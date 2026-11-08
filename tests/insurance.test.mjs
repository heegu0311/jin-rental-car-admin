import test from "node:test";
import assert from "node:assert/strict";
import { insuranceConfigFromContent, insuranceSelection, parseInsuranceConfig } from "../lib/domain/contracts.ts";
const plan = (name, cc, details = [], van = cc[cc.length - 1]) => ({
  name,
  prices: { cc, van },
  details,
});
const unit = (required, ccPrices = (n) => [n]) => ({
  required,
  plans: {
    "만 26세 이상": [plan("일반자차 26세", ccPrices(40000))],
    "만 26세 미만": [
      plan("일반자차 21세", ccPrices(80000), [
        { label: "보상 한도", value: "500만원" },
      ]),
    ],
  },
});
const config = {
  ccLimits: [],
  units: { daily: unit(false), weekly: unit(true), monthly: unit(false) },
};
function optionalConfig(value) {
  const next = structuredClone(value);
  for (const unit of Object.values(next.units)) unit.required = false;
  return next;
}
test("모든 렌트 단위·연령에서 이전 필수 설정과 관계없이 보험 미가입 가능", () => {
  const legacy = structuredClone(config);
  for (const unit of Object.values(legacy.units)) unit.required = true;
  const parsed = parseInsuranceConfig(legacy);
  for (const type of ["daily", "weekly", "monthly"]) {
    assert.equal(parsed.units[type].required, false);
    for (const age of ["만 26세 이상", "만 26세 미만"])
      assert.match(insuranceSelection(legacy, type, age, "선택 안함"), /선택 안함$/);
  }
  for (const unit of Object.values(legacy.units)) delete unit.required;
  assert.deepEqual(parseInsuranceConfig(legacy), parsed);
});
test("자차보험은 저장된 단위·연령별 보험만 허용", () => {
  assert.equal(
    insuranceSelection(config, "weekly", "만 26세 이상", "일반자차 26세"),
    "주단위 · 만 26세 이상 · 일반자차 26세 (+40,000원)",
  );
  assert.equal(
    insuranceSelection(config, "monthly", "만 26세 미만", "선택 안함"),
    "월단위 · 만 26세 미만 · 선택 안함",
  );
  assert.equal(
    insuranceSelection(config, "weekly", "만 26세 이상", "선택 안함"),
    "주단위 · 만 26세 이상 · 선택 안함",
  );
  assert.equal(
    insuranceSelection(config, "daily", "만 26세 미만", "일반자차 26세"),
    null,
  );
  assert.equal(
    insuranceSelection(config, "daily", "만 30세", "선택 안함"),
    null,
  );
});
test("자차보험은 배기량 구간이 정해지면 그 요금, 아니면 범위로 표시", () => {
  const tiered = {
    ccLimits: [2000],
    units: {
      daily: unit(false, (n) => [n, n * 2]),
      weekly: unit(true, (n) => [n, n * 2]),
      monthly: unit(false, (n) => [n, n * 2]),
    },
  };
  assert.deepEqual(parseInsuranceConfig(tiered), optionalConfig(tiered));
  assert.match(
    insuranceSelection(tiered, "daily", "만 26세 이상", "일반자차 26세", 1),
    /\(\+80,000원\)$/,
  );
  assert.match(
    insuranceSelection(tiered, "daily", "만 26세 이상", "일반자차 26세"),
    /\(\+40,000~80,000원\)$/,
  );
});
test("자차보험 설정은 형식이 어긋나면 거부", () => {
  assert.deepEqual(parseInsuranceConfig(config), optionalConfig(config));
  assert.equal(
    parseInsuranceConfig({ ...config, units: { ...config.units, daily: undefined } }),
    null,
  );
  const bad = structuredClone(config);
  bad.units.daily.plans["만 26세 이상"][0].prices.cc[0] = -1;
  assert.equal(parseInsuranceConfig(bad), null);
  const dup = structuredClone(config);
  dup.units.daily.plans["만 26세 이상"].push(plan("일반자차 26세", [1]));
  assert.equal(parseInsuranceConfig(dup), null);
  const empty = structuredClone(config);
  empty.units.weekly.plans["만 26세 미만"] = [];
  assert.deepEqual(parseInsuranceConfig(empty), optionalConfig(empty));
  assert.equal(
    insuranceConfigFromContent({
      is_published: false,
      sections: [{ title: "", body: JSON.stringify(config) }],
    }),
    null,
  );
  assert.deepEqual(
    insuranceConfigFromContent({
      is_published: true,
      sections: [{ title: "", body: JSON.stringify(config) }],
    }),
    optionalConfig(config),
  );
});
test("이전 단일 요금 형식은 전 구간·승합 같은 요금으로 읽음", () => {
  const legacyPlan = (name, price) => ({ name, price, details: [] });
  const legacyUnit = (required) => ({
    required,
    plans: {
      "만 26세 이상": [legacyPlan("일반자차 26세", 40000)],
      "만 26세 미만": [legacyPlan("일반자차 21세", 80000)],
    },
  });
  const parsed = parseInsuranceConfig({
    daily: legacyUnit(false),
    weekly: legacyUnit(true),
    monthly: legacyUnit(false),
  });
  assert.deepEqual(parsed.ccLimits, []);
  assert.deepEqual(parsed.units.weekly.plans["만 26세 이상"][0].prices, {
    cc: [40000],
    van: 40000,
  });
});
