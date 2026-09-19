import test from "node:test";
import assert from "node:assert/strict";
import {
  formatWon,
  rentalPeriod,
  rentalType,
  validPhone,
  vehicleOptions,
} from "../lib/domain/contracts.ts";
test("금액은 저장된 단위를 유지하고 유효하지 않은 값을 문의로 표시", () => {
  assert.equal(formatWon(380000), "380,000원");
  assert.equal(formatWon(0), "상담 문의");
  assert.equal(formatWon(null), "상담 문의");
  assert.equal(formatWon(NaN), "상담 문의");
  assert.equal(formatWon(-1), "상담 문의");
});
test("변조된 렌트 종류와 기간 제한", () => {
  assert.equal(rentalType("unknown"), null);
  for (const n of ["0", "-1", "Infinity", "1.5", "99999", "abc"])
    assert.equal(rentalPeriod(n), 1);
  assert.equal(rentalPeriod("12"), 12);
});
test("연락처는 국내 전화번호만 허용", () => {
  assert.equal(validPhone("010-1234-5678"), true);
  assert.equal(validPhone("02-123-4567"), true);
  assert.equal(validPhone("hello"), false);
  assert.equal(validPhone("1234567890"), false);
});
test("차량 옵션은 허용 목록 순서로 중복 없이 정규화", () => {
  assert.deepEqual(
    vehicleOptions(["HUD", "열선시트", "HUD", "임의 옵션", null]),
    ["열선시트", "HUD"],
  );
});
