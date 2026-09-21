export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.status(200).json({
    status: 'ok',
    hasApiKey,
    timestamp: new Date().toISOString(),
  });
}
