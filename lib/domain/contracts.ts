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
  /** 상세 캐러셀 사진(첫 장이 대표 사진, image_url과 같음). 최대 VEHICLE_IMAGE_MAX장. */
  image_urls?: string[] | null;
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
  /** 배기량(cc). 자차보험 요금 구간에 쓴다. 미입력이면 null. */
  displacement_cc?: number | null;
  /** 승합차면 배기량과 별도 자차보험 요금을 적용한다. */
  is_van?: boolean;
  /** 약정 주행거리 초과 시 100km당 추가 요금(원). 미입력이면 null. */
  extra_km_fee?: number | null;
  /** 일/주/월 대여료에 포함된 기본 약정 주행거리(km). 미입력이면 null. */
  km_daily?: number | null;
  km_weekly?: number | null;
  km_monthly?: number | null;
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
export const INCLUDED_KM_MAX = 100_000;
export function includedKmLabel(value: number | null | undefined) {
  return value != null && Number.isInteger(value) && value > 0
    ? `기본 ${new Intl.NumberFormat("ko-KR").format(value)}km 포함`
    : "주행거리 상담 문의";
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
  "수입",
] as const;
function categoryRank(name: string) {
  const key = name.trim().toUpperCase();
  const i = CATEGORY_ORDER.findIndex((c) => key.startsWith(c));
  // 목록에 없는 차종은 전기 뒤에 두고, 수입은 항상 가장 마지막에 둔다.
  return i < 0 ? CATEGORY_ORDER.indexOf("수입") - 0.5 : i;
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
 * 자차보험. 렌트 단위(일/주/월)·연령별 보험 목록이 있고, 요금은 차량 배기량 구간별로 다르며
 * 승합차(vehicles.is_van)는 배기량과 별도 요금을 쓴다. 배기량 구간 상한(ccLimits)은 단위 공통이다.
 * 관리자가 /insurance에서 site_content(slug "insurance")의 sections[0].body에 JSON으로 저장한다.
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
/** cc[i]는 배기량 구간 i의 요금(길이 = ccLimits.length + 1), van은 승합차 요금. */
export interface InsurancePrices {
  cc: number[];
  van: number;
}
export interface InsurancePlan {
  name: string;
  prices: InsurancePrices;
  details: InsuranceDetail[];
}
export interface InsuranceUnit {
  required: boolean;
  plans: Record<InsuranceAgeGroup, InsurancePlan[]>;
}
export interface InsuranceConfig {
  /** 오름차순 배기량 구간 상한(cc, 포함). 마지막 구간은 마지막 상한 초과. */
  ccLimits: number[];
  units: Record<RentalType, InsuranceUnit>;
}
/** 차량의 보험 요금 구분. 숫자는 배기량 구간 번호. */
export type InsuranceClass = number | "van";
export const INSURANCE_LIMITS = {
  plans: 10,
  details: 10,
  name: 40,
  detailLabel: 40,
  detailValue: 80,
  price: 10_000_000,
  ccLimits: 8,
  cc: 20_000,
} as const;
const RENTAL_TYPES = ["daily", "weekly", "monthly"] as const;
function validText(value: unknown, max: number): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}
function validPrice(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= INSURANCE_LIMITS.price
  );
}
function cc(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}cc`;
}
/** 구간 i의 이름. 예: [1600, 2000] → "1,600cc 이하", "1,601~2,000cc", "2,000cc 초과". */
export function insuranceClassLabel(
  ccLimits: readonly number[],
  cls: InsuranceClass,
) {
  if (cls === "van") return "승합";
  if (!ccLimits.length) return "전 배기량";
  if (cls === 0) return `${cc(ccLimits[0])} 이하`;
  if (cls >= ccLimits.length)
    return `${cc(ccLimits[ccLimits.length - 1])} 초과`;
  return `${new Intl.NumberFormat("ko-KR").format(ccLimits[cls - 1] + 1)}~${cc(ccLimits[cls])}`;
}
export function insuranceClasses(
  ccLimits: readonly number[],
): InsuranceClass[] {
  return [...ccLimits.map((_, i) => i), ccLimits.length, "van"];
}
/** 승합이면 "van", 배기량이 있으면 해당 구간, 배기량을 모르면 null. */
export function insuranceClassOf(
  ccLimits: readonly number[],
  vehicle: Pick<Vehicle, "displacement_cc" | "is_van"> | null | undefined,
): InsuranceClass | null {
  if (!vehicle) return null;
  if (vehicle.is_van) return "van";
  const value = vehicle.displacement_cc;
  if (value == null || !Number.isInteger(value) || value < 0) return null;
  const i = ccLimits.findIndex((limit) => value <= limit);
  return i < 0 ? ccLimits.length : i;
}
export function insurancePrice(plan: InsurancePlan, cls: InsuranceClass) {
  return cls === "van" ? plan.prices.van : plan.prices.cc[cls];
}
/** 차량 구분을 모를 때 보여줄 최소·최대 요금. */
export function insurancePriceRange(plan: InsurancePlan) {
  const all = [...plan.prices.cc, plan.prices.van];
  return { min: Math.min(...all), max: Math.max(...all) };
}
function parsePrices(
  plan: Record<string, unknown>,
  bands: number,
): InsurancePrices | null {
  // 배기량 구분 이전에 저장된 단일 요금(price)은 모든 구간·승합에 같은 값으로 읽는다.
  if (plan.prices === undefined && validPrice(plan.price))
    return { cc: Array(bands).fill(plan.price), van: plan.price };
  const prices = plan.prices as Record<string, unknown> | undefined;
  if (
    !prices ||
    !Array.isArray(prices.cc) ||
    prices.cc.length !== bands ||
    !prices.cc.every(validPrice) ||
    !validPrice(prices.van)
  )
    return null;
  return { cc: [...prices.cc], van: prices.van };
}
/** 저장/조회한 값을 엄격히 검증한다. 하나라도 어긋나면 null. */
export function parseInsuranceConfig(value: unknown): InsuranceConfig | null {
  if (!value || typeof value !== "object") return null;
  const root = value as Record<string, unknown>;
  // 이전 형식은 루트에 daily/weekly/monthly가 있고 배기량 구간이 없다.
  const legacy = !("units" in root);
  const ccLimits = legacy ? [] : root.ccLimits;
  const rawUnits = (legacy ? root : root.units) as
    Record<string, unknown> | undefined;
  if (
    !Array.isArray(ccLimits) ||
    ccLimits.length > INSURANCE_LIMITS.ccLimits ||
    !ccLimits.every(
      (limit, i) =>
        Number.isInteger(limit) &&
        limit > 0 &&
        limit <= INSURANCE_LIMITS.cc &&
        (i === 0 || limit > ccLimits[i - 1]),
    ) ||
    !rawUnits ||
    typeof rawUnits !== "object"
  )
    return null;
  const units = {} as Record<RentalType, InsuranceUnit>;
  for (const type of RENTAL_TYPES) {
    const unit = rawUnits[type] as Record<string, unknown> | undefined;
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
          !Array.isArray(plan.details) ||
          plan.details.length > INSURANCE_LIMITS.details
        )
          return null;
        const prices = parsePrices(plan, ccLimits.length + 1);
        if (!prices) return null;
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
        parsed.push({ name: plan.name.trim(), prices, details });
      }
      if (new Set(parsed.map((p) => p.name)).size !== parsed.length)
        return null;
      plans[age] = parsed;
    }
    if (unit.required && INSURANCE_AGE_GROUPS.some((age) => !plans[age].length))
      return null;
    units[type] = { required: unit.required, plans };
  }
  return { ccLimits: [...ccLimits], units };
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
/** 차량 구분이 있으면 그 요금, 없으면 "+10,000~20,000원" 범위. */
export function formatInsurancePrice(
  plan: InsurancePlan,
  cls: InsuranceClass | null,
) {
  if (cls !== null) return formatSurcharge(insurancePrice(plan, cls));
  const { min, max } = insurancePriceRange(plan);
  return min === max
    ? formatSurcharge(min)
    : `+${new Intl.NumberFormat("ko-KR").format(min)}~${new Intl.NumberFormat("ko-KR").format(max)}원`;
}
/**
 * 허용된 단위·연령·보험 조합만 "주단위 · 만 26세 이상 · 1,601~2,000cc · 일반자차 26세 (+40,000원)"
 * 형태로 반환한다. 차량 구분을 모르면 구간 없이 요금 범위를 남긴다.
 */
export function insuranceSelection(
  config: InsuranceConfig,
  type: RentalType,
  age: unknown,
  plan: unknown,
  cls: InsuranceClass | null = null,
): string | null {
  if (!(INSURANCE_AGE_GROUPS as readonly unknown[]).includes(age)) return null;
  const group = age as InsuranceAgeGroup;
  const { required, plans } = config.units[type];
  const prefix = `${RENTAL_UNIT_LABELS[type]} · ${group}`;
  if (plan === INSURANCE_NONE)
    return required ? null : `${prefix} · ${INSURANCE_NONE}`;
  const found = plans[group].find((p) => p.name === plan);
  if (!found) return null;
  const classLabel =
    cls === null ? "" : ` · ${insuranceClassLabel(config.ccLimits, cls)}`;
  return `${prefix}${classLabel} · ${found.name} (${formatInsurancePrice(found, cls)})`;
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
export const VEHICLE_IMAGE_MAX = 10;
/** 사진 주소는 HTTPS 또는 사이트 내부 경로만 허용한다. */
export function safeImageUrl(url: unknown): url is string {
  return (
    typeof url === "string" &&
    url.length <= 2000 &&
    (/^https:\/\/[^\s/?#]+\/\S*$/.test(url) || /^\/(?!\/)\S*$/.test(url))
  );
}
/** 차량 사진 목록. image_urls가 비어 있으면 기존 대표 사진 1장을 쓴다. */
export function vehicleImages(
  car: Pick<Vehicle, "image_url" | "image_urls">,
): string[] {
  const list = car.image_urls?.length ? car.image_urls : [car.image_url];
  return [...new Set(list.filter(safeImageUrl))].slice(0, VEHICLE_IMAGE_MAX);
}
