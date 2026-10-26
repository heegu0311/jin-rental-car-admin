"use client";

import {
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  Check,
  ClipboardCopy,
  Edit2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { INCLUDED_KM_MAX, INSURANCE_LIMITS } from "@/lib/domain/contracts";
import {
  createVehicleSheetColumns,
  isMultiCellPaste,
  parseClipboardGrid,
  parseSheetCell,
  toClipboardGrid,
  type VehicleSheetColumn,
  type VehicleSheetKey,
} from "@/lib/domain/vehicle-sheet";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Car, Category } from "./types";

const NO_CATEGORY = "__none__";

const COLUMNS = createVehicleSheetColumns({
  price: INSURANCE_LIMITS.price,
  cc: INSURANCE_LIMITS.cc,
  km: INCLUDED_KM_MAX,
});

type DbColumn = Exclude<VehicleSheetKey, "category"> | "category_id";
export type VehicleSheetPatch = Partial<
  Record<DbColumn, string | number | null>
>;

const dbColumn = (key: VehicleSheetKey): DbColumn =>
  key === "category" ? "category_id" : key;

function baseValue(car: Car, key: VehicleSheetKey, categories: Category[]) {
  const n = (v: number | null | undefined) => (v == null ? "" : String(v));
  switch (key) {
    case "category":
      return categories.find((c) => c.id === car.category_id)?.name ?? "";
    case "year":
      return car.year;
    case "seats":
      return n(car.seats);
    case "price_daily":
      return n(car.pricePolicy.daily);
    case "price_weekly":
      return n(car.pricePolicy.weekly);
    case "price_monthly":
      return n(car.pricePolicy.monthly);
    case "displacement_cc":
    case "extra_km_fee":
    case "km_daily":
    case "km_weekly":
    case "km_monthly":
      return n(car[key]);
    default:
      return car[key] ?? "";
  }
}

/** 저장된 패치를 화면 상태(Car)에 반영한다. */
export function applyVehiclePatch(
  car: Car,
  patch: VehicleSheetPatch,
  categories: Category[],
): Car {
  const next: Car = { ...car, pricePolicy: { ...car.pricePolicy } };
  for (const [column, value] of Object.entries(patch) as [
    DbColumn,
    string | number | null,
  ][]) {
    switch (column) {
      case "category_id":
        next.category_id = (value as string | null) ?? "";
        next.type = categories.find((c) => c.id === value)?.name ?? next.type;
        break;
      case "year":
        next.year = String(value);
        break;
      case "price_daily":
        next.pricePolicy.daily = value as number;
        break;
      case "price_weekly":
        next.pricePolicy.weekly = value as number;
        break;
      case "price_monthly":
        next.pricePolicy.monthly = value as number;
        next.price = String(value);
        break;
      case "seats":
        next.seats = value as number;
        break;
      case "displacement_cc":
      case "extra_km_fee":
      case "km_daily":
      case "km_weekly":
      case "km_monthly":
        next[column] = value as number | null;
        break;
      default:
        next[column] = (value as string) ?? "";
    }
  }
  return next;
}

type RowState = "saving" | "saved" | "error";
const omit = (record: Record<string, string>, id: string) => {
  const next = { ...record };
  delete next[id];
  return next;
};
const cellId = (carId: string, key: VehicleSheetKey) => `${carId}:${key}`;

interface VehicleSheetProps {
  cars: Car[];
  categories: Category[];
  onPatch: (id: string, patch: VehicleSheetPatch) => Promise<void>;
  onEdit: (car: Car) => void;
}

