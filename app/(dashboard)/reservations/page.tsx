'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  User,
  Phone,
  Car,
  X,
  Trash2,
  MoreVertical,
  Check,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Reservation {
  id: string
  car_name: string
  start_date: string
  period: string
  package_km: string
  options: string[]
  user_name: string
  user_phone: string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reservations:', error)
    } else {
      const normalizedData = (data || []).map(res => ({
        ...res,
        options: res.options || []
      }))
      setReservations(normalizedData)
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    setIsUpdating(true)
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('상태 업데이트 중 오류가 발생했습니다.')
      console.error('Error updating status:', error)
    } else {
      setReservations(reservations.map(res => 
        res.id === id ? { ...res, status: newStatus } : res
      ))
      if (selectedReservation?.id === id) {
        setSelectedReservation(prev => prev ? { ...prev, status: newStatus } : null)
      }
    }
    setIsUpdating(false)
  }

  const deleteReservation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('정말로 이 예약 내역을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting reservation:', error)
    } else {
      setReservations(reservations.filter(res => res.id !== id))
    }
  }

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      res.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.car_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.user_phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' ? true : res.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">차량 예약 상담 관리</h1>
          <p className="text-slate-500">웹사이트에서 접수된 차량 예약 상담 내역을 관리합니다.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="이름, 차량명, 또는 연락처 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 mr-1" />
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                statusFilter === status 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
              )}
            >
              {status === 'all' ? '전체' : status === 'pending' ? '대기중' : status === 'confirmed' ? '상담완료' : '취소'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-[#020617]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">상태</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">신청자</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">희망 차량</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">대여 시작일</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">제출일</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-6 bg-slate-100 rounded" /></td>
                  </tr>
                ))
              ) : filteredReservations.length > 0 ? (
                filteredReservations.map((res) => (
                  <tr 
                    key={res.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReservation(res)}
                  >
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                        res.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        res.status === 'cancelled' ? "bg-red-50 text-red-600 border border-red-100" :
                        "bg-amber-50 text-amber-600 border border-amber-100"
                      )}>
                        {res.status === 'confirmed' ? '상담완료' : res.status === 'cancelled' ? '취소' : '대기중'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{res.user_name}</span>
                        <span className="text-xs text-slate-500">{res.user_phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{res.car_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{res.start_date}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {format(new Date(res.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => deleteReservation(res.id, e)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedReservation(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">예약 상담 상세</h3>
              <button onClick={() => setSelectedReservation(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">신청자</p>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <User size={14} className="text-blue-500" />
                    {selectedReservation.user_name}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">연락처</p>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Phone size={14} className="text-blue-500" />
                    {selectedReservation.user_phone}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Car size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">선택 차량</p>
                    <p className="font-bold text-slate-900">{selectedReservation.car_name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">대여일</p>
                    <p className="text-sm font-semibold">{selectedReservation.start_date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">대여 기간</p>
                    <p className="text-sm font-semibold">{selectedReservation.period}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">상품 유형</p>
                    <p className="text-sm font-semibold">{selectedReservation.package_km}</p>
                  </div>
                </div>

                {selectedReservation.options && selectedReservation.options.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">추가 옵션</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedReservation.options.map(opt => (
                        <span key={opt} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">{opt}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-900">처리 상태 변경</p>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => updateStatus(selectedReservation.id, 'pending')}
                    disabled={isUpdating}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      selectedReservation.status === 'pending' ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    대기중
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedReservation.id, 'confirmed')}
                    disabled={isUpdating}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      selectedReservation.status === 'confirmed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    상담완료
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedReservation.id, 'cancelled')}
                    disabled={isUpdating}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      selectedReservation.status === 'cancelled' ? "bg-red-50 border-red-200 text-red-600 font-black" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
