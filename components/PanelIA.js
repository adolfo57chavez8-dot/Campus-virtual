"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { id: "resumen", label: "📝 Resumen" },
  { id: "examen", label: "🧠 Examen" },
  { id: "preguntar", label: "💬 Preguntar" },
  { id: "notas", label: "🗒️ Mis notas" }
];

export default function PanelIA({ unidadId, contenidos }) {
  const supabase = createClient();
  const [tab, setTab] = useState("resumen");

  const legiblesPorIA = useMemo(
    () => contenidos.filter((c) => c.tipo === "pdf" || c.tipo === "imagen"),
    [contenidos]
  );

  return (
    <div className="card mt-10 overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <p className="text-sm font-bold text-ink-900">Asistente de estudio (IA)</p>
        <p className="text-xs text-gray-500">
          Genera resúmenes, exámenes y respuestas a partir de los PDFs e
          imágenes de esta unidad.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-100 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-3 py-2 text-sm font-semibold ${
              tab === t.id
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "resumen" && (
          <TabResumen unidadId={unidadId} contenidos={legiblesPorIA} supabase={supabase} />
        )}
        {tab === "examen" && (
          <TabExamen unidadId={unidadId} contenidos={legiblesPorIA} supabase={supabase} />
        )}
        {tab === "preguntar" && (
          <TabPreguntar contenidos={legiblesPorIA} />
        )}
        {tab === "notas" && (
          <TabNotas unidadId={unidadId} contenidos={contenidos} supabase={supabase} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// RESUMEN
// ---------------------------------------------------------------
function TabResumen({ unidadId, contenidos, supabase }) {
  const [contenidoId, setContenidoId] = useState(contenidos[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  async function cargarHistorial() {
    if (contenidos.length === 0) return setCargandoHistorial(false);
    setCargandoHistorial(true);
    const ids = contenidos.map((c) => c.id);
    const { data } = await supabase
      .from("resumenes_ia")
      .select("id, resumen, created_at, contenido_id")
      .in("contenido_id", ids)
      .order("created_at", { ascending: false });
    setHistorial(data || []);
    setCargandoHistorial(false);
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function generar() {
    setError("");
    if (!contenidoId) {
      setError("Selecciona un PDF o imagen.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ia/resumen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenidoId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando el resumen.");
      setHistorial((h) => [data.resumen, ...h]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function eliminarResumen(id) {
    if (!confirm("¿Eliminar este resumen?")) return;
    await supabase.from("resumenes_ia").delete().eq("id", id);
    setHistorial((h) => h.filter((r) => r.id !== id));
  }

  if (contenidos.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Esta unidad todavía no tiene PDFs ni imágenes para resumir.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          className="input"
          value={contenidoId}
          onChange={(e) => setContenidoId(e.target.value)}
        >
          {contenidos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titulo}
            </option>
          ))}
        </select>
        <button onClick={generar} disabled={loading} className="btn btn-primary shrink-0">
          {loading ? "Generando..." : "Generar resumen"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-5 space-y-4">
        {cargandoHistorial && <p className="text-sm text-gray-500">Cargando...</p>}
        {historial.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-sm text-gray-700">{r.resumen}</p>
              <button
                onClick={() => eliminarResumen(r.id)}
                className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {!cargandoHistorial && historial.length === 0 && (
          <p className="text-sm text-gray-500">Aún no has generado ningún resumen aquí.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// EXAMEN
// ---------------------------------------------------------------
function TabExamen({ unidadId, contenidos, supabase }) {
  const [modo, setModo] = useState("unidad"); // "unidad" | contenidoId específico
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [examen, setExamen] = useState(null); // { id, preguntas }
  const [respuestas, setRespuestas] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);

  async function cargarHistorial() {
    const { data } = await supabase
      .from("examenes_ia")
      .select("id, nota, estado, created_at")
      .eq("unidad_id", unidadId)
      .eq("estado", "calificado")
      .order("created_at", { ascending: false });
    setHistorial(data || []);
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function eliminarExamen(id) {
    if (!confirm("¿Eliminar este examen de tu historial?")) return;
    await supabase.from("examenes_ia").delete().eq("id", id);
    setHistorial((h) => h.filter((x) => x.id !== id));
  }

  async function generar() {
    setError("");
    setResultado(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ia/examen/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidadId,
          contenidoId: modo === "unidad" ? null : modo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando el examen.");
      setExamen(data.examen);
      setRespuestas(new Array(data.examen.preguntas.length).fill(null));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function enviar() {
    if (!examen) return;
    if (respuestas.some((r) => r === null)) {
      setError("Responde todas las preguntas antes de enviar.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ia/examen/calificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examenId: examen.id, respuestas })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error calificando el examen.");
      setResultado(data);
      cargarHistorial();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (contenidos.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Esta unidad todavía no tiene PDFs ni imágenes para generar un examen.
      </p>
    );
  }

  return (
    <div>
      {!examen && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className="input" value={modo} onChange={(e) => setModo(e.target.value)}>
            <option value="unidad">Toda la unidad (hasta 4 archivos)</option>
            {contenidos.map((c) => (
              <option key={c.id} value={c.id}>
                Solo: {c.titulo}
              </option>
            ))}
          </select>
          <button onClick={generar} disabled={loading} className="btn btn-primary shrink-0">
            {loading ? "Generando..." : "Generar examen"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {examen && !resultado && (
        <div className="mt-5 space-y-5">
          {examen.preguntas.map((p, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-ink-900">
                {i + 1}. {p.pregunta}
              </p>
              <div className="mt-3 space-y-2">
                {p.opciones.map((op, j) => (
                  <label
                    key={j}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      respuestas[i] === j
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`pregunta-${i}`}
                      checked={respuestas[i] === j}
                      onChange={() => {
                        const copia = [...respuestas];
                        copia[i] = j;
                        setRespuestas(copia);
                      }}
                    />
                    {op}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button onClick={enviar} disabled={loading} className="btn btn-primary w-full">
            {loading ? "Enviando..." : "Entregar examen"}
          </button>
        </div>
      )}

      {resultado && (
        <div className="mt-5">
          <div className="rounded-xl bg-brand-50 p-5 text-center">
            <p className="text-sm font-semibold text-brand-700">Tu nota</p>
            <p className="text-4xl font-extrabold text-brand-700">{resultado.nota}/100</p>
            <p className="mt-1 text-sm text-gray-600">
              {resultado.aciertos} de {resultado.total} respuestas correctas
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {resultado.revision.map((r, i) => {
              const correcta = r.respuesta_usuario === r.respuesta_correcta;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    correcta ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="font-semibold text-ink-900">
                    {i + 1}. {r.pregunta}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Tu respuesta: {r.opciones[r.respuesta_usuario] ?? "—"}
                  </p>
                  {!correcta && (
                    <p className="text-sm font-semibold text-green-700">
                      Correcta: {r.opciones[r.respuesta_correcta]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setExamen(null);
              setResultado(null);
              setRespuestas([]);
            }}
            className="btn btn-outline mt-5 w-full"
          >
            Generar otro examen
          </button>
        </div>
      )}

      {!examen && historial.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-gray-500">Exámenes anteriores</p>
          <div className="space-y-2">
            {historial.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 text-sm"
              >
                <span className="text-gray-500">
                  {new Date(h.created_at).toLocaleDateString("es")}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink-900">{h.nota}/100</span>
                  <button
                    onClick={() => eliminarExamen(h.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// PREGUNTAR
// ---------------------------------------------------------------
function TabPreguntar({ contenidos }) {
  const [contenidoId, setContenidoId] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversacion, setConversacion] = useState([]);

  async function enviar(e) {
    e.preventDefault();
    if (!pregunta.trim()) return;
    setError("");
    setLoading(true);
    const preguntaActual = pregunta.trim();
    setPregunta("");

    try {
      const res = await fetch("/api/ia/pregunta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: preguntaActual, contenidoId: contenidoId || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error consultando a la IA.");
      setConversacion((c) => [...c, { pregunta: preguntaActual, respuesta: data.respuesta }]);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {contenidos.length > 0 && (
        <select
          className="input mb-3"
          value={contenidoId}
          onChange={(e) => setContenidoId(e.target.value)}
        >
          <option value="">Pregunta general (sin documento específico)</option>
          {contenidos.map((c) => (
            <option key={c.id} value={c.id}>
              Sobre: {c.titulo}
            </option>
          ))}
        </select>
      )}

      <div className="max-h-96 space-y-4 overflow-y-auto rounded-xl border border-gray-100 p-4">
        {conversacion.length === 0 && (
          <p className="text-sm text-gray-400">
            Escribe una pregunta abajo y la IA te responderá aquí.
          </p>
        )}
        {conversacion.map((c, i) => (
          <div key={i} className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-xl bg-brand-600 px-3 py-2 text-sm text-white">
              {c.pregunta}
            </p>
            <p className="w-fit max-w-[85%] whitespace-pre-wrap rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-800">
              {c.respuesta}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={enviar} className="mt-3 flex gap-2">
        <input
          className="input"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribe tu pregunta..."
        />
        <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------
// NOTAS
// ---------------------------------------------------------------
function TabNotas({ unidadId, contenidos, supabase }) {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setLoading(true);
    const { data } = await supabase
      .from("notas")
      .select("id, titulo, contenido, created_at")
      .eq("unidad_id", unidadId)
      .order("created_at", { ascending: false });
    setNotas(data || []);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardar(e) {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) {
      setError("Escribe un título y el contenido de la nota.");
      return;
    }
    setError("");
    setGuardando(true);
    const { error } = await supabase.from("notas").insert({
      unidad_id: unidadId,
      titulo: titulo.trim(),
      contenido: contenido.trim()
    });
    setGuardando(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTitulo("");
    setContenido("");
    cargar();
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar esta nota?")) return;
    await supabase.from("notas").delete().eq("id", id);
    cargar();
  }

  return (
    <div>
      <form onSubmit={guardar} className="space-y-3 rounded-xl border border-gray-100 p-4">
        <input
          className="input"
          placeholder="Título de la nota"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          className="input"
          rows={4}
          placeholder="Escribe tu nota..."
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={guardando} className="btn btn-primary">
          {guardando ? "Guardando..." : "Guardar nota"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-gray-500">Cargando...</p>}
        {notas.map((n) => (
          <div key={n.id} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-ink-900">{n.titulo}</p>
              <button
                onClick={() => eliminar(n.id)}
                className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{n.contenido}</p>
          </div>
        ))}
        {!loading && notas.length === 0 && (
          <p className="text-sm text-gray-500">Todavía no tienes notas en esta unidad.</p>
        )}
      </div>
    </div>
  );
}
