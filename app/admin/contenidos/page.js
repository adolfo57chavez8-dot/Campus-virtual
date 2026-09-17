"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getYouTubeId } from "@/lib/constants";

const TIPOS = [
  { value: "pdf", label: "PDF" },
  { value: "imagen", label: "Imagen" },
  { value: "archivo", label: "Otro archivo" },
  { value: "video", label: "Video de YouTube" },
  { value: "enlace", label: "Otro enlace" }
];

export default function ContenidosAdmin() {
  const supabase = createClient();

  const [ciclos, setCiclos] = useState([]);
  const [cicloId, setCicloId] = useState("");
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState("");
  const [unidades, setUnidades] = useState([]);
  const [unidadId, setUnidadId] = useState("");
  const [contenidos, setContenidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tipo, setTipo] = useState("pdf");
  const [titulo, setTitulo] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function loadCiclos() {
    const { data } = await supabase.from("ciclos").select("id, numero, nombre").order("numero");
    setCiclos(data || []);
    if (data && data.length > 0) setCicloId(data[0].id);
  }
  async function loadMaterias(cid) {
    if (!cid) return setMaterias([]);
    const { data } = await supabase
      .from("materias")
      .select("id, nombre")
      .eq("ciclo_id", cid)
      .order("orden");
    setMaterias(data || []);
    setMateriaId(data && data.length > 0 ? data[0].id : "");
  }
  async function loadUnidades(mid) {
    if (!mid) return setUnidades([]);
    const { data } = await supabase
      .from("unidades")
      .select("id, nombre")
      .eq("materia_id", mid)
      .order("orden");
    setUnidades(data || []);
    setUnidadId(data && data.length > 0 ? data[0].id : "");
  }
  async function loadContenidos(uid) {
    if (!uid) {
      setContenidos([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("contenidos")
      .select("*")
      .eq("unidad_id", uid)
      .order("orden", { ascending: true });
    setContenidos(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCiclos();
  }, []);
  useEffect(() => {
    loadMaterias(cicloId);
  }, [cicloId]);
  useEffect(() => {
    loadUnidades(materiaId);
  }, [materiaId]);
  useEffect(() => {
    loadContenidos(unidadId);
  }, [unidadId]);

  function resetForm() {
    setTitulo("");
    setVideoUrl("");
    setFile(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!unidadId) {
      setError("Selecciona una unidad primero.");
      return;
    }
    if (!titulo.trim()) {
      setError("Escribe un título.");
      return;
    }

    if (tipo === "video" || tipo === "enlace") {
      if (tipo === "video" && !getYouTubeId(videoUrl)) {
        setError("Ese enlace de YouTube no parece válido.");
        return;
      }
      if (tipo === "enlace" && !/^https?:\/\//i.test(videoUrl.trim())) {
        setError("Escribe un enlace válido (debe empezar con http:// o https://).");
        return;
      }
      setUploading(true);
      const { error } = await supabase.from("contenidos").insert({
        unidad_id: unidadId,
        tipo,
        titulo,
        url: videoUrl.trim(),
        orden: contenidos.length + 1
      });
      setUploading(false);
      if (error) return setError(error.message);
      resetForm();
      loadContenidos(unidadId);
      return;
    }

    if (!file) {
      setError("Selecciona un archivo para subir.");
      return;
    }

    setUploading(true);
    setProgress("Subiendo archivo...");

    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${unidadId}/${Date.now()}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("archivos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || (tipo === "pdf" ? "application/pdf" : "application/octet-stream")
      });

    if (uploadError) {
      setUploading(false);
      setProgress("");
      setError(uploadError.message);
      return;
    }

    setProgress("Guardando registro...");
    const { error: insertError } = await supabase.from("contenidos").insert({
      unidad_id: unidadId,
      tipo,
      titulo,
      url: path,
      orden: contenidos.length + 1
    });

    setUploading(false);
    setProgress("");

    if (insertError) {
      setError(insertError.message);
      return;
    }

    resetForm();
    loadContenidos(unidadId);
  }

  async function handleDelete(c) {
    if (!confirm(`¿Eliminar "${c.titulo}"?`)) return;
    if (c.tipo !== "video" && c.tipo !== "enlace") {
      await supabase.storage.from("archivos").remove([c.url]);
    }
    await supabase.from("contenidos").delete().eq("id", c.id);
    loadContenidos(unidadId);
  }

  return (
    <div>
      <div className="card mb-6 grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="label">Ciclo</label>
          <select className="input" value={cicloId} onChange={(e) => setCicloId(e.target.value)}>
            {ciclos.map((c) => (
              <option key={c.id} value={c.id}>
                Ciclo {c.numero} — {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Materia</label>
          <select className="input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Unidad</label>
          <select className="input" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">Agregar contenido</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="label">Tipo</label>
              <div className="flex gap-2">
                {TIPOS.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => {
                      setTipo(t.value);
                      setFile(null);
                      setVideoUrl("");
                    }}
                    className={`btn ${tipo === t.value ? "btn-primary" : "btn-outline"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Título</label>
              <input
                required
                className="input"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={tipo === "video" ? "Clase 1: Introducción" : "Guía práctica 1"}
              />
            </div>

            {tipo === "video" && (
              <div>
                <label className="label">Enlace de YouTube</label>
                <input
                  className="input"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  El enlace nunca se muestra a los estudiantes: solo verán el
                  video listo para reproducir.
                </p>
              </div>
            )}

            {tipo === "enlace" && (
              <div>
                <label className="label">Dirección del enlace</label>
                <input
                  className="input"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/recurso"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Úsalo para páginas web, videos de otras plataformas,
                  formularios, etc. Se mostrará como un botón para abrirlo.
                </p>
              </div>
            )}

            {(tipo === "pdf" || tipo === "archivo" || tipo === "imagen") && (
              <div>
                <label className="label">
                  Archivo (
                  {tipo === "pdf" ? "PDF" : tipo === "imagen" ? "imagen" : "cualquier formato"}
                  )
                </label>
                <input
                  type="file"
                  required
                  accept={
                    tipo === "pdf"
                      ? "application/pdf"
                      : tipo === "imagen"
                      ? "image/*"
                      : undefined
                  }
                  className="input"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            {progress && <p className="text-sm text-gray-500">{progress}</p>}

            <button type="submit" disabled={uploading || !unidadId} className="btn btn-primary w-full">
              {uploading ? "Subiendo..." : "Agregar"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">Contenido de la unidad</h2>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Cargando...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {contenidos.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div className="min-w-0">
                    <span className="badge bg-brand-100 text-brand-700">
                      {{
                        video: "Video",
                        pdf: "PDF",
                        imagen: "Imagen",
                        enlace: "Enlace"
                      }[c.tipo] || "Archivo"}
                    </span>
                    <p className="mt-1 truncate font-semibold text-ink-900">{c.titulo}</p>
                  </div>
                  <button onClick={() => handleDelete(c)} className="btn btn-danger shrink-0">
                    Eliminar
                  </button>
                </div>
              ))}
              {contenidos.length === 0 && (
                <p className="text-sm text-gray-500">Esta unidad todavía no tiene contenido.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
