import test from "node:test";
import assert from "node:assert/strict";
import {
  inquiryCategory,
  matchesRecordFilter,
  reservationCategory,
} from "../lib/consultation.ts";
import { formatPhone, kstDate, kstMonth } from "../lib/format.ts";

test("접수일은 한국 시간 기준 날짜·월로 계산", () => {
  // UTC 10월 31일 15시 = 한국 11월 1일 0시
  assert.equal(kstDate("2026-10-31T15:00:00Z"), "2026-11-01");
  assert.equal(kstMonth("2026-10-31T14:59:59Z"), "2026-10");
});

test("전화번호는 10·11자리만 하이픈 형식으로 표시", () => {
  assert.equal(formatPhone("01012345678"), "010-1234-5678");
  assert.equal(formatPhone("02-123-4567"), "02-123-4567");
  assert.equal(formatPhone("0311234567"), "031-123-4567");
  assert.equal(formatPhone("1588"), "1588");
});

test("신차 상담과 문의 분류는 제목 접두어로 구분", () => {
  assert.equal(reservationCategory({ car_name: "[신차] 아반떼" }), "new-car");
  assert.equal(reservationCategory({ car_name: "아반떼" }), "rental");
  assert.equal(inquiryCategory({ title: "[제휴] 문의" }), "제휴");
  assert.equal(inquiryCategory({ title: "문의합니다" }), "일반 문의");
});

test("목록 필터는 검색어·상태·접수월을 모두 만족해야 통과", () => {
  const row = {
    id: "1",
    user_name: "홍길동",
    user_phone: "01012345678",
    title: "[제휴] 문의",
    content: "",
    status: "pending",
    created_at: "2026-10-31T15:00:00Z",
  };
  const base = { query: "", status: "all", month: "" };
  assert.equal(matchesRecordFilter(row, base), true);
  assert.equal(matchesRecordFilter(row, { ...base, query: "제휴" }), true);
  assert.equal(matchesRecordFilter(row, { ...base, query: "5678" }), true);
  assert.equal(matchesRecordFilter(row, { ...base, status: "answered" }), false);
  assert.equal(matchesRecordFilter(row, { ...base, month: "2026-11" }), true);
  assert.equal(matchesRecordFilter(row, { ...base, month: "2026-10" }), false);
});
