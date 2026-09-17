import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { llamarGemini, descargarArchivoBase64, TIPOS_LEGIBLES_POR_IA } from "@/lib/gemini";

const ESQUEMA_EXAMEN = {
  type: "object",
  properties: {
    preguntas: {
      type: "array",
      minItems: 5,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          pregunta: { type: "string" },
          opciones: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4
          },
          respuesta_correcta: { type: "integer" }
        },
        required: ["pregunta", "opciones", "respuesta_correcta"]
      }
    }
  },
  required: ["preguntas"]
};

export async function POST(request) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { unidadId, contenidoId } = await request.json();

  if (!unidadId) {
    return NextResponse.json({ error: "Falta la unidad." }, { status: 400 });
  }

  let query = supabase
    .from("contenidos")
    .select("id, tipo, titulo, url")
    .eq("unidad_id", unidadId)
    .in("tipo", TIPOS_LEGIBLES_POR_IA);

  if (contenidoId) {
    query = query.eq("id", contenidoId);
  }

  const { data: contenidos, error: contenidosError } = await query;

  if (contenidosError) {
    return NextResponse.json({ error: contenidosError.message }, { status: 500 });
  }

  if (!contenidos || contenidos.length === 0) {
    return NextResponse.json(
      { error: "No hay PDFs o imágenes en esta unidad para generar un examen." },
      { status: 400 }
    );
  }

  // Límite: máximo 4 archivos por examen para no exceder el tamaño
  // permitido por la API de Gemini.
  const seleccionados = contenidos.slice(0, 4);

  try {
    const parts = [
      {
        text:
          `Eres un profesor universitario. Con base ÚNICAMENTE en el contenido ` +
          `de los archivos adjuntos, genera un examen de opción múltiple en ` +
          `español con entre 5 y 10 preguntas. Cada pregunta debe tener ` +
          `exactamente 4 opciones y un único índice de respuesta correcta ` +
          `(0 a 3). Varía la dificultad y cubre los temas más importantes. ` +
          `Responde solo con el JSON solicitado.`
      }
    ];

    for (const c of seleccionados) {
      const { base64, mimeType } = await descargarArchivoBase64(supabase, c.url);
      parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
    }

    const textoJson = await llamarGemini(parts, { jsonSchema: ESQUEMA_EXAMEN });
    const examenGenerado = JSON.parse(textoJson);

    const preguntasCompletas = examenGenerado.preguntas || [];

    if (preguntasCompletas.length === 0) {
      throw new Error("La IA no pudo generar preguntas para este contenido.");
    }

    // Lo que ve el usuario (sin la respuesta correcta)
    const preguntasPublicas = preguntasCompletas.map((p) => ({
      pregunta: p.pregunta,
      opciones: p.opciones
    }));

    // Solo se guarda en la base de datos, nunca se envía al navegador
    // hasta que el usuario termine el examen.
    const respuestasCorrectas = preguntasCompletas.map((p) => p.respuesta_correcta);

    const { data: examen, error: insertError } = await supabase
      .from("examenes_ia")
      .insert({
        unidad_id: unidadId,
        contenido_id: contenidoId || null,
        user_id: user.id,
        preguntas: preguntasPublicas,
        respuestas_correctas: respuestasCorrectas,
        estado: "pendiente"
      })
      .select("id, preguntas")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ examen });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Error generando el examen." },
      { status: 500 }
    );
  }
}
