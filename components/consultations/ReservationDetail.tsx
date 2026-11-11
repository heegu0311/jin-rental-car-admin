"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  type Reservation,
  type Vehicle,
  type InsuranceConfig,
  type InsuranceAgeGroup,
  type RentalType,
  RESERVATION_LABELS,
  VEHICLE_OPTIONS,
  INSURANCE_AGE_GROUPS,
  INSURANCE_NONE,
  insuranceClassOf,
  insurancePrice,
  insurancePriceRange,
  formatWon,
  vehicleDeposit,
} from "@/lib/domain/contracts";
import { saveReservationOutcome } from "@/lib/records";
import type { ReservationConsultationResult } from "@/lib/domain/consultation-result";
import { useSubmitLock } from "@/lib/hooks/use-submit-lock";
import { StatusBadge } from "@/components/shared/feedback";
import { formatKstDateTime } from "@/lib/format";

// web의 submitConsultation이 message 앞뒤에 붙이는 라벨만 구조화한다.
const LABELED_LINES = [
  "고객 유형",
  "생년월일",
  "반납일시",
  "수령 방식",
  "대여 및 반납장소",
  "자차보험",
  "통화 확인 보증금",
  "통화 확인 메모",
] as const;

function splitOptions(options: string[] | null | undefined) {
  const vehicle: string[] = [],
    fields: { label: string; value: string }[] = [],
    memo: string[] = [];
  for (const item of options ?? []) {
    if (item.startsWith("상담 결과: ")) continue;
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

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatAmountRange(min: number | null, max: number | null) {
  if (min === null || max === null) return "금액 확인 필요";
  return min === max
    ? formatAmount(min)
    : `${formatAmount(min)}~${formatAmount(max)}`;
}

function normalizeDateTime(value: string) {
  if (!value) return "";
  const normalized = value.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return `${normalized}T00:00`;
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

function RequestOutcomeComparison({
  rows,
  saved,
}: {
  rows: {
    label: string;
    requested: string;
    current: string;
    changed: boolean;
  }[];
  saved: boolean;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            고객 요청과 상담 결과
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            달라진 조건은 강조 표시됩니다.
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${saved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {saved ? "상담 결과 저장됨" : "저장 전 미리보기"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 px-2.5 py-2 font-bold text-slate-600">
          고객 요청
        </div>
        <div className="rounded-lg bg-blue-50 px-2.5 py-2 font-bold text-blue-800">
          상담 결과
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="col-span-2 grid grid-cols-2 gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500">{row.label}</p>
              <p className="mt-0.5 break-words font-medium text-slate-800">
                {row.requested}
              </p>
            </div>
            <div
              className={`min-w-0 rounded-md px-2 py-1 ${row.changed ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "text-slate-800"}`}
            >
              <p className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
                {row.label}
                {row.changed && (
                  <span className="shrink-0 font-bold text-amber-700">
                    변경
                  </span>
                )}
              </p>
              <p className="mt-0.5 break-words font-semibold">{row.current}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReservationDetail({
  reservation,
  vehicles = [],
  insurance = null,
  outcome = null,
  onOutcomeSaved,
}: {
  reservation: Reservation;
  vehicles?: Vehicle[];
  insurance?: InsuranceConfig | null;
  outcome?: ReservationConsultationResult | null;
  onOutcomeSaved: (result: ReservationConsultationResult) => void;
}) {
  const { vehicle, fields, memo } = splitOptions(reservation.options);
  const isNewCar = reservation.car_name.startsWith("[신차]");
  const customerCar = vehicles.find((car) => car.name === reservation.car_name);
  const legacyDeposit = reservation.options
    .find((option) => option.startsWith("통화 확인 보증금:"))
    ?.match(/통화 확인 보증금:\s*(\d+)원/)?.[1];
  const legacyNote = reservation.options
    .find((option) => option.startsWith("통화 확인 메모:"))
    ?.slice("통화 확인 메모:".length)
    .trim();
  const insuranceField =
    fields.find((field) => field.label === "자차보험")?.value ?? "";
  const requestedType: RentalType = insuranceField.startsWith("주단위")
    ? "weekly"
    : insuranceField.startsWith("월단위")
      ? "monthly"
      : /\d+주/.test(reservation.period)
        ? "weekly"
        : /\d+개월/.test(reservation.period)
          ? "monthly"
          : "daily";
  const initialType = outcome?.rental_type ?? requestedType;
  const requestedCount = Number(reservation.period.match(/\d+/)?.[0] ?? 1);
  const initialCount = outcome?.period_count ?? requestedCount;
  const [selectedCarId, setSelectedCarId] = useState(
    () => outcome?.vehicle_id ?? customerCar?.id ?? "",
  );
  const [rentalType, setRentalType] = useState<RentalType>(initialType);
  const [periodCount, setPeriodCount] = useState(
    Number.isInteger(initialCount) && initialCount > 0 ? initialCount : 1,
  );
  const requestedAgeGroup: InsuranceAgeGroup = insuranceField.includes(
    "만 26세 미만",
  )
    ? "만 26세 미만"
    : "만 26세 이상";
  const initialAgeGroup: InsuranceAgeGroup = INSURANCE_AGE_GROUPS.includes(
    outcome?.insurance_age as InsuranceAgeGroup,
  )
    ? (outcome?.insurance_age as InsuranceAgeGroup)
    : requestedAgeGroup;
  const [ageGroup, setAgeGroup] = useState<InsuranceAgeGroup>(initialAgeGroup);
  const requestedPlan = insuranceField.includes(INSURANCE_NONE)
    ? INSURANCE_NONE
    : (insurance?.units[requestedType].plans[requestedAgeGroup].find((plan) =>
        insuranceField.includes(plan.name),
      )?.name ?? "");
  const initialPlan =
    outcome?.insurance_plan === "선택 전"
      ? ""
      : (outcome?.insurance_plan ?? requestedPlan);
  const [insurancePlanName, setInsurancePlanName] = useState(initialPlan);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [savedOutcome, setSavedOutcome] = useState(outcome);
  const [depositAmount, setDepositAmount] = useState(
    String(
      outcome?.deposit_amount ??
        legacyDeposit ??
        vehicleDeposit(customerCar ?? { deposit_amount: null }),
    ),
  );
  const [consultationNote, setConsultationNote] = useState(
    outcome?.note ?? legacyNote ?? "",
  );
  const [rentalStart, setRentalStart] = useState(
    outcome?.rental_start ?? normalizeDateTime(reservation.start_date),
  );
  const [rentalEnd, setRentalEnd] = useState(
    outcome
      ? (outcome.rental_end ?? "")
      : normalizeDateTime(
          fields.find((field) => field.label === "반납일시")?.value ?? "",
        ),
  );
  const [packageKm, setPackageKm] = useState(
    outcome?.package_km ?? reservation.package_km,
  );
  const { busy: savingOutcome, run: runSaveOutcome } = useSubmitLock();
  const selectedCar = vehicles.find((car) => car.id === selectedCarId);
  const days =
    rentalType === "daily" && rentalStart && rentalEnd
      ? (() => {
          const stamp = (value: string) => Date.parse(`${value}:00+09:00`);
          const hours = (stamp(rentalEnd) - stamp(rentalStart)) / 3_600_000;
          return Number.isFinite(hours) && hours >= 24
            ? { whole: Math.floor(hours / 24), extra: hours % 24 }
            : null;
        })()
      : null;
  const unitPrice = selectedCar ? selectedCar[`price_${rentalType}`] : 0;
  const rentalTotal =
    unitPrice > 0
      ? rentalType === "daily" && days && periodCount === days.whole
        ? Math.round(
            unitPrice * days.whole +
              Math.min(unitPrice, unitPrice * 0.1 * days.extra),
          )
        : unitPrice * periodCount
      : null;
  const availablePlans = insurance?.units[rentalType].plans[ageGroup] ?? [];
  const selectedPlan = availablePlans.find(
    (plan) => plan.name === insurancePlanName,
  );
  const insuranceClass =
    insurance && insuranceClassOf(insurance.ccLimits, selectedCar);
  const premium = selectedPlan
    ? insuranceClass == null
      ? insurancePriceRange(selectedPlan)
      : {
          min: insurancePrice(selectedPlan, insuranceClass),
          max: insurancePrice(selectedPlan, insuranceClass),
        }
    : null;
  const totalMin =
    rentalTotal == null ||
    !insurance ||
    (insurancePlanName !== INSURANCE_NONE && !selectedPlan)
      ? null
      : rentalTotal + (premium?.min ?? 0);
  const totalMax =
    rentalTotal == null ||
    !insurance ||
    (insurancePlanName !== INSURANCE_NONE && !selectedPlan)
      ? null
      : rentalTotal + (premium?.max ?? 0);
  const registeredDeposit = vehicleDeposit(
    customerCar ?? { deposit_amount: null },
  );
  const customerType = requestedType;
  const customerStart = normalizeDateTime(reservation.start_date);
  const customerEnd = normalizeDateTime(
    fields.find((field) => field.label === "반납일시")?.value ?? "",
  );
  const customerDailyDuration =
    customerType === "daily" && customerEnd
      ? (() => {
          const stamp = (value: string) =>
            Date.parse(`${value.slice(0, 10)}T${value.slice(11, 16)}:00+09:00`);
          const hours = (stamp(customerEnd) - stamp(customerStart)) / 3_600_000;
          return Number.isFinite(hours) && hours >= 24
            ? { whole: Math.floor(hours / 24), extra: hours % 24 }
            : null;
        })()
      : null;
  const specialPrice = Number(
    memo
      .match(/월렌트 특별가:\s*([\d,]+)원\s*\/\s*월/)?.[1]
      ?.replaceAll(",", "") ?? "",
  );
  const customerUnitPrice =
    customerType === "monthly" && specialPrice > 0
      ? specialPrice
      : (customerCar?.[`price_${customerType}`] ?? 0);
  const customerRentalTotal =
    customerUnitPrice > 0
      ? customerType === "daily" && customerDailyDuration
        ? Math.round(
            customerUnitPrice * customerDailyDuration.whole +
              Math.min(
                customerUnitPrice,
                customerUnitPrice * 0.1 * customerDailyDuration.extra,
              ),
          )
        : customerUnitPrice * requestedCount
      : null;
  const insuranceSurcharge = insuranceField.match(
    /\(\+([\d,]+)(?:~([\d,]+))?원\)/,
  );
  const customerInsuranceRange = insuranceSurcharge
    ? {
        min: Number(insuranceSurcharge[1].replaceAll(",", "")),
        max: Number(
          (insuranceSurcharge[2] ?? insuranceSurcharge[1]).replaceAll(",", ""),
        ),
      }
    : null;
  const customerTotalMin =
    customerRentalTotal == null ||
    (!!insuranceField &&
      !insuranceField.includes(INSURANCE_NONE) &&
      customerInsuranceRange == null)
      ? null
      : customerRentalTotal + (customerInsuranceRange?.min ?? 0);
  const customerTotalMax =
    customerRentalTotal == null ||
    (!!insuranceField &&
      !insuranceField.includes(INSURANCE_NONE) &&
      customerInsuranceRange == null)
      ? null
      : customerRentalTotal + (customerInsuranceRange?.max ?? 0);
  const unitLabel = (type: RentalType) =>
    type === "daily" ? "일" : type === "weekly" ? "주" : "개월";
  const requestedPeriodLabel = `${requestedCount}${unitLabel(requestedType)}`;
  const currentPeriodLabel = `${periodCount}${unitLabel(rentalType)}`;
  const customerInsuranceLabel = insuranceField || "미선택";
  const currentInsuranceLabel =
    insurancePlanName === INSURANCE_NONE
      ? "선택 안함"
      : premium
        ? `${ageGroup} · ${insurancePlanName} · ${formatAmountRange(premium.min, premium.max)}`
        : insurancePlanName || "선택 전";
  const currentDeposit = Number(depositAmount);
  const validDeposit =
    /^(0|[1-9]\d{0,8})$/.test(depositAmount) &&
    Number(depositAmount) <= 100_000_000;
  const comparisonRows = [
    {
      label: "대여 시작 일시",
      requested: customerStart.replace("T", " ") || "미지정",
      current: rentalStart.replace("T", " ") || "미지정",
      changed: customerStart !== rentalStart,
    },
    {
      label: "반납 일시",
      requested: customerEnd.replace("T", " ") || "미지정",
      current: rentalEnd.replace("T", " ") || "미지정",
      changed: customerEnd !== rentalEnd,
    },
    {
      label: "차량",
      requested: reservation.car_name,
      current: selectedCar?.name ?? "차량 미선택",
      changed: (selectedCar?.name ?? "") !== reservation.car_name,
    },
    {
      label: "렌트 기간",
      requested: requestedPeriodLabel,
      current: currentPeriodLabel,
      changed: requestedPeriodLabel !== currentPeriodLabel,
    },
    {
      label: "약정 거리",
      requested: reservation.package_km || "미지정",
      current: packageKm || "미지정",
      changed: (reservation.package_km || "") !== packageKm,
    },
    {
      label: "대여료",
      requested:
        customerRentalTotal == null
          ? "금액 확인 필요"
          : formatAmount(customerRentalTotal),
      current:
        rentalTotal == null ? "금액 확인 필요" : formatAmount(rentalTotal),
      changed: customerRentalTotal !== rentalTotal,
    },
    {
      label: "자차보험",
      requested: customerInsuranceLabel,
      current: currentInsuranceLabel,
      changed:
        requestedPlan !== insurancePlanName || requestedAgeGroup !== ageGroup,
    },
    {
      label: "보증금",
      requested: formatAmount(registeredDeposit),
      current: validDeposit ? formatAmount(currentDeposit) : "금액 확인 필요",
      changed: currentDeposit !== registeredDeposit,
    },
    {
      label: "예상 합계",
      requested: formatAmountRange(customerTotalMin, customerTotalMax),
      current: formatAmountRange(totalMin, totalMax),
      changed: customerTotalMin !== totalMin || customerTotalMax !== totalMax,
    },
  ];
  const currentMatchesSaved = Boolean(
    savedOutcome &&
    savedOutcome.vehicle_id === selectedCarId &&
    savedOutcome.car_name === selectedCar?.name &&
    savedOutcome.rental_type === rentalType &&
    savedOutcome.period_count === periodCount &&
    savedOutcome.insurance_age === ageGroup &&
    savedOutcome.insurance_plan === (insurancePlanName || "선택 전") &&
    savedOutcome.deposit_amount === currentDeposit &&
    savedOutcome.note === consultationNote &&
    savedOutcome.rental_start === rentalStart &&
    savedOutcome.rental_end === (rentalEnd || null) &&
    savedOutcome.package_km === packageKm &&
    savedOutcome.rental_total === rentalTotal &&
    savedOutcome.insurance_min ===
      (insurancePlanName === INSURANCE_NONE ? 0 : (premium?.min ?? null)) &&
    savedOutcome.insurance_max ===
      (insurancePlanName === INSURANCE_NONE ? 0 : (premium?.max ?? null)) &&
    savedOutcome.total_min === totalMin &&
    savedOutcome.total_max === totalMax,
  );
  const saveOutcome = () =>
    runSaveOutcome(async () => {
      if (!selectedCar || !validDeposit || !rentalStart) {
        toast.error("차량, 대여 시작 일시와 보증금 금액을 확인해주세요.");
        return;
      }
      const outcome = {
        vehicle_id: selectedCar.id,
        car_name: selectedCar.name,
        rental_type: rentalType,
        period_count: periodCount,
        rental_start: rentalStart,
        rental_end: rentalEnd || null,
        package_km: packageKm,
        insurance_age: ageGroup,
        insurance_plan: insurancePlanName || "선택 전",
        rental_total: rentalTotal,
        insurance_min:
          insurancePlanName === INSURANCE_NONE ? 0 : (premium?.min ?? null),
        insurance_max:
          insurancePlanName === INSURANCE_NONE ? 0 : (premium?.max ?? null),
        total_min: totalMin,
        total_max: totalMax,
        deposit_amount: Number(depositAmount),
        note: consultationNote,
      };
      try {
        const result = await saveReservationOutcome(reservation.id, outcome);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setSavedOutcome(result.outcome);
        onOutcomeSaved(result.outcome);
        toast.success("상담 결과를 저장했습니다.");
      } catch {
        toast.error("상담 결과를 저장하지 못했습니다. 다시 시도해주세요.");
      }
    });
  const end = fields.find((f) => f.label === "반납일시");
  const summary = [
    ...(isNewCar
      ? [{ label: "출고 희망 시기", value: reservation.start_date }]
      : []),
    { label: "이용 기간", value: reservation.period },
    { label: "약정 거리", value: reservation.package_km },
    ...fields
      .filter(
        (f) =>
          f !== end &&
          f.label !== "통화 확인 보증금" &&
          f.label !== "통화 확인 메모",
      )
      .map((f) => ({
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
        접수일 {formatKstDateTime(reservation.created_at)}
      </p>
      {!isNewCar && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
          <button
            type="button"
            aria-expanded={calculatorOpen}
            onClick={() => setCalculatorOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">
                상담 요금 계산 및 조건 확정
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-600">
                {selectedCar
                  ? `${selectedCar.name} · ${rentalType === "daily" ? "일" : rentalType === "weekly" ? "주" : "개월"} ${periodCount}`
                  : "차량·기간·보험안을 바꿔 바로 계산"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-right">
                <span className="block text-[10px] font-medium text-blue-700">
                  예상 합계
                </span>
                <span className="block text-sm font-bold text-blue-800">
                  {totalMin == null
                    ? "계산 전"
                    : totalMin === totalMax
                      ? formatWon(totalMin)
                      : `${formatWon(totalMin)}~${formatWon(totalMax)}`}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`size-4 text-blue-700 transition-transform ${calculatorOpen ? "rotate-180" : ""}`}
              />
            </span>
          </button>
          {calculatorOpen && (
            <div className="mt-3 border-t border-blue-100 pt-3">
              <p className="mb-3 text-[11px] text-slate-600">
                선택을 바꾸면 등록된 요금 기준으로 즉시 계산합니다. 상담 안내용
                예상 금액입니다.
              </p>
              <RequestOutcomeComparison
                rows={comparisonRows}
                saved={currentMatchesSaved}
              />
              <p className="mt-2 text-[10px] leading-4 text-slate-500">
                {specialPrice > 0
                  ? "고객 요금은 접수 당시 저장된 월렌트 특가를 반영했습니다."
                  : "고객 대여료는 현재 차량 등록 요금 기준이며, 접수 이후 요금 변경 시 당시 안내 금액과 다를 수 있습니다."}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <label className="text-xs font-semibold text-slate-600">
                  차량
                  <select
                    value={selectedCarId}
                    onChange={(event) => setSelectedCarId(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  >
                    <option value="">차량 선택</option>
                    {vehicles.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  대여 시작 일시
                  <input
                    type="datetime-local"
                    step={1800}
                    value={rentalStart}
                    onChange={(event) => setRentalStart(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  반납 일시
                  <input
                    type="datetime-local"
                    step={1800}
                    value={rentalEnd}
                    onChange={(event) => setRentalEnd(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900"
                  />
                </label>
                <fieldset className="text-xs font-semibold text-slate-600">
                  <legend>렌트 단위</legend>
                  <div className="mt-1.5 grid h-10 grid-cols-3 gap-1">
                    {(
                      [
                        ["daily", "일"],
                        ["weekly", "주"],
                        ["monthly", "개월"],
                      ] as const
                    ).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={rentalType === type}
                        onClick={() => {
                          setRentalType(type);
                          setInsurancePlanName("");
                        }}
                        className={`rounded-lg border text-sm ${rentalType === type ? "border-blue-600 bg-blue-600 font-bold text-white" : "border-slate-200 bg-white text-slate-700"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="text-xs font-semibold text-slate-600">
                  기간 (
                  {rentalType === "daily"
                    ? "일"
                    : rentalType === "weekly"
                      ? "주"
                      : "개월"}
                  )
                  <input
                    type="number"
                    min={1}
                    max={
                      rentalType === "daily"
                        ? 30
                        : rentalType === "weekly"
                          ? 8
                          : 60
                    }
                    value={periodCount}
                    onChange={(event) =>
                      setPeriodCount(
                        Math.min(
                          rentalType === "daily"
                            ? 30
                            : rentalType === "weekly"
                              ? 8
                              : 60,
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      )
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  />
                  <span className="mt-1 flex gap-1">
                    {(rentalType === "daily"
                      ? [1, 3, 7, 14, 30]
                      : rentalType === "weekly"
                        ? [1, 2, 4, 8]
                        : [1, 3, 6, 12, 24]
                    ).map((count) => (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={periodCount === count}
                        onClick={() => setPeriodCount(count)}
                        className={`min-h-7 flex-1 rounded border text-xs ${periodCount === count ? "border-blue-600 bg-white font-bold text-blue-700" : "border-transparent text-slate-500 hover:bg-white"}`}
                      >
                        {count}
                      </button>
                    ))}
                  </span>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  약정 거리
                  <input
                    type="text"
                    maxLength={80}
                    value={packageKm}
                    onChange={(event) => setPackageKm(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  운전자 연령
                  <select
                    value={ageGroup}
                    onChange={(event) => {
                      setAgeGroup(event.target.value as InsuranceAgeGroup);
                      setInsurancePlanName("");
                    }}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  >
                    {INSURANCE_AGE_GROUPS.map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  자차보험
                  <select
                    value={insurancePlanName}
                    onChange={(event) =>
                      setInsurancePlanName(event.target.value)
                    }
                    disabled={!insurance}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-100"
                  >
                    <option value="">보험안 선택</option>
                    <option value={INSURANCE_NONE}>{INSURANCE_NONE}</option>
                    {availablePlans.map((plan) => (
                      <option key={plan.name} value={plan.name}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-white p-2.5 text-sm">
                <span className="text-slate-500">대여료</span>
                <strong className="text-right">
                  {rentalTotal == null
                    ? "요금 확인 필요"
                    : formatWon(rentalTotal)}
                </strong>
                <span className="text-slate-500">자차보험</span>
                <strong className="text-right">
                  {!insurance
                    ? "보험 설정 미등록"
                    : premium
                      ? premium.min === premium.max
                        ? formatWon(premium.min)
                        : `${formatWon(premium.min)}~${formatWon(premium.max)}`
                      : insurancePlanName === INSURANCE_NONE
                        ? "선택 안함"
                        : "선택 없음"}
                </strong>
                <span className="border-t border-slate-100 pt-2 font-bold text-slate-900">
                  예상 합계
                </span>
                <strong className="border-t border-slate-100 pt-2 text-right text-base text-blue-700">
                  {totalMin == null
                    ? "상담 문의"
                    : totalMin === totalMax
                      ? formatWon(totalMin)
                      : `${formatWon(totalMin)}~${formatWon(totalMax)}`}
                </strong>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                표시 금액은 대여료와 선택한 자차보험 기준입니다. 실제 안내 전
                보증금·탁송비·약정거리 초과료 등을 확인해주세요.
              </p>
            </div>
          )}
        </section>
      )}
      {!isNewCar && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">상담 결과 저장</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              초기 요청은 유지하고, 통화 후 합의한 조건을 별도로 기록합니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
            <span className="text-slate-500">확정 차량·기간</span>
            <strong className="text-right text-slate-800">
              {selectedCar
                ? `${selectedCar.name} · ${rentalType === "daily" ? "일" : rentalType === "weekly" ? "주" : "개월"} ${periodCount}`
                : "차량 미선택"}
            </strong>
            <span className="text-slate-500">보험·예상 금액</span>
            <strong className="text-right text-slate-800">
              {insurancePlanName || "보험안 미선택"} ·{" "}
              {totalMin == null
                ? "금액 확인 필요"
                : totalMin === totalMax
                  ? formatWon(totalMin)
                  : `${formatWon(totalMin)}~${formatWon(totalMax)}`}
            </strong>
          </div>
          <div className="grid gap-2 sm:grid-cols-[170px_1fr]">
            <label className="text-xs font-semibold text-slate-600">
              확정 보증금 (원)
              <input
                type="number"
                min={0}
                max={100_000_000}
                step={10000}
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              통화 확인 내용
              <input
                type="text"
                maxLength={1000}
                value={consultationNote}
                onChange={(event) => setConsultationNote(event.target.value)}
                placeholder="예: 보증금 30만원으로 안내, 탁송 장소 확인"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-normal text-slate-900"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
            {savedOutcome ? (
              <p className="text-[11px] text-emerald-700">
                최근 상담 결과 저장됨
                {savedOutcome.updated_at
                  ? ` · ${formatKstDateTime(savedOutcome.updated_at)}`
                  : ""}
              </p>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={savingOutcome || !selectedCar || !validDeposit}
              onClick={saveOutcome}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingOutcome ? "저장 중…" : "상담 결과 저장"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
