import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CicloPage({ params }) {
  const supabase = createClient();

  const { data: ciclo } = await supabase
    .from("ciclos")
    .select("id, numero, nombre, descripcion")
    .eq("id", params.id)
    .single();

  if (!ciclo) notFound();

  const { data: materias } = await supabase
    .from("materias")
    .select("id, nombre, descripcion, orden, unidades(count)")
    .eq("ciclo_id", params.id)
    .order("orden", { ascending: true });

  return (
    <>
      <Navbar />
      <div className="container-app py-10">
        <Link href="/" className="text-sm font-semibold text-brand-600">
          ← Todos los ciclos
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="badge bg-ink-900 text-white">Ciclo {ciclo.numero}</span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-ink-900">{ciclo.nombre}</h1>
        {ciclo.descripcion && (
          <p className="mt-2 max-w-2xl text-gray-500">{ciclo.descripcion}</p>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {materias?.map((m) => (
            <Link
              key={m.id}
              href={`/materia/${m.id}`}
              className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="text-xs font-semibold text-gray-400">
                {m.unidades?.[0]?.count ?? 0} unidades
              </span>
              <h3 className="mt-2 text-lg font-bold text-ink-900 group-hover:text-brand-700">
                {m.nombre}
              </h3>
              {m.descripcion && (
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                  {m.descripcion}
                </p>
              )}
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-brand-600">
                Ver unidades →
              </span>
            </Link>
          ))}

          {(!materias || materias.length === 0) && (
            <div className="card col-span-full p-10 text-center text-gray-500">
              Este ciclo todavía no tiene materias publicadas.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
