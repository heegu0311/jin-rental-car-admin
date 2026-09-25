import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImageVariant } from "@/lib/domain/contracts";

export const ADMIN_IMAGE_BUCKET = "site-assets";
/** Storage 버킷 한도. 변환된 사본 한 장의 최대 크기다. */
export const ADMIN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** 원본은 브라우저에서 줄인 뒤 올리므로 휴대폰 원본 사진까지 받는다. */
export const ADMIN_IMAGE_SOURCE_MAX_BYTES = 20 * 1024 * 1024;
export const ADMIN_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

const sourceTypes = ["image/jpeg", "image/png", "image/webp"];

/** 용도별 권장 비율과 자동 변환 크기(긴 변 px). */
export const IMAGE_PRESETS = {
  thumbnail: {
    ratio: "3:2",
    example: "1800×1200px",
    widths: { desktop: 1600, mobile: 800 },
  },
  banner: {
    ratio: "16:9",
    example: "1920×1080px",
    widths: { desktop: 1920, mobile: 960 },
  },
  content: {
    ratio: null,
    example: null,
    widths: { desktop: 1600, mobile: 800 },
  },
} as const satisfies Record<
  string,
  {
    ratio: string | null;
    example: string | null;
    widths: Record<ImageVariant, number>;
  }
>;
export type ImagePreset = keyof typeof IMAGE_PRESETS;

export function imageGuide(preset: ImagePreset) {
  const { ratio, example, widths } = IMAGE_PRESETS[preset];
  const recommend = ratio
    ? `권장 비율 ${ratio} (예: ${example}) · 일반 사진 비율로 올리면 잘림이 적습니다. `
    : "";
  return `${recommend}JPG·PNG·WebP 최대 ${ADMIN_IMAGE_SOURCE_MAX_BYTES / (1024 * 1024)}MB · 데스크탑 ${widths.desktop}px / 모바일 ${widths.mobile}px로 자동 변환해 저장합니다.`;
}

async function encode(
  bitmap: ImageBitmap,
  maxEdge: number,
): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 변환할 수 없는 브라우저입니다.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  // WebP 인코딩을 지원하지 않는 브라우저는 PNG를 돌려주므로 JPEG로 다시 만든다.
  let blob = await toBlob("image/webp", 0.82);
  if (blob?.type !== "image/webp") {
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    blob = await toBlob("image/jpeg", 0.85);
  }
  if (!blob || blob.size === 0) throw new Error("이미지를 변환하지 못했습니다.");
  if (blob.size > ADMIN_IMAGE_MAX_BYTES) {
    throw new Error("변환 후에도 5MB를 넘습니다. 더 작은 이미지를 선택해주세요.");
  }
  return blob;
}

/**
 * 원본을 데스크탑·모바일 크기로 줄여 {folder}/desktop, {folder}/mobile에 저장하고
 * 데스크탑 공개 URL을 돌려준다. 메타데이터(EXIF 위치 등)는 변환 과정에서 제거된다.
 */
export async function uploadAdminImage(
  supabase: SupabaseClient,
  file: File,
  folder: string,
  preset: ImagePreset = "content",
): Promise<string> {
  if (
    !sourceTypes.includes(file.type) ||
    file.size === 0 ||
    file.size > ADMIN_IMAGE_SOURCE_MAX_BYTES
  ) {
    throw new Error("20MB 이하 JPG, PNG, WebP 이미지를 선택해주세요.");
  }

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!safeFolder) throw new Error("이미지 저장 위치가 올바르지 않습니다.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("이미지를 읽지 못했습니다. 다른 파일을 선택해주세요.");
  }
  const { widths } = IMAGE_PRESETS[preset];
  let blobs: Record<ImageVariant, Blob>;
  try {
    blobs = {
      desktop: await encode(bitmap, widths.desktop),
      mobile: await encode(bitmap, widths.mobile),
    };
  } finally {
    bitmap.close();
  }

  // 두 사본은 같은 형식이어야 이름 규칙으로 서로를 찾을 수 있다.
  const extension = blobs.desktop.type === "image/webp" ? "webp" : "jpg";
  if (blobs.mobile.type !== blobs.desktop.type) {
    throw new Error("이미지를 변환하지 못했습니다.");
  }
  const name = `${crypto.randomUUID()}.${extension}`;
  const paths = {
    desktop: `${safeFolder}/desktop/${name}`,
    mobile: `${safeFolder}/mobile/${name}`,
  };
  const storage = supabase.storage.from(ADMIN_IMAGE_BUCKET);
  const results = await Promise.all(
    (["desktop", "mobile"] as const).map((variant) =>
      storage.upload(paths[variant], blobs[variant], {
        contentType: blobs[variant].type,
        cacheControl: "31536000",
        upsert: false,
      }),
    ),
  );

  if (results.some((result) => result.error)) {
    // 한쪽만 저장된 경우 짝이 없는 파일을 남기지 않는다.
    const saved = results.flatMap((result) => (result.data ? [result.data.path] : []));
    if (saved.length) await storage.remove(saved);
    throw new Error("이미지 업로드에 실패했습니다. 권한과 Storage 설정을 확인해주세요.");
  }

  return storage.getPublicUrl(paths.desktop).data.publicUrl;
}
