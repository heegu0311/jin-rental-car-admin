import test from "node:test";
import assert from "node:assert/strict";
import {
  carFromVehicle,
  vehiclePayload,
  vehiclePayloadError,
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
  vehicle_units: [
    { id: "u1", status: "available" },
    { id: "u2", status: "rented" },
    { id: "u3", status: "available" },
  ],
};
const categories = [{ id: "c1", name: "중형" }, { id: "c2", name: "SUV" }];

test("차량 행을 편집 상태로 바꾸고 실차 상태별 대수를 센다", () => {
  const car = carFromVehicle(row);
  assert.equal(car.year, "2025");
  assert.equal(car.image, row.image_url);
  assert.deepEqual(car.pricePolicy, { daily: 50000, weekly: 300000, monthly: 900000 });
  assert.equal(car.unitCount, 3);
  assert.equal(car.availableCount, 2);
  assert.equal(car.rentedCount, 1);
  assert.equal(car.maintenanceCount, 0);
  assert.equal(car.extra_km_fee, null);
});

test("저장 값은 편집 상태를 그대로 되돌리고 type은 카테고리 이름을 따른다", () => {
  const car = { ...carFromVehicle(row), category_id: "c2", options: [" 후방카메라 ", ""] };
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
