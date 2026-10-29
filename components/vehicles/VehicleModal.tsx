"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Car, VehicleUnit, Category } from "./types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_IMAGE_ACCEPT,
  IMAGE_PRESETS,
  imageGuide,
  uploadAdminImage,
} from "@/lib/storage/upload-image";
import {
  INCLUDED_KM_MAX,
  INSURANCE_LIMITS,
  VEHICLE_IMAGE_MAX,
  VEHICLE_OPTIONS,
  vehicleOptions,
} from "@/lib/domain/contracts";
import {
  Car as CarIcon,
  X,
  Camera,
  Trash2,
  Loader2,
  Tag,
  Hash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { refreshPublicSiteOrNotify } from "@/lib/public-site";

const NO_CATEGORY = "__none__";

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
  const [units, setUnits] = useState<VehicleUnit[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [saving, setSaving] = useState(false);

  const [supabase] = useState(createClient);
  const selectedOptions = vehicleOptions(formData.options || []);
  const legacyOptions = (formData.options || []).filter(
    (option) => !VEHICLE_OPTIONS.some((allowed) => allowed === option),
  );

  const loadUnits = useCallback(
    async (vehicleId: string) => {
      const { data } = await supabase
        .from("vehicle_units")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    [supabase],
  );
  const fetchUnits = async (id: string) => setUnits(await loadUnits(id));
  useEffect(() => {
    let active = true;
    if (car?.id)
      loadUnits(car.id).then((data) => {
        if (active) setUnits(data);
      });
    return () => {
      active = false;
    };
  }, [car?.id, loadUnits]);

  const handleAddUnit = async () => {
    if (!newPlate.trim() || !car?.id) return;
    setIsAddingUnit(true);
    const { error } = await supabase.from("vehicle_units").insert([
      {
        vehicle_id: car.id,
        plate_number: newPlate.trim(),
        status: "available",
      },
    ]);

    if (!error) {
      setNewPlate("");
      refreshPublicSiteOrNotify("차량 번호를 추가했습니다.");
      fetchUnits(car.id);
    } else {
      toast.error("이미 등록된 번호이거나 오류가 발생했습니다.");
    }
    setIsAddingUnit(false);
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("해당 차량 번호를 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("vehicle_units")
      .delete()
      .eq("id", unitId);

    if (error) {
      toast.error("차량 번호를 삭제하지 못했습니다. 다시 시도해주세요.");
      return;
    }
    if (car?.id) {
      refreshPublicSiteOrNotify("차량 번호를 삭제했습니다.");
      fetchUnits(car.id);
    }
  };

  const images = formData.images || [];
  const setImages = (update: (current: string[]) => string[]) =>
    setFormData((current) => {
      const next = update(current.images || []);
      return { ...current, images: next, image: next[0] || "" };
    });
  const moveImage = (index: number, offset: -1 | 1) =>
    setImages((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  const removeImage = (index: number) =>
    setImages((current) => current.filter((_, i) => i !== index));

  /** 선택한 사진을 순서대로 올린다. 실패한 사진만 건너뛰고 나머지는 유지한다. */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const selected = Array.from(input.files || []);
    input.value = "";
    if (!selected.length) return;
    const files = selected.slice(0, VEHICLE_IMAGE_MAX - images.length);
    if (files.length < selected.length)
      toast.error(
        `사진은 최대 ${VEHICLE_IMAGE_MAX}장까지 등록할 수 있어 ${selected.length - files.length}장은 제외했습니다.`,
      );

    let failed = 0;
    for (const [index, file] of files.entries()) {
      setUploadProgress(`${index + 1}/${files.length}`);
      try {
        const publicUrl = await uploadAdminImage(
          supabase,
          file,
          "vehicles",
          "thumbnail",
        );
        setImages((current) =>
          current.length < VEHICLE_IMAGE_MAX
            ? [...current, publicUrl]
            : current,
        );
      } catch (error) {
        failed += 1;
        toast.error(
          error instanceof Error
            ? `${file.name}: ${error.message}`
            : `${file.name}: 이미지 업로드 중 오류가 발생했습니다.`,
        );
      }
    }
    setUploadProgress("");
    if (failed && failed < files.length)
      toast.error(
        `${files.length - failed}장은 추가했고 ${failed}장은 올리지 못했습니다.`,
      );
  };

  const handleEditorImageUpload = (file: File): Promise<string> =>
    uploadAdminImage(supabase, file, "vehicle-content");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploadProgress) return;
    setSaving(true);
    try {
      await onSave({
        ...formData,
        id: car?.id || "",
        price: (formData.pricePolicy?.monthly || 0).toLocaleString(),
      } as Car);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "차량을 저장하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
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
                    setFormData({
                      ...formData,
                      category_id: value === NO_CATEGORY ? "" : value,
                    })
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, fuel: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
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
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 비흡연/완벽점검/썬루프"
                />
              </div>
              <div className="space-y-1.5">
                <div className="ml-1 flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    차량 사진
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">
                    {images.length} / {VEHICLE_IMAGE_MAX}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((src, index) => (
                    <div
                      key={src}
                      className="group relative aspect-[3/2] overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <Image
                        src={src}
                        alt={`차량 사진 ${index + 1}`}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          대표
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/45 p-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button
                          type="button"
                          aria-label={`사진 ${index + 1} 앞으로 이동`}
                          disabled={index === 0}
                          onClick={() => moveImage(index, -1)}
                          className="rounded-md bg-white/90 p-1 text-slate-700 disabled:opacity-40"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`사진 ${index + 1} 삭제`}
                          onClick={() => removeImage(index)}
                          className="rounded-md bg-red-500 p-1 text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`사진 ${index + 1} 뒤로 이동`}
                          disabled={index === images.length - 1}
                          onClick={() => moveImage(index, 1)}
                          className="rounded-md bg-white/90 p-1 text-slate-700 disabled:opacity-40"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {images.length < VEHICLE_IMAGE_MAX && (
                    <label
                      className={cn(
                        "flex aspect-[3/2] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 transition-all focus-within:border-blue-400",
                        !uploadProgress &&
                          "hover:border-blue-400 hover:bg-blue-50/30",
                      )}
                    >
                      {uploadProgress ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="text-[11px] font-bold">
                            업로드 중 {uploadProgress}
                          </span>
                        </>
                      ) : (
                        <>
                          <Camera size={20} />
                          <span className="text-[11px] font-bold">
                            사진 추가
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        multiple
                        className="sr-only"
                        accept={ADMIN_IMAGE_ACCEPT}
                        onChange={handleImageUpload}
                        disabled={Boolean(uploadProgress)}
                      />
                    </label>
                  )}
                </div>
                <p className="ml-1 text-[11px] leading-relaxed text-slate-400">
                  여러 장을 한 번에 선택할 수 있습니다. 첫 번째 사진이
                  목록·카드의 대표 사진이며 상세 페이지에서 순서대로 넘겨 볼 수
                  있습니다. 권장 비율 {IMAGE_PRESETS.thumbnail.ratio} (예:{" "}
                  {IMAGE_PRESETS.thumbnail.example}). {imageGuide("thumbnail")}
                </p>
              </div>

              <div className="space-y-1.5 pt-4">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">
                  상세 내용
                </label>
                <RichEditor
                  content={formData.content || ""}
                  onChange={(val) => setFormData({ ...formData, content: val })}
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
                    value={formData.pricePolicy?.daily || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePolicy: {
                          ...formData.pricePolicy!,
                          daily: parseInt(e.target.value) || 0,
                        },
                      })
                    }
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
                    value={formData.pricePolicy?.weekly || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePolicy: {
                          ...formData.pricePolicy!,
                          weekly: parseInt(e.target.value) || 0,
                        },
                      })
                    }
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
                    value={formData.pricePolicy?.monthly || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePolicy: {
                          ...formData.pricePolicy!,
                          monthly: parseInt(e.target.value) || 0,
                        },
                      })
                    }
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [key]:
                            e.target.value === ""
                              ? null
                              : Math.trunc(Number(e.target.value)),
                        })
                      }
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
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
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
                  setFormData({
                    ...formData,
                    displacement_cc:
                      e.target.value === ""
                        ? null
                        : Math.trunc(Number(e.target.value)),
                  })
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
                  setFormData({
                    ...formData,
                    extra_km_fee:
                      e.target.value === ""
                        ? null
                        : Math.trunc(Number(e.target.value)),
                  })
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
                onChange={(e) =>
                  setFormData({ ...formData, is_van: e.target.checked })
                }
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
                value={formData.seats || 5}
                onChange={(e) =>
                  setFormData({ ...formData, seats: Number(e.target.value) })
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
                        setFormData({
                          ...formData,
                          options: [...nextOptions, ...legacyOptions],
                        });
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
          <div className="space-y-4 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-6">
            <h3 className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Hash size={14} /> 실물 차량 관리 (번호판)
              </span>
              {car && (
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                  총 {units.length}대
                </span>
              )}
            </h3>

            {car ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddUnit();
                      }
                    }}
                    placeholder="차량 번호 입력 (예: 29로3714)"
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
                  />
                  <button
                    type="button"
                    disabled={isAddingUnit || !newPlate.trim()}
                    onClick={handleAddUnit}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {units.length > 0 ? (
                    units.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Hash size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">
                              {unit.plate_number}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  unit.status === "available"
                                    ? "bg-emerald-500"
                                    : unit.status === "rented"
                                      ? "bg-blue-500"
                                      : "bg-red-500",
                                )}
                              />
                              <Select
                                value={unit.status}
                                onValueChange={async (value) => {
                                  const status = value as VehicleUnit["status"];
                                  const { error } = await supabase
                                    .from("vehicle_units")
                                    .update({ status })
                                    .eq("id", unit.id)
                                    .select("id")
                                    .single();
                                  if (error) {
                                    toast.error("상태 변경에 실패했습니다.");
                                    return;
                                  }
                                  refreshPublicSiteOrNotify(
                                    `${unit.plate_number} 상태를 변경했습니다.`,
                                  );
                                  setUnits((prev) =>
                                    prev.map((u) =>
                                      u.id === unit.id ? { ...u, status } : u,
                                    ),
                                  );
                                }}
                              >
                                <SelectTrigger
                                  size="xs"
                                  aria-label={`${unit.plate_number} 차량 상태`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">
                                    대여 가능
                                  </SelectItem>
                                  <SelectItem value="rented">
                                    대여 중
                                  </SelectItem>
                                  <SelectItem value="maintenance">
                                    정비 중
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400 font-medium whitespace-pre-wrap">
                        등록된 실물 차량 번호가 없습니다.\n사용자에게 &quot;예약
                        불가&quot;로 표시됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center bg-white border border-slate-200 rounded-xl px-6">
                <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 italic font-medium leading-relaxed">
                  개별 차량 번호 등록 및 재고 관리는
                  <br />
                  기본 차량 모델 정보를 상단에서 저장한 후에 가능합니다.
                </p>
              </div>
            )}
          </div>
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
            disabled={saving || Boolean(uploadProgress)}
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
