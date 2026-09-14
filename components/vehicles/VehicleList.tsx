"use client";

import { useState } from "react";
import type { Car } from "./types";
import { VehicleImage } from "./VehicleImage";
import type { VehicleStatus } from "@/lib/domain/contracts";
import { VEHICLE_LABELS } from "@/lib/domain/contracts";
import {
  CheckSquare2,
  Edit2,
  ExternalLink,
  Hash,
  Loader2,
  Trash2,
} from "lucide-react";

const VEHICLE_STATUS_OPTIONS = Object.entries(VEHICLE_LABELS) as [
  VehicleStatus,
  string,
][];

interface VehicleListProps {
  cars: Car[];
  viewMode: "grid" | "table";
  onEdit: (car: Car) => void;
  onDelete: (id: string) => void;
  onBulkStatusChange: (
    carIds: string[],
    status: VehicleStatus,
  ) => Promise<boolean>;
  bulkUpdating: boolean;
}

export function VehicleList({
  cars,
  viewMode,
  onEdit,
  onDelete,
  onBulkStatusChange,
  bulkUpdating,
}: VehicleListProps) {
  const [selection, setSelection] = useState({
    scope: "",
    ids: [] as string[],
  });
  const [bulkStatus, setBulkStatus] = useState<VehicleStatus>("available");
  const visibleIds = cars.map((car) => car.id);
  const selectionScope = visibleIds.join(":");
  const visibleSelectedIds =
    selection.scope === selectionScope ? selection.ids : [];
  const selectedSet = new Set(visibleSelectedIds);
  const selectedUnitCount = cars.reduce(
    (total, car) =>
      selectedSet.has(car.id) ? total + (car.unitCount || 0) : total,
    0,
  );
  const allSelected =
    cars.length > 0 && visibleSelectedIds.length === cars.length;

  const toggleAll = () => {
    setSelection({ scope: selectionScope, ids: allSelected ? [] : visibleIds });
  };

  const toggleCar = (id: string) => {
    setSelection((current) => {
      const ids = current.scope === selectionScope ? current.ids : [];
      return {
        scope: selectionScope,
        ids: ids.includes(id)
          ? ids.filter((selectedId) => selectedId !== id)
          : [...ids, id],
      };
    });
  };

  const applyBulkStatus = async () => {
    if (!visibleSelectedIds.length || bulkUpdating) return;
    const changed = await onBulkStatusChange(visibleSelectedIds, bulkStatus);
    if (changed) setSelection({ scope: selectionScope, ids: [] });
  };

  if (cars.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">등록된 차량이 없습니다.</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div
            key={car.id}
            className="group bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col"
          >
            <div className="relative h-52 w-full overflow-hidden bg-slate-50">
              <VehicleImage
                src={car.image}
                alt={car.name}
                priority={cars.indexOf(car) < 6}
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {car.badge && (
                  <span className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-blue-500/30 uppercase tracking-widest">
                    {car.badge}
                  </span>
                )}
                {(car.availableCount ?? 0) === 0 && (
                  <span className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-500/30 uppercase tracking-widest">
                    매진
                  </span>
                )}
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Hash size={10} /> {car.availableCount ?? 0} /{" "}
                  {car.unitCount ?? 0}대 사용 가능
                </span>
              </div>
              <div className="absolute top-4 right-4 flex gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  aria-label={`${car.name} 수정`}
                  onClick={() => onEdit(car)}
                  className="p-2.5 bg-white/95 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  aria-label={`${car.name} 삭제`}
                  onClick={() => onDelete(car.id)}
                  className="p-2.5 bg-white/95 backdrop-blur-sm text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">
                    {car.year} Year
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">
                    {car.fuel}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {car.name}
                </h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-1 font-medium">
                  {car.condition}
                </p>
              </div>

              <div className="mt-auto space-y-4">
                <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50/50 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">
                      일 대여
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      ₩{(car.pricePolicy.daily / 10000).toFixed(1)}만
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50/30 rounded-xl border border-blue-100/50">
                    <p className="text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-tighter">
                      주 대여
                    </p>
                    <p className="text-xs font-bold text-blue-700">
                      ₩{(car.pricePolicy.weekly / 10000).toFixed(1)}만
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50/50 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">
                      월 대여
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      ₩{(car.pricePolicy.monthly / 10000).toFixed(1)}만
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    aria-label={`${car.name} 수정`}
                    onClick={() => onEdit(car)}
                    className="group/btn flex items-center justify-center gap-2 flex-1 py-3 text-xs font-bold text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    <Hash size={14} />
                    <span>재고/현황 관리</span>
                    <ExternalLink
                      size={12}
                      className="opacity-50 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <CheckSquare2 size={16} className="text-blue-600" />
            실물 차량 상태 일괄 변경
          </p>
          <p className="mt-1 text-xs text-slate-500">
            선택한 모델에 등록된 모든 번호판 차량의 상태가 함께 변경됩니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-slate-500">
            {visibleSelectedIds.length}개 모델 · 실물 차량 {selectedUnitCount}대
          </span>
          <label className="sr-only" htmlFor="bulk-vehicle-status">
            변경할 실물 차량 상태
          </label>
          <select
            id="bulk-vehicle-status"
            value={bulkStatus}
            disabled={bulkUpdating}
            onChange={(event) =>
              setBulkStatus(event.target.value as VehicleStatus)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-60"
          >
            {VEHICLE_STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!visibleSelectedIds.length || bulkUpdating}
            onClick={applyBulkStatus}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {bulkUpdating ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckSquare2 size={15} />
            )}
            선택 상태 변경
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <caption className="sr-only">
            차량 모델을 선택하고 등록된 실물 차량 상태를 일괄 관리하는 표
          </caption>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="w-14 px-5 py-4 text-center">
                <input
                  type="checkbox"
                  aria-label="현재 목록의 차량 모델 전체 선택"
                  aria-checked={
                    visibleSelectedIds.length > 0 && !allSelected
                      ? "mixed"
                      : allSelected
                  }
                  checked={allSelected}
                  ref={(element) => {
                    if (element) {
                      element.indeterminate =
                        visibleSelectedIds.length > 0 && !allSelected;
                    }
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                차량 정보
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                연식/연료
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                일 대여가
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                재고 현황
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                노출 배지
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr
                key={car.id}
                className={`group border-b border-slate-50 transition-colors ${
                  selectedSet.has(car.id)
                    ? "bg-blue-50/70 hover:bg-blue-50"
                    : "hover:bg-slate-50/50"
                }`}
              >
                <td className="px-5 py-4 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${car.name} 선택`}
                    checked={selectedSet.has(car.id)}
                    onChange={() => toggleCar(car.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <VehicleImage src={car.image} alt={car.name} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {car.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {car.condition}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {car.year}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {car.fuel}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-slate-700">
                    ₩{car.pricePolicy.daily.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex flex-col gap-1 rounded-lg bg-slate-100 px-3 py-2 text-left text-[11px] font-semibold">
                    <span className="text-emerald-700">
                      대여 가능 {car.availableCount ?? 0}대
                    </span>
                    <span className="text-blue-700">
                      대여 중 {car.rentedCount ?? 0}대
                    </span>
                    <span className="text-red-700">
                      정비 중 {car.maintenanceCount ?? 0}대
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {car.badge ? (
                    <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {car.badge}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      aria-label={`${car.name} 수정`}
                      onClick={() => onEdit(car)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      aria-label={`${car.name} 삭제`}
                      onClick={() => onDelete(car.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
