import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = createClient();

  const [{ count: ciclos }, { count: materias }, { count: unidades }, { count: contenidos }] =
    await Promise.all([
      supabase.from("ciclos").select("*", { count: "exact", head: true }),
      supabase.from("materias").select("*", { count: "exact", head: true }),
      supabase.from("unidades").select("*", { count: "exact", head: true }),
      supabase.from("contenidos").select("*", { count: "exact", head: true })
    ]);

  const stats = [
    { label: "Ciclos", value: ciclos || 0, href: "/admin/ciclos" },
    { label: "Materias", value: materias || 0, href: "/admin/materias" },
    { label: "Unidades", value: unidades || 0, href: "/admin/unidades" },
    { label: "Archivos / videos", value: contenidos || 0, href: "/admin/contenidos" }
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:shadow-soft">
            <p className="text-sm font-semibold text-gray-500">{s.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">Flujo recomendado</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
          <li>Crea un <strong>ciclo</strong> (ej. Ciclo 1) y actívalo como visible.</li>
          <li>Dentro del ciclo, agrega sus <strong>materias</strong>.</li>
          <li>Dentro de cada materia, agrega las <strong>unidades</strong>.</li>
          <li>
            Dentro de cada unidad, sube <strong>PDFs / archivos</strong> o pega
            enlaces de <strong>YouTube</strong> — se mostrarán listos para
            reproducir, sin exponer el enlace.
          </li>
        </ol>
      </div>
    </div>
  );
}
