import fetch from 'cross-fetch';

/**
 * Client class to communicate with Band.ai platform APIs.
 */
export class BandClient {
  /**
  /**
   * @param {string} apiKey - The Band.ai agent API key.
   * @param {string} agentId - The Band.ai agent UUID.
   * @param {string} [baseUrl] - Base URL for the Band.ai API.
   */
  constructor(apiKey, agentId = '', baseUrl = 'https://app.band.ai/api/v1') {
    this.apiKey = apiKey;
    this.agentId = agentId;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * General request helper with authentication.
   */
  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        let errMessage = `HTTP error! Status: ${response.status}`;
        try {
          const errJson = await response.json();
          const errorObj = errJson.error || errJson;
          errMessage = typeof errorObj === 'object' ? (errorObj.message || JSON.stringify(errorObj)) : errorObj;
        } catch (_) {}
        console.warn(`[BandClient Warning] Request to ${path} failed: ${errMessage}`);
        return { success: false, error: errMessage };
      }

      return { success: true, data: await response.json() };
    } catch (err) {
      console.warn(`[BandClient Warning] Network failure targeting ${path}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Notify Band.ai that a message is being processed.
   * @param {string} messageId 
   */
  async markProcessing(messageId) {
    return this.request(`/agent/messages/${messageId}/processing`, { method: 'POST' });
  }

  /**
   * Notify Band.ai that processing is completed.
   * @param {string} messageId 
   */
  async markProcessed(messageId) {
    return this.request(`/agent/messages/${messageId}/processed`, { method: 'POST' });
  }

  /**
   * Notify Band.ai that processing failed.
   * @param {string} messageId 
   * @param {string} [reason]
   */
  async markFailed(messageId, reason = '') {
    return this.request(`/agent/messages/${messageId}/failed`, {
      method: 'POST',
      body: { reason }
    });
  }

  /**
   * Send a message to a specific Band chat room.
   * @param {string} chatRoomId 
   * @param {string} content 
   * @param {string} [mentionId] - The peer agent/user UUID to mention (to avoid self-mention errors)
   * @param {Object} [payload] - Optional structured JSON metadata
   */
  async sendMessage(chatRoomId, content, mentionId = '', payload = null) {
    // If we have payload, append it formatted as code block in the content, or let it send as content.
    let fullContent = content;
    if (payload) {
      const formattedJson = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      fullContent = `${content}\n\n\`\`\`json\n${formattedJson}\n\`\`\``;
    }

    // Build the payload matching the schema validation rules:
    // Requires a top-level 'message' object with 'content' and 'mentions' containing a valid UUID.
    const body = {
      message: {
        content: fullContent,
        mentions: mentionId ? [{ id: mentionId }] : []
      }
    };

    return this.request(`/agent/chats/${chatRoomId}/messages`, {
      method: 'POST',
      body
    });
  }

  /**
   * Create a new chat room.
   * @param {string} title 
   */
  async createChatRoom(title) {
    return this.request('/agent/chats', {
      method: 'POST',
      body: { chat: { title } }
    });
  }

  /**
   * Add an external agent or user as participant in a chat room.
   * @param {string} chatRoomId 
   * @param {string} participantId 
   */
  async addParticipant(chatRoomId, participantId) {
    return this.request(`/agent/chats/${chatRoomId}/participants`, {
      method: 'POST',
      body: {
        participant: {
          participant_id: participantId
        }
      }
    });
  }
}

// Pre-configured instances for the 3 agents
export const scopingBandClient = new BandClient(
  process.env.BAND_SCOPING_AGENT_KEY || '',
  process.env.BAND_SCOPING_AGENT_ID || ''
);
export const riskBandClient = new BandClient(
  process.env.BAND_RISK_AGENT_KEY || '',
  process.env.BAND_RISK_AGENT_ID || ''
);
export const ledgerBandClient = new BandClient(
  process.env.BAND_LEDGER_AGENT_KEY || '',
  process.env.BAND_LEDGER_AGENT_ID || ''
);

export default BandClient;
