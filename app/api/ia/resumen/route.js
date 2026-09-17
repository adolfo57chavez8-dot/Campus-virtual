import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { llamarGemini, descargarArchivoBase64, TIPOS_LEGIBLES_POR_IA } from "@/lib/gemini";

export async function POST(request) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { contenidoId } = await request.json();

  if (!contenidoId) {
    return NextResponse.json({ error: "Falta el contenido a resumir." }, { status: 400 });
  }

  const { data: contenido, error: contenidoError } = await supabase
    .from("contenidos")
    .select("id, tipo, titulo, url, unidad_id")
    .eq("id", contenidoId)
    .single();

  if (contenidoError || !contenido) {
    return NextResponse.json({ error: "No se encontró ese contenido." }, { status: 404 });
  }

  if (!TIPOS_LEGIBLES_POR_IA.includes(contenido.tipo)) {
    return NextResponse.json(
      { error: "La IA solo puede resumir archivos PDF o imágenes por ahora." },
      { status: 400 }
    );
  }

  try {
    const { base64, mimeType } = await descargarArchivoBase64(supabase, contenido.url);

    const texto = await llamarGemini([
      {
        text:
          `Eres un asistente educativo. Resume el siguiente documento titulado ` +
          `"${contenido.titulo}" en español, de forma clara, organizada en ` +
          `secciones con subtítulos y viñetas con las ideas más importantes, ` +
          `pensado para que un estudiante universitario repase antes de un examen. ` +
          `No inventes información que no esté en el documento.`
      },
      { inline_data: { mime_type: mimeType, data: base64 } }
    ]);

    const { data: guardado, error: insertError } = await supabase
      .from("resumenes_ia")
      .insert({
        contenido_id: contenido.id,
        user_id: user.id,
        resumen: texto
      })
      .select("id, resumen, created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ resumen: guardado });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Error generando el resumen." }, { status: 500 });
  }
}
