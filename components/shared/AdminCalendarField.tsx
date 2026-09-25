"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
function pad(value: number) { return String(value).padStart(2, "0"); }
function dateKey(year: number, month: number, day: number) { return `${year}-${pad(month + 1)}-${pad(day)}`; }

export function AdminCalendarField({ value, onChange, monthOnly = false, label }: { value: string; onChange: (value: string) => void; monthOnly?: boolean; label: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => { const date = value ? new Date(`${value}${monthOnly ? "-01" : ""}T12:00:00`) : new Date(); return Number.isNaN(date.getTime()) ? new Date() : date; });
  const year = view.getFullYear(), month = view.getMonth();
  const first = new Date(year, month, 1).getDay();
  const last = new Date(year, month + 1, 0).getDate();
  const move = (delta: number) => setView(new Date(year, month + delta, 1));
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger type="button" aria-label={label} className="flex h-11 min-w-36 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-600">
      <CalendarDays size={16} className="text-blue-700" aria-hidden="true" />{value || (monthOnly ? "월 선택" : "날짜 선택")}
    </Popover.Trigger>
    <Popover.Portal><Popover.Content sideOffset={6} align="start" className="z-50 w-[280px] rounded-2xl border border-slate-700 bg-slate-900 p-3 text-white shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => move(monthOnly ? -12 : -1)} aria-label={monthOnly ? "이전 연도" : "이전 달"} className="rounded p-2 hover:bg-slate-700"><ChevronLeft size={16} /></button>
        <strong className="text-sm">{year}년 {!monthOnly && `${month + 1}월`}</strong>
        <button type="button" onClick={() => move(monthOnly ? 12 : 1)} aria-label={monthOnly ? "다음 연도" : "다음 달"} className="rounded p-2 hover:bg-slate-700"><ChevronRight size={16} /></button>
      </div>
      {monthOnly ? <div className="grid grid-cols-3 gap-1">{Array.from({ length: 12 }, (_, index) => { const key = `${year}-${pad(index + 1)}`; return <button key={key} type="button" aria-pressed={value === key} onClick={() => { onChange(key); setOpen(false); }} className={`rounded-lg py-3 text-sm hover:bg-slate-700 aria-pressed:bg-white aria-pressed:text-slate-900`}>{index + 1}월</button>; })}</div> : <div className="grid grid-cols-7 gap-1 text-center text-sm">{weekdays.map((day) => <span key={day} className="py-2 text-slate-400">{day}</span>)}{Array.from({ length: first }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: last }, (_, index) => { const key = dateKey(year, month, index + 1); return <button key={key} type="button" aria-pressed={value === key} onClick={() => { onChange(key); setOpen(false); }} className="size-9 rounded-lg hover:bg-slate-700 aria-pressed:bg-white aria-pressed:text-slate-900">{index + 1}</button>; })}</div>}
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
