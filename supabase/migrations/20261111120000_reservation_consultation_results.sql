-- Keep post-call agreements separately from the customer's original reservation request.
CREATE TABLE public.reservation_consultation_results (
  reservation_id uuid PRIMARY KEY
    REFERENCES public.reservations (id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles (id) ON DELETE SET NULL,
  car_name text NOT NULL CHECK (length(car_name) BETWEEN 1 AND 200),
  rental_type text NOT NULL CHECK (rental_type IN ('daily', 'weekly', 'monthly')),
  period_count integer NOT NULL,
  rental_start text NOT NULL CHECK (length(rental_start) <= 40),
  rental_end text CHECK (rental_end IS NULL OR length(rental_end) <= 40),
  package_km text NOT NULL DEFAULT '' CHECK (length(package_km) <= 80),
  insurance_age text NOT NULL DEFAULT '' CHECK (length(insurance_age) <= 40),
  insurance_plan text NOT NULL DEFAULT '' CHECK (length(insurance_plan) <= 100),
  rental_total integer CHECK (rental_total IS NULL OR rental_total BETWEEN 0 AND 100000000),
  insurance_min integer CHECK (insurance_min IS NULL OR insurance_min BETWEEN 0 AND 100000000),
  insurance_max integer CHECK (insurance_max IS NULL OR insurance_max BETWEEN 0 AND 100000000),
  total_min integer CHECK (total_min IS NULL OR total_min BETWEEN 0 AND 100000000),
  total_max integer CHECK (total_max IS NULL OR total_max BETWEEN 0 AND 100000000),
  deposit_amount integer NOT NULL CHECK (deposit_amount BETWEEN 0 AND 100000000),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  updated_by uuid NOT NULL REFERENCES auth.users (id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (rental_type = 'daily' AND period_count BETWEEN 1 AND 30) OR
    (rental_type = 'weekly' AND period_count BETWEEN 1 AND 8) OR
    (rental_type = 'monthly' AND period_count BETWEEN 1 AND 60)
  )
);

ALTER TABLE public.reservation_consultation_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reservation_consultation_results FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.reservation_consultation_results TO authenticated;

CREATE POLICY "Admins read reservation consultation results"
  ON public.reservation_consultation_results
  FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
CREATE POLICY "Admins insert reservation consultation results"
  ON public.reservation_consultation_results
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()) AND updated_by = (SELECT auth.uid()));
CREATE POLICY "Admins update reservation consultation results"
  ON public.reservation_consultation_results
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()) AND updated_by = (SELECT auth.uid()));
