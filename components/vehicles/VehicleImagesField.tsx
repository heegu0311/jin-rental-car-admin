"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { VEHICLE_IMAGE_MAX } from "@/lib/domain/contracts";
import {
  ADMIN_IMAGE_ACCEPT,
  IMAGE_PRESETS,
  imageGuide,
  uploadAdminImage,
} from "@/lib/storage/upload-image";
import { cn } from "@/lib/utils";

/**
 * 차량 사진 목록(최대 VEHICLE_IMAGE_MAX장) 업로드·순서 이동·삭제. 첫 장이 대표 사진이다.
 * 업로드 중에는 onUploadingChange(true)로 부모가 저장을 막을 수 있게 한다.
 */
export function VehicleImagesField({
  supabase,
  images,
  onChange,
  onUploadingChange,
}: {
  supabase: SupabaseClient;
  images: string[];
  /** 최신 목록을 받아 다음 목록을 돌려준다(연속 업로드 중에도 순서가 섞이지 않도록). */
  onChange: (update: (current: string[]) => string[]) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [uploadProgress, setUploadProgress] = useState("");
  const setImages = onChange;
  const moveImage = (index: number, offset: -1 | 1) =>
    setImages((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  const removeImage = (index: number) =>
    setImages((current) => current.filter((_, i) => i !== index));

  /** 선택한 사진을 순서대로 올린다. 실패한 사진만 건너뛰고 나머지는 유지한다. */
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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
    onUploadingChange(true);
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
    onUploadingChange(false);
    if (failed && failed < files.length)
      toast.error(
        `${files.length - failed}장은 추가했고 ${failed}장은 올리지 못했습니다.`,
      );
  };

  return (
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
              !uploadProgress && "hover:border-blue-400 hover:bg-blue-50/30",
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
                <span className="text-[11px] font-bold">사진 추가</span>
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
        여러 장을 한 번에 선택할 수 있습니다. 첫 번째 사진이 목록·카드의 대표
        사진이며 상세 페이지에서 순서대로 넘겨 볼 수 있습니다. 권장 비율{" "}
        {IMAGE_PRESETS.thumbnail.ratio} (예: {IMAGE_PRESETS.thumbnail.example}).{" "}
        {imageGuide("thumbnail")}
      </p>
    </div>
  );
}
