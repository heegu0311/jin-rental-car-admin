"use server";

import { requireAdmin } from "@/lib/auth";
import { operationLog } from "@/lib/observability";
import {
  vehiclePayload,
  vehiclePayloadError,
  lockedMonthlySpecialError,
  type Car,
} from "@/lib/domain/vehicle-form";

/** 세션·관리자 역할 확인 후 기존 RLS를 통해 저장한다. */
export async function saveVehicle(id: string | null, car: Car) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const { db } = await requireAdmin();
  if (id !== null && (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)))
    return { error: "차량 ID를 확인해주세요." };
  const { data: categories, error: categoryError } = await db
    .from("vehicle_categories")
    .select("id, name");
  if (categoryError)
    return { error: "카테고리를 확인하지 못했습니다. 다시 시도해주세요." };
  try {
    if (
      !car ||
      typeof car.name !== "string" ||
      (car.is_monthly_special !== undefined &&
        typeof car.is_monthly_special !== "boolean")
    )
      return { error: "차량명과 월렌트 특가 지정 여부를 확인해주세요." };
    const payload = vehiclePayload(car, categories ?? []);
    const invalid = vehiclePayloadError(payload);
    if (invalid) return { error: invalid };
    if (id) {
      const { data: current, error: loadError } = await db
        .from("vehicles")
        .select(
          "is_monthly_special,monthly_special_price,monthly_special_starts_on,monthly_special_ends_on",
        )
        .eq("id", id)
        .single();
      if (loadError || !current)
        return { error: "차량 정보를 불러오지 못했습니다." };
      const lockedError = lockedMonthlySpecialError(current, payload);
      if (lockedError) return { error: lockedError };
    }
    // 요청에 추가된 임의 필드 대신 정규화된 차량 필드만 저장한다.
    const result = id
      ? await db
          .from("vehicles")
          .update(payload)
          .eq("id", id)
          .select("id")
          .single()
      : await db.from("vehicles").insert(payload).select("id").single();
    if (result.error) {
      operationLog("vehicle.save", requestId, "failure", "db_save", startedAt);
      return {
        error: "차량 저장에 실패했습니다. 입력값과 권한을 확인해주세요.",
      };
    }
    operationLog("vehicle.save", requestId, "success", "saved", startedAt);
    return { error: null };
  } catch {
    operationLog("vehicle.save", requestId, "failure", "invalid_input", startedAt);
    return { error: "차량 입력값을 확인해주세요." };
  }
}
