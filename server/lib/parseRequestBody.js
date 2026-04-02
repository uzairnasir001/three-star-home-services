/**
 * Vercel may pass JSON as object; IPN may be urlencoded string.
 */
export function parseRequestBody(req) {
  const body = req.body;
  if (body == null) return {};
  // Vercel / some runtimes use plain objects without Object.prototype (constructor check would fail).
  if (typeof body === 'object' && !Array.isArray(body)) {
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
