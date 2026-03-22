-- =============================================================================
-- Row Level Security (RLS) for public booking + contact + admin dashboard
-- =============================================================================
-- Supabase API uses JWT roles: "anon" (guest) and "authenticated" (logged in).
-- Prefer TO anon, authenticated — "TO public" can still fail for API requests in
-- some setups (e.g. live site 42501 while policies look correct in pg_policies).
--
-- Run in: Supabase Dashboard → SQL Editor (project: same URL as VITE_SUPABASE_URL)
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
DROP POLICY IF EXISTS "bookings_explicit_anon_auth_insert" ON public.bookings;
DROP POLICY IF EXISTS "bookings_explicit_anon_auth_update" ON public.bookings;

-- Table privileges (RLS still applies on top of this)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON TABLE public.bookings TO anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.bookings TO authenticated;

-- Guest + logged-in: create / update booking (payment step updates same row)
CREATE POLICY "bookings_client_insert"
  ON public.bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "bookings_client_update"
  ON public.bookings
  FOR UPDATE
  TO anon, authenticated
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

GRANT INSERT ON TABLE public.contact_messages TO anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.contact_messages TO authenticated;

CREATE POLICY "contact_client_insert"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
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
-- If INSERT still fails, check for RESTRICTIVE policies (all must pass):
--   SELECT policyname, permissive, cmd, roles, qual, with_check
--   FROM pg_policies WHERE tablename = 'bookings';
-- permissive should be PERMISSIVE for the policies above. If any RESTRICTIVE
-- row exists on bookings, drop or fix it.
-- =============================================================================
