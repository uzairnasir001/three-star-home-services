import { runJazzcashIpn } from '../server/lib/jazzcashLogic.js';
import { parseRequestBody } from '../server/lib/parseRequestBody.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }
  const data = parseRequestBody(req);
  const out = await runJazzcashIpn(data);
  if (out.json) return res.status(out.statusCode).json(out.json);
  return res.status(out.statusCode).send(out.text ?? '');
}
