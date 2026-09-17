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

  const { pregunta, contenidoId } = await request.json();

  if (!pregunta || !pregunta.trim()) {
    return NextResponse.json({ error: "Escribe una pregunta." }, { status: 400 });
  }

  try {
    const parts = [];
    let instruccion =
      `Eres un tutor universitario que responde en español, de forma clara ` +
      `y concreta. Responde la siguiente pregunta del estudiante`;

    if (contenidoId) {
      const { data: contenido } = await supabase
        .from("contenidos")
        .select("id, tipo, titulo, url")
        .eq("id", contenidoId)
        .single();

      if (contenido && TIPOS_LEGIBLES_POR_IA.includes(contenido.tipo)) {
        const { base64, mimeType } = await descargarArchivoBase64(supabase, contenido.url);
        parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
        instruccion += ` basándote únicamente en el documento adjunto ("${contenido.titulo}"). Si la respuesta no está en el documento, dilo claramente`;
      }
    }

    instruccion += `:\n\n${pregunta.trim()}`;
    parts.unshift({ text: instruccion });

    const respuesta = await llamarGemini(parts);

    return NextResponse.json({ respuesta });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Error consultando a la IA." },
      { status: 500 }
    );
  }
}
