const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * LLM Service (Gemini)
 * Provider-agnostic interface but currently wired to Gemini via @google/generative-ai.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL ='gemini-2.0-flash-lite';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API key is not set. Please add GEMINI_API to your backend .env');
}

let genAI;
try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
} catch (e) {
  // library will throw if key missing; keep service constructable for tests
}

/**
 * Generate JSON-safe response from the model using a system instruction and a user prompt.
 * Returns parsed JSON, throws on invalid JSON or provider error.
 */
async function generateJson({ systemInstruction, userPrompt, responseSchema, temperature = 0.6, maxOutputTokens = 2048 }) {
  if (!genAI) throw new Error('Gemini client not initialized');

  const content = [
    { role: 'user', parts: [{ text: userPrompt }] }
  ];

  const generationConfig = {
    temperature,
    maxOutputTokens,
    responseMimeType: 'application/json'
  };

  const candidates = [
    GEMINI_MODEL,
    'gemini-1.5-flash-8b-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash'
  ];
  let lastError;
  for (const modelName of candidates.filter(Boolean)) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      const result = await model.generateContent({ contents: content, generationConfig });
      const text = result?.response?.text?.() ?? '';
      if (process.env.PROMPT_DEBUG === 'true') {
        console.log('\n🧪 GEMINI RAW OUTPUT:');
        console.log(String(text));
      }
      if (!text) throw new Error('Empty response from LLM');

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('LLM returned non-JSON output');
        }
      }

      if (responseSchema && typeof responseSchema === 'function') {
        const ok = responseSchema(parsed);
        if (!ok) throw new Error('LLM JSON did not match expected schema');
      }

      return parsed;
    } catch (err) {
      lastError = err;
      const message = String(err?.message || '');
      // Try next model only for model-availability errors
      const isModelNotFound = message.includes('404') || message.toLowerCase().includes('not found') || message.toLowerCase().includes('not supported');
      if (!isModelNotFound) break;
      // otherwise continue to next candidate
    }
  }

  throw lastError || new Error('LLM generation failed');
}

module.exports = {
  generateJson
};


