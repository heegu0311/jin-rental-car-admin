'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Car,
  Calendar,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/login/actions'

const menuItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/' },
  { icon: Car, label: '차량 관리', href: '/vehicles' },
  { icon: Calendar, label: '이벤트 관리', href: '/events' },
  { icon: Bell, label: '공지사항 관리', href: '/notices' },
  { icon: MessageSquare, label: '1:1 문의', href: '/inquiries' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by rendering a consistent server-side version
  if (!mounted) {
    return (
      <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Car size={20} />
            </div>
            <span className="text-xl font-bold text-blue-700 tracking-tight">JIN ADMIN</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Car size={20} />
          </div>
          <span className="text-xl font-bold text-blue-700 tracking-tight">JIN ADMIN</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg transition-all group",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600")} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} className="text-blue-400" />}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-2 border-t border-slate-100">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all group"
        >
          <Settings size={20} className="text-slate-400 group-hover:text-blue-600" />
          <span className="font-semibold text-sm">설정</span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group text-left"
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
          <span className="font-semibold text-sm">로그아웃</span>
        </button>
      </div>
    </div>
  )
}
