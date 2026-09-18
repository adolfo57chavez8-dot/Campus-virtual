import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import ImageViewer from "@/components/ImageViewer";
import DocCard from "@/components/DocCard";
import PanelIA from "@/components/PanelIA";
import { createClient } from "@/lib/supabase/server";
import { getYouTubeId } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CarpetaPage({ params }) {
  const supabase = createClient();

  const { data: carpeta } = await supabase
    .from("carpetas")
    .select("id, nombre, descripcion, unidad_id, carpeta_padre_id")
    .eq("id", params.id)
    .single();

  if (!carpeta) notFound();

  const [{ data: unidad }, { data: carpetaPadre }, { data: todosLosContenidos }, { data: subcarpetas }] =
    await Promise.all([
      supabase.from("unidades").select("id, nombre").eq("id", carpeta.unidad_id).single(),
      carpeta.carpeta_padre_id
        ? supabase.from("carpetas").select("id, nombre").eq("id", carpeta.carpeta_padre_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("contenidos")
        .select("id, tipo, titulo, url, orden, carpeta_id")
        .eq("unidad_id", carpeta.unidad_id)
        .order("orden", { ascending: true }),
      supabase
        .from("carpetas")
        .select("id, nombre, descripcion, orden, contenidos(count)")
        .eq("carpeta_padre_id", carpeta.id)
        .order("orden", { ascending: true })
    ]);

  const lista = todosLosContenidos || [];
  const subcarpetasList = subcarpetas || [];

  const enEstaCarpeta = lista.filter((c) => c.carpeta_id === carpeta.id);

  const videos = enEstaCarpeta.filter((c) => c.tipo === "video");
  const enlaces = enEstaCarpeta.filter((c) => c.tipo === "enlace");
  const archivosStorage = enEstaCarpeta.filter((c) => c.tipo === "pdf" || c.tipo === "archivo");
  const imagenes = enEstaCarpeta.filter((c) => c.tipo === "imagen");

  async function firmarUrl(path) {
    const { data } = await supabase.storage.from("archivos").createSignedUrl(path, 60 * 60);
    return data?.signedUrl || null;
  }

  const archivosConUrl = await Promise.all(
    archivosStorage.map(async (a) => ({ ...a, urlFirmada: await firmarUrl(a.url) }))
  );
  const imagenesConUrl = await Promise.all(
    imagenes.map(async (a) => ({ ...a, urlFirmada: await firmarUrl(a.url) }))
  );

  const hayContenido =
    subcarpetasList.length +
      videos.length +
      enlaces.length +
      archivosConUrl.length +
      imagenesConUrl.length >
    0;

  const volverHref = carpetaPadre ? `/carpeta/${carpetaPadre.id}` : `/unidad/${carpeta.unidad_id}`;
  const volverTexto = carpetaPadre ? carpetaPadre.nombre : unidad?.nombre || "la unidad";

  return (
    <>
      <Navbar />
      <div className="container-app py-10">
        <Link href={volverHref} className="text-sm font-semibold text-brand-600">
          ← {volverTexto}
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl">📁</span>
          <h1 className="text-3xl font-extrabold text-ink-900">{carpeta.nombre}</h1>
        </div>
        {carpeta.descripcion && (
          <p className="mt-2 max-w-2xl text-gray-500">{carpeta.descripcion}</p>
        )}

        {subcarpetasList.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Carpetas</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subcarpetasList.map((c) => (
                <Link
                  key={c.id}
                  href={`/carpeta/${c.id}`}
                  className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    📁
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900 group-hover:text-brand-700">
                      {c.nombre}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.contenidos?.[0]?.count ?? 0} archivos directos
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Videos</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {videos.map((v) => (
                <VideoPlayer key={v.id} titulo={v.titulo} videoId={getYouTubeId(v.url)} />
              ))}
            </div>
          </div>
        )}

        {imagenesConUrl.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Imágenes</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {imagenesConUrl.map(
                (img) =>
                  img.urlFirmada && (
                    <ImageViewer key={img.id} titulo={img.titulo} url={img.urlFirmada} />
                  )
              )}
            </div>
          </div>
        )}

        {archivosConUrl.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Documentos y archivos</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {archivosConUrl.map(
                (a) =>
                  a.urlFirmada && (
                    <DocCard key={a.id} titulo={a.titulo} url={a.urlFirmada} tipo={a.tipo} />
                  )
              )}
            </div>
          </div>
        )}

        {enlaces.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink-900">Enlaces</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {enlaces.map((e) => (
                <a
                  key={e.id}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
                    🔗
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{e.titulo}</p>
                    <p className="text-xs font-semibold uppercase text-brand-600">
                      Abrir enlace
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {!hayContenido && (
          <div className="card mt-10 p-10 text-center text-gray-500">
            Esta carpeta todavía no tiene contenido.
          </div>
        )}

        <PanelIA unidadId={carpeta.unidad_id} contenidos={lista} />
      </div>
    </>
  );
}
