/** Contract v1. Keep web/admin copies identical; schema owner: admin. */
export type VehicleStatus = "available" | "rented" | "maintenance";
export type ReservationStatus = "pending" | "confirmed" | "cancelled";
export type InquiryStatus = "pending" | "answered";
export type RentalType = "daily" | "weekly" | "monthly";
export const VEHICLE_OPTIONS = [
  "열선시트",
  "열선핸들",
  "블랙박스",
  "정품네비",
  "후방카메라",
  "차선유지보조 기능",
  "파노라마선루프",
  "스마트 크루즈컨트롤",
  "통풍시트",
  "어라운드뷰",
  "HUD",
  "자동문",
] as const;
export type VehicleOption = (typeof VEHICLE_OPTIONS)[number];
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
  return value != null && Number.isFinite(value) && value > 0
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
export function vehicleOptions(values: readonly unknown[]): VehicleOption[] {
  const selected = new Set(
    values.filter(
      (value): value is VehicleOption =>
        typeof value === "string" &&
        (VEHICLE_OPTIONS as readonly string[]).includes(value),
    ),
  );
  return VEHICLE_OPTIONS.filter((option) => selected.has(option));
}
/** 자차보험 선택. 금액은 원 단위 추가 요금이며 상담 접수 시 라벨로 저장한다. */
export const INSURANCE_AGE_GROUPS = ["만 26세 이상", "만 26세 미만"] as const;
export type InsuranceAgeGroup = (typeof INSURANCE_AGE_GROUPS)[number];
export const INSURANCE_NONE = "선택 안함";
export const INSURANCE_PLANS: Record<
  InsuranceAgeGroup,
  readonly { name: string; price: number }[]
> = {
  "만 26세 이상": [
    { name: "일반자차 26세", price: 10000 },
    { name: "플러스자차 26세", price: 15000 },
    { name: "프리미엄자차 26세", price: 20000 },
  ],
  "만 26세 미만": [
    { name: "일반자차 21세", price: 20000 },
    { name: "플러스자차 21세", price: 30000 },
    { name: "프리미엄자차 21세", price: 40000 },
  ],
};
export function formatSurcharge(value: number) {
  return `+${new Intl.NumberFormat("ko-KR").format(value)}원`;
}
/** 허용된 연령·보험 조합만 "만 26세 이상 · 일반자차 26세 (+10,000원)" 형태로 반환한다. */
export function insuranceSelection(age: unknown, plan: unknown): string | null {
  if (!(INSURANCE_AGE_GROUPS as readonly unknown[]).includes(age)) return null;
  const group = age as InsuranceAgeGroup;
  if (plan === INSURANCE_NONE) return `${group} · ${INSURANCE_NONE}`;
  const found = INSURANCE_PLANS[group].find((p) => p.name === plan);
  return found
    ? `${group} · ${found.name} (${formatSurcharge(found.price)})`
    : null;
}
/**
 * 관리자 업로드 이미지는 site-assets/{folder}/desktop/{uuid}.{webp|jpg}와
 * 같은 이름의 mobile/ 사본으로 저장한다. DB에는 desktop URL만 저장한다.
 */
export const IMAGE_VARIANTS = ["desktop", "mobile"] as const;
export type ImageVariant = (typeof IMAGE_VARIANTS)[number];
const variantImagePattern =
  /^(https:\/\/[^/?#]+\/storage\/v1\/object\/public\/site-assets\/[a-z0-9-]+\/)desktop(\/[0-9a-f-]{36}\.(?:webp|jpg))$/i;
export function mobileImageVariant(url: string | null | undefined) {
  const match = url?.match(variantImagePattern);
  return match ? `${match[1]}mobile${match[2]}` : null;
}
