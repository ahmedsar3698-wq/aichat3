import { processChatRequest } from '../src/server/geminiService';

export default async function handler(req: any, res: any) {
  // CORS support for Vercel edge/serverless requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { message, history = [], model = 'gemini-3.8-flash' } = body || {};
    const result = await processChatRequest({ message, history, model });
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error('Vercel serverless function error:', error);
    return res.status(500).json({
      error: error?.message || 'Server error while processing chat.',
    });
  }
}
