import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: ciclos } = await supabase
    .from("ciclos")
    .select("id, numero, nombre, descripcion, visible, materias(count)")
    .eq("visible", true)
    .order("numero", { ascending: true });

  return (
    <>
      <Navbar />

      <section className="border-b border-gray-100 bg-gradient-to-b from-brand-50 to-white">
        <div className="container-app py-16 sm:py-20">
          <span className="badge bg-brand-100 text-brand-700">
            Plataforma de estudio
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            Todo tu material académico, organizado por ciclo.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-600">
            Accede a materias, unidades, PDFs y videos organizados como en la
            universidad. Estudia a tu ritmo, descarga tus archivos y mira las
            clases sin salir de la plataforma.
          </p>
          {!user && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registro" className="btn btn-primary px-6 py-3 text-base">
                Crear cuenta gratis
              </Link>
              <Link href="/login" className="btn btn-outline px-6 py-3 text-base">
                Ya tengo cuenta
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="container-app py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Ciclos disponibles</h2>
            <p className="mt-1 text-gray-500">
              Selecciona un ciclo para ver sus materias.
            </p>
          </div>
        </div>

        {(!ciclos || ciclos.length === 0) && (
          <div className="card p-10 text-center text-gray-500">
            Aún no hay ciclos publicados. Vuelve pronto.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ciclos?.map((ciclo) => (
            <Link
              key={ciclo.id}
              href={user ? `/ciclo/${ciclo.id}` : "/login"}
              className="card group relative overflow-hidden p-6 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="badge bg-ink-900 text-white">
                  Ciclo {ciclo.numero}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {ciclo.materias?.[0]?.count ?? 0} materias
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink-900 group-hover:text-brand-700">
                {ciclo.nombre}
              </h3>
              {ciclo.descripcion && (
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                  {ciclo.descripcion}
                </p>
              )}
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-brand-600">
                Entrar al ciclo →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Campus Virtual — Plataforma de estudio.
      </footer>
    </>
  );
}
