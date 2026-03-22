import { config } from '../server/config.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method Not Allowed');
  }
  return res.status(200).json({
    ok: true,
    message: 'API (Vercel serverless) is running',
    port: config.port,
  });
}
