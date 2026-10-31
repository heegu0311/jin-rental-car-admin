import { Phone } from "lucide-react";
import { formatPhone } from "@/lib/format";

/** 상세 화면의 전화 걸기 버튼. 숫자가 없으면 원문만 표시한다. */
export function PhoneLink({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return <span className="text-sm text-slate-500">{phone}</span>;
  const display = formatPhone(phone);
  return (
    <a
      href={`tel:${digits}`}
      aria-label={`${display}로 전화 걸기`}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-50 px-4 text-base font-bold tabular-nums text-blue-700 hover:bg-blue-100"
    >
      <Phone aria-hidden className="size-4" />
      {display}
    </a>
  );
}
