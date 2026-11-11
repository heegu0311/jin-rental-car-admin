# 42 — Reservation consultation results

## Migration

- `supabase/migrations/20261111120000_reservation_consultation_results.sql`
- Apply to the Supabase project before deploying the admin UI. This migration has not been applied from this workspace.
- The table is admin-only under RLS and stores one latest confirmed result per reservation, separate from the customer's original request. It contains no customer contact fields.

## Admin behavior

- The rental details dialog combines the request/result comparison with the collapsible quote calculator.
- Start and return date/time, vehicle, rental unit, duration, mileage package, insurance, rental price, total and deposit are compared side by side. Differences are highlighted.
- `상담 결과 저장` upserts the confirmed terms to `reservation_consultation_results`; the existing status save remains separate.
- Saving records the authenticated admin and timestamp. A later save replaces the current result for that reservation.

## Verification

- Pending: apply migration in the intended Supabase environment and verify admin-only access and save/reload behavior.
