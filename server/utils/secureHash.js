/**
 * JazzCash Secure Hash - HMAC-SHA256 per official documentation
 * 1. Filter params whose names start with "pp" (includes ppmpf_*), exclude pp_SecureHash
 * 2. Omit null, undefined, and empty / whitespace-only values from the hash input only
 *    (still send "" in JSON where the guide requires those fields on the wire)
 * 3. Sort keys alphabetically
 * 4. Concatenate: SALT&value1&value2&...
 * 5. HMAC-SHA256(concatenated, integritySalt) -> uppercase hex
 */
import crypto from 'crypto';

export function generateSecureHash(params, integritySalt) {
  const filtered = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      key.toLowerCase().startsWith('pp') &&
      key.toLowerCase() !== 'pp_securehash' &&
      value != null &&
      String(value).trim() !== ''
    ) {
      filtered[key] = typeof value === 'string' ? value.trim() : String(value).trim();
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
