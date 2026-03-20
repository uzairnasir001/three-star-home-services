import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
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
  },
};
