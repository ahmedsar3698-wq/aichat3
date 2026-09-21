import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function parseGeminiError(error: any): { message: string; isUnavailable: boolean; statusCode: number } {
  let raw = error?.message || (typeof error === 'string' ? error : '');
  let statusCode = error?.status || error?.code || 500;
  let isUnavailable = false;

  // Check if error itself has status or code 503
  if (statusCode === 503 || error?.status === 'UNAVAILABLE' || error?.statusText === 'Service Unavailable') {
    isUnavailable = true;
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        raw = parsed.error.message;
      }
      if (parsed.error?.code) {
        statusCode = parsed.error.code;
      }
      if (parsed.error?.status === 'UNAVAILABLE' || parsed.error?.code === 503) {
        isUnavailable = true;
      }
    }
  } catch {
    // Continue with string parsing
  }

  const lower = (raw + ' ' + (error?.status || '')).toLowerCase();
  if (
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('503') ||
    lower.includes('temporarily unavailable') ||
    statusCode === 503
  ) {
    isUnavailable = true;
    raw = 'Google Gemini is currently experiencing high demand. Spikes in demand are usually temporary. Retrying with an alternate fast model...';
  } else if (lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('429')) {
    raw = 'Google Gemini request limit reached. Please wait a brief moment before sending another prompt.';
  } else if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || lower.includes('unauthenticated')) {
    raw = 'The configured GEMINI_API_KEY is invalid. Please verify your API key in your project settings.';
  }

  return {
    message: raw || 'Unable to communicate with Gemini API.',
    isUnavailable,
    statusCode: typeof statusCode === 'number' && statusCode >= 400 && statusCode < 600 ? statusCode : 503,
  };
}

export interface ChatRequestParams {
  message: string;
  history?: Array<{ role: string; content: string }>;
  model?: string;
}

export interface ChatResult {
  status: number;
  data: {
    reply?: string;
    model?: string;
    error?: string;
  };
}

export async function processChatRequest({
  message,
  history = [],
  model = 'gemini-3.8-flash',
}: ChatRequestParams): Promise<ChatResult> {
  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      status: 400,
      data: { error: 'A valid prompt message is required.' },
    };
  }

  const ai = getGeminiClient();

  // If no GEMINI_API_KEY is configured in the environment
  if (!ai) {
    return {
      status: 401,
      data: {
        error:
          'GEMINI_API_KEY environment variable is not configured. Please add your GEMINI_API_KEY in your deployment environment variables (e.g. Vercel Project Settings -> Environment Variables or AI Studio Settings) to enable live Gemini AI responses.',
      },
    };
  }

  // Map history to @google/genai format
  const contents = history.map((item: { role: string; content: string }) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }));

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  // Target supported model
  const validModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
  const targetModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

  // Failover model chain: if a model is facing high demand (503), try robust fallbacks
  const failoverModels: string[] = [targetModel];
  if (targetModel === 'gemini-3.8-flash') {
    failoverModels.push('gemini-flash-latest', 'gemini-3.1-flash-lite');
  } else if (targetModel === 'gemini-flash-latest') {
    failoverModels.push('gemini-3.8-flash', 'gemini-3.1-flash-lite');
  } else if (targetModel === 'gemini-3.1-flash-lite') {
    failoverModels.push('gemini-flash-latest', 'gemini-3.8-flash');
  } else if (targetModel === 'gemini-3.1-pro-preview') {
    failoverModels.push('gemini-3.8-flash', 'gemini-flash-latest');
  }
  const uniqueModels = Array.from(new Set(failoverModels));

  let lastError: any = null;
  let successfulResponse: { text: string; modelUsed: string } | null = null;

  const systemInstruction =
    'You are Nexus AI, an advanced, highly knowledgeable full-stack AI engineering assistant. You excel at Next.js, React, Tailwind CSS, TypeScript, modern web architectures, and algorithms. Always format code using markdown code blocks with explicit language tags (e.g. ```typescript, ```tsx, ```bash, ```json). Provide clean, production-ready, well-commented code and structured explanations with bullet points and headings.';

  for (const currentModel of uniqueModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            systemInstruction,
          },
        });

        const replyText = response.text || 'No response text generated.';
        successfulResponse = {
          text: replyText,
          modelUsed: currentModel,
        };
        break;
      } catch (err: any) {
        lastError = err;
        const errDetails = parseGeminiError(err);

        if (errDetails.isUnavailable) {
          if (attempt === 0) {
            // Short backoff before retrying same model
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          } else {
            console.warn(`Model ${currentModel} returned 503 high demand. Trying next model...`);
            break;
          }
        } else {
          // Non-retryable error (e.g. invalid arguments or bad auth)
          break;
        }
      }
    }

    if (successfulResponse) {
      break;
    }
  }

  if (successfulResponse) {
    return {
      status: 200,
      data: {
        reply: successfulResponse.text,
        model: successfulResponse.modelUsed,
      },
    };
  }

  // If all live models failed, extract clean error
  const parsedErr = parseGeminiError(lastError);
  console.error('All Gemini API models failed:', parsedErr.message);
  return {
    status: parsedErr.statusCode >= 400 && parsedErr.statusCode < 600 ? parsedErr.statusCode : 503,
    data: {
      error: parsedErr.message,
    },
  };
}
