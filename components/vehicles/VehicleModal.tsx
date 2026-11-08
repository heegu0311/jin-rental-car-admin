"use client";

import { useState } from "react";
import { numberInputValue, parseNumberInput } from "@/lib/number-input";
import { useSubmitLock } from "@/lib/hooks/use-submit-lock";
import dynamic from "next/dynamic";
import { Car as CarIcon, Tag, X } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { uploadAdminImage } from "@/lib/storage/upload-image";
import {
  INCLUDED_KM_MAX,
  INSURANCE_LIMITS,
  VEHICLE_OPTIONS,
  vehicleOptions,
} from "@/lib/domain/contracts";
import type { Car, Category } from "./types";
import { VehicleImagesField } from "./VehicleImagesField";
import { VehicleUnitsSection } from "./VehicleUnitsSection";

const NO_CATEGORY = "__none__";

/** 숫자 입력값. 비우면 null(상담 안내), 소수점은 버린다. */
const optionalInt = (value: string) =>
  value === "" ? null : Math.trunc(Number(value));

const RichEditor = dynamic(
  () => import("@/components/admin/RichEditor").then((mod) => mod.RichEditor),
  { ssr: false },
);

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (car: Car) => void | Promise<void>;
  car?: Car | null;
  categories: Category[];
}

