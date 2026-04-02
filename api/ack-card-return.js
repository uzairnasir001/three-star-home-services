import { runAckCardReturnSuccess } from '../server/lib/jazzcashLogic.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const out = await runAckCardReturnSuccess(body);
  return res.status(out.statusCode).json(out.json);
}
