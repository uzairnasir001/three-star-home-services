-- =============================================================================
-- Row Level Security (RLS) for public booking + contact + admin dashboard
-- =============================================================================
-- Error: "new row violates row-level security policy for table bookings"
--
-- Common causes:
-- 1) No INSERT policy for the DB role your client is using.
-- 2) You logged into Admin in the SAME browser — then the client role is
--    "authenticated", NOT "anon". Policies that only allow anon will FAIL.
--
-- Fix: INSERT/UPDATE use TO public (covers both anon + authenticated).
--      SELECT/DELETE stay authenticated-only (admin dashboard).
--
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Confirm project URL matches VITE_SUPABASE_URL in .env.local
-- =============================================================================

-- ----- BOOKINGS ----------------------------------------------------------------

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_anon_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_anon_update" ON public.bookings;
DROP POLICY IF EXISTS "bookings_public_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_public_update" ON public.bookings;
DROP POLICY IF EXISTS "bookings_auth_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_auth_update" ON public.bookings;
DROP POLICY IF EXISTS "bookings_auth_select" ON public.bookings;
DROP POLICY IF EXISTS "bookings_auth_delete" ON public.bookings;

-- Booking form: works for visitors (anon) AND if you still have an admin session (authenticated)
CREATE POLICY "bookings_public_insert"
  ON public.bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "bookings_public_update"
  ON public.bookings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Admin: list and delete
CREATE POLICY "bookings_auth_select"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bookings_auth_delete"
  ON public.bookings
  FOR DELETE
  TO authenticated
  USING (true);

-- ----- CONTACT MESSAGES --------------------------------------------------------

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_anon_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_public_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_auth_select" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_auth_delete" ON public.contact_messages;

CREATE POLICY "contact_public_insert"
  ON public.contact_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "contact_auth_select"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "contact_auth_delete"
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- Debug (optional): list policies Supabase is using
-- SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename IN ('bookings', 'contact_messages');
-- =============================================================================
