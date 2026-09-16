"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CiclosAdmin() {
  const supabase = createClient();
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ numero: "", nombre: "", descripcion: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("ciclos")
      .select("*")
      .order("numero", { ascending: true });
    setCiclos(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm({ numero: "", nombre: "", descripcion: "" });
    setEditId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      numero: Number(form.numero),
      nombre: form.nombre,
      descripcion: form.descripcion || null
    };

    const { error } = editId
      ? await supabase.from("ciclos").update(payload).eq("id", editId)
      : await supabase.from("ciclos").insert({ ...payload, visible: true });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    resetForm();
    load();
  }

  function handleEdit(c) {
    setEditId(c.id);
    setForm({ numero: c.numero, nombre: c.nombre, descripcion: c.descripcion || "" });
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este ciclo y todo su contenido asociado?")) return;
    await supabase.from("ciclos").delete().eq("id", id);
    load();
  }

  async function toggleVisible(c) {
    await supabase.from("ciclos").update({ visible: !c.visible }).eq("id", c.id);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="card p-6">
        <h2 className="text-lg font-bold text-ink-900">
          {editId ? "Editar ciclo" : "Nuevo ciclo"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">Número de ciclo</label>
            <input
              type="number"
              required
              min={1}
              className="input"
              value={form.numero}
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
              placeholder="1"
            />
          </div>
          <div>
            <label className="label">Nombre</label>
            <input
              required
              className="input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ciclo 1"
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

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Guardando..." : editId ? "Guardar cambios" : "Crear ciclo"}
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
        <h2 className="text-lg font-bold text-ink-900">Ciclos existentes</h2>
        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Cargando...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {ciclos.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-ink-900 text-white">Ciclo {c.numero}</span>
                    <span
                      className={`badge ${
                        c.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {c.visible ? "Visible" : "Oculto"}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-semibold text-ink-900">{c.nombre}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => toggleVisible(c)} className="btn btn-outline">
                    {c.visible ? "Ocultar" : "Mostrar"}
                  </button>
                  <button onClick={() => handleEdit(c)} className="btn btn-outline">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="btn btn-danger">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {ciclos.length === 0 && (
              <p className="text-sm text-gray-500">Todavía no hay ciclos creados.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
