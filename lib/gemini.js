// Este archivo SOLO se ejecuta en el servidor (rutas app/api/ia/*).
// La API key de Gemini nunca se envía al navegador del usuario.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "Falta configurar GEMINI_API_KEY en las variables de entorno del servidor."
    );
  }
  return key;
}

// Llama a Gemini con un arreglo de "parts" (texto + archivos en base64)
// y devuelve el texto de la respuesta. Si se pasa jsonSchema, le pide a
// Gemini que responda en JSON siguiendo ese esquema.
export async function llamarGemini(parts, { jsonSchema } = {}) {
  const apiKey = getApiKey();

  const body = {
    contents: [{ role: "user", parts }]
  };

  if (jsonSchema) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: jsonSchema
    };
  }

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    const mensaje = data?.error?.message || "Error al llamar a Gemini.";
    throw new Error(mensaje);
  }

  const candidato = data?.candidates?.[0];
  const texto =
    candidato?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") ||
    "";

  if (!texto) {
    throw new Error(
      "Gemini no devolvió contenido. Es posible que el archivo sea muy grande o el modelo esté saturado."
    );
  }

  return texto;
}

// Descarga un archivo del bucket "archivos" y lo devuelve en base64,
// junto con su tipo MIME, listo para enviarlo a Gemini como inline_data.
export async function descargarArchivoBase64(supabase, path) {
  const { data, error } = await supabase.storage.from("archivos").download(path);

  if (error) {
    throw new Error("No se pudo leer el archivo desde el almacenamiento: " + error.message);
  }

  const arrayBuffer = await data.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = data.type || "application/octet-stream";

  // Límite práctico: Gemini acepta datos "inline" hasta ~20MB en base64.
  // 15 MB de archivo original ya son ~20MB en base64, así que avisamos antes.
  const MAX_BYTES = 15 * 1024 * 1024;
  if (arrayBuffer.byteLength > MAX_BYTES) {
    throw new Error(
      "Este archivo es demasiado grande para que la IA lo lea directamente (máximo recomendado 15MB)."
    );
  }

  return { base64, mimeType };
}

export const TIPOS_LEGIBLES_POR_IA = ["pdf", "imagen"];
