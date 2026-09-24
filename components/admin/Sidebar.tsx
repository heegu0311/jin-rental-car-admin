"use client";
import {
  Table2,
  Settings,
  CalendarCheck,
  Users,
  CircleAlert,
  MessageCircle,
  Car,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
const menu = [
  ["/", "대시보드"],
  ["/vehicles", "차량 관리"],
  ["/reservations", "예약 상담"],
  ["/new-car", "신차 상담"],
  ["/events", "이벤트 관리"],
  ["/notices", "공지사항"],
  ["/inquiries", "1:1 문의"],
  ["/content", "웹사이트 콘텐츠"],
  ["/settings", "사이트 설정"],
];
const icons = [
  Table2,
  Settings,
  CalendarCheck,
  Car,
  Users,
  CircleAlert,
  MessageCircle,
  FileText,
  Settings,
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
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base font-extrabold text-white"
        >
          <span className="size-8 shrink-0 rounded-lg bg-blue-900" />
          <span>
            JIN RENTAL CAR
            <span className="mt-1 block text-[10px] tracking-widest text-sky-400">
              ADMIN SYSTEM
            </span>
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
        {menu.map(([href, label], i) => {
          const Icon = icons[i];
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
