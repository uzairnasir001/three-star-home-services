/**
 * Vercel may pass JSON as object; IPN may be urlencoded string.
 */
export function parseRequestBody(req) {
  const body = req.body;
  if (body == null) return {};
  if (typeof body === 'object' && !Array.isArray(body) && body.constructor === Object) {
    return body;
  }
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return {};
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        /* fall through */
      }
    }
    const params = new URLSearchParams(trimmed);
    const out = {};
    for (const [k, v] of params.entries()) {
      out[k] = v;
    }
    return out;
  }
  return {};
}
