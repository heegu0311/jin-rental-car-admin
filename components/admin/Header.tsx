"use client";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
const titles: Record<string, string> = {
  "/": "대시보드 개요",
  "/vehicles": "차량 관리",
  "/reservations": "예약 관리",
  "/new-car": "신차 상담 관리",
  "/events": "이벤트 관리",
  "/notices": "공지사항 관리",
  "/inquiries": "문의 관리",
  "/content": "웹사이트 콘텐츠 관리",
  "/settings": "사이트 설정",
  "/accident": "사고대차 안내 관리",
};
export function Header({ onMenuClick }: { onMenuClick: () => void }) {
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
      <p className="text-lg font-bold text-slate-900">
        {titles[key] || "진렌트카 운영 관리"}
      </p>
      <div className="ml-auto flex items-center gap-3 text-xs">
        <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500">
          <UserRound size={16} />
        </span>
        <strong>관리자</strong>
        <span className="hidden text-slate-500 sm:inline">운영 관리</span>
      </div>
    </header>
  );
}
