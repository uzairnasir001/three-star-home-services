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

Use **Production** (and **Preview** if you want previews to work). Same names as **`.env.local`** — see **`.env.example`** for placeholders.

**Minimum set (matches a typical sandbox deploy):**

| Variable | Where it’s used |
|----------|------------------|
| `VITE_SUPABASE_URL` | Client build + serverless config |
| `VITE_SUPABASE_ANON_KEY` | Client build |
| `SUPABASE_SERVICE_ROLE_KEY` | **Serverless only** — IPN / status → Supabase updates |
| `VITE_JAZZCASH_MERCHANT_ID` | Serverless (initiate + Retrieve hash) |
| `VITE_JAZZCASH_PASSWORD` | Serverless |
| `VITE_JAZZCASH_INTEGRITY_SALT` | Serverless |
| `VITE_JAZZCASH_PAYMENT_URL` | Client (merchant-form flow if used) |
| `JAZZCASH_API_BASE_URL` | Serverless — e.g. `https://sandbox.jazzcash.com.pk` |

**Optional:**

| Variable | Purpose |
|----------|---------|
| `VITE_JAZZCASH_MWALLET_REST_V2_URL` | Override MWALLET REST CNIC endpoint (otherwise default in `server/config.js`) |

After adding or changing variables, **redeploy** (serverless reads env at runtime; `VITE_*` are also inlined at **build** time for the client).

### Security

- **Never** commit `.env.local` (repo already gitignores `*.local` and `.env*` patterns).
- **Never** paste **service_role**, **passwords**, or **JWT keys** in chat, tickets, or screenshots. If they leak, **rotate** them in Supabase / JazzCash and update Vercel + your local `.env.local`.

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
