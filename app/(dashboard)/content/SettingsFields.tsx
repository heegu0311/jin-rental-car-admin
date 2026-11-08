"use client";

import type { SiteContent } from "@/lib/domain/contracts";

export const SETTING_FIELDS = [
  "전화번호", "상담시간", "주소", "대표자", "사업자등록번호",
  "카카오 채널", "네이버 톡톡", "인스타그램", "페이스북", "유튜브",
] as const;

type Props = {
  sections: SiteContent["sections"];
  onChange: (sections: SiteContent["sections"]) => void;
  inputClass: string;
};

function timeParts(value: string): [string, string] {
  const match = value.match(/(?:(AM|PM|오전|오후)\s*)?(\d{1,2}):([0-5]\d)\s*(?:~|～|–|—|-)\s*(?:(AM|PM|오전|오후)\s*)?(\d{1,2}):([0-5]\d)/i);
  if (!match) return ["", ""];
  const convert = (period: string | undefined, hour: string, minute: string) => {
    let h = Number(hour);
    if (period) {
      if (h < 1 || h > 12) return "";
      h = h % 12 + (/^(PM|오후)$/i.test(period) ? 12 : 0);
    }
    if (h > 23) return "";
    return `${String(h).padStart(2, "0")}:${minute}`;
  };
  return [convert(match[1], match[2], match[3]), convert(match[4], match[5], match[6])];
}

export function SettingsFields({ sections, onChange, inputClass }: Props) {
  const get = (field: string) => sections.find((section) => section.title === field)?.body ?? "";
  const set = (field: string, body: string) => onChange([
    ...SETTING_FIELDS.map((title) => ({ title, body: title === field ? body : get(title) })),
    ...sections.filter((section) => !SETTING_FIELDS.some((title) => title === section.title)),
  ]);
  const hours = get("상담시간");
  const [start, end] = timeParts(hours);
  const setHours = (from: string, to: string) => set("상담시간", `${from} ~ ${to}`);

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-bold text-slate-900">연락처와 사업자 정보</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {SETTING_FIELDS.slice(0, 5).map((field) => field === "상담시간" ? (
            <div key={field} className="text-sm font-semibold text-slate-900">
              상담시간
              <div className="mt-2 flex items-center gap-3">
                <label className="min-w-0 flex-1 text-xs text-slate-600"><input aria-label="상담 시작 시간" type="time" step="1800" className={inputClass} value={start} onChange={(event) => setHours(event.target.value, end || "20:00")} /></label>
                <span aria-hidden="true">~</span>
                <label className="min-w-0 flex-1 text-xs text-slate-600"><input aria-label="상담 종료 시간" type="time" step="1800" className={inputClass} value={end} onChange={(event) => setHours(start || "08:30", event.target.value)} /></label>
              </div>
              {hours && (!start || !end) && <p className="mt-2 text-xs font-normal text-amber-700">저장된 시간 형식을 읽을 수 없습니다. 시작과 종료 시간을 다시 선택해 주세요.</p>}
            </div>
          ) : (
            <label key={field} className={`block text-sm font-semibold text-slate-900 ${field === "주소" ? "md:col-span-2" : ""}`}>
              {field}
              <input className={inputClass} type={field === "전화번호" ? "tel" : "text"} maxLength={field === "주소" ? 500 : 200} value={get(field)} onChange={(event) => set(field, event.target.value)} />
            </label>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">상담 채널</h2>
        <p className="mt-1 text-xs text-slate-500">사용하는 채널의 HTTPS 주소를 입력하세요. 비워 둔 채널은 고객센터로 연결됩니다.</p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {SETTING_FIELDS.slice(5).map((field) => (
            <label key={field} className="block text-sm font-semibold text-slate-900">{field}
              <input className={inputClass} type="url" inputMode="url" maxLength={2000} placeholder="https://" value={get(field)} onChange={(event) => set(field, event.target.value)} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
