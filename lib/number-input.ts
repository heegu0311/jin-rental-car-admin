/** 빈 필수 숫자 입력은 NaN으로 보관해 실제 0과 구분하고 저장 검증에서 거부한다. */
export function parseNumberInput(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}

/** React의 number input에 NaN을 넘기지 않고 빈칸으로 표시한다. */
export function numberInputValue(value: number | null | undefined): number | "" {
  return value != null && Number.isFinite(value) ? value : "";
}
