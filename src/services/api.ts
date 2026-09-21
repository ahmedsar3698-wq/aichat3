import { ChatApiRequest, ChatApiResponse } from '../types';

export interface HealthStatus {
  status: string;
  hasApiKey: boolean;
  timestamp: string;
}

export const chatApiService = {
  async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
      return { status: 'error', hasApiKey: false, timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', hasApiKey: false, timestamp: new Date().toISOString() };
    }
  },

  async sendMessage(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    model = 'gemini-3.8-flash',
    signal?: AbortSignal
  ): Promise<ChatApiResponse> {
    const payload: ChatApiRequest = {
      message,
      history,
      model,
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let errorMsg = data.error || '';
      
      // If 404 occurred (e.g. backend server starting up or deployed SPA routing)
      if (!errorMsg && res.status === 404) {
        errorMsg = 'Backend server is initializing or the chat endpoint is unreachable. Please try again in a moment.';
      } else if (!errorMsg) {
        errorMsg = `Server responded with status ${res.status}`;
      }

      // Clean up if errorMsg is a JSON string (e.g. from Google API ApiError)
      try {
        if (typeof errorMsg === 'string' && errorMsg.includes('{') && errorMsg.includes('}')) {
          const match = errorMsg.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.error?.message) {
              errorMsg = parsed.error.message;
            }
          }
        }
      } catch {}

      if (
        typeof errorMsg === 'string' &&
        (errorMsg.toLowerCase().includes('high demand') ||
          errorMsg.toLowerCase().includes('unavailable') ||
          errorMsg.toLowerCase().includes('503'))
      ) {
        errorMsg =
          'Google Gemini is currently experiencing high demand. Spikes in traffic are usually temporary. Please try again or switch model.';
      }

      throw new Error(errorMsg);
    }

    return data as ChatApiResponse;
  },
};
