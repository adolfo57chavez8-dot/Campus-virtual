"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MateriasAdmin() {
  const supabase = createClient();
  const [ciclos, setCiclos] = useState([]);
  const [cicloId, setCicloId] = useState("");
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: "", descripcion: "", orden: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCiclos() {
    const { data } = await supabase.from("ciclos").select("id, numero, nombre").order("numero");
    setCiclos(data || []);
    if (data && data.length > 0 && !cicloId) setCicloId(data[0].id);
  }

  async function loadMaterias(cid) {
    if (!cid) {
      setMaterias([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("materias")
      .select("*")
      .eq("ciclo_id", cid)
      .order("orden", { ascending: true });
    setMaterias(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCiclos();
  }, []);

  useEffect(() => {
    loadMaterias(cicloId);
  }, [cicloId]);

  function resetForm() {
    setForm({ nombre: "", descripcion: "", orden: "" });
    setEditId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!cicloId) {
      setError("Selecciona un ciclo primero.");
      return;
    }
    setSaving(true);

    const payload = {
      ciclo_id: cicloId,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      orden: form.orden ? Number(form.orden) : materias.length + 1
    };

    const { error } = editId
      ? await supabase.from("materias").update(payload).eq("id", editId)
      : await supabase.from("materias").insert(payload);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    resetForm();
    loadMaterias(cicloId);
  }

  function handleEdit(m) {
    setEditId(m.id);
    setForm({ nombre: m.nombre, descripcion: m.descripcion || "", orden: m.orden || "" });
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta materia y sus unidades/archivos?")) return;
    await supabase.from("materias").delete().eq("id", id);
    loadMaterias(cicloId);
  }

  return (
    <div>
      <div className="card mb-6 p-5">
        <label className="label">Ciclo</label>
        <select
          className="input max-w-sm"
          value={cicloId}
          onChange={(e) => {
            setCicloId(e.target.value);
            resetForm();
          }}
        >
          {ciclos.map((c) => (
            <option key={c.id} value={c.id}>
              Ciclo {c.numero} — {c.nombre}
            </option>
          ))}
        </select>
        {ciclos.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Primero crea un ciclo en la sección "Ciclos".
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-ink-900">
            {editId ? "Editar materia" : "Nueva materia"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="label">Nombre de la materia</label>
              <input
                required
                className="input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Matemática I"
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
                placeholder="1"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Crear materia"}
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
          <h2 className="text-lg font-bold text-ink-900">Materias del ciclo</h2>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Cargando...</p>
          ) : (
            <div className="mt-4 space-y-3">
              {materias.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <p className="truncate font-semibold text-ink-900">{m.nombre}</p>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => handleEdit(m)} className="btn btn-outline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="btn btn-danger">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {materias.length === 0 && (
                <p className="text-sm text-gray-500">Este ciclo todavía no tiene materias.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
