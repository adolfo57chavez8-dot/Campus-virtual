import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import { createClient } from "@/lib/supabase/server";
import { getYouTubeId } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ICONS = {
  pdf: "📄",
  archivo: "📎"
};

export default async function UnidadPage({ params }) {
  const supabase = createClient();

  const { data: unidad } = await supabase
    .from("unidades")
    .select("id, nombre, descripcion, materia_id, materias(id, nombre, ciclo_id)")
    .eq("id", params.id)
    .single();

  if (!unidad) notFound();

  const { data: contenidos } = await supabase
    .from("contenidos")
    .select("id, tipo, titulo, url, orden")
    .eq("unidad_id", params.id)
    .order("orden", { ascending: true });

  const videos = contenidos?.filter((c) => c.tipo === "video") || [];
  const archivos = contenidos?.filter((c) => c.tipo !== "video") || [];

  const archivosConUrl = await Promise.all(
    archivos.map(async (a) => {
      const { data } = await supabase.storage
        .from("archivos")
        .createSignedUrl(a.url, 60 * 60); // enlace válido por 1 hora
      return { ...a, publicUrl: data?.signedUrl || null };
    })
  );

  return (
    <>
      <Navbar />
      <div className="container-app py-10">
        <Link
          href={`/materia/${unidad.materia_id}`}
          className="text-sm font-semibold text-brand-600"
        >
          ← {unidad.materias?.nombre || "Volver a la materia"}
        </Link>

        <h1 className="mt-3 text-3xl font-extrabold text-ink-900">{unidad.nombre}</h1>
        {unidad.descripcion && (
          <p className="mt-2 max-w-2xl text-gray-500">{unidad.descripcion}</p>
        )}

        {videos.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Videos</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {videos.map((v) => (
                <VideoPlayer
                  key={v.id}
                  titulo={v.titulo}
                  videoId={getYouTubeId(v.url)}
                />
              ))}
            </div>
          </div>
        )}

        {archivosConUrl.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Documentos y archivos</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {archivosConUrl.map((a) => (
                <a
                  key={a.id}
                  href={a.publicUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    {ICONS[a.tipo] || "📎"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{a.titulo}</p>
                    <p className="text-xs font-semibold uppercase text-brand-600">
                      Descargar / ver
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {videos.length === 0 && archivosConUrl.length === 0 && (
          <div className="card mt-10 p-10 text-center text-gray-500">
            Esta unidad todavía no tiene contenido publicado.
          </div>
        )}
      </div>
    </>
  );
}
