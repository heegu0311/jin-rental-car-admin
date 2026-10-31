/** 관리자 화면 공통 표시 형식. 모든 날짜는 한국 시간 기준이다. */
const KST = "Asia/Seoul";

/** "YYYY-MM-DD" (한국 시간). */
export function kstDate(value: string | number | Date = new Date()) {
  return new Date(value).toLocaleDateString("sv-SE", { timeZone: KST });
}

/** "YYYY-MM" (한국 시간). 접수월 필터 값과 같은 형식. */
export function kstMonth(value: string | number | Date = new Date()) {
  return kstDate(value).slice(0, 7);
}

/** 목록의 접수일 표시. 예: "2026. 10. 31. 오후 3:20:00" */
export function formatKstDateTime(value: string | number | Date) {
  return new Date(value).toLocaleString("ko-KR", { timeZone: KST });
}

/** 숫자만 남긴 휴대전화/일반전화를 하이픈 형식으로. 자릿수가 맞지 않으면 원문 그대로. */
export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}
