"use server";

import { requireAdmin } from "@/lib/auth";
import {
  vehiclePayload,
  vehiclePayloadError,
  type Car,
} from "@/lib/domain/vehicle-form";

/** 세션·관리자 역할 확인 후 기존 RLS를 통해 저장한다. */
export async function saveVehicle(id: string | null, car: Car) {
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
    // 요청에 추가된 임의 필드 대신 정규화된 차량 필드만 저장한다.
    const result = id
      ? await db
          .from("vehicles")
          .update(payload)
          .eq("id", id)
          .select("id")
          .single()
      : await db.from("vehicles").insert(payload).select("id").single();
    if (result.error)
      return {
        error: "차량 저장에 실패했습니다. 입력값과 권한을 확인해주세요.",
      };
    return { error: null };
  } catch {
    return { error: "차량 입력값을 확인해주세요." };
  }
}
