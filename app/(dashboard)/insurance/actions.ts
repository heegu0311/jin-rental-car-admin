"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  INSURANCE_CONTENT_SLUG,
  parseInsuranceConfig,
} from "@/lib/domain/contracts";
import { refreshPublicSite } from "@/lib/web-revalidate";

export async function saveInsurance(value: unknown, isPublished: unknown) {
  const { db } = await requireAdmin();
  const config = parseInsuranceConfig(value);
  if (!config || typeof isPublished !== "boolean")
    return {
      error:
        "보험명·금액·상세 항목을 확인해주세요. 필수 가입 단위는 연령별 보험이 1개 이상 있어야 합니다.",
    };
  const missing = Object.values(config).flatMap((unit) =>
    Object.values(unit.plans)
      .flat()
      .filter((plan) => !plan.details.length),
  );
  if (missing.length)
    return {
      error: `고객에게 보장 내용을 안내할 수 있도록 모든 보험에 상세 조건을 입력해주세요. (${missing
        .map((p) => p.name)
        .slice(0, 3)
        .join(", ")}${missing.length > 3 ? " 외" : ""})`,
    };
  const { error } = await db
    .from("site_content")
    .upsert({
      slug: INSURANCE_CONTENT_SLUG,
      title: "자차보험",
      subtitle: "",
      sections: [{ title: "config", body: JSON.stringify(config) }],
      image_url: "",
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .select("slug")
    .single();
  if (error)
    return { error: "저장하지 못했습니다. 연결 상태와 권한을 확인해주세요." };
  revalidatePath("/insurance");
  const site = await refreshPublicSite();
  return { success: true as const, site };
}
