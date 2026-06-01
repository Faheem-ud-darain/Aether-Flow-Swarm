import fetch from 'cross-fetch';
import dotenv from 'dotenv';

// Load environment variables if not already loaded
dotenv.config();

/**
 * A client class that mimics the standard OpenAI API structure
 * using cross-fetch, compatible with various LLM API providers.
 */
export class OpenAICompatibleClient {
  /**
   * @param {Object} config
   * @param {string} config.apiKey - The API key for authorization
   * @param {string} config.baseUrl - The base URL of the API (e.g. https://api.featherless.ai/v1)
   */
  constructor({ apiKey, baseUrl }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Performs an HTTP request to the API endpoint.
   * @param {string} path - The endpoint path (e.g. '/chat/completions')
   * @param {Object} [options={}] - Custom request options
   * @returns {Promise<Object>} The JSON response parsed from the API
   */
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      method: options.method || 'POST',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson) || errorMessage;
      } catch (e) {
        // Fallback to text if response is not JSON
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch (_) {}
      }
      throw new Error(`[AI Client Error] ${errorMessage}`);
    }

    return response.json();
  }

  /**
   * Chat completions endpoint interface.
   */
  chat = {
    completions: {
      /**
       * Create a chat completion.
       * @param {Object} body - OpenAI chat completion request body options
       * @param {string} body.model - The model to query
       * @param {Array<Object>} body.messages - Messages array
       * @returns {Promise<Object>} Chat completion response object
       */
      create: async (body) => {
        return this.request('/chat/completions', {
          method: 'POST',
          body,
        });
      }
    }
  };

  /**
   * Text completions endpoint interface.
   */
  completions = {
    /**
     * Create a text completion.
     * @param {Object} body - OpenAI text completion request body options
     * @returns {Promise<Object>} Completion response object
     */
    create: async (body) => {
      return this.request('/completions', {
        method: 'POST',
        body,
      });
    }
  };

  /**
   * Embeddings endpoint interface.
   */
  embeddings = {
    /**
     * Create embeddings.
     * @param {Object} body - OpenAI embeddings request body options
     * @returns {Promise<Object>} Embeddings response object
     */
    create: async (body) => {
      return this.request('/embeddings', {
        method: 'POST',
        body,
      });
    }
  };
}

// Instantiate specific clients configured for Featherless AI
export const featherlessClient = new OpenAICompatibleClient({
  apiKey: process.env.FEATHERLESS_API_KEY || '',
  baseUrl: process.env.FEATHERLESS_BASE_URL || 'https://api.featherless.ai/v1',
});

// Instantiate specific clients configured for AI/ML API
export const aimlClient = new OpenAICompatibleClient({
  apiKey: process.env.AIML_API_KEY || '',
  baseUrl: process.env.AIML_BASE_URL || 'https://api.aimlapi.com/v1',
});

export default OpenAICompatibleClient;
