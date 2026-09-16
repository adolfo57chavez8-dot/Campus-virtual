import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MateriaPage({ params }) {
  const supabase = createClient();

  const { data: materia } = await supabase
    .from("materias")
    .select("id, nombre, descripcion, ciclo_id, ciclos(id, numero, nombre)")
    .eq("id", params.id)
    .single();

  if (!materia) notFound();

  const { data: unidades } = await supabase
    .from("unidades")
    .select("id, nombre, descripcion, orden, contenidos(count)")
    .eq("materia_id", params.id)
    .order("orden", { ascending: true });

  return (
    <>
      <Navbar />
      <div className="container-app py-10">
        <Link
          href={`/ciclo/${materia.ciclo_id}`}
          className="text-sm font-semibold text-brand-600"
        >
          ← {materia.ciclos?.nombre || "Volver al ciclo"}
        </Link>

        <h1 className="mt-3 text-3xl font-extrabold text-ink-900">{materia.nombre}</h1>
        {materia.descripcion && (
          <p className="mt-2 max-w-2xl text-gray-500">{materia.descripcion}</p>
        )}

        <div className="mt-8 space-y-3">
          {unidades?.map((u, idx) => (
            <Link
              key={u.id}
              href={`/unidad/${u.id}`}
              className="card group flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-700">
                  {idx + 1}
                </span>
                <div>
                  <h3 className="font-bold text-ink-900 group-hover:text-brand-700">
                    {u.nombre}
                  </h3>
                  {u.descripcion && (
                    <p className="line-clamp-1 text-sm text-gray-500">{u.descripcion}</p>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold text-gray-400">
                {u.contenidos?.[0]?.count ?? 0} recursos →
              </span>
            </Link>
          ))}

          {(!unidades || unidades.length === 0) && (
            <div className="card p-10 text-center text-gray-500">
              Esta materia todavía no tiene unidades publicadas.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
