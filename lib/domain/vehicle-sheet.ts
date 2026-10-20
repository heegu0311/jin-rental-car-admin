/** 차량 표 편집(스프레드시트형) 입력 규칙. React·Supabase에 의존하지 않는다. */

export type VehicleSheetKey =
  | "name"
  | "manufacturer"
  | "category"
  | "year"
  | "fuel"
  | "seats"
  | "displacement_cc"
  | "badge"
  | "condition"
  | "price_daily"
  | "price_weekly"
  | "price_monthly"
  | "extra_km_fee"
  | "km_daily"
  | "km_weekly"
  | "km_monthly";

export interface VehicleSheetColumn {
  key: VehicleSheetKey;
  label: string;
  kind: "text" | "int" | "category";
  /** 빈 값을 허용하면 null로 저장한다(int) 또는 빈 문자열로 저장한다(text). */
  optional?: boolean;
  /** 빈 값을 0으로 저장한다. 요금처럼 0이 "상담 문의"를 뜻하는 값에 쓴다. */
  emptyAsZero?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  width: number;
}

export interface VehicleSheetLimits {
  price: number;
  cc: number;
  km: number;
}

export function createVehicleSheetColumns(
  limits: VehicleSheetLimits,
): VehicleSheetColumn[] {
  const won = { kind: "int", min: 0, max: limits.price, width: 120 } as const;
  const km = {
    kind: "int",
    optional: true,
    min: 0,
    max: limits.km,
    width: 100,
  } as const;
  return [
    { key: "name", label: "차량명", kind: "text", maxLength: 100, width: 200 },
    {
      key: "manufacturer",
      label: "제조사",
      kind: "text",
      optional: true,
      maxLength: 50,
      width: 110,
    },
    { key: "category", label: "카테고리", kind: "category", width: 130 },
    {
      key: "year",
      label: "연식",
      kind: "int",
      min: 1990,
      max: 2100,
      width: 80,
    },
    {
      key: "fuel",
      label: "연료",
      kind: "text",
      optional: true,
      maxLength: 30,
      width: 90,
    },
    { key: "seats", label: "인승", kind: "int", min: 1, max: 99, width: 70 },
    {
      key: "displacement_cc",
      label: "배기량(cc)",
      kind: "int",
      optional: true,
      min: 0,
      max: limits.cc,
      width: 100,
    },
    {
      key: "badge",
      label: "배지",
      kind: "text",
      optional: true,
      maxLength: 30,
      width: 100,
    },
    {
      key: "condition",
      label: "상태 설명",
      kind: "text",
      optional: true,
      maxLength: 200,
      width: 180,
    },
    { key: "price_daily", label: "일 요금", emptyAsZero: true, ...won },
    { key: "price_weekly", label: "주 요금", emptyAsZero: true, ...won },
    { key: "price_monthly", label: "월 요금", emptyAsZero: true, ...won },
    {
      key: "extra_km_fee",
      label: "초과 100km당",
      optional: true,
      ...won,
    },
    { key: "km_daily", label: "일 약정km", ...km },
    { key: "km_weekly", label: "주 약정km", ...km },
    { key: "km_monthly", label: "월 약정km", ...km },
  ];
}

export type SheetCellResult =
  { ok: true; value: string | number | null } | { ok: false; error: string };

/** "1,200,000원", "2,000cc", "3000 km" 같은 붙여넣기 값을 정수로 읽는다. */
export function parseSheetInt(raw: string): number | null {
  const cleaned = raw
    .replace(/[\s,]/g, "")
    .replace(/(원|cc|km|인승|인|년)$/i, "");
  if (!/^-?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isSafeInteger(n) ? n : null;
}

/** 카테고리 값은 호출 측에서 이름→ID로 해석한다. 여기서는 공백만 정리한다. */
export function parseSheetCell(
  column: VehicleSheetColumn,
  raw: string,
): SheetCellResult {
  const text = raw.trim();
  if (column.kind === "text" || column.kind === "category") {
    if (!text && !column.optional && column.kind === "text")
      return { ok: false, error: `${column.label}을(를) 입력해주세요.` };
    if (column.maxLength && text.length > column.maxLength)
      return {
        ok: false,
        error: `${column.label}은(는) ${column.maxLength}자 이하로 입력해주세요.`,
      };
    return { ok: true, value: text };
  }
  if (!text) {
    if (column.optional) return { ok: true, value: null };
    if (column.emptyAsZero) return { ok: true, value: 0 };
    return { ok: false, error: `${column.label}을(를) 입력해주세요.` };
  }
  const n = parseSheetInt(text);
  if (
    n === null ||
    (column.min !== undefined && n < column.min) ||
    (column.max !== undefined && n > column.max)
  )
    return {
      ok: false,
      error: `${column.label}은(는) ${column.min ?? 0}~${(column.max ?? 0).toLocaleString("ko-KR")} 사이의 정수로 입력해주세요.`,
    };
  return { ok: true, value: n };
}

/** 엑셀·구글 시트에서 복사한 TSV를 2차원 배열로 읽는다. 따옴표로 감싼 셀의 줄바꿈을 유지한다. */
export function parseClipboardGrid(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === "\t") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** 붙여넣기 내용이 여러 셀인지 판단한다. 한 셀 값은 기본 입력 동작을 따른다. */
export function isMultiCellPaste(text: string) {
  return /[\t\n]/.test(text.replace(/\r?\n$/, ""));
}

/** 표 셀을 복사할 때 쓰는 TSV. 탭·줄바꿈·따옴표가 있는 셀은 따옴표로 감싼다. */
export function toClipboardGrid(rows: string[][]) {
  return rows
    .map((r) =>
      r
        .map((c) => (/[\t\n"]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c))
        .join("\t"),
    )
    .join("\n");
}
