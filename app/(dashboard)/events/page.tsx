'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar as CalendarIcon, 
  Eye, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Event {
  id: string
  title: string
  description: string
  image_url: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching events:', error)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating event:', error)
    } else {
      setEvents(events.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e))
    }
  }

  const deleteEvent = async (id: string) => {
    if (!window.confirm('정말로 이 이벤트를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting event:', error)
    } else {
      setEvents(events.filter(e => e.id !== id))
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filter === 'all' ? true : 
      filter === 'active' ? event.is_active : !event.is_active
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">이벤트 관리</h1>
          <p className="text-slate-500">홈페이지 팝업 및 진행 중인 이벤트를 관리합니다.</p>
        </div>
        <Link 
          href="/events/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          <span>새 이벤트 등록</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="이벤트 제목으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === 'all' 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
            )}
          >
            전체
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === 'active' 
                ? "bg-emerald-600 border-emerald-600 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600"
            )}
          >
            활성
          </button>
          <button 
            onClick={() => setFilter('inactive')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === 'inactive' 
                ? "bg-slate-600 border-slate-600 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-600"
            )}
          >
            비활성
          </button>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col">
              <div className="relative h-44 w-full bg-slate-100">
                {event.image_url ? (
                  <Image 
                    src={event.image_url} 
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon size={40} className="mb-2 opacity-20" />
                    <span className="text-xs font-medium">이미지 없음</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-full shadow-lg border",
                    event.is_active 
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20" 
                      : "bg-slate-500 text-white border-slate-400 shadow-slate-500/20"
                  )}>
                    {event.is_active ? '진행 중' : '종료'}
                  </span>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200">
                    <Link href={`/events/${event.id}`} className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-md transition-all">
                      <Edit2 size={16} />
                    </Link>
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-white rounded-md transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                  {event.title}
                </h3>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarIcon size={14} className="text-slate-400" />
                    <span>
                      {event.start_date ? format(new Date(event.start_date), 'yyyy.MM.dd', { locale: ko }) : '미정'} 
                      ~ 
                      {event.end_date ? format(new Date(event.end_date), 'yyyy.MM.dd', { locale: ko }) : '미정'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={14} className="text-slate-400" />
                    <span>등록일: {format(new Date(event.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button 
                    onClick={() => toggleActive(event.id, event.is_active)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-bold transition-colors",
                      event.is_active ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {event.is_active ? (
                      <><CheckCircle2 size={14} /> 활성화됨</>
                    ) : (
                      <><XCircle size={14} /> 비활성화됨</>
                    )}
                  </button>
                  
                  <Link 
                    href={`/events/${event.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    상세보기 <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <CalendarIcon size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">등록된 이벤트가 없습니다</h3>
          <p className="text-slate-500">새로운 이벤트를 등록하여 고객들에게 소식을 전해보세요.</p>
          <Link 
            href="/events/new"
            className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            첫 이벤트 등록하기
          </Link>
        </div>
      )}
    </div>
  )
}

function ImageIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  )
}