export function VehicleSheet({
  cars,
  categories,
  onPatch,
  onEdit,
}: VehicleSheetProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const tableRef = useRef<HTMLTableElement>(null);
  /** 같은 행의 저장 요청을 순서대로 처리해 중복·역순 저장을 막는다. */
  const queues = useRef(new Map<string, Promise<void>>());
  /** 이미 저장 요청한 셀 값. 붙여넣기·Enter 뒤 blur가 같은 값을 다시 보내지 않게 한다. */
  const submitted = useRef(new Map<string, string>());

  /** 카테고리 이름을 ID로 바꾸고, 나머지는 공통 규칙으로 검증한다. */
  const parse = (column: VehicleSheetColumn, raw: string) => {
    const result = parseSheetCell(column, raw);
    if (!result.ok || column.kind !== "category") return result;
    if (!result.value) return { ok: true as const, value: null };
    const found = categories.find((c) => c.name === result.value);
    return found
      ? { ok: true as const, value: found.id }
      : {
          ok: false as const,
          error: `등록된 카테고리가 아닙니다: ${result.value}`,
        };
  };

  const saveRow = (
    car: Car,
    values: Partial<Record<VehicleSheetKey, string>>,
  ) => {
    const patch: VehicleSheetPatch = {};
    const nextErrors: Record<string, string> = {};
    const cleared: string[] = [];
    for (const column of COLUMNS) {
      const raw = values[column.key];
      if (raw === undefined) continue;
      const id = cellId(car.id, column.key);
      submitted.current.set(id, raw);
      const result = parse(column, raw);
      if (!result.ok) {
        nextErrors[id] = result.error;
        continue;
      }
      cleared.push(id);
      const current = parse(column, baseValue(car, column.key, categories));
      if (current.ok && current.value === result.value) {
        setDrafts((prev) => omit(prev, id));
        continue;
      }
      patch[dbColumn(column.key)] = result.value;
    }
    setErrors((prev) => {
      const next = { ...prev, ...nextErrors };
      for (const id of cleared) delete next[id];
      return next;
    });
    if (!Object.keys(patch).length) return;

    setRowStates((s) => ({ ...s, [car.id]: "saving" }));
    const previous = queues.current.get(car.id) ?? Promise.resolve();
    const task = previous.then(async () => {
      try {
        await onPatch(car.id, patch);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const column of COLUMNS) {
            const id = cellId(car.id, column.key);
            if (
              dbColumn(column.key) in patch &&
              next[id] === values[column.key]
            )
              delete next[id];
          }
          return next;
        });
        setRowStates((s) => ({ ...s, [car.id]: "saved" }));
      } catch (error) {
        for (const key of Object.keys(values))
          submitted.current.delete(cellId(car.id, key as VehicleSheetKey));
        setRowStates((s) => ({ ...s, [car.id]: "error" }));
        toast.error(
          `${car.name}: ${error instanceof Error ? error.message : "저장하지 못했습니다."}`,
        );
      }
    });
    queues.current.set(car.id, task);
  };

  const commitCell = (car: Car, key: VehicleSheetKey) => {
    const id = cellId(car.id, key);
    const raw = drafts[id];
    if (raw !== undefined && submitted.current.get(id) !== raw)
      saveRow(car, { [key]: raw });
  };

  const focusCell = (row: number, col: number) => {
    const target = tableRef.current?.querySelector<HTMLElement>(
      `[data-cell="${row}:${col}"]`,
    );
    target?.focus();
    return Boolean(target);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    car: Car,
    row: number,
    col: number,
  ) => {
    const key = COLUMNS[col].key;
    if (event.key === "Escape") {
      setDrafts((prev) => omit(prev, cellId(car.id, key)));
      setErrors((prev) => omit(prev, cellId(car.id, key)));
      return;
    }
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      // 이동하면 blur에서 저장된다. 끝 행이면 포커스가 남으므로 직접 저장한다.
      if (!focusCell(event.shiftKey ? row - 1 : row + 1, col))
        commitCell(car, key);
    }
  };

  const handlePaste = (
    event: ClipboardEvent<HTMLElement>,
    row: number,
    col: number,
  ) => {
    const text = event.clipboardData.getData("text/plain");
    if (!isMultiCellPaste(text)) return;
    event.preventDefault();
    const grid = parseClipboardGrid(text.replace(/\r?\n$/, ""));
    let skipped = 0;
    const nextDrafts: Record<string, string> = {};
    const rowsToSave: [Car, Partial<Record<VehicleSheetKey, string>>][] = [];
    grid.forEach((cells, r) => {
      const car = cars[row + r];
      if (!car) {
        skipped += 1;
        return;
      }
      const values: Partial<Record<VehicleSheetKey, string>> = {};
      cells.forEach((value, c) => {
        const column = COLUMNS[col + c];
        if (!column) return;
        values[column.key] = value;
        nextDrafts[cellId(car.id, column.key)] = value;
      });
      rowsToSave.push([car, values]);
    });
    setDrafts((prev) => ({ ...prev, ...nextDrafts }));
    rowsToSave.forEach(([car, values]) => saveRow(car, values));
    if (skipped)
      toast.warning(
        `표 아래로 넘친 ${skipped}행은 붙여넣지 않았습니다. 새 차량은 '새 차량 등록'으로 추가해주세요.`,
      );
  };

  const copyAll = async () => {
    const rows = [
      COLUMNS.map((c) => c.label),
      ...cars.map((car) =>
        COLUMNS.map((c) => baseValue(car, c.key, categories)),
      ),
    ];
    try {
      await navigator.clipboard.writeText(toClipboardGrid(rows));
      toast.success(`${cars.length}개 차량을 표 형식으로 복사했습니다.`);
    } catch {
      toast.error(
        "클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해주세요.",
      );
    }
  };

  if (cars.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">등록된 차량이 없습니다.</p>
      </div>
    );
  }

  const pendingErrors = Object.keys(errors).length;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">표 편집</p>
          <p className="mt-1 text-xs text-slate-500">
            셀을 수정하고 다른 칸으로 이동하거나 Enter를 누르면 바로 저장됩니다.
            엑셀·구글 시트에서 여러 칸을 복사해 시작 셀에 붙여넣을 수 있습니다.
            Esc는 저장 전 입력을 취소합니다.
          </p>
          {pendingErrors > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
              <AlertCircle size={13} />
              저장되지 않은 잘못된 입력 {pendingErrors}칸이 있습니다. 빨간 칸에
              마우스를 올리면 사유가 표시됩니다.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ClipboardCopy size={15} />
          현재 목록 복사
        </button>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table
          ref={tableRef}
          className="border-separate border-spacing-0 text-left text-sm"
        >
          <caption className="sr-only">
            차량 모델 정보를 셀 단위로 수정하는 표
          </caption>
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 w-12 min-w-12 max-w-12 whitespace-nowrap border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[11px] font-bold text-slate-500">
                저장
              </th>
              {COLUMNS.map((column, c) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{ minWidth: column.width }}
                  className={cn(
                    "border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-[11px] font-bold whitespace-nowrap text-slate-500",
                    c === 0 && "sticky left-12 z-30",
                  )}
                >
                  {column.label}
                  {!column.optional &&
                    column.kind !== "category" &&
                    !column.emptyAsZero && (
                      <span className="text-red-500"> *</span>
                    )}
                </th>
              ))}
              <th className="border-b border-slate-200 bg-slate-100 px-2 py-2 text-[11px] font-bold text-slate-500">
                상세
              </th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car, r) => {
              const state = rowStates[car.id];
              return (
                <tr key={car.id} className="group">
                  <td className="sticky left-0 z-10 w-12 min-w-12 max-w-12 border-b border-r border-slate-100 bg-white px-2 text-center">
                    {state === "saving" ? (
                      <Loader2
                        size={14}
                        className="mx-auto animate-spin text-blue-500"
                        aria-label="저장 중"
                      />
                    ) : state === "saved" ? (
                      <Check
                        size={14}
                        className="mx-auto text-emerald-600"
                        aria-label="저장됨"
                      />
                    ) : state === "error" ? (
                      <AlertCircle
                        size={14}
                        className="mx-auto text-red-500"
                        aria-label="저장 실패"
                      />
                    ) : null}
                  </td>
                  {COLUMNS.map((column, c) => {
                    const id = cellId(car.id, column.key);
                    const draft = drafts[id];
                    const value =
                      draft ?? baseValue(car, column.key, categories);
                    const error = errors[id];
                    const dirty = draft !== undefined;
                    const handlers = {
                      onKeyDown: (e: KeyboardEvent<HTMLElement>) =>
                        handleKeyDown(e, car, r, c),
                      onPaste: (e: ClipboardEvent<HTMLElement>) =>
                        handlePaste(e, r, c),
                    };
                    const common = {
                      "data-cell": `${r}:${c}`,
                      "aria-label": `${car.name} ${column.label}`,
                      "aria-invalid": Boolean(error),
                      title: error,
                      className: cn(
                        "h-9 w-full bg-transparent px-2 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500",
                        column.kind === "int" && "text-right tabular-nums",
                        dirty && "bg-amber-50",
                        error && "bg-red-50 ring-1 ring-inset ring-red-400",
                      ),
                    };
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "border-b border-r border-slate-100 bg-white p-0 group-hover:bg-slate-50",
                          c === 0 && "sticky left-12 z-10",
                        )}
                      >
                        {column.kind === "category" ? (
                          <div
                            onKeyDown={(e) => {
                              // 열린 목록 안의 키 입력은 셀 이동으로 처리하지 않는다.
                              if (
                                e.target === e.currentTarget.firstElementChild
                              )
                                handlers.onKeyDown(e);
                            }}
                            onPaste={handlers.onPaste}
                          >
                            <Select
                              value={value || NO_CATEGORY}
                              onValueChange={(next) =>
                                saveRow(car, {
                                  [column.key]:
                                    next === NO_CATEGORY ? "" : next,
                                })
                              }
                            >
                              <SelectTrigger
                                {...common}
                                className={cn(
                                  common.className,
                                  "rounded-none border-0 shadow-none hover:border-0 data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-blue-500",
                                )}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_CATEGORY}>
                                  미지정
                                </SelectItem>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                                {value &&
                                  !categories.some(
                                    (cat) => cat.name === value,
                                  ) && (
                                    <SelectItem value={value}>
                                      {value}
                                    </SelectItem>
                                  )}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <input
                            {...common}
                            {...handlers}
                            type="text"
                            inputMode={
                              column.kind === "int" ? "numeric" : undefined
                            }
                            value={value}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [id]: e.target.value,
                              }))
                            }
                            onBlur={() => commitCell(car, column.key)}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-slate-100 bg-white px-2 text-center">
                    <button
                      type="button"
                      aria-label={`${car.name} 상세 수정`}
                      onClick={() => onEdit(car)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
