'use client'

import { useState, useEffect } from 'react'
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
  ExternalLink,
  Edit2,
  Trash2,
  X
} from 'lucide-react'
import { CARS, Car } from '@/lib/data/cars'
import { cn } from '@/lib/utils'

interface VehicleImageProps {
  src?: string
  alt: string
  priority?: boolean
}

function VehicleImage({ src, alt, priority }: VehicleImageProps) {
  const [error, setError] = useState(false)
  
  return (
    <Image
      src={error || !src ? '/empty.jpeg' : src}
      alt={alt}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-500"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={priority}
      onError={() => setError(true)}
    />
  )
}


interface VehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (car: Car) => void
  car?: Car | null
}

function VehicleModal({ isOpen, onClose, onSave, car }: VehicleModalProps) {
  const [formData, setFormData] = useState<Partial<Car>>({
    name: '',
    year: '',
    fuel: '',
    badge: '',
    condition: '',
    image: '',
    pricePolicy: { daily: 0, weekly: 0, monthly: 0 },
    price: ''
  })

  useEffect(() => {
    if (car) {
      setFormData(car)
    } else {
      setFormData({
        name: '',
        year: '2025',
        fuel: '휘발유',
        badge: '',
        condition: '비흡연/완벽점검',
        image: '',
        pricePolicy: { daily: 0, weekly: 0, monthly: 0 },
        price: ''
      })
    }
  }, [car, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: car?.id || Date.now(),
      price: (formData.pricePolicy?.daily || 0).toLocaleString()
    } as Car)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full w-full max-w-lg bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{car ? '차량 정보 수정' : '새 차량 등록'}</h2>
            <p className="text-sm text-slate-500">차량의 상세 정보를 입력해주세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">차량명</label>
                <input
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 아반떼"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">연식</label>
                <input
                  required
                  value={formData.year || ''}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 2025"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">연료</label>
                <input
                  value={formData.fuel || ''}
                  onChange={e => setFormData({ ...formData, fuel: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 휘발유, LPG, 전기"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">배지 (선택)</label>
                <input
                  value={formData.badge || ''}
                  onChange={e => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 인기, 신차, 특가"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">상태 및 옵션</label>
              <input
                value={formData.condition || ''}
                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="예: 비흡연/완벽점검/썬루프"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1">이미지 URL</label>
              <input
                value={formData.image || ''}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">요금 정책 (원 단위)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">일 대여</label>
                <input
                  type="number"
                  required
                  value={formData.pricePolicy?.daily || 0}
                  onChange={e => setFormData({ 
                    ...formData, 
                    pricePolicy: { ...formData.pricePolicy!, daily: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">주 대여(일)</label>
                <input
                  type="number"
                  required
                  value={formData.pricePolicy?.weekly || 0}
                  onChange={e => setFormData({ 
                    ...formData, 
                    pricePolicy: { ...formData.pricePolicy!, weekly: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1">월 대여(일)</label>
                <input
                  type="number"
                  required
                  value={formData.pricePolicy?.monthly || 0}
                  onChange={e => setFormData({ 
                    ...formData, 
                    pricePolicy: { ...formData.pricePolicy!, monthly: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic font-medium">* 입력한 일 대여 요금이 기본 표시 가격으로 설정됩니다.</p>
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-auto border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-8 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const [cars, setCars] = useState<Car[]>(CARS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)

  const badges = Array.from(new Set(cars.map(car => car.badge).filter(Boolean))) as string[]

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.year.includes(searchTerm) ||
      (car.fuel || '').includes(searchTerm)
    const matchesBadge = selectedBadge ? car.badge === selectedBadge : true
    return matchesSearch && matchesBadge
  })

  const stats = [
    { label: '전체 차량', value: cars.length, icon: CarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '대여 가능', value: Math.floor(cars.length * 0.7), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '대여 중', value: Math.floor(cars.length * 0.2), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '정비/점검', value: Math.ceil(cars.length * 0.1), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const handleSaveCar = (car: Car) => {
    if (editingCar) {
      setCars(cars.map(c => c.id === car.id ? car : c))
    } else {
      setCars([car, ...cars])
    }
    setIsModalOpen(false)
    setEditingCar(null)
  }

  const handleDeleteCar = (id: number) => {
    if (window.confirm('정말로 이 차량을 삭제하시겠습니까?')) {
      setCars(cars.filter(c => c.id !== id))
    }
  }

  const handleEditClick = (car: Car) => {
    setEditingCar(car)
    setIsModalOpen(true)
  }


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
          <button 
            onClick={() => { setEditingCar(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
          >
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
              <VehicleImage
                src={car.image}
                alt={car.name}
                priority={CARS.indexOf(car) < 6}
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
              <div className="absolute top-4 right-4 flex gap-1">
                <button 
                  onClick={() => handleEditClick(car)}
                  className="p-2 bg-white/80 backdrop-blur-sm text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  title="수정"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteCar(car.id)}
                  className="p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCar(null); }}
        onSave={handleSaveCar}
        car={editingCar}
      />
    </div>
  )
}
