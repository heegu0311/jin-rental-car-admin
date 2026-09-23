import type { SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_IMAGE_BUCKET = "site-assets";
export const ADMIN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function uploadAdminImage(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<string> {
  const extension = imageTypes[file.type as keyof typeof imageTypes];
  if (!extension || file.size > ADMIN_IMAGE_MAX_BYTES || file.size === 0) {
    throw new Error("5MB 이하 JPG, PNG, WebP 이미지를 선택해주세요.");
  }

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!safeFolder) throw new Error("이미지 저장 위치가 올바르지 않습니다.");

  const path = `${safeFolder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(ADMIN_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error("이미지 업로드에 실패했습니다. 권한과 Storage 설정을 확인해주세요.");

  return supabase.storage.from(ADMIN_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
