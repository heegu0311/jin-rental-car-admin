-- Keep the staff follow-up request on its reservation, independent from the
-- consultation result. Preserve any value written by the prior UI iteration.
ALTER TABLE public.reservations
  ADD COLUMN staff_request text NOT NULL DEFAULT ''
  CHECK (length(staff_request) <= 1000);

UPDATE public.reservations AS reservation
SET staff_request = result.staff_request
FROM public.reservation_consultation_results AS result
WHERE result.reservation_id = reservation.id
  AND length(btrim(result.staff_request)) > 0;

ALTER TABLE public.reservation_consultation_results
  DROP COLUMN staff_request;

CREATE OR REPLACE FUNCTION private.guard_reservation_staff_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    NEW.staff_request := '';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_reservation_staff_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_reservation_staff_request ON public.reservations;
CREATE TRIGGER guard_reservation_staff_request
  BEFORE INSERT OR UPDATE OF staff_request ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION private.guard_reservation_staff_request();
