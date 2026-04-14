'use client'

import { Search, Bell, User } from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-400 transition-all outline-none text-sm text-slate-900"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600 rounded-full transition-all">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700">관리자</p>
            <p className="text-xs text-slate-500">admin@jin-rental.com</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-100">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}
