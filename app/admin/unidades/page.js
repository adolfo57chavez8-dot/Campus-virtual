"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UnidadesAdmin() {
  const supabase = createClient();
  const [ciclos, setCiclos] = useState([]);
  const [cicloId, setCicloId] = useState("");
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState("");
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", descripcion: "", orden: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
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
    if (!mid) {
      setUnidades([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("unidades")
      .select("*")
      .eq("materia_id", mid)
      .order("orden", { ascending: true });
    setUnidades(data || []);
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

  function resetForm() {
    setForm({ nombre: "", descripcion: "", orden: "" });
    setEditId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!materiaId) {
      setError("Selecciona una materia primero.");
      return;
    }
    setSaving(true);

    const payload = {
      materia_id: materiaId,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      orden: form.orden ? Number(form.orden) : unidades.length + 1
    };

    const { error } = editId
      ? await supabase.from("unidades").update(payload).eq("id", editId)
      : await supabase.from("unidades").insert(payload);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    resetForm();
    loadUnidades(materiaId);
  }

  function handleEdit(u) {
    setEditId(u.id);
    setForm({ nombre: u.nombre, descripcion: u.descripcion || "", orden: u.orden || "" });
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta unidad y su contenido?")) return;
    await supabase.from("unidades").delete().eq("id", id);
    loadUnidades(materiaId);
  }

  return (
    <div>
      <div className="card mb-6 grid gap-4 p-5 sm:grid-cols-2">
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
          <select
            className="input"
            value={materiaId}
            onChange={(e) => {
              setMateriaId(e.target.value);
              resetForm();
            }}
          >
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          {materias.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">Este ciclo no tiene materias aún.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">
            {editId ? "Editar unidad" : "Nueva unidad"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="label">Nombre de la unidad</label>
              <input
                required
                className="input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Unidad 1: Introducción"
              />
            </div>
            <div>
              <label className="label">Descripción (opcional)</label>
              <textarea
                className="input"
                rows={3}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Orden (opcional)</label>
              <input
                type="number"
                className="input"
                value={form.orden}
                onChange={(e) => setForm({ ...form, orden: e.target.value })}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Crear unidad"}
              </button>
              {editId && (
                <button type="button" onClick={resetForm} className="btn btn-outline">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">Unidades de la materia</h2>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Cargando...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {unidades.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <p className="truncate font-semibold text-ink-900">{u.nombre}</p>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => handleEdit(u)} className="btn btn-outline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="btn btn-danger">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {unidades.length === 0 && (
                <p className="text-sm text-gray-500">Esta materia todavía no tiene unidades.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
