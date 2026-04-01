import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root .env.local first; server/.env.local wins for duplicate keys (override: true).
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  },
  jazzcash: {
    merchantId: process.env.VITE_JAZZCASH_MERCHANT_ID,
    password: process.env.VITE_JAZZCASH_PASSWORD,
    integritySalt: process.env.VITE_JAZZCASH_INTEGRITY_SALT || process.env.VITE_JAZZCASH_INTEGRITY_CHECK_KEY,
    apiBaseUrl:
      process.env.JAZZCASH_API_BASE_URL ||
      'https://sandbox.jazzcash.com.pk',
    mwalletRestV2CnicUrl:
      process.env.VITE_JAZZCASH_MWALLET_REST_V2_URL ||
      'https://onlinepayments.jazzcash.com.pk/payment-orchestrator/api/v2/rest/payments/m-wallet',
    /** Card Page Redirection v1.1 — POST form to JazzCash merchantform URL */
    cardMerchantFormUrl:
      process.env.VITE_JAZZCASH_CARD_MERCHANT_FORM_URL ||
      'https://onlinepayments.jazzcash.com.pk/payment-orchestrator/CustomerPortal/transactionmanagement/merchantform',
    /** Full URL registered in JazzCash portal (e.g. https://your-app.vercel.app/api/jazzcash-card-return) */
    cardReturnUrl: process.env.JAZZCASH_CARD_RETURN_URL || '',
    /** SPA origin for redirect after card payment (e.g. https://your-app.vercel.app or http://localhost:3000) */
    spaPublicOrigin:
      process.env.JAZZCASH_SPA_PUBLIC_ORIGIN ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''),
  },
};
