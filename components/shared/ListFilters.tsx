"use client";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** 아이콘이 붙은 제목 검색 입력. */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full md:w-96">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <input
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
    </div>
  );
}

const PILL_TONES = {
  blue: "bg-blue-600 border-blue-600 text-white",
  emerald: "bg-emerald-600 border-emerald-600 text-white",
  orange: "bg-orange-500 border-orange-500 text-white",
  slate: "bg-slate-600 border-slate-600 text-white",
} as const;
const PILL_HOVER = {
  blue: "hover:border-blue-400 hover:text-blue-600",
  emerald: "hover:border-emerald-400 hover:text-emerald-600",
  orange: "hover:border-orange-400 hover:text-orange-500",
  slate: "hover:border-slate-400 hover:text-slate-600",
} as const;

/** 목록 상단의 둥근 필터 버튼. 선택되면 tone 색으로 채운다. */
export function FilterPill({
  active,
  tone = "blue",
  onClick,
  children,
}: {
  active: boolean;
  tone?: keyof typeof PILL_TONES;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
        active
          ? PILL_TONES[tone]
          : cn("bg-white border-slate-200 text-slate-600", PILL_HOVER[tone]),
      )}
    >
      {children}
    </button>
  );
}
