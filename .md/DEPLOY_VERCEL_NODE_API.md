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

---

## Error: `Cannot POST /api/initiate-mwallet-cnic` (HTML with `<pre>…</pre>`)

That means the request **reached some HTTP server**, but **nothing handled that POST**. Usually one of these:

### 1. Backend is a **static site**, not Node (most common on Render)

If Render is set up as **Static Site** (only uploading `dist/`), or the start command is `npx serve dist` / `vite preview`, there is **no Express API**. POSTs get **“Cannot POST …”**.

**Fix:** Use a **Web Service** (Node):

| Setting | Value |
|--------|--------|
| **Root directory** | repo root (where `package.json` is) |
| **Build command** | `npm install && npm run build` |
| **Start command** | `npm start` |

`npm start` must run `NODE_ENV=production node server/index.js` (see `package.json`). After deploy, open in a browser:

`https://YOUR-API.onrender.com/api/health`  
You should see JSON like `{ "ok": true, ... }`. If that 404s or returns HTML, the API is not running.

### 2. Wrong **`vercel.json` rewrite** (missing `/api` on the backend URL)

Vercel’s example often uses:

`"destination": "https://api.example.com/:path*"`

That sends `/api/initiate-mwallet-cnic` → `https://api.example.com/initiate-mwallet-cnic` (**no** `/api` on the backend).

Our Express routes live under **`/api/...`**, so the destination **must** include `/api/`:

```json
"destination": "https://YOUR-SERVICE.onrender.com/api/:path*"
```

**Wrong:** `https://YOUR-SERVICE.onrender.com/:path*`  
**Right:** `https://YOUR-SERVICE.onrender.com/api/:path*`

### 3. Quick test (from your PC)

Replace the host with your real API URL:

```bash
curl -s -o /dev/null -w "%{http_code}" https://YOUR-API.onrender.com/api/health
```

Expect **200**. Then:

```bash
curl -s -X POST https://YOUR-API.onrender.com/api/initiate-mwallet-cnic \
  -H "Content-Type: application/json" \
  -d "{\"bookingId\":\"test\",\"amount\":1,\"customerPhone\":\"03001234567\",\"description\":\"t\",\"cnicLast6\":\"123456\"}"
```

Expect **JSON** (e.g. 503 missing env, or JazzCash response) — **not** HTML `Cannot POST`.
