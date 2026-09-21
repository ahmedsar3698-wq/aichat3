import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { processChatRequest } from './src/server/geminiService';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json());

// 1. Health API route
app.get('/api/health', (req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasApiKey,
    timestamp: new Date().toISOString(),
  });
});

// 2. Chat API route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], model = 'gemini-3.8-flash' } = req.body || {};
    const result = await processChatRequest({ message, history, model });
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error('Unhandled chat server error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error while processing chat.',
    });
  }
});

// 3. Mount Vite Middleware or Serve Static Files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
