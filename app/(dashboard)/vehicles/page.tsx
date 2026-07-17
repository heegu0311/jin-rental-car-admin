'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Car, Category } from '@/components/vehicles/types'
import { VehicleList } from '@/components/vehicles/VehicleList'
import { VehicleModal } from '@/components/vehicles/VehicleModal'
import { CategoryManager } from '@/components/vehicles/CategoryManager'
import {
  Search,
  Plus,
  Filter,
  Download,
  Car as CarIcon,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Hash
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function VehiclesPage() {
  const [cars, setCars] = useState<Car[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    
    const [vehiclesRes, categoriesRes] = await Promise.all([
      supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_units (id, status)
        `)
        .order('id', { ascending: false }),
      supabase
        .from('vehicle_categories')
        .select('*')
        .order('created_at', { ascending: true })
    ])

    if (!vehiclesRes.error && vehiclesRes.data) {
      const mapped = vehiclesRes.data.map((v: any) => ({
        id: v.id,
        name: v.name,
        year: String(v.year),
        price: String((v.price_monthly || v.price_daily) * 30),
        badge: v.badge || '',
        condition: v.condition || '',
        image: v.image_url || '',
        fuel: v.fuel || '',
        category_id: v.category_id || '',
        pricePolicy: {
          daily: v.price_daily,
          weekly: v.price_weekly,
          monthly: v.price_monthly
        },
        unitCount: v.vehicle_units?.length || 0,
        availableCount: v.vehicle_units?.filter((u: any) => u.status === 'available').length || 0,
        content: v.content || ''
      }))
      setCars(mapped)
    }

    if (!categoriesRes.error && categoriesRes.data) {
      setCategories(categoriesRes.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const badges = Array.from(new Set(cars.map(car => car.badge).filter(Boolean))) as string[]

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.year.includes(searchTerm) ||
      (car.fuel || '').includes(searchTerm)
    const matchesBadge = selectedBadge ? car.badge === selectedBadge : true
    const matchesCategory = selectedCategoryId ? car.category_id === selectedCategoryId : true
    return matchesSearch && matchesBadge && matchesCategory
  })

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
      category_id: carData.category_id || null,
      price_daily: carData.pricePolicy.daily,
      price_weekly: carData.pricePolicy.weekly,
      price_monthly: carData.pricePolicy.monthly,
      type: '일반', // 과거 잔재인 type 컬럼의 NOT NULL 제약조건 우회
    }

    if (editingCar) {
      await supabase.from('vehicles').update(payload).eq('id', editingCar.id)
    } else {
      await supabase.from('vehicles').insert([payload])
    }

    fetchData()
    setIsModalOpen(false)
    setEditingCar(null)
  }

  const handleDeleteCar = async (id: string) => {
    if (window.confirm('모델과 등록된 모든 차량 정보를 삭제하시겠습니까?')) {
      await supabase.from('vehicles').delete().eq('id', id)
      fetchData()
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
        <div className="flex items-center gap-3 flex-wrap">
          <CategoryManager onCategoryChange={fetchData} />
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

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              "whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold border transition-all",
              !selectedCategoryId
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            전체 차량
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold border transition-all",
                selectedCategoryId === cat.id
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

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
              전체 배지
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
      ) : (
        <VehicleList 
          cars={filteredCars} 
          viewMode={viewMode}
          onEdit={handleEditClick}
          onDelete={handleDeleteCar}
        />
      )}

      {isModalOpen && (
        <VehicleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCar}
          car={editingCar}
          categories={categories}
        />
      )}
    </div>
  )
}
