import test from "node:test";
import assert from "node:assert/strict";
import {
  createVehicleSheetColumns,
  isMultiCellPaste,
  parseClipboardGrid,
  parseSheetCell,
  toClipboardGrid,
} from "../lib/domain/vehicle-sheet.ts";

const cols = Object.fromEntries(
  createVehicleSheetColumns({ price: 10_000_000, cc: 20_000, km: 100_000 }).map(
    (c) => [c.key, c],
  ),
);

test("붙여넣은 금액·거리 표기를 정수로 저장", () => {
  assert.deepEqual(parseSheetCell(cols.price_daily, "1,200,000원"), {
    ok: true,
    value: 1200000,
  });
  assert.deepEqual(parseSheetCell(cols.displacement_cc, " 1,998cc "), {
    ok: true,
    value: 1998,
  });
  assert.deepEqual(parseSheetCell(cols.km_monthly, "3000 km"), {
    ok: true,
    value: 3000,
  });
});

test("빈 값: 요금은 0(상담 문의), 선택 항목은 null, 필수 항목은 거부", () => {
  assert.deepEqual(parseSheetCell(cols.price_monthly, ""), {
    ok: true,
    value: 0,
  });
  assert.deepEqual(parseSheetCell(cols.km_daily, " "), {
    ok: true,
    value: null,
  });
  assert.equal(parseSheetCell(cols.year, "").ok, false);
  assert.equal(parseSheetCell(cols.name, "  ").ok, false);
});

test("범위·형식을 벗어난 값 거부", () => {
  for (const [key, raw] of [
    ["price_daily", "-1"],
    ["price_daily", "12.5"],
    ["price_daily", "10000001"],
    ["year", "1989"],
    ["displacement_cc", "20001"],
    ["km_weekly", "abc"],
    ["seats", "0"],
  ])
    assert.equal(parseSheetCell(cols[key], raw).ok, false, `${key}=${raw}`);
  assert.equal(parseSheetCell(cols.name, "가".repeat(101)).ok, false);
});

test("엑셀 TSV 붙여넣기와 따옴표 셀", () => {
  assert.deepEqual(parseClipboardGrid("a\tb\r\nc\td"), [
    ["a", "b"],
    ["c", "d"],
  ]);
  assert.deepEqual(parseClipboardGrid('"줄\n바꿈"\tx'), [["줄\n바꿈", "x"]]);
  assert.equal(isMultiCellPaste("120000\n"), false);
  assert.equal(isMultiCellPaste("1\t2"), true);
  const rows = [
    ["a\tb", 'q"'],
    ["c", "d"],
  ];
  assert.deepEqual(parseClipboardGrid(toClipboardGrid(rows)), rows);
});

test("표 편집에서 특가 지정·특별가·한국 날짜를 읽고 잘못된 날짜를 거부한다", () => {
  assert.deepEqual(parseSheetCell(cols.is_monthly_special, "지정"), {
    ok: true,
    value: true,
  });
  assert.deepEqual(parseSheetCell(cols.is_monthly_special, "미지정"), {
    ok: true,
    value: false,
  });
  assert.equal(parseSheetCell(cols.is_monthly_special, "true").ok, false);
  assert.deepEqual(parseSheetCell(cols.monthly_special_price, "750,000원"), {
    ok: true,
    value: 750000,
  });
  assert.deepEqual(parseSheetCell(cols.monthly_special_price, ""), {
    ok: true,
    value: null,
  });
  assert.deepEqual(
    parseSheetCell(cols.monthly_special_starts_on, "2026-11-08"),
    { ok: true, value: "2026-11-08" },
  );
  assert.equal(
    parseSheetCell(cols.monthly_special_ends_on, "2026-11-31").ok,
    false,
  );
});
