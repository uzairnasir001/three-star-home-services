-- =============================================================================
-- Optional: remove DUPLICATE booking policies (keep one clear set)
-- =============================================================================
-- You currently have BOTH:
--   - "Allow anonymous insert bookings" / "Allow authenticated ..." (older names)
--   - "bookings_public_*" / "bookings_auth_*" (from repo script)
-- Having two INSERT policies is OK, but cleaning up avoids confusion.
--
-- This keeps: bookings_public_insert, bookings_public_update,
--             bookings_auth_select, bookings_auth_delete
-- Drops:    the "Allow ..." policies if they still exist.
-- =============================================================================

DROP POLICY IF EXISTS "Allow anonymous insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated delete bookings" ON public.bookings;

-- If you prefer the OLD names instead, skip this file and drop the bookings_* policies manually.
