"use client";
import { AdminCalendarField } from "./AdminCalendarField";
export function ReceiptMonthFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-2 text-sm font-bold text-slate-700">
        접수 월로 보기
        <AdminCalendarField value={value} onChange={onChange} monthOnly label="접수 월 선택" />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-blue-700 hover:border-blue-400"
        >
          전체 월 보기
        </button>
      )}
    </div>
  );
}