export function VehicleModal({
  isOpen,
  onClose,
  onSave,
  car,
  categories,
}: VehicleModalProps) {
  const [formData, setFormData] = useState<Partial<Car>>(
    car || {
      name: "",
      year: "2025",
      fuel: "휘발유",
      badge: "",
      condition: "비흡연/완벽점검",
      image: "",
      images: [],
      category_id: "",
      pricePolicy: { daily: 0, weekly: 0, monthly: 0 },
      price: "",
      content: "",
    },
  );
  const [uploading, setUploading] = useState(false);
  const { busy: saving, run } = useSubmitLock();

  const [supabase] = useState(createClient);
  const selectedOptions = vehicleOptions(formData.options || []);
  const legacyOptions = (formData.options || []).filter(
    (option) => !VEHICLE_OPTIONS.some((allowed) => allowed === option),
  );
  const update = <K extends keyof Car>(key: K, value: Car[K]) =>
    setFormData((current) => ({ ...current, [key]: value }));
  const updatePrice = (key: keyof Car["pricePolicy"], value: string) =>
    setFormData((current) => ({
      ...current,
      pricePolicy: {
        ...current.pricePolicy!,
        [key]: parseNumberInput(value),
      },
    }));
  /** 첫 장을 대표 사진(image)으로 함께 저장한다. */
  const updateImages = (next: (current: string[]) => string[]) =>
    setFormData((current) => {
      const images = next(current.images || []);
      return { ...current, images, image: images[0] || "" };
    });

  const handleEditorImageUpload = (file: File): Promise<string> =>
    uploadAdminImage(supabase, file, "vehicle-content");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    await run(async () => {
      try {
        await onSave({
          ...formData,
          id: car?.id || "",
          price: (formData.pricePolicy?.monthly || 0).toLocaleString(),
        } as Car);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "차량을 저장하지 못했습니다.",
        );
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full w-full max-w-lg bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {car ? "차량 정보 수정" : "새 차량 등록"}
            </h2>
            <p className="text-sm text-slate-500">
              차량의 상세 정보를 관리합니다.
            </p>
          </div>
          <button
            aria-label="차량 편집 닫기"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <CarIcon size={14} /> 기본 제원 정보
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                  카테고리
                </label>
                <Select
                  value={formData.category_id || ""}
                  onValueChange={(value) =>
                    update("category_id", value === NO_CATEGORY ? "" : value)
                  }
                >
                  <SelectTrigger
                    size="lg"
                    aria-label="카테고리"
                    className="w-full rounded-xl bg-slate-50"
                  >
                    <SelectValue placeholder="카테고리 선택 (예: 소형, 중형)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>미지정</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                    차량 모델명
                  </label>
                  <input
                    required
                    value={formData.name || ""}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 아반떼"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                    출시 연도
                  </label>
                  <input
                    required
                    value={formData.year || ""}
                    onChange={(e) => update("year", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 2025"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                    사용 연료
                  </label>
                  <input
                    value={formData.fuel || ""}
                    onChange={(e) => update("fuel", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 휘발유, LPG, 전기"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                    노출 배지
                  </label>
                  <input
                    value={formData.badge || ""}
                    onChange={(e) => update("badge", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 인기, 신차, 특가"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                  상태 및 옵션 설명
                </label>
                <input
                  value={formData.condition || ""}
                  onChange={(e) => update("condition", e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 비흡연/완벽점검/썬루프"
                />
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <input
                  type="checkbox"
                  checked={formData.is_monthly_special === true}
                  onChange={(e) =>
                    update("is_monthly_special", e.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-bold text-slate-900">
                  월렌트 특가 차량
                  <span className="mt-1 block text-xs font-normal leading-5 text-slate-600">
                    설정한 기간에 특별 월 요금으로 표시합니다. 기간이 끝나면
                    자동으로 제외됩니다.
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
                <label className="text-xs font-bold text-slate-700">
                  특별 월 요금 (원)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={formData.monthly_special_price ?? ""}
                    onChange={(e) =>
                      update(
                        "monthly_special_price",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal"
                    placeholder="특별가"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  시작일
                  <input
                    type="date"
                    value={formData.monthly_special_starts_on ?? ""}
                    onChange={(e) =>
                      update(
                        "monthly_special_starts_on",
                        e.target.value || null,
                      )
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  종료일
                  <input
                    type="date"
                    value={formData.monthly_special_ends_on ?? ""}
                    onChange={(e) =>
                      update("monthly_special_ends_on", e.target.value || null)
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
                  />
                </label>
              </div>

              <VehicleImagesField
                supabase={supabase}
                images={formData.images || []}
                onChange={updateImages}
                onUploadingChange={setUploading}
              />

              <div className="space-y-1.5 pt-4">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                  상세 내용
                </label>
                <RichEditor
                  content={formData.content || ""}
                  onChange={(val) => update("content", val)}
                  onImageUpload={handleEditorImageUpload}
                  placeholder="차량 상세 설명을 입력하세요..."
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <Tag size={14} /> 요금 체계 (원 단위)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">
                    일 대여
                  </label>
                  <input
                    type="number"
                    required
                    value={numberInputValue(formData.pricePolicy?.daily)}
                    onChange={(e) => updatePrice("daily", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 ml-1 mt-1">
                    하루{" "}
                    <span className="font-bold text-slate-700">
                      {(formData.pricePolicy?.daily || 0).toLocaleString()}
                    </span>
                    원
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">
                    주 대여(일)
                  </label>
                  <input
                    type="number"
                    required
                    value={numberInputValue(formData.pricePolicy?.weekly)}
                    onChange={(e) => updatePrice("weekly", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 ml-1 mt-1">
                    하루{" "}
                    <span className="font-bold text-blue-600">
                      {Math.round(
                        (formData.pricePolicy?.weekly || 0) / 7,
                      ).toLocaleString()}
                    </span>
                    원
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">
                    월 대여(일)
                  </label>
                  <input
                    type="number"
                    required
                    value={numberInputValue(formData.pricePolicy?.monthly)}
                    onChange={(e) => updatePrice("monthly", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-500 ml-1 mt-1">
                    하루{" "}
                    <span className="font-bold text-blue-600">
                      {Math.round(
                        (formData.pricePolicy?.monthly || 0) / 30,
                      ).toLocaleString()}
                    </span>
                    원
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ["km_daily", "일 약정 거리(km)"],
                    ["km_weekly", "주 약정 거리(km)"],
                    ["km_monthly", "월 약정 거리(km)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <label
                      htmlFor={`vehicle-${key}`}
                      className="text-[10px] font-bold text-slate-400 ml-1"
                    >
                      {label}
                    </label>
                    <input
                      id={`vehicle-${key}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={INCLUDED_KM_MAX}
                      step={1}
                      value={formData[key] ?? ""}
                      onChange={(e) => update(key, optionalInt(e.target.value))}
                      placeholder="비우면 상담"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Unit Management Section */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold">
              제조사
              <input
                form="vehicle-form"
                className="mt-2 w-full rounded-lg border p-3"
                value={formData.manufacturer || ""}
                onChange={(e) => update("manufacturer", e.target.value)}
                placeholder="현대, 기아, 제네시스 등"
              />
            </label>
            <label className="block text-sm font-semibold">
              배기량(cc)
              <input
                form="vehicle-form"
                className="mt-2 w-full rounded-lg border p-3"
                type="number"
                inputMode="numeric"
                min={0}
                max={INSURANCE_LIMITS.cc}
                step={1}
                value={formData.displacement_cc ?? ""}
                onChange={(e) =>
                  update("displacement_cc", optionalInt(e.target.value))
                }
                placeholder="예: 1598 (전기차는 0)"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                자차보험 요금 구간에 사용합니다. 비워두면 고객에게 요금 범위로
                안내됩니다.
              </span>
            </label>
            <label className="block text-sm font-semibold">
              초과 주행 요금(100km당, 원)
              <input
                form="vehicle-form"
                className="mt-2 w-full rounded-lg border p-3"
                type="number"
                inputMode="numeric"
                min={0}
                max={INSURANCE_LIMITS.price}
                step={1}
                value={formData.extra_km_fee ?? ""}
                onChange={(e) =>
                  update("extra_km_fee", optionalInt(e.target.value))
                }
                placeholder="예: 20000"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                약정 주행거리 초과 시 차량 상세에 안내됩니다. 비워두면 차종별
                범위(1만~3만원)로 안내됩니다.
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
              <input
                form="vehicle-form"
                type="checkbox"
                className="mt-0.5 size-4"
                checked={Boolean(formData.is_van)}
                onChange={(e) => update("is_van", e.target.checked)}
              />
              <span>
                <strong className="block font-semibold">승합차</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  켜면 배기량과 관계없이 자차보험 설정의 승합 요금을 적용합니다.
                </span>
              </span>
            </label>
            <label className="block text-sm font-semibold">
              승차 인원
              <input
                form="vehicle-form"
                className="mt-2 w-full rounded-lg border p-3"
                type="number"
                min={1}
                max={45}
                required
                value={numberInputValue(formData.seats ?? 5)}
                onChange={(e) =>
                  update("seats", parseNumberInput(e.target.value))
                }
              />
            </label>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">차량 옵션</legend>
              <p className="text-xs leading-5 text-slate-500">
                해당 차량에 장착된 옵션을 모두 선택하세요.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700"
                  >
                    <input
                      form="vehicle-form"
                      type="checkbox"
                      checked={selectedOptions.includes(option)}
                      onChange={(event) => {
                        const nextOptions = event.target.checked
                          ? vehicleOptions([...selectedOptions, option])
                          : selectedOptions.filter(
                              (selected) => selected !== option,
                            );
                        update("options", [...nextOptions, ...legacyOptions]);
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {legacyOptions.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  <p className="font-semibold">기존 기타 옵션</p>
                  <p>{legacyOptions.join(", ")}</p>
                  <p className="mt-1 text-amber-700">
                    기존 데이터 보호를 위해 차량 저장 시 그대로 유지됩니다.
                  </p>
                </div>
              )}
            </fieldset>
          </div>
          <VehicleUnitsSection supabase={supabase} vehicleId={car?.id} />
        </div>

        <div className="sticky bottom-0 bg-white p-6 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            aria-label="차량 편집 닫기"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            disabled={saving || uploading}
            form="vehicle-form"
            type="submit"
            className="flex-[2] py-3 px-8 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            기본 정보 저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
