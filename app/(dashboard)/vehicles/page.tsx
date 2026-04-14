'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreVertical, 
  Car as CarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { CARS, Car } from '@/lib/data/cars'
import { cn } from '@/lib/utils'

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)

  const badges = Array.from(new Set(CARS.map(car => car.badge).filter(Boolean))) as string[]

  const filteredCars = CARS.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         car.year.includes(searchTerm) ||
                         (car.fuel || '').includes(searchTerm)
    const matchesBadge = selectedBadge ? car.badge === selectedBadge : true
    return matchesSearch && matchesBadge
  })

  const stats = [
    { label: '전체 차량', value: CARS.length, icon: CarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '대여 가능', value: Math.floor(CARS.length * 0.7), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '대여 중', value: Math.floor(CARS.length * 0.2), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '정비/점검', value: Math.ceil(CARS.length * 0.1), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">차량 관리</h1>
          <p className="text-slate-500">등록된 전체 차량 리스트와 상태를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            <Download size={18} />
            <span>엑셀 다운로드</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
            <Plus size={18} />
            <span>새 차량 등록</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="차량명, 연식, 연료 등으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={() => setSelectedBadge(null)}
            className={cn(
              "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              !selectedBadge 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
            )}
          >
            전체
          </button>
          {badges.map(badge => (
            <button 
              key={badge}
              onClick={() => setSelectedBadge(badge)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                selectedBadge === badge 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
              )}
            >
              {badge}
            </button>
          ))}
          <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter size={14} />
            <span>상세 필터</span>
          </button>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCars.map((car) => (
          <div key={car.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300">
            <div className="relative h-48 w-full overflow-hidden">
              <Image 
                src={car.image} 
                alt={car.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {car.badge && (
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-blue-500/30">
                    {car.badge}
                  </span>
                )}
                {car.fuel && (
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold rounded-full border border-slate-200/50">
                    {car.fuel}
                  </span>
                )}
              </div>
              <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm text-slate-600 rounded-full hover:bg-white transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      {car.year}년식
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{car.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{car.condition}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1">일 대여</p>
                  <p className="text-xs font-bold text-slate-800">₩{(car.pricePolicy.daily / 10000).toFixed(1)}만</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-semibold text-blue-500 mb-1">주 대여(일)</p>
                  <p className="text-xs font-bold text-blue-700">₩{(car.pricePolicy.weekly / 10000).toFixed(1)}만</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-semibold text-slate-400 mb-1">월 대여(일)</p>
                  <p className="text-xs font-bold text-slate-800">₩{(car.pricePolicy.monthly / 10000).toFixed(1)}만</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <button className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                  상세 정보
                </button>
                <button className="group/btn flex items-center justify-center gap-2 flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">
                  <span>현황 관리</span>
                  <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredCars.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">검색 결과가 없습니다</h3>
          <p className="text-slate-500">다른 검색어나 필터를 사용해 보세요.</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedBadge(null); }}
            className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            검색 필터 초기화
          </button>
        </div>
      )}
    </div>
  )
}
