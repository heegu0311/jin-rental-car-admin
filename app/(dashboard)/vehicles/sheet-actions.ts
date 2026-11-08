"use server";

import { requireAdmin } from "@/lib/auth";
import { INCLUDED_KM_MAX, INSURANCE_LIMITS } from "@/lib/domain/contracts";
import {
  lockedMonthlySpecialError,
  vehicleSpecialError,
} from "@/lib/domain/vehicle-form";
import { createVehicleSheetColumns } from "@/lib/domain/vehicle-sheet";
import type { VehicleSheetPatch } from "@/components/vehicles/VehicleSheet";

const columns = createVehicleSheetColumns({
  price: INSURANCE_LIMITS.price,
  cc: INSURANCE_LIMITS.cc,
  km: INCLUDED_KM_MAX,
});
const idPattern = /^[0-9a-f-]{36}$/i;

/** 표 셀 입력을 서버에서 다시 확인하고, 특가 항목은 현재 DB 행과 합쳐 검증한다. */
export async function patchVehicleSheet(id: string, patch: VehicleSheetPatch) {
  const { db } = await requireAdmin();
  if (
    !idPattern.test(id) ||
    !patch ||
    typeof patch !== "object" ||
    Array.isArray(patch)
  )
    return { error: "차량 정보를 확인해주세요." };
  const entries = Object.entries(patch);
  if (!entries.length) return { error: "변경할 내용이 없습니다." };
  const values: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of entries) {
    const column = columns.find(
      (item) => (item.key === "category" ? "category_id" : item.key) === key,
    );
    if (!column) return { error: "수정할 수 없는 차량 항목입니다." };
    if (column.kind === "boolean") {
      if (typeof value !== "boolean")
        return { error: "월렌트 특가 지정 여부를 확인해주세요." };
    } else if (column.kind === "date") {
      if (
        value !== null &&
        (typeof value !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ||
          new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)
      )
        return { error: "특가 적용 날짜를 확인해주세요." };
    } else if (column.kind === "int") {
      if (
        value !== null &&
        (typeof value !== "number" ||
          !Number.isInteger(value) ||
          value < (column.min ?? 0) ||
          value > (column.max ?? Infinity))
      )
        return { error: `${column.label} 값을 확인해주세요.` };
      if (value === null && !column.optional)
        return { error: `${column.label} 값을 확인해주세요.` };
    } else if (
      (value === null && !column.optional && column.kind !== "category") ||
      (value !== null &&
        (typeof value !== "string" ||
          (column.maxLength !== undefined && value.length > column.maxLength)))
    )
      return { error: `${column.label} 값을 확인해주세요.` };
    values[key] = value;
  }
  if ("category_id" in values) {
    if (values.category_id !== null && typeof values.category_id !== "string")
      return { error: "카테고리를 확인해주세요." };
    if (values.category_id) {
      const { data: category, error } = await db
        .from("vehicle_categories")
        .select("name")
        .eq("id", values.category_id)
        .single();
      if (error || !category) return { error: "카테고리를 확인해주세요." };
      values.type = category.name;
    } else values.type = "일반";
  }
  const { data: current, error: loadError } = await db
    .from("vehicles")
    .select(
      "price_monthly,is_monthly_special,monthly_special_price,monthly_special_starts_on,monthly_special_ends_on",
    )
    .eq("id", id)
    .single();
  if (loadError || !current)
    return { error: "차량 정보를 불러오지 못했습니다." };
  const lockedError = lockedMonthlySpecialError(current, values);
  if (lockedError) return { error: lockedError };
  const offer = {
    price_monthly: (values.price_monthly ?? current.price_monthly) as number,
    is_monthly_special: (values.is_monthly_special ??
      current.is_monthly_special) as boolean,
    monthly_special_price: ("monthly_special_price" in values
      ? values.monthly_special_price
      : current.monthly_special_price) as number | null,
    monthly_special_starts_on: ("monthly_special_starts_on" in values
      ? values.monthly_special_starts_on
      : current.monthly_special_starts_on) as string | null,
    monthly_special_ends_on: ("monthly_special_ends_on" in values
      ? values.monthly_special_ends_on
      : current.monthly_special_ends_on) as string | null,
  };
  const hadCompleteOffer =
    current.monthly_special_price !== null &&
    Boolean(
      current.monthly_special_starts_on && current.monthly_special_ends_on,
    );
  const requireComplete =
    values.is_monthly_special === true ||
    (current.is_monthly_special && hadCompleteOffer);
  const invalid = vehicleSpecialError(offer, requireComplete);
  if (invalid) return { error: invalid };
  const { error } = await db
    .from("vehicles")
    .update(values)
    .eq("id", id)
    .select("id")
    .single();
  return {
    error: error ? "저장에 실패했습니다. 입력값과 권한을 확인해주세요." : null,
  };
}
