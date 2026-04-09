import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root .env.local first; server/.env.local wins for duplicate keys (override: true).
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });
dotenv.config();

function envTrim(key) {
  const v = process.env[key];
  if (v == null) return undefined;
  const t = String(v).trim();
  return t === '' ? undefined : t;
}

/**
 * Card Page Redirection v1.1 — default same host family as MWALLET REST (onlinepayments orchestrator).
 * Legacy sandbox CustomerPortal (sandbox.jazzcash.com.pk) only if JazzCash tells you to use it.
 */
function resolveCardMerchantFormUrl() {
  const explicit = process.env.VITE_JAZZCASH_CARD_MERCHANT_FORM_URL?.trim();
  if (explicit) return explicit;
  if (process.env.JAZZCASH_CARD_USE_SANDBOX_FORM === '1') {
    return 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';
  }
  return 'https://onlinepayments.jazzcash.com.pk/payment-orchestrator/CustomerPortal/transactionmanagement/merchantform';
}

export const config = {
  port: process.env.PORT || 3001,
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  },
  jazzcash: {
    /** Serverless: JAZZCASH_* (optional) overrides VITE_* — same values as portal; trimmed to avoid hash / Return URL mismatches. */
    merchantId: envTrim('JAZZCASH_MERCHANT_ID') ?? envTrim('VITE_JAZZCASH_MERCHANT_ID'),
    password: envTrim('JAZZCASH_PASSWORD') ?? envTrim('VITE_JAZZCASH_PASSWORD'),
    integritySalt:
      envTrim('JAZZCASH_INTEGRITY_SALT') ??
      envTrim('VITE_JAZZCASH_INTEGRITY_SALT') ??
      envTrim('VITE_JAZZCASH_INTEGRITY_CHECK_KEY'),
    apiBaseUrl:
      process.env.JAZZCASH_API_BASE_URL ||
      'https://sandbox.jazzcash.com.pk',
    mwalletRestV2CnicUrl:
      process.env.VITE_JAZZCASH_MWALLET_REST_V2_URL ||
      'https://onlinepayments.jazzcash.com.pk/payment-orchestrator/api/v2/rest/payments/m-wallet',
    /** Status Inquiry Guide (2026) API v2 — same host family as orchestrator REST. */
    statusInquiryV2Url:
      envTrim('JAZZCASH_STATUS_INQUIRY_V2_URL') ||
      'https://onlinepayments.jazzcash.com.pk/payment-orchestrator/api/v2/rest/payments/status/inquiry',
    /** Card Page Redirection v1.1 — POST form to merchantform (sandbox vs live host differs; override with VITE_JAZZCASH_CARD_MERCHANT_FORM_URL). */
    cardMerchantFormUrl: resolveCardMerchantFormUrl(),
    /** Full URL registered in JazzCash portal (e.g. https://your-app.vercel.app/api/jazzcash-card-return) */
    cardReturnUrl: envTrim('JAZZCASH_CARD_RETURN_URL') || '',
    /** SPA origin for redirect after card payment (e.g. https://your-app.vercel.app or http://localhost:3000) */
    spaPublicOrigin:
      process.env.JAZZCASH_SPA_PUBLIC_ORIGIN ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''),
  },
};
