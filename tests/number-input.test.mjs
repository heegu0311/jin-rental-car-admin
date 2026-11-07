import test from "node:test";
import assert from "node:assert/strict";
import { numberInputValue, parseNumberInput } from "../lib/number-input.ts";
import { INSURANCE_AGE_GROUPS, parseInsuranceConfig } from "../lib/domain/contracts.ts";
import { vehiclePayload, vehiclePayloadError } from "../lib/domain/vehicle-form.ts";

test("숫자를 모두 삭제한 뒤 새 값을 입력하고 실제 0도 표시한다", () => {
  for (const value of [0, 1598, 50000, 5]) {
    assert.equal(numberInputValue(value), value);
    const cleared = parseNumberInput("");
    assert.ok(Number.isNaN(cleared));
    assert.equal(numberInputValue(cleared), "");
    assert.equal(numberInputValue(parseNumberInput("2000")), 2000);
    assert.equal(numberInputValue(parseNumberInput("0")), 0);
  }
  assert.equal(numberInputValue(null), "");
  assert.equal(numberInputValue(undefined), "");
});

test("빈 필수 차량 요금은 저장 검증에서 거부하고 명시한 0원은 허용한다", () => {
  const car = {
    id: "", name: "입력 검증", year: "2025", price: "0", condition: "",
    image: "", images: [], pricePolicy: { daily: 0, weekly: 0, monthly: 0 },
  };
  assert.equal(vehiclePayloadError(vehiclePayload(car, [])), null);
  for (const unit of ["daily", "weekly", "monthly"]) {
    const edited = { ...car, pricePolicy: { ...car.pricePolicy, [unit]: parseNumberInput("") } };
    assert.notEqual(vehiclePayloadError(vehiclePayload(edited, [])), null);
  }
});

test("빈 보험 요금·배기량 상한을 저장하지 않고 0원 보험은 허용한다", () => {
  const config = {
    ccLimits: [1600],
    units: Object.fromEntries(["daily", "weekly", "monthly"].map((unit) => [unit, {
      required: false,
      plans: Object.fromEntries(INSURANCE_AGE_GROUPS.map((age) => [age, [{
        name: "입력 검증", prices: { cc: [0, 0], van: 0 }, details: [],
      }]])),
    }])),
  };
  assert.ok(parseInsuranceConfig(config));
  assert.equal(parseInsuranceConfig({ ...config, ccLimits: [parseNumberInput("")] }), null);
  for (const key of ["cc", "van"]) {
    const edited = structuredClone(config);
    const prices = edited.units.daily.plans[INSURANCE_AGE_GROUPS[0]][0].prices;
    if (key === "cc") prices.cc[0] = parseNumberInput("");
    else prices.van = parseNumberInput("");
    assert.equal(parseInsuranceConfig(edited), null);
  }
});
