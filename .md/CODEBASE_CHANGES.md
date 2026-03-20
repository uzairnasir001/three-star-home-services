# Codebase Implementation Notes: Supabase + JazzCash Backend

This document explains the changes I made in this codebase so you can quickly understand why each part exists (Supabase persistence, JazzCash payment integration, and the Express backend proxy).

## 1) High-level goal
This project started as a Vite + React frontend with local-only persistence. I then implemented the following:

1. I replaced `localStorage` booking/message storage with **Supabase** (Postgres) tables using `@supabase/supabase-js`.
2. I updated the **Admin** page to use **Supabase Auth** (email/password) instead of a hardcoded password in the frontend.
3. I added a small **Node.js + Express backend** to:
   - Receive **JazzCash IPN** callbacks (`/api/jazzcash-ipn`)
   - Perform **Status Inquiry** checks (`/api/check-payment-status`)
   - Initiate **MWallet REST API v2.0 (with CNIC)** requests in a CORS-safe way (`/api/initiate-mwallet-cnic`)
4. I updated the **frontend payment step** to collect **CNIC last 6 digits** (required by MWALLET REST v2.0 (CNIC)).

## 2) Frontend stack (what runs in the browser)
- React 19 + TypeScript
- Vite dev server
- Tailwind CSS via CDN (frontend styling is Tailwind classNames)
- Hash-based navigation using `window.location.hash` (no React Router)

## 3) Supabase (booking + contact persistence)

### 3.1 What I changed
- I rewrote `services/dataService.ts` to read/write:
  - `public.bookings`
  - `public.contact_messages`
- I updated `pages/Admin.tsx` to load bookings from Supabase (instead of localStorage).
- I use Supabase Auth sessions for admin authentication.

### 3.2 Where in code
- `lib/supabase.ts`
  - Initializes a Supabase client using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- `services/dataService.ts`
  - `getBookings()`, `addBooking()`, `updateBooking()`, `deleteBooking()`
  - `getContactMessages()`, `addContactMessage()`

- `pages/Admin.tsx`
  - Supabase Auth login
  - Calls `dataService.getBookings()` to display results

### 3.3 Why Supabase is needed
`localStorage` doesn’t work reliably across devices/browsers and can be cleared by users. Supabase provides:
- Shared persistent storage
- RLS-based access control (anon vs authenticated vs server-side service role)

## 4) JazzCash integration (what changed)

### 4.1 Important integration components
JazzCash onboarding requirements I followed:
1. **IPN API** (Instant Payment Notification) - mandatory
2. **Status Inquiry API** - mandatory
3. Refund APIs - optional

### 4.2 Frontend: CNIC collection + initiating payment
- `components/JazzCashPayment.tsx`
  - I added an input for **CNIC last 6 digits**
  - When the user clicks Pay:
    - The frontend calls my backend endpoint to initiate the MWALLET REST v2.0 (CNIC) request (instead of calling JazzCash directly from the browser).

- `pages/Book.tsx`
  - I receive the MWALLET response from the payment component
  - I update Supabase booking fields accordingly (`payment_status`, `transactionId`, etc.)

### 4.3 Why the backend is required for payment initiation
Browsers block cross-origin requests via **CORS**. JazzCash’s REST endpoints do not reliably provide `Access-Control-Allow-Origin`, so direct `fetch()` from the browser can fail.

So:
- The frontend calls my backend (`/api/initiate-mwallet-cnic`)
- The backend performs the JazzCash REST call server-side (so CORS is not an issue)

## 5) Express backend (Node.js) structure

### 5.1 Files
- `server/index.js`
  - Express app setup
  - I mount `server/routes/jazzcash.js` under `/api/*`
  - I serve the built frontend in production mode (when `NODE_ENV=production`)
- `server/routes/jazzcash.js`
  - `POST /api/jazzcash-ipn` (IPN callback)
  - `POST /api/check-payment-status` (Status Inquiry)
  - `POST /api/initiate-mwallet-cnic` (MWALLET REST v2.0 (CNIC) initiation proxy)
- `server/utils/secureHash.js`
  - I included HMAC-SHA256 secure-hash generation/verification helper
- `server/config.js`
  - I load env vars from `.env.local` and expose JazzCash + Supabase configuration

### 5.2 Endpoints and purpose

#### `POST /api/jazzcash-ipn`
JazzCash calls this when payment status changes.
- Verifies `pp_SecureHash` (HMAC-SHA256)
- Updates Supabase `bookings`:
  - `payment_status`
  - `transaction_id`
  - `amount_paid` (when available)

#### `POST /api/check-payment-status`
Used by the app when confirming pending payments.
- Generates secure hash
- Calls JazzCash Status Inquiry endpoint
- Updates Supabase bookings with the latest state

#### `POST /api/initiate-mwallet-cnic`
Used by my app when the customer clicks Pay.
- Validates input (CNIC last 6 digits)
- Builds MWALLET REST v2.0 (CNIC) payload:
  - `pp_Version`, `pp_TxnType`, `pp_MerchantID`, `pp_Password`
  - `pp_TxnRefNo` (unique)
  - `pp_Amount` (amount * 100)
  - `pp_TxnDateTime`, `pp_TxnExpiryDateTime` (PKT, expiry + 1 day)
  - `pp_BillReference` (alphanumeric)
  - `pp_CNIC`, `pp_MobileNumber`
  - `ppmpf_1..ppmpf_5` present as empty strings `""` when not used
- Calls JazzCash MWALLET REST endpoint server-side
- Returns JazzCash response payload to the frontend

## 6) Environment variables (names only; do not hardcode secrets)

### 6.1 Frontend `.env.local`
Required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_JAZZCASH_MERCHANT_ID`
- `VITE_JAZZCASH_PASSWORD`
- `VITE_JAZZCASH_INTEGRITY_SALT`
- `VITE_JAZZCASH_PAYMENT_URL` (still present for older flows; MWALLET REST uses backend proxy)

### 6.2 Backend `.env.local`
Required:
- `SUPABASE_SERVICE_ROLE_KEY` (server-side updates bypass RLS safely)

Optional:
- `VITE_JAZZCASH_MWALLET_REST_V2_URL` to override the MWALLET REST endpoint

## 7) Local run instructions

1. Install deps:
   - `npm install`
2. Start backend:
   - `npm run server` (backend on port 3001)
3. Start frontend:
   - `npm run dev` (frontend on port 3000)
4. Open:
   - `http://localhost:3000`

## 8) UI styling tweaks I added
- `pages/Book.tsx`
  - I modernized styling for `select` inputs and date/time inputs (Tailwind classes + icon overlays).

Note: native `<select>`, `<input type="date">`, and `<input type="time">` have limited browser styling control. Fully “custom” dropdown panels require replacing `<select>` with a custom dropdown component.

## 9) How to interpret JazzCash errors (important)
If JazzCash returns:
- `pp_ResponseCode = 999`
- message like “insufficient merchant information”

This is almost always an **onboarding/enablement** problem on the JazzCash side (merchant profile not verified/enabled for the specific MWALLET REST integration), not a frontend formatting mistake.

To debug this:
- Verify the merchant onboarding step (documents uploaded + verification approved)
- Confirm your merchant is enabled for MWALLET REST v2.0 (CNIC) on the backend integration side

