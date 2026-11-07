import { safeImageUrl } from "./contracts.ts";

export function parseEventForm(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const {
    id,
    title,
    description,
    image_url,
    start_date,
    end_date,
    is_active,
    is_popup,
  } = input;
  if (
    id !== undefined &&
    (typeof id !== "string" ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))
  )
    return null;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 200 ||
    typeof description !== "string" ||
    description.length > 500000 ||
    typeof image_url !== "string" ||
    (image_url !== "" && !safeImageUrl(image_url)) ||
    typeof is_active !== "boolean" ||
    typeof is_popup !== "boolean"
  )
    return null;
  const validDate = (date: unknown): date is string | null =>
    date === null ||
    (typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(date) &&
      Number.isFinite(Date.parse(date)) &&
      new Date(date).toISOString() === date);
  if (
    !validDate(start_date) ||
    !validDate(end_date) ||
    (start_date && end_date && start_date > end_date)
  )
    return null;
  return {
    id,
    data: {
      title: title.trim(),
      description,
      image_url,
      start_date,
      end_date,
      is_active,
      is_popup,
    },
  };
}
