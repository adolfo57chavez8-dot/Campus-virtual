import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ICONO = {
  pdf: "📄",
  archivo: "📎",
  imagen: "🖼️",
  video: "🎬",
  enlace: "🔗"
};

export default async function BuscarPage({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const supabase = createClient();

  let resultadosContenido = [];
  let resultadosUnidades = [];
  let resultadosMaterias = [];

  if (q.length >= 2) {
    const [{ data: contenidos }, { data: unidades }, { data: materias }] = await Promise.all([
      supabase
        .from("contenidos")
        .select("id, tipo, titulo, unidad_id, carpeta_id, unidades(id, nombre, materia_id)")
        .ilike("titulo", `%${q}%`)
        .limit(30),
      supabase
        .from("unidades")
        .select("id, nombre, materia_id, materias(id, nombre)")
        .ilike("nombre", `%${q}%`)
        .limit(20),
      supabase
        .from("materias")
        .select("id, nombre, ciclo_id")
        .ilike("nombre", `%${q}%`)
        .limit(20)
    ]);

    resultadosContenido = contenidos || [];
    resultadosUnidades = unidades || [];
    resultadosMaterias = materias || [];
  }

  const sinResultados =
    q.length >= 2 &&
    resultadosContenido.length === 0 &&
    resultadosUnidades.length === 0 &&
    resultadosMaterias.length === 0;

  return (
    <>
      <Navbar />
      <div className="container-app py-10">
        <form action="/buscar" method="GET" className="flex max-w-xl gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar un PDF, video, materia o unidad..."
            className="input"
          />
          <button type="submit" className="btn btn-primary shrink-0 px-5">
            🔍 Buscar
          </button>
        </form>

        <h1 className="mt-6 text-2xl font-extrabold text-ink-900">
          {q ? `Resultados para "${q}"` : "Escribe algo para buscar"}
        </h1>

        {q.length > 0 && q.length < 2 && (
          <p className="mt-3 text-gray-500">Escribe al menos 2 letras.</p>
        )}

        {sinResultados && (
          <p className="mt-3 text-gray-500">No se encontró nada con ese nombre.</p>
        )}

        {resultadosMaterias.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink-900">Materias</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {resultadosMaterias.map((m) => (
                <Link
                  key={m.id}
                  href={`/materia/${m.id}`}
                  className="card p-4 hover:shadow-soft"
                >
                  <p className="font-semibold text-ink-900">{m.nombre}</p>
                  <p className="text-xs text-gray-400">Materia</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {resultadosUnidades.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink-900">Unidades</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {resultadosUnidades.map((u) => (
                <Link key={u.id} href={`/unidad/${u.id}`} className="card p-4 hover:shadow-soft">
                  <p className="font-semibold text-ink-900">{u.nombre}</p>
                  <p className="text-xs text-gray-400">
                    Unidad {u.materias?.nombre ? `— ${u.materias.nombre}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {resultadosContenido.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink-900">Archivos y videos</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {resultadosContenido.map((c) => (
                <Link
                  key={c.id}
                  href={c.carpeta_id ? `/carpeta/${c.carpeta_id}` : `/unidad/${c.unidad_id}`}
                  className="card flex items-center gap-3 p-4 hover:shadow-soft"
                >
                  <span className="text-xl">{ICONO[c.tipo] || "📎"}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{c.titulo}</p>
                    <p className="text-xs text-gray-400">
                      En {c.unidades?.nombre || "una unidad"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
