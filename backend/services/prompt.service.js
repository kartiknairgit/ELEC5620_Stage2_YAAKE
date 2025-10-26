const AgenticAI = require('./agenticAI');

// Use shared agent instance (stateless wrapper around Gemini client)
const agent = new AgenticAI();

/**
 * Extract course metadata from a URL using Gemini via AgenticAI
 * Returns { title, provider, description }
 */
async function extractFromUrl(url) {
  if (!url) throw new Error('URL is required');

  const prompt = `You are a web content extractor. Given the URL ${url}, extract these fields:\n- title (short, 8-12 words max)\n- provider (the organisation or site name)\n- description (one paragraph, 30-80 words) describing the course or offering on that page\n- signup_link or signupLink (the direct signup/enrolment URL, if present)\nReturn ONLY a JSON object with keys: title, provider, description, signupLink (or signup_link). If a field cannot be determined, set it to an empty string.`;

  try {
    const text = await agent.generateContent(prompt, { maxOutputTokens: 400, temperature: 0.2 });

    // attempt to find JSON object in the response text
    const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const signup = parsed.signupLink || parsed.signup_link || '';
        // if signup not provided, try to find a URL in the raw text as a fallback
        if (!signup) {
          const urlMatch = String(text || '').match(/https?:\/\/[^")\]\s]+/i);
          if (urlMatch) parsed.signupLink = urlMatch[0];
        }

        return {
          title: parsed.title || '',
          provider: parsed.provider || '',
          description: parsed.description || '',
          signupLink: parsed.signupLink || parsed.signup_link || ''
        };
      } catch (err) {
        // fallthrough to attempt URL extraction from raw text
        console.warn('Prompt service: failed to parse JSON from model response, will try to extract URL from raw text');
      }
    }

    // fallback: try to extract first URL from the raw text and return as signupLink
    const urlMatch = String(text || '').match(/https?:\/\/[^")\]\s]+/i);
    const foundUrl = urlMatch ? urlMatch[0] : '';

    return { title: '', provider: '', description: String(text || ''), signupLink: foundUrl };
  } catch (error) {
    console.error('Prompt service error:', error?.response?.data || error.message || error);
    throw new Error('Failed to extract metadata from URL');
  }
}

module.exports = { extractFromUrl };
