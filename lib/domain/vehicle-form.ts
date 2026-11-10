/**
 * 관리자 차량 편집 화면의 상태(Car)와 vehicles 테이블 행 사이의 변환·저장 검증.
 * React·Supabase에 의존하지 않는다.
 */
import { validKoreanDate } from "./monthly-special.ts";
import {
  INCLUDED_KM_MAX,
  INSURANCE_LIMITS,
  VEHICLE_IMAGE_MAX,
  safeImageUrl,
  vehicleImages,
  type Vehicle,
} from "./contracts.ts";

export interface Car {
  id: string;
  name: string;
  type?: string;
  year: string;
  price: string;
  badge?: string;
  is_monthly_special?: boolean;
  monthly_special_price?: number | null;
  monthly_special_starts_on?: string | null;
  monthly_special_ends_on?: string | null;
  condition: string;
  /** 대표 사진(images[0]). 목록·카드에 쓴다. */
  image: string;
  /** 상세 캐러셀 사진. 첫 장이 대표 사진이다. */
  images?: string[];
  fuel?: string;
  category_id?: string;
  deposit_amount?: number | null;
  pricePolicy: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  content?: string;
  options?: string[];
  manufacturer?: string;
  seats?: number;
  /** 배기량(cc). 빈 값이면 null. */
  displacement_cc?: number | null;
  is_van?: boolean;
  /** 100km당 초과 주행 요금(원). 빈 값이면 null. */
  extra_km_fee?: number | null;
  /** 일/주/월 기본 약정 주행거리(km). 빈 값이면 null. */
  km_daily?: number | null;
  km_weekly?: number | null;
  km_monthly?: number | null;
}

export interface Category {
  id: string;
  name: string;
}

/** vehicles 행을 편집 화면 상태로 바꾼다. */
export function carFromVehicle(v: Vehicle): Car {
  const images = vehicleImages(v);
  return {
    id: v.id,
    name: v.name,
    type: v.type,
    year: String(v.year),
    price: String(v.price_monthly ?? 0),
    badge: v.badge || "",
    is_monthly_special: v.is_monthly_special === true,
    monthly_special_price: v.monthly_special_price ?? null,
    monthly_special_starts_on: v.monthly_special_starts_on ?? null,
    monthly_special_ends_on: v.monthly_special_ends_on ?? null,
    condition: v.condition || "",
    image: images[0] || "",
    images,
    fuel: v.fuel || "",
    category_id: v.category_id || "",
    deposit_amount: v.deposit_amount ?? null,
    pricePolicy: {
      daily: v.price_daily,
      weekly: v.price_weekly,
      monthly: v.price_monthly,
    },
    content: v.content || "",
    options: v.options || [],
    manufacturer: v.manufacturer || "",
    seats: v.seats || 5,
    displacement_cc: v.displacement_cc ?? null,
    is_van: Boolean(v.is_van),
    extra_km_fee: v.extra_km_fee ?? null,
    km_daily: v.km_daily ?? null,
    km_weekly: v.km_weekly ?? null,
    km_monthly: v.km_monthly ?? null,
  };
}

/** 편집 화면 상태를 vehicles insert/update 값으로 바꾼다. type은 카테고리 이름을 따른다. */
export function vehiclePayload(car: Car, categories: Category[]) {
  const images = car.images || [];
  return {
    name: car.name,
    year: Number(car.year),
    fuel: car.fuel,
    badge: car.badge,
    is_monthly_special: car.is_monthly_special ?? false,
    monthly_special_price: car.monthly_special_price ?? null,
    monthly_special_starts_on: car.monthly_special_starts_on || null,
    monthly_special_ends_on: car.monthly_special_ends_on || null,
    condition: car.condition,
    image_url: images[0] || "",
    image_urls: images,
    category_id: car.category_id || null,
    price_daily: car.pricePolicy.daily,
    price_weekly: car.pricePolicy.weekly,
    price_monthly: car.pricePolicy.monthly,
    deposit_amount: car.deposit_amount ?? null,
    type:
      categories.find((c) => c.id === car.category_id)?.name ||
      car.type ||
      "일반",
    content: car.content || "",
    options: (car.options || []).map((s) => s.trim()).filter(Boolean),
    manufacturer: car.manufacturer || "",
    seats: car.seats || 5,
    displacement_cc: car.displacement_cc ?? null,
    is_van: Boolean(car.is_van),
    extra_km_fee: car.extra_km_fee ?? null,
    km_daily: car.km_daily ?? null,
    km_weekly: car.km_weekly ?? null,
    km_monthly: car.km_monthly ?? null,
  };
}
export type VehiclePayload = ReturnType<typeof vehiclePayload>;

