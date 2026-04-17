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
  X,
  LayoutGrid,
  List,
  Hash,
  Calendar,
  Fuel,
  Tag
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export interface Car {
  id: string;
  name: string;
  year: string;
  price: string;
  badge?: string;
  condition: string;
  image: string;
  fuel?: string;
  pricePolicy: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  unitCount?: number;
  availableCount?: number;
}

interface VehicleUnit {
  id: string;
  plate_number: string;
  status: 'available' | 'rented' | 'maintenance';
}

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
  const [units, setUnits] = useState<VehicleUnit[]>([])
  const [newPlate, setNewPlate] = useState('')
  const [isAddingUnit, setIsAddingUnit] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (car) {
      setFormData(car)
      fetchUnits(car.id)
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
      setUnits([])
    }
  }, [car, isOpen])

  const fetchUnits = async (vehicleId: string) => {
    const { data } = await supabase
      .from('vehicle_units')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
    if (data) setUnits(data)
  }

  const handleAddUnit = async () => {
    if (!newPlate.trim() || !car?.id) return
    setIsAddingUnit(true)
    const { error } = await supabase
      .from('vehicle_units')
      .insert([{ 
        vehicle_id: car.id, 
        plate_number: newPlate.trim(), 
        status: 'available' 
      }])
    
    if (!error) {
      setNewPlate('')
      fetchUnits(car.id)
    } else {
      alert('이미 등록된 번호이거나 오류가 발생했습니다.')
    }
    setIsAddingUnit(false)
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('해당 차량 번호를 삭제하시겠습니까?')) return
    const { error } = await supabase
      .from('vehicle_units')
      .delete()
      .eq('id', unitId)
    
    if (!error && car?.id) {
      fetchUnits(car.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: car?.id || '', // New cars will be handled by Parent's Supabase logic
      price: (formData.pricePolicy?.daily || 0).toLocaleString()
    } as Car)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full w-full max-w-lg bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{car ? '차량 정보 수정' : '새 차량 등록'}</h2>
            <p className="text-sm text-slate-500">차량의 상세 정보를 관리합니다.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <CarIcon size={14} /> 기본 제원 정보
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">차량 모델명</label>
                  <input
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 아반떼"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">출시 연도</label>
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
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">사용 연료</label>
                  <input
                    value={formData.fuel || ''}
                    onChange={e => setFormData({ ...formData, fuel: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 휘발유, LPG, 전기"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">노출 배지</label>
                  <input
                    value={formData.badge || ''}
                    onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 인기, 신차, 특가"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">상태 및 옵션 설명</label>
                <input
                  value={formData.condition || ''}
                  onChange={e => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="예: 비흡연/완벽점검/썬루프"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">차량 이미지 URL</label>
                <input
                  value={formData.image || ''}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <Tag size={14} /> 요금 체계 (원 단위)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">일 대여</label>
                  <input
                    type="number"
                    required
                    value={formData.pricePolicy?.daily || 0}
                    onChange={e => setFormData({ 
                      ...formData, 
                      pricePolicy: { ...formData.pricePolicy!, daily: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">주 대여(일)</label>
                  <input
                    type="number"
                    required
                    value={formData.pricePolicy?.weekly || 0}
                    onChange={e => setFormData({ 
                      ...formData, 
                      pricePolicy: { ...formData.pricePolicy!, weekly: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">월 대여(일)</label>
                  <input
                    type="number"
                    required
                    value={formData.pricePolicy?.monthly || 0}
                    onChange={e => setFormData({ 
                      ...formData, 
                      pricePolicy: { ...formData.pricePolicy!, monthly: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Unit Management Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-6">
            <h3 className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2"><Hash size={14} /> 실물 차량 관리 (번호판)</span>
              {car && <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">총 {units.length}대</span>}
            </h3>
            
            {car ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
                    placeholder="차량 번호 입력 (예: 29로3714)"
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
                  />
                  <button 
                    type="button"
                    disabled={isAddingUnit || !newPlate.trim()}
                    onClick={handleAddUnit}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    추가
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {units.length > 0 ? units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-slate-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Hash size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{unit.plate_number}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              unit.status === 'available' ? "bg-emerald-500" : unit.status === 'rented' ? "bg-blue-500" : "bg-red-500"
                            )} />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{unit.status}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )) : (
                    <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400 font-medium whitespace-pre-wrap">등록된 실물 차량 번호가 없습니다.\n사용자에게 "예약 불가"로 표시됩니다.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center bg-white border border-slate-200 rounded-xl px-6">
                <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 italic font-medium leading-relaxed">
                  개별 차량 번호 등록 및 재고 관리는\n기본 차량 모델 정보를 상단에서 저장한 후에 가능합니다.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-6 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            form="vehicle-form"
            type="submit"
            className="flex-[2] py-3 px-8 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            기본 정보 저장하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const supabase = createClient()

  const fetchCars = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        vehicle_units (id, status)
      `)
      .order('id', { ascending: false })

    if (!error && data) {
      const mapped = data.map((v: any) => ({
        id: v.id,
        name: v.name,
        year: String(v.year),
        price: String(v.price_daily * 30),
        badge: v.badge || '',
        condition: v.condition || '',
        image: v.image_url || '',
        fuel: v.fuel || '',
        pricePolicy: {
          daily: v.price_daily,
          weekly: v.price_weekly,
          monthly: v.price_monthly
        },
        unitCount: v.vehicle_units?.length || 0,
        availableCount: v.vehicle_units?.filter((u: any) => u.status === 'available').length || 0
      }))
      setCars(mapped)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCars()
  }, [])

  const badges = Array.from(new Set(cars.map(car => car.badge).filter(Boolean))) as string[]

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.year.includes(searchTerm) ||
      (car.fuel || '').includes(searchTerm)
    const matchesBadge = selectedBadge ? car.badge === selectedBadge : true
    return matchesSearch && matchesBadge
  })

  // Actual dynamic stats from the data
  const totalUnits = cars.reduce((acc, car) => acc + (car.unitCount || 0), 0)
  const availableUnits = cars.reduce((acc, car) => acc + (car.availableCount || 0), 0)
  const rentedUnits = totalUnits - availableUnits

  const stats = [
    { label: '전체 모델', value: cars.length, icon: CarIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: '전체 차량(대)', value: totalUnits, icon: Hash, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '대여 가능', value: availableUnits, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '대여 중', value: rentedUnits, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const handleSaveCar = async (carData: Car) => {
    const payload = {
      name: carData.name,
      year: carData.year,
      fuel: carData.fuel,
      badge: carData.badge,
      condition: carData.condition,
      image_url: carData.image,
      price_daily: carData.pricePolicy.daily,
      price_weekly: carData.pricePolicy.weekly,
      price_monthly: carData.pricePolicy.monthly,
    }

    if (editingCar) {
      await supabase.from('vehicles').update(payload).eq('id', editingCar.id)
    } else {
      await supabase.from('vehicles').insert([payload])
    }
    
    fetchCars()
    setIsModalOpen(false)
    setEditingCar(null)
  }

  const handleDeleteCar = async (id: string) => {
    if (window.confirm('모델과 등록된 모든 차량 정보를 삭제하시겠습니까?')) {
      await supabase.from('vehicles').delete().eq('id', id)
      fetchCars()
    }
  }

  const handleEditClick = (car: Car) => {
    setEditingCar(car)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">차량 관리</h1>
          <p className="text-slate-500">등록된 전체 차량 모델 및 개별 차량 리스트를 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            <Download size={18} />
            <span className="hidden sm:inline">엑셀 다운로드</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md">
            <div className={cn("p-2.5 md:p-3 rounded-xl shrink-0", stat.bg, stat.color)}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="모델명, 연식, 연료 등으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedBadge(null)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all uppercase tracking-wider",
                !selectedBadge
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
              )}
            >
              전체
            </button>
            {badges.map(badge => (
              <button
                key={badge}
                onClick={() => setSelectedBadge(badge)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all uppercase tracking-wider",
                  selectedBadge === badge
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                )}
              >
                {badge}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t xl:border-t-0 pt-4 xl:pt-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <List size={18} />
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter size={14} />
            <span>상세 필터</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 animate-pulse">차량 데이터를 불러오는 중...</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <div key={car.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col">
              <div className="relative h-52 w-full overflow-hidden bg-slate-50">
                <VehicleImage
                  src={car.image}
                  alt={car.name}
                  priority={cars.indexOf(car) < 6}
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {car.badge && (
                    <span className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-blue-500/30 uppercase tracking-widest">
                      {car.badge}
                    </span>
                  )}
                  {car.availableCount === 0 && (
                    <span className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-500/30 uppercase tracking-widest">
                      매진
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Hash size={10} /> {car.availableCount} / {car.unitCount}대 사용 가능
                  </span>
                </div>
                <div className="absolute top-4 right-4 flex gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => handleEditClick(car)}
                    className="p-2.5 bg-white/95 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteCar(car.id)}
                    className="p-2.5 bg-white/95 backdrop-blur-sm text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">
                      {car.year} Year
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">
                      {car.fuel}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{car.name}</h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-1 font-medium">{car.condition}</p>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50/50 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">일 대여</p>
                      <p className="text-xs font-bold text-slate-800">₩{(car.pricePolicy.daily / 10000).toFixed(1)}만</p>
                    </div>
                    <div className="p-2 bg-blue-50/30 rounded-xl border border-blue-100/50">
                      <p className="text-[9px] font-bold text-blue-400 mb-1 uppercase tracking-tighter">주 대여</p>
                      <p className="text-xs font-bold text-blue-700">₩{(car.pricePolicy.weekly / 10000).toFixed(1)}만</p>
                    </div>
                    <div className="p-2 bg-slate-50/50 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tighter">월 대여</p>
                      <p className="text-xs font-bold text-slate-800">₩{(car.pricePolicy.monthly / 10000).toFixed(1)}만</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClick(car)}
                      className="group/btn flex items-center justify-center gap-2 flex-1 py-3 text-xs font-bold text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      <Hash size={14} />
                      <span>재고/현황 관리</span>
                      <ExternalLink size={12} className="opacity-50 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">차량 정보</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">연식/연료</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">일 대여가</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">재고 현황</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">노출 배지</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCars.map((car) => (
                <tr key={car.id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image src={car.image || '/empty.jpeg'} alt={car.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{car.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{car.condition}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-slate-700">{car.year}년</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{car.fuel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-sm text-slate-700">
                    ₩{car.pricePolicy.daily.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          car.availableCount === 0 ? "bg-red-500" : "bg-emerald-500"
                        )} />
                        <span className="text-sm font-bold text-slate-700">{car.availableCount} / {car.unitCount}대</span>
                      </div>
                      <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full", car.availableCount === 0 ? "bg-red-500" : "bg-emerald-500")} 
                          style={{ width: `${car.unitCount ? (car.availableCount / car.unitCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {car.badge ? (
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-widest border border-blue-100">
                        {car.badge}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(car)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCar(car.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCars.length === 0 && !loading && (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
            <CarIcon size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">검색된 차량이 없습니다</h3>
          <p className="text-slate-400 font-medium">다른 검색어를 입력하거나 필터를 초기화해 보세요.</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedBadge(null); }}
            className="mt-6 px-6 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            모든 차량 보기
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
