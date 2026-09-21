import { Conversation, AVAILABLE_MODELS } from '../types';

const STORAGE_KEY_CONVERSATIONS = 'nexus_gemini_conversations_v2';
const STORAGE_KEY_ACTIVE_ID = 'nexus_gemini_active_chat_id_v2';
const STORAGE_KEY_SELECTED_MODEL = 'nexus_gemini_selected_model_v2';

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'seed-conv-nextjs-gemini',
    title: 'Gemini API Route in Next.js 14',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'How do I securely call the Google Gemini API using Next.js 14 Route Handlers without leaking my GEMINI_API_KEY to the client?',
        timestamp: '10:55 PM'
      },
      {
        id: 'm2',
        role: 'assistant',
        modelUsed: 'gemini-3.8-flash',
        content: `To securely invoke the Google Gemini API in **Next.js 14 (App Router)** without exposing your API key to client browsers, implement a server-side **Route Handler** at \`app/api/chat/route.ts\`.

### 1. Configure Secret in \`.env.local\`
Place your secret key in your server environment file. Never prefix it with \`NEXT_PUBLIC_\`:

\`\`\`bash
# .env.local
GEMINI_API_KEY=AIzaSyYourSecretGeminiKeyHere
\`\`\`

### 2. Implement Server Route Handler (\`app/api/chat/route.ts\`)
\`\`\`typescript
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Server-side initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(req: Request) {
  try {
    const { message, history, model = 'gemini-3.8-flash' } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Format chat history for @google/genai
    const contents = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini API
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: 'You are an expert AI assistant specializing in Next.js, React, and TypeScript architecture.',
      },
    });

    return NextResponse.json({
      reply: response.text,
      model,
    });
  } catch (error: any) {
    console.error('Gemini API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
\`\`\`

### Key Security & Architectural Advantages:
- 🔒 **Zero Client Leaks**: \`process.env.GEMINI_API_KEY\` is exclusively evaluated on the Node.js / Edge server.
- ⚡ **Type-Safe Payloads**: Request validation prevents malformed requests and resource exhaustion.
- 🛡️ **Rate Limiting**: You can inject Redis or token bucket algorithms right before dispatching the model call.`,
        timestamp: '10:56 PM'
      }
    ]
  },
  {
    id: 'seed-conv-localstorage',
    title: 'Local Storage State Sync in React',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 82800000).toISOString(),
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'Write a reusable TypeScript React hook `useLocalStorage` that prevents SSR hydration mismatches.',
        timestamp: 'Yesterday 2:20 PM'
      },
      {
        id: 'm4',
        role: 'assistant',
        modelUsed: 'gemini-3.8-flash',
        content: `Here is a production-grade \`useLocalStorage\` hook with hydration awareness and storage event synchronization across multiple browser tabs:

\`\`\`typescript
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage once mounted on the client
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  // Setter function supporting functional updates
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((current) => {
          const valueToStore = value instanceof Function ? value(current) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.error(\`Error saving localStorage key "\${key}":\`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue, isHydrated];
}
\`\`\`

### Why this prevents Next.js Hydration Errors:
1. Returns \`initialValue\` on server render and initial client pass.
2. The \`useEffect\` runs strictly on the client, updating \`storedValue\` after the initial DOM tree matches.
3. The \`isHydrated\` boolean allows you to render clean skeleton states until storage is ready.`,
        timestamp: 'Yesterday 2:22 PM'
      }
    ]
  }
];

export const storageService = {
  getConversations(): Conversation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (!raw) {
        this.saveConversations(SEED_CONVERSATIONS);
        return SEED_CONVERSATIONS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sanitize any previously saved error messages so they render properly
        const sanitized = parsed.map((conv: Conversation) => ({
          ...conv,
          messages: Array.isArray(conv.messages)
            ? conv.messages.map((m: any) => {
                if (
                  !m.isError &&
                  m.role === 'assistant' &&
                  typeof m.content === 'string' &&
                  (m.content.includes('"error":{') || m.content.includes('"UNAVAILABLE"'))
                ) {
                  return { ...m, isError: true };
                }
                return m;
              })
            : [],
        }));
        return sanitized;
      }
      return SEED_CONVERSATIONS;
    } catch (e) {
      console.error('Failed to read conversations from localStorage:', e);
      return SEED_CONVERSATIONS;
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to localStorage:', e);
    }
  },

  getActiveConversationId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    } catch {
      return null;
    }
  },

  setActiveConversationId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    } catch (e) {
      console.error('Failed to save active conversation id:', e);
    }
  },

  getSelectedModel(): string {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED_MODEL);
      if (saved && AVAILABLE_MODELS.some(m => m.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return AVAILABLE_MODELS[0].id; // 'gemini-3.8-flash'
  },

  setSelectedModel(modelId: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_MODEL, modelId);
    } catch (e) {
      console.error('Failed to save selected model:', e);
    }
  }
};
