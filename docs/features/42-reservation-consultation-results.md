# 42 — Reservation consultation results

## Migration

- `supabase/migrations/20261111120000_reservation_consultation_results.sql`
- `supabase/migrations/20261111130000_reservation_consultation_policy_access.sql`
- `supabase/migrations/20261111140000_reservation_consultation_vehicle_options.sql`
- Apply migrations `20261111120000`, `20261111130000`, and `20261111140000` in timestamp order before using this UI. The later migrations add the RLS predicate permission, selectable result options, and staff handling request field.
- The table is admin-only under RLS and stores one latest confirmed result per reservation, separate from the customer's original request. It contains no customer contact fields.

## Admin behavior

- The rental details dialog combines the request/result comparison with the collapsible quote calculator.
- Start and return date/time, vehicle, requested options, rental unit, duration, mileage package, insurance, rental price, total and deposit are compared side by side. Differences are highlighted. Consultation options and staff handling requests are stored separately from the original request.
- On mobile, the detail dialog uses a full-screen layout with compact 8px spacing; desktop keeps the centered dialog.
- `상담 결과 저장` upserts the confirmed terms to `reservation_consultation_results`; the existing status save remains separate.
- Saving records the authenticated admin and timestamp. A later save replaces the current result for that reservation.

## Verification

- Pending: apply migration in the intended Supabase environment and verify admin-only access and save/reload behavior.
