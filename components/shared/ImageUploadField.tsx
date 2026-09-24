"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ADMIN_IMAGE_MAX_BYTES,
  uploadAdminImage,
} from "@/lib/storage/upload-image";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  preview?: boolean;
}

export function ImageUploadField({
  value,
  onChange,
  folder,
  label = "이미지 URL",
  preview = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      onChange(await uploadAdminImage(createClient(), file, folder));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "이미지를 업로드하지 못했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleUrlChange = (url: string) => {
    if (!url || url.startsWith("/")) {
      onChange(url);
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:") onChange(url);
      else setError("이미지 주소는 HTTPS 또는 사이트 내부 경로만 사용할 수 있습니다.");
    } catch {
      setError("올바른 이미지 주소를 입력해주세요.");
    }
  };

  return (
    <div className="space-y-2">
      {preview && value ? (
        <div className="relative h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <Image src={value} alt="이미지 미리보기" fill unoptimized className="object-contain" />
        </div>
      ) : null}
      <label className="block text-xs font-bold text-slate-500">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(event) => handleUrlChange(event.target.value)}
          placeholder="https://…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
        >
          {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? "업로드 중" : "이미지 업로드"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>
      <p className="text-xs text-slate-500">JPG, PNG, WebP · 최대 {ADMIN_IMAGE_MAX_BYTES / (1024 * 1024)}MB</p>
      {error ? <p role="alert" className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
