# 42 — Reservation consultation results

## Migration

- `supabase/migrations/20261111120000_reservation_consultation_results.sql`
- `supabase/migrations/20261111130000_reservation_consultation_policy_access.sql`
- `supabase/migrations/20261111140000_reservation_consultation_vehicle_options.sql`
- `supabase/migrations/20261111150000_reservation_staff_requests.sql`
- `supabase/migrations/20261111160000_expand_staff_request_limit.sql`
- Apply migrations `20261111120000` through `20261111160000` in timestamp order before using this UI. The later migrations add the RLS predicate permission, selectable result options, `reservations.staff_request`, and room for appended consultation summaries.
- The table is admin-only under RLS and stores one latest confirmed result per reservation, separate from the customer's original request. It contains no customer contact fields.

## Admin behavior

- The rental details dialog combines the request/result comparison with the collapsible quote calculator.
- Start and return date/time, vehicle, rental unit, duration, mileage package, insurance, rental price, total and deposit are compared side by side. Vehicle options are outside the scope of this dialog, so they are not shown or edited here; existing option data is retained on save. Differences are highlighted. The consultation result and `reservations.staff_request` have separate save buttons; staff follow-up is stored as a reservation property.
- On mobile, the detail dialog uses a full-screen layout with compact 8px spacing; desktop keeps the centered dialog.
- `상담 결과 저장` upserts the confirmed terms to `reservation_consultation_results` and writes a fixed-format summary of consultation result values to `reservations.staff_request`. The full summary and final `• 담당자 요청 사항` section appear in one generously sized editable textarea. The separate staff request button saves and copies that full text to the clipboard. The existing status save remains separate.
- Saving records the authenticated admin and timestamp. A later save replaces the current result for that reservation.

## Verification

- Pending: apply migration in the intended Supabase environment and verify admin-only access and save/reload behavior.
