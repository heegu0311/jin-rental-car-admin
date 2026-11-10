ALTER TABLE public.reservations
  ADD COLUMN staff_request_note text NOT NULL DEFAULT '';
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_staff_request_note_length CHECK (char_length(staff_request_note) <= 5000);
