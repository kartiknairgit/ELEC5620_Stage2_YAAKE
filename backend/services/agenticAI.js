const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

/**
 * AgenticAI - a lightweight wrapper around the Google Generative (Gemini) client
 * Provides convenience methods for starting chat sessions and generating content.
 * This class is intended to be extended or instantiated by higher-level agents.
 */
class AgenticAI {
  constructor(options = {}) {
    const apiKey = process.env.GEMINI_API_KEY || options.apiKey || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.defaultModel = options.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    this.model = this.genAI.getGenerativeModel({ model: this.defaultModel });
  }

  /**
   * Start a chat with an optional history and generation config.
   * Returns the chat object from the SDK which supports sendMessage().
   */
  startChat({ history = [], generationConfig = {} } = {}) {
    return this.model.startChat({ history, generationConfig });
  }

  /**
   * Send a message to an existing chat session (SDK chat object) and return the response text.
   */
  async sendChatMessage(chat, message) {
    const result = await chat.sendMessage(message);
    return result.response?.text?.() || '';
  }

  /**
   * Generate a single-shot completion for a prompt. Returns the response text.
   */
  async generateContent(prompt, generationConfig = {}) {
    const config = Object.assign({ maxOutputTokens: 512, temperature: 0.3 }, generationConfig);
    const result = await this.model.generateContent(prompt, config);
    return result.response?.text?.() || '';
  }
}

module.exports = AgenticAI;
