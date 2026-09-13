"use client";
export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5 md:px-8">
      <button
        onClick={onMenuClick}
        aria-label="관리자 메뉴 열기"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm lg:hidden"
      >
        메뉴
      </button>
      <p className="text-sm font-semibold text-slate-900">진렌트카 운영 관리</p>
      <span className="ml-auto text-xs text-slate-500">ADMIN SYSTEM</span>
    </header>
  );
}
