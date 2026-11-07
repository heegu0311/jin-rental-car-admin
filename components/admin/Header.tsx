"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { AccountIdentity } from "@/lib/account";
import { PushToggle } from "@/components/admin/PushToggle";
import { InstallGuide } from "@/components/admin/InstallGuide";
const titles: Record<string, string> = {
  "/": "대시보드 개요",
  "/vehicles": "차량 관리",
  "/reservations": "예약 관리",
  "/new-car": "신차 상담 관리",
  "/events": "이벤트 관리",
  "/notices": "공지사항 관리",
  "/inquiries": "문의 관리",
  "/consultations": "예약/문의 통합 관리",
  "/content": "웹사이트 콘텐츠 관리",
  "/insurance": "자차보험 설정",
  "/accident": "사고대차 안내 관리",
  "/mypage": "마이페이지",
};
export function Header({
  onMenuClick,
  identity,
}: {
  onMenuClick: () => void;
  identity: AccountIdentity;
}) {
  const path = usePathname();
  const key = path === "/" ? "/" : "/" + path.split("/")[1];
  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5 md:px-8">
      <button
        onClick={onMenuClick}
        aria-label="관리자 메뉴 열기"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm lg:hidden"
      >
        메뉴
      </button>
      <p className="min-w-0 truncate text-lg font-bold text-slate-900">
        {titles[key] || "진렌트카 운영 관리"}
      </p>
      <div className="ml-auto flex shrink-0 items-center gap-2 text-xs sm:gap-3">
        <InstallGuide />
        <PushToggle />
        <Link
          href="/mypage"
          aria-label="마이페이지"
          title={`${identity.name} · ${identity.email}`}
          className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-blue-700 text-sm font-bold text-white"
          >
            {identity.initial}
          </span>
          <strong className="hidden max-w-28 truncate sm:inline">
            {identity.name}
          </strong>
        </Link>
      </div>
    </header>
  );
}
