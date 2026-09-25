import {
  type Reservation,
  RESERVATION_LABELS,
  VEHICLE_OPTIONS,
} from "@/lib/domain/contracts";
import { StatusBadge } from "./feedback";

// web의 submitConsultation이 message 앞뒤에 붙이는 라벨만 구조화한다.
const LABELED_LINES = ["고객 유형", "생년월일"] as const;

function splitOptions(options: string[] | null | undefined) {
  const vehicle: string[] = [],
    fields: { label: string; value: string }[] = [],
    memo: string[] = [];
  for (const item of options ?? []) {
    if ((VEHICLE_OPTIONS as readonly string[]).includes(item)) {
      vehicle.push(item);
      continue;
    }
    for (const line of item.split("\n")) {
      const text = line.trim();
      if (!text) continue;
      const label = LABELED_LINES.find((l) => text.startsWith(`${l}:`));
      if (label)
        fields.push({ label, value: text.slice(label.length + 1).trim() });
      else memo.push(text);
    }
  }
  return { vehicle, fields, memo: memo.join("\n") };
}

function formatBirthdate(value: string) {
  return /^\d{6}$/.test(value)
    ? `${value.slice(0, 2)}.${value.slice(2, 4)}.${value.slice(4)}`
    : value;
}

export function ReservationDetail({
  reservation,
}: {
  reservation: Reservation;
}) {
  const { vehicle, fields, memo } = splitOptions(reservation.options);
  const summary = [
    { label: "희망 시작일", value: reservation.start_date },
    { label: "이용 기간", value: reservation.period },
    { label: "약정 거리", value: reservation.package_km },
    ...fields.map((f) => ({
      label: f.label,
      value:
        f.label === "생년월일"
          ? formatBirthdate(f.value)
          : f.value.replace(/\s*\([A-Za-z]+\)$/, ""),
    })),
  ].filter((f) => f.value);
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">희망 차량</p>
            <p className="mt-1 break-keep text-base font-bold text-slate-900">
              {reservation.car_name}
            </p>
          </div>
          <StatusBadge tone={reservation.status}>
            {RESERVATION_LABELS[reservation.status]}
          </StatusBadge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-sm">
          {summary.map((f) => (
            <div
              key={f.label}
              className="bg-slate-50 px-3 py-2.5 odd:last:col-span-2"
            >
              <dt className="text-xs text-slate-500">{f.label}</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h3 className="text-sm font-semibold text-slate-900">
          희망 옵션{" "}
          <span className="font-normal text-slate-500">{vehicle.length}</span>
        </h3>
        {vehicle.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {vehicle.map((o) => (
              <li
                key={o}
                className="rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
              >
                {o}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">선택한 옵션 없음</p>
        )}
      </section>
      <section>
        <h3 className="text-sm font-semibold text-slate-900">요청 메모</h3>
        <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          {memo || <span className="text-slate-500">작성한 메모 없음</span>}
        </p>
      </section>
      <p className="text-xs text-slate-500">
        접수일{" "}
        {new Date(reservation.created_at).toLocaleString("ko-KR", {
          timeZone: "Asia/Seoul",
        })}
      </p>
    </div>
  );
}