type SpecialSettings = Pick<
  VehiclePayload,
  | "is_monthly_special"
  | "monthly_special_price"
  | "monthly_special_starts_on"
  | "monthly_special_ends_on"
>;

/** 특가 지정을 해제할 때 가격과 기간도 함께 비워야 한다. */
export function monthlySpecialUnassignError(
  current: SpecialSettings,
  next: Partial<SpecialSettings>,
): string | null {
  if (!current.is_monthly_special) return null;
  if (next.is_monthly_special === false)
    return next.monthly_special_price === null &&
      next.monthly_special_starts_on === null &&
      next.monthly_special_ends_on === null
      ? null
      : "지정 해제 후 수정하세요.";
  return null;
}

const nonNegativeInt = (value: unknown, max = Infinity) =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;
const optional = (value: number | null, max: number) =>
  value === null || nonNegativeInt(value, max);

/** 개별 표 셀 저장도 동일한 특별가 규칙을 적용한다. */
export function vehicleSpecialError(
  payload: Pick<
    VehiclePayload,
    | "is_monthly_special"
    | "price_monthly"
    | "monthly_special_price"
    | "monthly_special_starts_on"
    | "monthly_special_ends_on"
  >,
  requireComplete = true,
): string | null {
  const specialPrice = payload.monthly_special_price;
  const starts = payload.monthly_special_starts_on;
  const ends = payload.monthly_special_ends_on;
  if (
    specialPrice !== null &&
    (!nonNegativeInt(specialPrice) ||
      specialPrice === 0 ||
      specialPrice >= payload.price_monthly)
  )
    return "월렌트 특별가는 0원보다 크고 평소 월 요금보다 낮아야 합니다.";
  if (
    (starts !== null && !validKoreanDate(starts)) ||
    (ends !== null && !validKoreanDate(ends)) ||
    (starts && ends && starts > ends)
  )
    return "월렌트 특별가 적용 기간을 확인해주세요.";
  if (
    requireComplete &&
    payload.is_monthly_special &&
    (specialPrice === null || !starts || !ends)
  )
    return "특가 차량은 특별가와 시작일·종료일을 모두 입력해주세요.";
  return null;
}

/** 저장 전 검증. 문제가 있으면 관리자에게 보여줄 문구, 없으면 null. */
export function vehiclePayloadError(payload: VehiclePayload): string | null {
  if (typeof payload.is_monthly_special !== "boolean")
    return "월렌트 특가 지정 여부를 확인해주세요.";
  const specialError = vehicleSpecialError(payload);
  if (specialError) return specialError;
  const images = payload.image_urls;
  if (
    images.length > VEHICLE_IMAGE_MAX ||
    new Set(images).size !== images.length ||
    !images.every(safeImageUrl)
  )
    return `차량 사진은 HTTPS 주소로 중복 없이 최대 ${VEHICLE_IMAGE_MAX}장까지 등록할 수 있습니다.`;
  if (
    !payload.name.trim() ||
    !Number.isInteger(payload.year) ||
    payload.year < 1990 ||
    payload.year > 2100 ||
    ![payload.price_daily, payload.price_weekly, payload.price_monthly].every(
      (p) => nonNegativeInt(p),
    ) ||
    !optional(payload.deposit_amount, 1000000000) ||
    !optional(payload.displacement_cc, INSURANCE_LIMITS.cc) ||
    !optional(payload.extra_km_fee, INSURANCE_LIMITS.price) ||
    ![payload.km_daily, payload.km_weekly, payload.km_monthly].every((km) =>
      optional(km, INCLUDED_KM_MAX),
    )
  )
    return "차량명, 연식, 0 이상의 정수 요금·약정 주행거리·초과 주행 요금과 배기량(0~20,000cc)을 입력해주세요.";
  return null;
}
