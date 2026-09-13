/** Contract v1. Keep web/admin copies identical; schema owner: admin. */
export type VehicleStatus = "available" | "rented" | "maintenance";
export type ReservationStatus = "pending" | "confirmed" | "cancelled";
export type InquiryStatus = "pending" | "answered";
export type RentalType = "daily" | "weekly" | "monthly";
export interface Vehicle {
  id: string;
  name: string;
  type: string;
  year: number;
  fuel: string | null;
  image_url: string | null;
  badge: string | null;
  condition: string | null;
  category_id: string | null;
  content: string | null;
  status: VehicleStatus;
  price_daily: number;
  price_weekly: number;
  price_monthly: number;
  options?: string[];
  seats?: number;
  manufacturer?: string;
  vehicle_categories?: { name: string } | null;
  vehicle_units?: { id: string; status: VehicleStatus }[];
}
export interface Reservation {
  id: string;
  car_name: string;
  start_date: string;
  period: string;
  package_km: string;
  options: string[];
  user_name: string;
  user_phone: string;
  status: ReservationStatus;
  created_at: string;
}
export interface Inquiry {
  id: string;
  user_name: string;
  user_phone: string;
  user_email: string | null;
  title: string;
  content: string;
  status: InquiryStatus;
  answer_content: string | null;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
}
export interface ContentSection {
  title: string;
  body: string;
}
export interface SiteContent {
  slug: string;
  title: string;
  subtitle: string;
  sections: ContentSection[];
  image_url: string;
  is_published: boolean;
  updated_at?: string;
}
export const CONTENT_PAGES = {
  home: "메인 배너",
  benefits: "홈 특장점",
  about: "회사소개",
  info: "이용안내",
  accident: "사고대차",
  privacy: "개인정보처리방침",
  terms: "이용약관",
  contact: "고객센터 안내",
  "new-car": "신차 장기렌트 안내",
  settings: "사업자·상담 채널",
} as const;
export type ContentSlug = keyof typeof CONTENT_PAGES;
export const RESERVATION_LABELS: Record<ReservationStatus, string> = {
  pending: "대기중",
  confirmed: "상담완료",
  cancelled: "취소",
};
export const INQUIRY_LABELS: Record<InquiryStatus, string> = {
  pending: "대기중",
  answered: "답변완료",
};
export const VEHICLE_LABELS: Record<VehicleStatus, string> = {
  available: "대여 가능",
  rented: "대여 중",
  maintenance: "정비 중",
};
export function formatWon(value: number | null | undefined) {
  return value != null && Number.isFinite(value) && value >= 0
    ? `${new Intl.NumberFormat("ko-KR").format(value)}원`
    : "상담 문의";
}
export function rentalType(value: string): RentalType | null {
  return ["daily", "weekly", "monthly"].includes(value)
    ? (value as RentalType)
    : null;
}
export function rentalPeriod(value: string | null): number {
  const n = Number(value ?? 1);
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : 1;
}
export function vehiclePrice(car: Vehicle, type: RentalType) {
  return car[`price_${type}`];
}
export function categoryName(car: Vehicle) {
  return car.vehicle_categories?.name || car.type;
}
export function validPhone(value: string) {
  return /^0\d{8,10}$/.test(value.replace(/[\s-]/g, ""));
}
