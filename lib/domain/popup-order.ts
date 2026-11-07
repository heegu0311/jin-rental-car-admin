import { POPUP_ORDER_MAX } from "./contracts.ts";

export function parsePopupOrderIds(value: unknown): string[] | null {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > POPUP_ORDER_MAX + 1 ||
    value.some(
      (id) =>
        typeof id !== "string" ||
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id),
    ) ||
    new Set(value.map((id: string) => id.toLowerCase())).size !== value.length
  )
    return null;
  return value as string[];
}

export function movePopup<T extends { id: string }>(
  rows: T[],
  from: string,
  to: string,
): T[] {
  const start = rows.findIndex((row) => row.id === from);
  const end = rows.findIndex((row) => row.id === to);
  if (start < 0 || end < 0 || start === end) return rows;
  const next = [...rows];
  const [row] = next.splice(start, 1);
  next.splice(end, 0, row);
  return next;
}
