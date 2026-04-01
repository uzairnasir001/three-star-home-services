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

/** Card Page Redirection: sandbox uses CustomerPortal on sandbox.jazzcash.com.pk; live uses onlinepayments orchestrator (v1.1 PDF). */
function resolveCardMerchantFormUrl() {
  const explicit = process.env.VITE_JAZZCASH_CARD_MERCHANT_FORM_URL?.trim();
  if (explicit) return explicit;
  /* Force sandbox hosted form when Retrieve base URL does not include "sandbox" (e.g. unset/mistyped on Vercel). */
  if (process.env.JAZZCASH_CARD_USE_SANDBOX_FORM === '1') {
    return 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';
  }
  const apiBase = process.env.JAZZCASH_API_BASE_URL || 'https://sandbox.jazzcash.com.pk';
  const useSandboxForm = apiBase.includes('sandbox.jazzcash.com.pk');
  if (useSandboxForm) {
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
