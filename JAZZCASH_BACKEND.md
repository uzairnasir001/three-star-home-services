# JazzCash Backend Setup

## Overview

The backend handles:
1. **IPN (Instant Payment Notification)** – JazzCash POSTs payment status here
2. **Status Inquiry** – Frontend calls this to verify payment status

## Run Locally

### Option 1: Full stack (frontend + backend)
```bash
npm run dev:full
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Option 2: Separate terminals
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## JazzCash Credentials Configuration

In **JazzCash Sandbox → Credentials**, set:

| Field | Value |
|-------|-------|
| **IPN Url** | `https://your-domain.com/api/jazzcash-ipn` |
| **Return Url** | `https://your-domain.com/#book?payment=complete` |
| **ITN Url** | Same as IPN or leave default |

For **local testing**, use a tunnel (ngrok, localtunnel):
```bash
ngrok http 3001
# Use the ngrok URL: https://xxx.ngrok.io/api/jazzcash-ipn
```

## Production

1. Build: `npm run build`
2. Start: `npm start`
3. Serve on port 3001 (or set `PORT` env var)
4. Use a reverse proxy (nginx, etc.) to serve frontend + API
5. Configure JazzCash Credentials with your production domain

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/jazzcash-ipn` | JazzCash IPN callback (configure in JazzCash) |
| POST | `/api/check-payment-status` | Status inquiry (called by frontend) |

## Environment Variables

Backend uses `.env.local`. Ensure these are set:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY` for full access)
- `VITE_JAZZCASH_MERCHANT_ID`, `VITE_JAZZCASH_PASSWORD`, `VITE_JAZZCASH_INTEGRITY_SALT`
