ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_staff_request_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_staff_request_length_check
  CHECK (length(staff_request) <= 5000);
