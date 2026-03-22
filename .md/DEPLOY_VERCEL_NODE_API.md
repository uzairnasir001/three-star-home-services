# Deploy on Vercel (frontend + JazzCash API)

## How it works

- **Vite build** → static files (`dist/`) for the React app.
- **`/api/*`** → **Vercel Serverless Functions** in the repo root **`api/`** folder:
  - `api/initiate-mwallet-cnic.js`
  - `api/check-payment-status.js`
  - `api/jazzcash-ipn.js`
  - `api/health.js`

Shared logic lives in **`server/lib/jazzcashLogic.js`** (also used by **Express** when you run `npm run server` locally).

The same repo supports:

- **Production (Vercel):** serverless `/api/*`
- **Local dev:** `npm run dev` + `npm run server` with Vite proxy → Express on `:3001`

Do **not** set **`VITE_API_BASE_URL`** on Vercel if you want the browser to call **`/api/...`** on the same domain (recommended).

---

## Environment variables (Vercel → Project → Settings → Environment Variables)

Add the same values you use in **`.env.local`**, including:

| Variable | Used by |
|----------|---------|
| `VITE_SUPABASE_URL` | Frontend + optional server reads |
| `VITE_SUPABASE_ANON_KEY` | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serverless** (bookings updates from IPN / status) |
| `VITE_JAZZCASH_MERCHANT_ID` | Serverless |
| `VITE_JAZZCASH_PASSWORD` | Serverless |
| `VITE_JAZZCASH_INTEGRITY_SALT` | Serverless |
| `VITE_JAZZCASH_PAYMENT_URL` | Frontend (if used) |
| `JAZZCASH_API_BASE_URL` | Serverless (Retrieve API), default sandbox |
| `VITE_JAZZCASH_MWALLET_REST_V2_URL` | Optional override for MWALLET REST URL |

After changing env vars, **redeploy** so functions pick them up.

---

## JazzCash IPN URL

Use your **Vercel** site:

`https://YOUR-PROJECT.vercel.app/api/jazzcash-ipn`

---

## Troubleshooting

### `503` + `missingEnv` on initiate

JazzCash env vars are missing in **Vercel** for the **Production** environment.

### IPN not updating bookings

Set **`SUPABASE_SERVICE_ROLE_KEY`** on Vercel (not the anon key).

### Local “Cannot POST” / proxy

Use **`npm run dev:full`** or two terminals: **`npm run dev`** + **`npm run server`**.

---

## Old setup: external Node + `vercel.json` rewrite

If you previously proxied `/api` to Render/Railway, remove that rewrite. Current **`vercel.json`** only sets **`includeFiles`** so serverless bundles **`server/**`**.
