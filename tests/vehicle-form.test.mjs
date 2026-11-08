import test from "node:test";
import assert from "node:assert/strict";
import {
  carFromVehicle,
  vehiclePayload,
  vehiclePayloadError,
  lockedMonthlySpecialError,
} from "../lib/domain/vehicle-form.ts";

const row = {
  id: "v1",
  name: "아반떼",
  type: "중형",
  year: 2025,
  fuel: "휘발유",
  image_url: "https://x.supabase.co/a.webp",
  image_urls: ["https://x.supabase.co/a.webp", "https://x.supabase.co/b.webp"],
  badge: null,
  condition: null,
  category_id: "c1",
  content: null,
  status: "available",
  price_daily: 50000,
  price_weekly: 300000,
  price_monthly: 900000,
  displacement_cc: 1598,
};
const categories = [
  { id: "c1", name: "중형" },
  { id: "c2", name: "SUV" },
];

test("지정된 특가 가격과 기간은 해제를 저장하기 전까지 변경할 수 없다", () => {
  const current = {
    is_monthly_special: true,
    monthly_special_price: 700000,
    monthly_special_starts_on: "2026-11-01",
    monthly_special_ends_on: "2026-11-30",
  };
  assert.match(
    lockedMonthlySpecialError(current, { monthly_special_price: 690000 }),
    /지정 해제 후 수정하세요/,
  );
  assert.match(
    lockedMonthlySpecialError(current, {
      is_monthly_special: false,
      monthly_special_ends_on: "2026-12-01",
    }),
    /지정 해제 후 수정하세요/,
  );
  assert.match(
    lockedMonthlySpecialError(current, { is_monthly_special: false }),
    /지정 해제 후 수정하세요/,
  );
  assert.equal(
    lockedMonthlySpecialError(current, {
      is_monthly_special: false,
      monthly_special_price: null,
      monthly_special_starts_on: null,
      monthly_special_ends_on: null,
    }),
    null,
  );
  assert.equal(
    lockedMonthlySpecialError(
      { ...current, is_monthly_special: false },
      { monthly_special_price: 690000 },
    ),
    null,
  );
});

test("차량 행을 재고 추적 정보 없이 편집 상태로 바꾼다", () => {
  const car = carFromVehicle(row);
  assert.equal(car.year, "2025");
  assert.equal(car.image, row.image_url);
  assert.deepEqual(car.pricePolicy, {
    daily: 50000,
    weekly: 300000,
    monthly: 900000,
  });
  assert.equal("unitCount" in car, false);
  assert.equal("availableCount" in car, false);
  assert.equal(car.extra_km_fee, null);
});

test("저장 값은 편집 상태를 그대로 되돌리고 type은 카테고리 이름을 따른다", () => {
  const car = {
    ...carFromVehicle(row),
    category_id: "c2",
    options: [" 후방카메라 ", ""],
  };
  const payload = vehiclePayload(car, categories);
  assert.equal(payload.type, "SUV");
  assert.equal(payload.year, 2025);
  assert.equal(payload.image_url, row.image_url);
  assert.deepEqual(payload.options, ["후방카메라"]);
  assert.equal(payload.price_monthly, 900000);
  assert.equal(vehiclePayloadError(payload), null);
});

test("저장 전 검증은 사진·연식·요금·배기량 범위를 거부한다", () => {
  const ok = vehiclePayload(carFromVehicle(row), categories);
  const bad = (patch) => vehiclePayloadError({ ...ok, ...patch });
  assert.match(bad({ image_urls: ["http://x.co/a.jpg"] }), /사진/);
  assert.match(bad({ image_urls: [ok.image_url, ok.image_url] }), /사진/);
  assert.notEqual(bad({ year: 1989 }), null);
  assert.notEqual(bad({ name: " " }), null);
  assert.notEqual(bad({ price_daily: -1 }), null);
  assert.notEqual(bad({ price_weekly: 1.5 }), null);
  assert.notEqual(bad({ displacement_cc: 20001 }), null);
  assert.equal(bad({ displacement_cc: null, km_daily: null }), null);
  assert.notEqual(bad({ km_monthly: -10 }), null);
});

test("월렌트 특가 지정·해제·기존 차량 미지정이 저장 왕복에서 유지된다", () => {
  assert.equal(carFromVehicle(row).is_monthly_special, false);
  for (const value of [true, false]) {
    const car = carFromVehicle({
      ...row,
      is_monthly_special: value,
      monthly_special_price: 750000,
      monthly_special_starts_on: "2026-11-01",
      monthly_special_ends_on: "2026-11-30",
    });
    const payload = vehiclePayload(car, categories);
    assert.equal(payload.is_monthly_special, value);
    assert.equal(vehiclePayloadError(payload), null);
    assert.equal(
      carFromVehicle({ ...row, ...payload }).is_monthly_special,
      value,
    );
    assert.equal(payload.price_monthly, row.price_monthly);
  }
  const valid = vehiclePayload(carFromVehicle(row), categories);
  assert.match(
    vehiclePayloadError({ ...valid, is_monthly_special: "true" }),
    /특가/,
  );
});

test("월렌트 특별가는 정가보다 낮고 유효한 기간을 가져야 한다", () => {
  const ok = vehiclePayload(
    carFromVehicle({
      ...row,
      is_monthly_special: true,
      monthly_special_price: 750000,
      monthly_special_starts_on: "2026-11-01",
      monthly_special_ends_on: "2026-11-30",
    }),
    categories,
  );
  assert.equal(vehiclePayloadError(ok), null);
  for (const invalid of [0, 900000, -1, 1.5])
    assert.match(
      vehiclePayloadError({ ...ok, monthly_special_price: invalid }),
      /특별가/,
    );
  assert.match(
    vehiclePayloadError({ ...ok, monthly_special_ends_on: "2026-10-31" }),
    /기간/,
  );
  assert.match(
    vehiclePayloadError({ ...ok, monthly_special_starts_on: "2026-11-31" }),
    /기간/,
  );
  assert.match(
    vehiclePayloadError({ ...ok, monthly_special_ends_on: null }),
    /시작일/,
  );
  assert.equal(
    vehiclePayloadError({
      ...ok,
      is_monthly_special: false,
      monthly_special_price: null,
    }),
    null,
  );
});
