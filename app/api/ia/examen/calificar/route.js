import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { examenId, respuestas } = await request.json();

  if (!examenId || !Array.isArray(respuestas)) {
    return NextResponse.json({ error: "Faltan datos del examen." }, { status: 400 });
  }

  const { data: examen, error: examenError } = await supabase
    .from("examenes_ia")
    .select("id, preguntas, respuestas_correctas, user_id, estado")
    .eq("id", examenId)
    .single();

  if (examenError || !examen) {
    return NextResponse.json({ error: "No se encontró el examen." }, { status: 404 });
  }

  if (examen.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const correctas = examen.respuestas_correctas;
  const total = correctas.length;
  let aciertos = 0;

  const revision = examen.preguntas.map((p, i) => {
    const esCorrecta = respuestas[i] === correctas[i];
    if (esCorrecta) aciertos++;
    return {
      pregunta: p.pregunta,
      opciones: p.opciones,
      respuesta_usuario: respuestas[i] ?? null,
      respuesta_correcta: correctas[i]
    };
  });

  const nota = total > 0 ? Math.round((aciertos / total) * 100) : 0;

  const { error: updateError } = await supabase
    .from("examenes_ia")
    .update({
      respuestas_usuario: respuestas,
      nota,
      estado: "calificado",
      calificado_at: new Date().toISOString()
    })
    .eq("id", examenId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ nota, aciertos, total, revision });
}
