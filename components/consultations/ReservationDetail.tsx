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
  type VehicleOption,
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
import {
  saveReservationOutcome,
  saveReservationStaffRequest,
} from "@/lib/records";
import type {
  ReservationConsultationResult,
  ReservationStaffRequest,
} from "@/lib/domain/consultation-result";
import { useSubmitLock } from "@/lib/hooks/use-submit-lock";
import { StatusBadge } from "@/components/shared/feedback";
import { formatKstDateTime } from "@/lib/format";
import { isQuickRentalConsultation } from "@/lib/consultation";

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
  const vehicle: VehicleOption[] = [],
    fields: { label: string; value: string }[] = [],
    memo: string[] = [];
  for (const item of options ?? []) {
    if (item.startsWith("상담 결과: ")) continue;
    if (item === "접수 경로: 빠른 렌트 상담") continue;
    const vehicleOption = VEHICLE_OPTIONS.find((option) => option === item);
    if (vehicleOption) {
      vehicle.push(vehicleOption);
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

function addRentalPeriod(
  start: string,
  type: RentalType,
  count: number,
) {
  const match = start.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match || !Number.isInteger(count) || count < 1) return "";
  const [, year, month, day, hour, minute] = match;
  const y = Number(year);
  const m = Number(month) - 1;
  const d = Number(day);
  let result: Date;
  if (type === "monthly") {
    const targetMonth = m + count;
    const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
    result = new Date(
      Date.UTC(y, targetMonth, Math.min(d, lastDay), Number(hour), Number(minute)),
    );
  } else {
    const addDays = count * (type === "weekly" ? 7 : 1);
    result = new Date(Date.UTC(y, m, d + addDays, Number(hour), Number(minute)));
  }
  return result.toISOString().slice(0, 16);
}

export function ReservationDetail({
  reservation,
  vehicles = [],
  insurance = null,
  outcome = null,
  staffRequestRecord = null,
  onOutcomeSaved,
  onStaffRequestSaved,
}: {
  reservation: Reservation;
  vehicles?: Vehicle[];
  insurance?: InsuranceConfig | null;
  outcome?: ReservationConsultationResult | null;
  staffRequestRecord?: ReservationStaffRequest | null;
  onOutcomeSaved: (result: ReservationConsultationResult) => void;
  onStaffRequestSaved: (request: ReservationStaffRequest) => void;
}) {
  const { vehicle, fields, memo } = splitOptions(reservation.options);
  const isNewCar = reservation.car_name.startsWith("[신차]");
  const isQuickConsultation = isQuickRentalConsultation(reservation);
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
    outcome?.insurance_plan && outcome.insurance_plan !== "선택 전"
      ? outcome.insurance_plan
      : requestedPlan;
  const [insurancePlanName, setInsurancePlanName] = useState(initialPlan);
  const [calculatorOpen, setCalculatorOpen] = useState(true);
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
  const [staffRequest, setStaffRequest] = useState(
    staffRequestRecord?.staff_request ?? "",
  );
  const [savedStaffRequest, setSavedStaffRequest] =
    useState(staffRequestRecord);
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
  const [selectedVehicleOptions, setSelectedVehicleOptions] = useState<
    VehicleOption[]
  >(() => outcome?.vehicle_options ?? vehicle);
  const updateRentalStart = (value: string) => {
    setRentalStart(value);
    setRentalEnd(addRentalPeriod(value, rentalType, periodCount));
  };
  const updateRentalType = (value: RentalType) => {
    setRentalType(value);
    setInsurancePlanName("");
    setRentalEnd(addRentalPeriod(rentalStart, value, periodCount));
  };
  const updatePeriodCount = (value: number) => {
    const max = rentalType === "daily" ? 30 : rentalType === "weekly" ? 8 : 60;
    const count = Math.min(max, Math.max(1, value || 1));
    setPeriodCount(count);
    setRentalEnd(addRentalPeriod(rentalStart, rentalType, count));
  };
  const { busy: savingOutcome, run: runSaveOutcome } = useSubmitLock();
  const { busy: savingStaffRequest, run: runSaveStaffRequest } =
    useSubmitLock();
  const selectedCar = vehicles.find((car) => car.id === selectedCarId);
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
  const useRequestedInsurancePrice = Boolean(
    !insurancePlanName &&
      customerInsuranceRange &&
      insuranceField &&
      !insuranceField.includes(INSURANCE_NONE) &&
      rentalType === requestedType &&
      ageGroup === requestedAgeGroup &&
      selectedCar &&
      customerCar?.id === selectedCar.id,
  );
  const premium = selectedPlan
    ? insuranceClass == null
      ? insurancePriceRange(selectedPlan)
      : {
          min: insurancePrice(selectedPlan, insuranceClass),
          max: insurancePrice(selectedPlan, insuranceClass),
        }
    : useRequestedInsurancePrice
      ? customerInsuranceRange
      : null;
  const totalMin =
    rentalTotal == null ||
    (insurancePlanName !== INSURANCE_NONE &&
      !selectedPlan &&
      !useRequestedInsurancePrice)
      ? null
      : rentalTotal + (premium?.min ?? 0);
  const totalMax =
    rentalTotal == null ||
    (insurancePlanName !== INSURANCE_NONE &&
      !selectedPlan &&
      !useRequestedInsurancePrice)
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
        ? `${ageGroup} · ${insurancePlanName || "고객 요청 보험"} · ${formatAmountRange(
            premium.min,
            premium.max,
          )}${useRequestedInsurancePrice ? " (고객 요청 기준)" : ""}`
        : insurancePlanName || "선택 전";
  const currentDeposit = Number(depositAmount);
  const validDeposit =
    /^(0|[1-9]\d{0,8})$/.test(depositAmount) &&
    Number(depositAmount) <= 100_000_000;
  const comparisonRows = [
    {
      label: "차량",
      requested: reservation.car_name,
      current: selectedCar?.name ?? "차량 미선택",
      changed: (selectedCar?.name ?? "") !== reservation.car_name,
    },
    {
      label: "대여 시작 일시",
      requested: customerStart.replace("T", " ") || "미지정",
      current: rentalStart.replace("T", " ") || "미지정",
      changed: customerStart !== rentalStart,
    },
    {
      label: "렌트 기간",
      requested: requestedPeriodLabel,
      current: currentPeriodLabel,
      changed: requestedPeriodLabel !== currentPeriodLabel,
    },
    {
      label: "반납 일시",
      requested: customerEnd.replace("T", " ") || "미지정",
      current: rentalEnd.replace("T", " ") || "미지정",
      changed: customerEnd !== rentalEnd,
    },
    {
      label: "희망 옵션",
      requested: vehicle.length ? vehicle.join(" · ") : "미지정",
      current: selectedVehicleOptions.length
        ? selectedVehicleOptions.join(" · ")
        : "미선택",
      changed:
        [...vehicle].sort().join("\u0000") !==
        [...selectedVehicleOptions].sort().join("\u0000"),
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
      current:
        totalMin == null
          ? rentalTotal == null
            ? "금액 확인 필요"
            : `${formatAmount(rentalTotal)} (보험료 미포함)`
          : formatAmountRange(totalMin, totalMax),
      changed: customerTotalMin !== totalMin || customerTotalMax !== totalMax,
    },
  ];
  const staffRequestSummary = [
    `[상담 결과 요약 · ${formatKstDateTime(new Date())}]`,
    ...comparisonRows.flatMap((row) => [
      `• ${row.label}`,
      `  고객 요청: ${row.requested}`,
      `  상담 결과: ${row.current}`,
    ]),
    "• 상담 특이사항",
    `  ${consultationNote.trim() || "없음"}`,
  ].join("\n");
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
    [...(savedOutcome.vehicle_options ?? vehicle)].sort().join("\u0000") ===
      [...selectedVehicleOptions].sort().join("\u0000") &&
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
      const appendedStaffRequest = `${staffRequest.trim()}${staffRequest.trim() ? "\n\n" : ""}${staffRequestSummary}`;
      if (appendedStaffRequest.length > 5000) {
        toast.error("담당자 처리 요청사항이 길어졌습니다. 내용을 줄인 뒤 저장해주세요.");
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
        vehicle_options: selectedVehicleOptions,
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
        setStaffRequest(appendedStaffRequest);
        try {
          const staffRequestResult = await saveReservationStaffRequest(
            reservation.id,
            appendedStaffRequest,
          );
          if ("error" in staffRequestResult) {
            toast.error(
              "상담 결과는 저장했지만 담당자 요청사항 요약은 저장하지 못했습니다. 담당자 저장 버튼으로 다시 저장해주세요.",
            );
            return;
          }
          setSavedStaffRequest(staffRequestResult.staffRequest);
          onStaffRequestSaved(staffRequestResult.staffRequest);
        } catch {
          toast.error(
            "상담 결과는 저장했지만 담당자 요청사항 요약은 저장하지 못했습니다. 담당자 저장 버튼으로 다시 저장해주세요.",
          );
          return;
        }
        toast.success("상담 결과와 담당자 요청사항 요약을 저장했습니다.");
      } catch {
        toast.error("상담 결과를 저장하지 못했습니다. 다시 시도해주세요.");
      }
    });
  const saveStaffRequest = () =>
    runSaveStaffRequest(async () => {
      try {
        const result = await saveReservationStaffRequest(
          reservation.id,
          staffRequest,
        );
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setSavedStaffRequest(result.staffRequest);
        onStaffRequestSaved(result.staffRequest);
        toast.success("담당자 처리 요청사항을 저장했습니다.");
      } catch {
        toast.error("담당자 처리 요청사항을 저장하지 못했습니다.");
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
  const renderOutcomeInput = (row: (typeof comparisonRows)[number]) => {
    const inputClass =
      "h-9 min-w-0 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900";
    switch (row.label) {
      case "대여 시작 일시":
        return (
          <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <input
              aria-label="상담 결과 대여 시작 날짜"
              type="date"
              value={rentalStart.slice(0, 10)}
              onChange={(event) =>
                updateRentalStart(
                  event.target.value
                    ? `${event.target.value}T${rentalStart.slice(11, 16) || "00:00"}`
                    : "",
                )
              }
              className={`${inputClass} max-w-full`}
            />
            <input
              aria-label="상담 결과 대여 시작 시간"
              type="time"
              step={1800}
              value={rentalStart.slice(11, 16)}
              onChange={(event) =>
                updateRentalStart(
                  rentalStart
                    ? `${rentalStart.slice(0, 10)}T${event.target.value}`
                    : "",
                )
              }
              className={`${inputClass} max-w-full`}
            />
          </div>
        );
      case "반납 일시":
        return (
          <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <input
              aria-label="상담 결과 반납 날짜"
              type="date"
              value={rentalEnd.slice(0, 10)}
              onChange={(event) =>
                setRentalEnd(
                  event.target.value
                    ? `${event.target.value}T${rentalEnd.slice(11, 16) || "00:00"}`
                    : "",
                )
              }
              className={`${inputClass} max-w-full`}
            />
            <input
              aria-label="상담 결과 반납 시간"
              type="time"
              step={1800}
              value={rentalEnd.slice(11, 16)}
              onChange={(event) =>
                setRentalEnd(
                  rentalEnd
                    ? `${rentalEnd.slice(0, 10)}T${event.target.value}`
                    : "",
                )
              }
              className={`${inputClass} max-w-full`}
            />
          </div>
        );
      case "차량":
        return (
          <select
            aria-label="상담 결과 차량"
            value={selectedCarId}
            onChange={(event) => setSelectedCarId(event.target.value)}
            className={inputClass}
          >
            <option value="">차량 선택</option>
            {vehicles.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name}
              </option>
            ))}
          </select>
        );
      case "희망 옵션":
        return (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {VEHICLE_OPTIONS.map((option) => {
              const selected = selectedVehicleOptions.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setSelectedVehicleOptions((current) =>
                      selected
                        ? current.filter((item) => item !== option)
                        : [...current, option],
                    )
                  }
                  className={`min-h-8 rounded border px-1 py-1 text-[10px] leading-3 ${selected ? "border-blue-500 bg-blue-50 font-semibold text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        );
      case "렌트 기간":
        return (
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_72px] gap-1">
            <select
              aria-label="상담 결과 렌트 단위"
              value={rentalType}
              onChange={(event) =>
                updateRentalType(event.target.value as RentalType)
              }
              className={inputClass}
            >
              <option value="daily">일</option>
              <option value="weekly">주</option>
              <option value="monthly">개월</option>
            </select>
            <input
              aria-label="상담 결과 기간 수"
              type="number"
              min={1}
              max={rentalType === "daily" ? 30 : rentalType === "weekly" ? 8 : 60}
              value={periodCount}
              onChange={(event) => updatePeriodCount(Number(event.target.value))}
              className={inputClass}
            />
          </div>
        );
      case "약정 거리":
        return (
          <input
            aria-label="상담 결과 약정 거리"
            value={packageKm}
            maxLength={80}
            onChange={(event) => setPackageKm(event.target.value)}
            className={inputClass}
          />
        );
      case "자차보험":
        return (
          <div className="grid min-w-0 gap-1">
            <select
              aria-label="상담 결과 운전자 연령"
              value={ageGroup}
              onChange={(event) => {
                setAgeGroup(event.target.value as InsuranceAgeGroup);
                setInsurancePlanName("");
              }}
              className={inputClass}
            >
              {INSURANCE_AGE_GROUPS.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
            <select
              aria-label="상담 결과 자차보험"
              value={insurancePlanName}
              onChange={(event) => setInsurancePlanName(event.target.value)}
              disabled={!insurance}
              className={`${inputClass} disabled:bg-slate-100`}
            >
              <option value="">
                {useRequestedInsurancePrice
                  ? "고객 요청 보험료 적용"
                  : "보험안 선택"}
              </option>
              <option value={INSURANCE_NONE}>{INSURANCE_NONE}</option>
              {availablePlans.map((plan) => (
                <option key={plan.name} value={plan.name}>
                  {plan.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500">
              {premium
                ? formatAmountRange(premium.min, premium.max)
                : insurancePlanName === INSURANCE_NONE
                  ? "보험 미선택"
                  : "보험료 확인 필요"}
            </span>
          </div>
        );
      case "보증금":
        return (
          <input
            aria-label="상담 결과 보증금"
            type="number"
            min={0}
            max={100_000_000}
            step={10000}
            value={depositAmount}
            onChange={(event) => setDepositAmount(event.target.value)}
            className={inputClass}
          />
        );
      default:
        return (
          <p className="min-h-9 rounded-md bg-slate-50 px-2 py-2 text-xs font-bold text-slate-800">
            {row.current}
          </p>
        );
    }
  };
  return (
    <div className="space-y-2 sm:space-y-4">
      <p className="px-1 text-xs text-slate-500 sm:px-0">
        접수일 {formatKstDateTime(reservation.created_at)}
      </p>
      <section className="rounded-lg border border-slate-200 p-2 sm:rounded-xl sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">희망 차량</p>
            <p className="mt-1 break-keep text-base font-bold text-slate-900">
              {reservation.car_name}
            </p>
            {isQuickConsultation && (
              <p className="mt-1 text-xs font-semibold text-blue-700">
                빠른 렌트 상담 · 입력한 차종
              </p>
            )}
          </div>
          <StatusBadge tone={reservation.status}>
            {RESERVATION_LABELS[reservation.status]}
          </StatusBadge>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-sm sm:mt-4">
          {summary.map((f) => (
            <div
              key={f.label}
              className="bg-slate-50 px-2 py-2 odd:last:col-span-2 sm:px-3 sm:py-2.5"
            >
              <dt className="text-xs text-slate-500">{f.label}</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {!isNewCar && (
        <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-2 sm:rounded-xl sm:p-3">
          {isQuickConsultation && !selectedCar && (
            <p className="mb-2 text-xs text-blue-800">
              고객이 차종을 직접 입력했습니다. 요금을 계산하려면 아래에서 등록 차량을 선택해주세요.
            </p>
          )}
          <button
            type="button"
            aria-expanded={calculatorOpen}
            onClick={() => setCalculatorOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">
                고객 요청과 상담 결과
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-600">
                {selectedCar
                  ? `${selectedCar.name} · ${rentalType === "daily" ? "일" : rentalType === "weekly" ? "주" : "개월"} ${periodCount}`
                  : "상담 조건을 바로 선택하고 금액을 확인하세요"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-right">
                <span className="block text-[10px] font-medium text-blue-700">
                  예상 합계
                </span>
                <span className="block text-sm font-bold text-blue-800">
                  {totalMin == null
                    ? rentalTotal == null
                      ? "계산 전"
                      : `${formatWon(rentalTotal)} · 보험료 미포함`
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
            <div className="mt-2 border-t border-blue-100 pt-2 sm:mt-3 sm:pt-3">
              <div className="mb-2 grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div className="rounded-md bg-white px-2 py-2 text-slate-600">
                  고객 요청
                </div>
                <div className="rounded-md bg-blue-100 px-2 py-2 text-blue-800">
                  상담 결과 · 변경 즉시 계산
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2">
                {comparisonRows.map((row) => (
                  <div
                    key={row.label}
                    className="col-span-2 grid min-w-0 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2 border-b border-blue-100 py-2 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500">{row.label}</p>
                      <p className="mt-1 break-words text-xs font-medium leading-5 text-slate-800">
                        {row.requested}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 flex min-h-3 items-center justify-between gap-1 text-[10px] text-slate-500">
                        <span className="truncate">{row.label}</span>
                        {row.changed && (
                          <span className="shrink-0 font-bold text-amber-700">
                            변경
                          </span>
                        )}
                      </p>
                      {renderOutcomeInput(row)}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">
                {specialPrice > 0
                  ? "고객 요금은 접수 당시 저장된 월렌트 특가를 반영했습니다."
                  : "고객 대여료는 현재 차량 등록 요금 기준이며, 접수 이후 요금 변경 시 당시 안내 금액과 다를 수 있습니다."}
                {" "}표시 합계는 대여료와 자차보험 기준이며 보증금·탁송비·초과료는 별도로 확인해주세요.
              </p>
              <div className="mt-3 border-t border-blue-100 pt-3">
                <label className="block text-xs font-semibold text-slate-600">
                  상담 특이사항
                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={consultationNote}
                    onChange={(event) => setConsultationNote(event.target.value)}
                    placeholder="통화 중 확인하거나 합의한 특이사항을 기록하세요."
                    className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-normal text-slate-900"
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 pt-2">
                {savedOutcome ? (
                  <p className="text-[10px] text-emerald-700">
                    {currentMatchesSaved ? "상담 결과 저장됨" : "저장 전 변경사항"}
                    {savedOutcome.updated_at
                      ? ` · ${formatKstDateTime(savedOutcome.updated_at)}`
                      : ""}
                  </p>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  disabled={
                    savingOutcome || savingStaffRequest || !selectedCar || !validDeposit
                  }
                  onClick={saveOutcome}
                  className="ml-auto rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingOutcome ? "저장 중…" : "상담 결과 저장"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      <section>
        <h3 className="text-sm font-semibold text-slate-900">고객 요청 메모</h3>
        <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2 text-sm leading-6 text-slate-700 sm:p-3">
          {memo || <span className="text-slate-500">작성한 메모 없음</span>}
        </p>
      </section>
      {!isNewCar && (
        <section>
          <label className="block text-sm font-semibold text-slate-900">
            담당자 처리 요청사항
            <textarea
              maxLength={5000}
              rows={3}
              value={staffRequest}
              onChange={(event) => setStaffRequest(event.target.value)}
              placeholder="담당자가 후속으로 확인하거나 처리할 내용을 적어주세요."
              className="mt-2 w-full resize-y rounded-lg border border-slate-200 p-2 text-sm font-normal text-slate-900 sm:p-3"
            />
          </label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {savedStaffRequest ? (
              <p className="text-[10px] text-emerald-700">
                {savedStaffRequest.staff_request === staffRequest
                  ? "담당자 요청 저장됨"
                  : "저장 전 변경사항"}
              </p>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={savingStaffRequest || savingOutcome}
              onClick={saveStaffRequest}
              className="ml-auto rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingStaffRequest
                ? "저장 중…"
                : "담당자 처리 요청 저장"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
