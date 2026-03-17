/**
 * JazzCash Secure Hash - HMAC-SHA256 per official documentation
 * 1. Filter pp_* params (exclude pp_SecureHash, null/empty)
 * 2. Sort keys alphabetically
 * 3. Concatenate: SALT&value1&value2&...
 * 4. HMAC-SHA256(concatenated, integritySalt) -> uppercase hex
 */
import crypto from 'crypto';

export function generateSecureHash(params, integritySalt) {
  const filtered = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      key.toLowerCase().startsWith('pp_') &&
      key.toLowerCase() !== 'pp_securehash' &&
      value != null &&
      String(value).trim() !== ''
    ) {
      filtered[key] = String(value).trim();
    }
  }

  const sortedKeys = Object.keys(filtered).sort();
  const values = sortedKeys.map((k) => filtered[k]);
  const concatenated =
    values.length === 0 ? integritySalt : `${integritySalt}&${values.join('&')}`;

  const hmac = crypto.createHmac('sha256', integritySalt);
  hmac.update(concatenated, 'utf8');
  return hmac.digest('hex').toUpperCase();
}

export function verifySecureHash(params, integritySalt, receivedHash) {
  const computed = generateSecureHash(params, integritySalt);
  return computed === (receivedHash || '').toUpperCase();
}
