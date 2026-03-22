# Vercel frontend + Node API (JazzCash `/api/*`)

## Why you see `NOT_FOUND` / `bom1::…` on `/api/initiate-mwallet-cnic`

Vercel only hosts the **static Vite build**. There is **no** Express server there unless you add one.  
`fetch("/api/...")` goes to **your-project.vercel.app** → **404**.

## Fix (pick one)

### Option A — **Recommended:** `vercel.json` reverse proxy (no CORS for browser)

1. Deploy the Node app (e.g. **Render**, Railway, Fly.io):
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - Set env vars: same secrets as `.env.local` (JazzCash, `SUPABASE_SERVICE_ROLE_KEY`, etc.).

2. Copy your real API origin, e.g. `https://three-stars-api.onrender.com`.

3. Edit **`vercel.json`** in this repo — replace `YOUR-BACKEND` in the rewrite `destination` with your host **only** (no path):

   ```json
   "destination": "https://three-stars-api.onrender.com/api/:path*"
   ```

   Vercel forwards `GET/POST /api/initiate-mwallet-cnic` → `https://…onrender.com/api/initiate-mwallet-cnic`.

4. Commit, push, let Vercel redeploy.

5. Leave **`VITE_API_BASE_URL` unset** on Vercel so the app keeps using same-origin `/api/...` (proxied by Vercel).

### Option B: `VITE_API_BASE_URL`

Set in Vercel → Environment Variables:

`VITE_API_BASE_URL=https://your-api.onrender.com` (no trailing slash)

Redeploy. On the API server set **`ALLOWED_ORIGINS`** to your Vercel site URL (see `.env.example`).

---

## JazzCash IPN

Configure the **public URL of the server that runs Express**, e.g.:

`https://your-api.onrender.com/api/jazzcash-ipn`

(not the Vercel URL, unless you only use rewrites and JazzCash can reach Vercel’s `/api/...` — then Vercel proxies to the same backend; either way the **path** must end up on your Node route).
