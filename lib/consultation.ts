/**
 * 예약 상담·1:1 문의 목록의 분류와 검색 규칙. React·Supabase에 의존하지 않는다.
 *
 * - 신차 상담은 reservations.car_name이 "[신차]"로 시작한다(web 신차 상담 폼이 붙인다).
 * - 문의 분류는 inquiries.title 앞의 "[분류]"이며, 없으면 "일반 문의"다.
 */
import type { Inquiry, Reservation } from "./domain/contracts.ts";
import { kstMonth } from "./format.ts";

export type ReservationCategory = "rental" | "new-car";
export const GENERAL_INQUIRY = "일반 문의";

export function isQuickRentalConsultation(
  reservation: Pick<Reservation, "options">,
) {
  return (reservation.options ?? []).some(
    (option) =>
      option === "접수 경로: 빠른 렌트 상담" ||
      /(^|\n)나이 확인: 만 (21|26)세 이상 확인/.test(option),
  );
}

export function reservationCategory(r: Pick<Reservation, "car_name">) {
  return (
    r.car_name.startsWith("[신차]") ? "new-car" : "rental"
  ) satisfies ReservationCategory;
}

export function inquiryCategory(i: Pick<Inquiry, "title">) {
  return i.title.match(/^\[([^\]]+)\]/)?.[1] || GENERAL_INQUIRY;
}

/** 목록 행의 제목 칸: 예약은 차량명, 문의는 제목. */
export function recordSubject(row: Reservation | Inquiry) {
  return "car_name" in row ? row.car_name : row.title;
}

export interface RecordFilter {
  query: string;
  /** "all" 또는 상태 값 */
  status: string;
  /** "YYYY-MM" 또는 ""(전체 기간) */
  month: string;
}

/** 이름·연락처·제목 검색 + 상태 + 접수월(한국 시간) 공통 조건. */
export function matchesRecordFilter(
  row: Reservation | Inquiry,
  { query, status, month }: RecordFilter,
) {
  const text = `${row.user_name} ${row.user_phone} ${recordSubject(row)}`;
  return (
    (status === "all" || row.status === status) &&
    (!month || kstMonth(row.created_at) === month) &&
    text.toLowerCase().includes(query.toLowerCase())
  );
}
