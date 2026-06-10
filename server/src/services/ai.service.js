const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY não configurada no servidor.");
    err.status = 503;
    throw err;
  }
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return { apiKey, model };
}

/**
 * Chama o Gemini com uma imagem/PDF inline + prompt e devolve o JSON parseado.
 * @param {Buffer} buffer - Conteúdo do arquivo
 * @param {string} mimeType
 * @param {string} prompt
 */
async function generateJSON(buffer, mimeType, prompt) {
  const { apiKey, model } = getConfig();

  const response = await fetch(
    `${API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: buffer.toString("base64") } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const err = new Error(`Erro na API do Gemini (${response.status}): ${body.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const err = new Error("A IA não retornou conteúdo para este arquivo.");
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("A IA retornou um formato inesperado. Tente novamente.");
    err.status = 502;
    throw err;
  }
}

const MEDICATION_PROMPT = `Você é um assistente que extrai medicamentos de fotos de receitas médicas brasileiras.
Analise a imagem e extraia TODOS os medicamentos prescritos.

Responda APENAS com JSON neste formato:
{
  "medications": [
    {
      "name": "nome do medicamento (sem dosagem)",
      "dosage": "dosagem, ex: 500mg" ou null,
      "frequency": "frequência por extenso, ex: 8 em 8 horas" ou null,
      "times": "horários sugeridos das doses no formato HH:mm separados por vírgula, ex: 08:00,16:00,00:00" ou null
    }
  ]
}

Regras:
- Se não conseguir ler algum campo, use null — NUNCA invente dados.
- Para "times", sugira horários convencionais coerentes com a frequência (começando às 08:00).
- Se a imagem não for uma receita médica ou estiver ilegível, retorne {"medications": []}.`;

const DOCUMENT_PROMPT = `Você é um assistente que analisa documentos médicos brasileiros (laudos, exames, receitas, atestados).
Analise o documento e responda APENAS com JSON neste formato:
{
  "title": "título curto e descritivo, ex: Hemograma completo — março/2026",
  "summary": "resumo objetivo dos achados relevantes em português, 2 a 5 frases. Destaque valores fora da referência, diagnósticos e orientações."
}

Regras:
- Seja fiel ao documento — NUNCA invente dados.
- Se o documento estiver ilegível, use title "Documento médico" e explique no summary que não foi possível ler.`;

/**
 * Extrai medicamentos de uma foto de receita.
 * @returns {Promise<{ medications: Array }>}
 */
export async function extractMedicationsFromImage(buffer, mimeType) {
  const result = await generateJSON(buffer, mimeType, MEDICATION_PROMPT);
  return { medications: Array.isArray(result.medications) ? result.medications : [] };
}

/**
 * Gera título e resumo de um documento médico (imagem ou PDF).
 * @returns {Promise<{ title: string, summary: string }>}
 */
export async function analyzeDocument(buffer, mimeType) {
  const result = await generateJSON(buffer, mimeType, DOCUMENT_PROMPT);
  return {
    title: result.title ?? "Documento médico",
    summary: result.summary ?? "",
  };
}
