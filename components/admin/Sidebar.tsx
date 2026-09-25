"use client";
import {
  Table2,
  Settings,
  CalendarCheck,
  CircleAlert,
  MessageCircle,
  Car,
  FileText,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
const menu = [
  { href: "/", label: "대시보드", icon: Table2 },
  { href: "/vehicles", label: "차량 관리", icon: Car },
  { href: "/events", label: "이벤트 관리", icon: CircleAlert },
  { href: "/notices", label: "공지사항", icon: FileText },
  { href: "/content", label: "웹사이트 콘텐츠", icon: FileText },
  { href: "/settings", label: "사이트 설정", icon: Settings },
];
const consultationMenu = [
  { href: "/reservations", label: "기간 렌트", icon: CalendarCheck },
  { href: "/new-car", label: "신차 장기", icon: Car },
  { href: "/inquiries", label: "1:1 문의", icon: MessageCircle },
];
export function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen?: boolean;
  setIsOpen?: (value: boolean) => void;
}) {
  const path = usePathname();
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col bg-slate-900 text-slate-400 transition-transform lg:relative lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 p-6">
        <Link href="/" aria-label="진렌트카 관리자 홈" className="block">
          <Image
            src="/jintrental-logo-white.png"
            width={136}
            height={64}
            alt="진렌트카"
            priority
            className="h-16 w-[136px] object-contain"
          />
          <span className="block pl-3 text-[10px] font-extrabold tracking-widest text-sky-400">
            ADMIN SYSTEM
          </span>
        </Link>
        <button
          aria-label="메뉴 닫기"
          className="size-10 rounded text-xl lg:hidden"
          onClick={() => setIsOpen?.(false)}
        >
          ×
        </button>
      </div>
      <nav aria-label="관리자 메뉴" className="overflow-y-auto py-0">
        {menu.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen?.(false)}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 px-6 py-3 text-sm transition ${active ? "bg-slate-800 text-white" : "hover:bg-slate-800/70 hover:text-white"}`}
            >
              <Icon size={22} aria-hidden="true" />
              {active && (
                <span className="absolute right-6 h-4 w-1 rounded bg-sky-400" />
              )}
              {label}
            </Link>
          );
        })}
        <div className="mt-3 border-t border-slate-800 pt-3">
          <Link
            href="/consultations"
            onClick={() => setIsOpen?.(false)}
            aria-current={path === "/consultations" ? "page" : undefined}
            className={`flex items-center gap-3 px-6 py-2 text-xs font-bold tracking-wide transition ${path === "/consultations" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"}`}
          >
            <CalendarCheck size={20} aria-hidden="true" />
            예약/문의 관리
          </Link>
          <div className="ml-8 border-l border-slate-700">
            {consultationMenu.map(({ href, label, icon: Icon }) => {
              const active = path === href || path.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen?.(false)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-3 py-2.5 pl-5 pr-6 text-sm transition ${active ? "bg-slate-800 font-semibold text-white" : "hover:bg-slate-800/70 hover:text-white"}`}
                >
                  <Icon size={17} aria-hidden="true" />
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded bg-sky-400" />
                  )}
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mt-3 border-t border-slate-800 pt-3">
          {menu.slice(2).map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen?.(false)}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 px-6 py-3 text-sm transition ${active ? "bg-slate-800 text-white" : "hover:bg-slate-800/70 hover:text-white"}`}
              >
                <Icon size={22} aria-hidden="true" />
                {active && (
                  <span className="absolute right-6 h-4 w-1 rounded bg-sky-400" />
                )}
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="mt-auto border-t border-slate-800 p-5">
        <button
          onClick={() => logout()}
          className="w-full rounded-lg px-4 py-3 text-left text-sm hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={16} className="mr-2 inline" /> 로그아웃
        </button>
      </div>
    </aside>
  );
}
