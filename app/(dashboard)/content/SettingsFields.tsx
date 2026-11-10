"use client";

import type { SiteContent } from "@/lib/domain/contracts";

export const SETTING_FIELDS = [
  "전화번호",
  "상담시간",
  "주소",
  "대표자",
  "상호",
  "사업자등록번호",
  "배차 시간",
  "카카오 채널",
  "네이버 톡톡",
  "인스타그램",
  "페이스북",
  "유튜브",
] as const;

type Props = {
  sections: SiteContent["sections"];
  onChange: (sections: SiteContent["sections"]) => void;
  inputClass: string;
};

function timeParts(value: string): [string, string] {
  const match = value.match(
    /(?:(AM|PM|오전|오후)\s*)?(\d{1,2}):([0-5]\d)\s*(?:~|～|–|—|-)\s*(?:(AM|PM|오전|오후)\s*)?(\d{1,2}):([0-5]\d)/i,
  );
  if (!match) return ["", ""];
  const convert = (
    period: string | undefined,
    hour: string,
    minute: string,
  ) => {
    let h = Number(hour);
    if (period) {
      if (h < 1 || h > 12) return "";
      h = (h % 12) + (/^(PM|오후)$/i.test(period) ? 12 : 0);
    }
    if (h > 23) return "";
    return `${String(h).padStart(2, "0")}:${minute}`;
  };
  return [
    convert(match[1], match[2], match[3]),
    convert(match[4], match[5], match[6]),
  ];
}

export function SettingsFields({ sections, onChange, inputClass }: Props) {
  const get = (field: string) =>
    sections.find((section) => section.title === field)?.body ?? "";
  const set = (field: string, body: string) =>
    onChange([
      ...SETTING_FIELDS.map((title) => ({
        title,
        body: title === field ? body : get(title),
      })),
      ...sections.filter(
        (section) => !SETTING_FIELDS.some((title) => title === section.title),
      ),
    ]);
  const hours = get("상담시간");
  const [start, end] = timeParts(hours);
  const setHours = (from: string, to: string) =>
    set("상담시간", `${from} ~ ${to}`);
  const dispatch = get("배차 시간");
  const [dispatchStart, dispatchEnd] = timeParts(dispatch);
  const cutoff = dispatch.match(/(?:탁송|배달)\s*([0-2]\d:[0-5]\d)\s*마감/)?.[1] ?? "";
  const days =
    dispatch
      .match(/^([^0-9]*?)(?:(?:AM|PM|오전|오후)\s*)?\d{1,2}:/i)?.[1]
      .trim() ?? "";
  const setDispatch = (
    nextDays: string,
    from: string,
    to: string,
    nextCutoff: string,
  ) =>
    set(
      "배차 시간",
      `${nextDays.trim()} ${from}~${to}${nextCutoff ? ` (탁송 ${nextCutoff} 마감)` : ""}`.trim(),
    );

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          연락처와 사업자 정보
        </h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {SETTING_FIELDS.slice(0, 6).map((field) =>
            field === "상담시간" ? (
              <div key={field} className="text-sm font-semibold text-slate-900">
                상담시간
                <div className="flex items-center gap-3">
                  <label className="min-w-0 flex-1 text-xs text-slate-600">
                    <input
                      aria-label="상담 시작 시간"
                      type="time"
                      step="1800"
                      className={inputClass}
                      value={start}
                      onChange={(event) =>
                        setHours(event.target.value, end || "20:00")
                      }
                    />
                  </label>
                  <span aria-hidden="true">~</span>
                  <label className="min-w-0 flex-1 text-xs text-slate-600">
                    <input
                      aria-label="상담 종료 시간"
                      type="time"
                      step="1800"
                      className={inputClass}
                      value={end}
                      onChange={(event) =>
                        setHours(start || "08:30", event.target.value)
                      }
                    />
                  </label>
                </div>
                {hours && (!start || !end) && (
                  <p className="mt-2 text-xs font-normal text-amber-700">
                    저장된 시간 형식을 읽을 수 없습니다. 시작과 종료 시간을 다시
                    선택해 주세요.
                  </p>
                )}
              </div>
            ) : (
              <label
                key={field}
                className={`block text-sm font-semibold text-slate-900 ${field === "주소" ? "md:col-span-2" : ""}`}
              >
                {field}
                <input
                  className={inputClass}
                  type={field === "전화번호" ? "tel" : "text"}
                  maxLength={field === "주소" ? 500 : 200}
                  value={get(field)}
                  onChange={(event) => set(field, event.target.value)}
                />
              </label>
            ),
          )}
        </div>
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">배차 시간</h2>
        <p className="mt-1 text-xs text-slate-500">
          회사소개 안내와 주·월 렌트의 대여 가능 시간에 함께 적용됩니다.
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            운영 요일
            <input
              className={inputClass}
              value={days}
              placeholder="평일, 주말"
              maxLength={50}
              onChange={(event) =>
                setDispatch(
                  event.target.value,
                  dispatchStart,
                  dispatchEnd,
                  cutoff,
                )
              }
            />
          </label>
          <div className="text-sm font-semibold">
            배차 가능 시간
            <div className="flex items-center gap-3">
              <input
                aria-label="배차 시작 시간"
                type="time"
                step="1800"
                className={inputClass}
                value={dispatchStart}
                onChange={(event) =>
                  setDispatch(
                    days,
                    event.target.value,
                    dispatchEnd || "18:30",
                    cutoff,
                  )
                }
              />
              <span>~</span>
              <input
                aria-label="배차 종료 시간"
                type="time"
                step="1800"
                className={inputClass}
                value={dispatchEnd}
                onChange={(event) =>
                  setDispatch(
                    days,
                    dispatchStart || "08:30",
                    event.target.value,
                    cutoff,
                  )
                }
              />
            </div>
          </div>
          <label className="block text-sm font-semibold">
            탁송 마감 시간 (선택)
            <input
              type="time"
              step="1800"
              className={inputClass}
              value={cutoff}
              onChange={(event) =>
                setDispatch(
                  days,
                  dispatchStart,
                  dispatchEnd,
                  event.target.value,
                )
              }
            />
          </label>
        </div>
        {dispatch && (!dispatchStart || !dispatchEnd) && (
          <p className="mt-2 text-xs text-amber-700">
            저장된 배차 시간을 읽을 수 없습니다. 시작과 종료 시간을 다시 선택해
            주세요.
          </p>
        )}
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">상담 채널</h2>
        <p className="mt-1 text-xs text-slate-500">
          사용하는 채널의 HTTPS 주소를 입력하세요. 비워 둔 채널은 고객센터로
          연결됩니다.
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {SETTING_FIELDS.slice(7).map((field) => (
            <label
              key={field}
              className="block text-sm font-semibold text-slate-900"
            >
              {field}
              <input
                className={inputClass}
                type="url"
                inputMode="url"
                maxLength={2000}
                placeholder="https://"
                value={get(field)}
                onChange={(event) => set(field, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
