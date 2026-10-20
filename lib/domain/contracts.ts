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
export const CATEGORY_ORDER = [
  "경차",
  "소형",
  "중형",
  "대형",
  "승합",
  "SUV",
  "전기",
] as const;
function categoryRank(name: string) {
  const key = name.trim().toUpperCase();
  const i = CATEGORY_ORDER.findIndex((c) => key.startsWith(c));
  return i < 0 ? CATEGORY_ORDER.length : i;
}
export function compareCategory(a: string, b: string) {
  return categoryRank(a) - categoryRank(b) || a.localeCompare(b, "ko");
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
/**
 * 자차보험. 차종과 무관하고 렌트 단위(일/주/월)별로 다르다. 관리자가 /insurance에서
 * site_content(slug "insurance")의 sections[0].body에 JSON으로 저장한다(스키마 변경 없음).
 * 상담 접수 시 선택 결과를 "자차보험: ..." 라벨로 reservations.options에 남긴다.
 */
export const INSURANCE_CONTENT_SLUG = "insurance";
export const INSURANCE_AGE_GROUPS = ["만 26세 이상", "만 26세 미만"] as const;
export type InsuranceAgeGroup = (typeof INSURANCE_AGE_GROUPS)[number];
export const INSURANCE_NONE = "선택 안함";
export const RENTAL_UNIT_LABELS: Record<RentalType, string> = {
  daily: "일단위",
  weekly: "주단위",
  monthly: "월단위",
};
export interface InsuranceDetail {
  label: string;
  value: string;
}
export interface InsurancePlan {
  name: string;
  price: number;
  details: InsuranceDetail[];
}
export interface InsuranceUnit {
  required: boolean;
  plans: Record<InsuranceAgeGroup, InsurancePlan[]>;
}
export type InsuranceConfig = Record<RentalType, InsuranceUnit>;
export const INSURANCE_LIMITS = {
  plans: 10,
  details: 10,
  name: 40,
  detailLabel: 40,
  detailValue: 80,
  price: 10_000_000,
} as const;
function validText(value: unknown, max: number): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}
/** 저장/조회한 값을 엄격히 검증한다. 하나라도 어긋나면 null. */
export function parseInsuranceConfig(value: unknown): InsuranceConfig | null {
  if (!value || typeof value !== "object") return null;
  const result = {} as InsuranceConfig;
  for (const type of ["daily", "weekly", "monthly"] as const) {
    const unit = (value as Record<string, unknown>)[type] as
      Record<string, unknown> | undefined;
    if (!unit || typeof unit.required !== "boolean") return null;
    const rawPlans = unit.plans as Record<string, unknown> | undefined;
    if (!rawPlans || typeof rawPlans !== "object") return null;
    const plans = {} as Record<InsuranceAgeGroup, InsurancePlan[]>;
    for (const age of INSURANCE_AGE_GROUPS) {
      const list = rawPlans[age];
      if (!Array.isArray(list) || list.length > INSURANCE_LIMITS.plans)
        return null;
      const parsed: InsurancePlan[] = [];
      for (const plan of list as Record<string, unknown>[]) {
        if (
          !plan ||
          !validText(plan.name, INSURANCE_LIMITS.name) ||
          plan.name.trim() === INSURANCE_NONE ||
          !Number.isInteger(plan.price) ||
          (plan.price as number) < 0 ||
          (plan.price as number) > INSURANCE_LIMITS.price ||
          !Array.isArray(plan.details) ||
          plan.details.length > INSURANCE_LIMITS.details
        )
          return null;
        const details: InsuranceDetail[] = [];
        for (const d of plan.details as Record<string, unknown>[]) {
          if (
            !d ||
            !validText(d.label, INSURANCE_LIMITS.detailLabel) ||
            !validText(d.value, INSURANCE_LIMITS.detailValue)
          )
            return null;
          details.push({ label: d.label.trim(), value: d.value.trim() });
        }
        parsed.push({
          name: plan.name.trim(),
          price: plan.price as number,
          details,
        });
      }
      if (new Set(parsed.map((p) => p.name)).size !== parsed.length)
        return null;
      plans[age] = parsed;
    }
    if (unit.required && INSURANCE_AGE_GROUPS.some((age) => !plans[age].length))
      return null;
    result[type] = { required: unit.required, plans };
  }
  return result;
}
/** 공개된 site_content 행에서 보험 설정을 읽는다. 없거나 형식이 틀리면 null. */
export function insuranceConfigFromContent(
  row: Pick<SiteContent, "sections" | "is_published"> | null | undefined,
): InsuranceConfig | null {
  const body = row?.is_published ? row.sections?.[0]?.body : undefined;
  if (!body) return null;
  try {
    return parseInsuranceConfig(JSON.parse(body));
  } catch {
    return null;
  }
}
export function formatSurcharge(value: number) {
  return `+${new Intl.NumberFormat("ko-KR").format(value)}원`;
}
/** 허용된 단위·연령·보험 조합만 "주단위 · 만 26세 이상 · 일반자차 26세 (+40,000원)" 형태로 반환한다. */
export function insuranceSelection(
  config: InsuranceConfig,
  type: RentalType,
  age: unknown,
  plan: unknown,
): string | null {
  if (!(INSURANCE_AGE_GROUPS as readonly unknown[]).includes(age)) return null;
  const group = age as InsuranceAgeGroup;
  const { required, plans } = config[type];
  const prefix = `${RENTAL_UNIT_LABELS[type]} · ${group}`;
  if (plan === INSURANCE_NONE)
    return required ? null : `${prefix} · ${INSURANCE_NONE}`;
  const found = plans[group].find((p) => p.name === plan);
  return found
    ? `${prefix} · ${found.name} (${formatSurcharge(found.price)})`
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
