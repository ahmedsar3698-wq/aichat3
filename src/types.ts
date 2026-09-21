export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export const AVAILABLE_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Fast & Smart',
    description: 'Next-generation multimodal model built for speed, coding, and general tasks.'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'High Availability',
    description: 'Latest auto-updating Gemini Flash release for reliable production workloads.'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Lightweight model optimized for rapid response times and high availability.'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    badge: 'Complex Reasoning',
    description: 'Advanced reasoning and intricate logic. (Requires a paid API key).'
  }
];

export interface ChatApiRequest {
  message: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
}

export interface ChatApiResponse {
  reply: string;
  model: string;
  usage?: {
    totalTokens?: number;
  };
}
