-- Existing accounts receive staff only through an administrator's trusted SQL path.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'superadmin', 'staff'));

-- Staff can read consultation requests, but cannot change status or other admin data.
CREATE POLICY "Staff read reservation requests" ON public.reservations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'staff'
  ));
