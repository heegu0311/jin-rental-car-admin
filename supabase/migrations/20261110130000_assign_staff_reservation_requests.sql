ALTER TABLE public.reservations
  ADD COLUMN assigned_staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN staff_request_note text NOT NULL DEFAULT '';
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_staff_request_note_length CHECK (char_length(staff_request_note) <= 5000);
CREATE INDEX reservations_assigned_staff_idx ON public.reservations (assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

CREATE POLICY "Admins read staff profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (role = 'staff' AND (SELECT private.is_admin()));

DROP POLICY IF EXISTS "Staff read reservation requests" ON public.reservations;
CREATE POLICY "Staff read reservation requests" ON public.reservations
  FOR SELECT TO authenticated
  USING (assigned_staff_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'staff'
  ));
