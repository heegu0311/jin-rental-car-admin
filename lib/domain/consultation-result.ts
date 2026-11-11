import type { RentalType, VehicleOption } from "./contracts.ts";

/** Latest administrator-confirmed rental terms; kept separate from the original request. */
export interface ReservationConsultationResult {
  reservation_id: string;
  vehicle_id: string | null;
  car_name: string;
  rental_type: RentalType;
  period_count: number;
  rental_start: string;
  rental_end: string | null;
  package_km: string;
  vehicle_options: VehicleOption[] | null;
  insurance_age: string;
  insurance_plan: string;
  rental_total: number | null;
  insurance_min: number | null;
  insurance_max: number | null;
  total_min: number | null;
  total_max: number | null;
  deposit_amount: number;
  note: string;
  updated_by: string;
  updated_at: string;
}

export interface ReservationStaffRequest {
  reservation_id: string;
  staff_request: string;
}

export type ReservationConsultationResultInput = Omit<
  ReservationConsultationResult,
  "reservation_id" | "updated_by" | "updated_at"
>;
