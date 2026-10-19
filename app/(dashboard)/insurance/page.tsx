import { requireAdmin } from "@/lib/auth";
import {
  INSURANCE_CONTENT_SLUG,
  parseInsuranceConfig,
} from "@/lib/domain/contracts";
import { DEFAULT_INSURANCE } from "./defaults";
import { InsuranceEditor } from "./InsuranceEditor";

export default async function InsurancePage() {
  const { db } = await requireAdmin();
  const { data, error } = await db
    .from("site_content")
    .select("sections, is_published")
    .eq("slug", INSURANCE_CONTENT_SLUG)
    .maybeSingle();
  if (error) throw new Error("자차보험 설정 조회 실패");
  let saved = null;
  try {
    saved = data?.sections?.[0]?.body
      ? parseInsuranceConfig(JSON.parse(data.sections[0].body))
      : null;
  } catch {
    saved = null;
  }
  return (
    <InsuranceEditor
      initial={saved ?? DEFAULT_INSURANCE}
      initialPublished={Boolean(data?.is_published)}
      hasSaved={Boolean(saved)}
    />
  );
}
