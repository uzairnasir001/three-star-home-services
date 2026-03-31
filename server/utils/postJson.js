/**
 * POST JSON without using global fetch (avoids undici edge cases where
 * Response body reads throw "Body has already been read" on some Node versions).
 */
import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * @param {string} urlString
 * @param {object} bodyObj
 * @returns {Promise<{ status: number, text: string }>}
 */
export function postJson(urlString, bodyObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const body = JSON.stringify(bodyObj);
    const lib = url.protocol === 'https:' ? https : http;
    const port =
      url.port || (url.protocol === 'https:' ? 443 : 80);
    const req = lib.request(
      {
        hostname: url.hostname,
        port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body, 'utf8'),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );
    req.on('error', reject);
    req.write(body, 'utf8');
    req.end();
  });
}
