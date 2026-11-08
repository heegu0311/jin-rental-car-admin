import type { Vehicle } from "./contracts.ts";

type SpecialVehicle = Pick<
  Vehicle,
  | "is_monthly_special"
  | "price_monthly"
  | "monthly_special_price"
  | "monthly_special_starts_on"
  | "monthly_special_ends_on"
>;

/** 날짜 전용 DB 컬럼의 유효성 검증. JS Date가 잘못된 일을 다음 달로 보정하는 일을 막는다. */
export function validKoreanDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function koreanToday(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function monthlySpecialOffer(
  car: SpecialVehicle,
  now: Date = new Date(),
) {
  const price = car.monthly_special_price;
  const start = car.monthly_special_starts_on;
  const end = car.monthly_special_ends_on;
  if (
    car.is_monthly_special !== true ||
    !Number.isInteger(price) ||
    typeof price !== "number" ||
    price <= 0 ||
    price >= car.price_monthly ||
    !validKoreanDate(start) ||
    !validKoreanDate(end) ||
    start > end
  )
    return null;
  const today = koreanToday(now);
  return start <= today && today <= end ? { price, start, end } : null;
}

export function monthlySpecialVehicles(
  cars: Vehicle[],
  now: Date = new Date(),
) {
  return cars.filter((car) => monthlySpecialOffer(car, now) !== null);
}

export function effectiveMonthlyPrice(
  car: SpecialVehicle,
  now: Date = new Date(),
) {
  return monthlySpecialOffer(car, now)?.price ?? car.price_monthly;
}

export function monthlySpecialTitle(now: Date = new Date()) {
  const month = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    month: "numeric",
  }).format(now);
  return `${month}월 월렌트 특가차량`;
}
