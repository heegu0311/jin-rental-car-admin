'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Car, VehicleUnit, Category } from './types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Car as CarIcon, X, Camera, Trash2, Loader2, Tag, Hash, AlertCircle } from 'lucide-react'

const RichEditor = dynamic(() => import('@/components/admin/RichEditor').then(mod => mod.RichEditor), { ssr: false })

interface VehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (car: Car) => void
  car?: Car | null
  categories: Category[]
}

export function VehicleModal({ isOpen, onClose, onSave, car, categories }: VehicleModalProps) {
  const [formData, setFormData] = useState<Partial<Car>>({
    name: '',
    year: '2025',
    fuel: '휘발유',
    badge: '',
    condition: '비흡연/완벽점검',
    image: '',
    category_id: '',
    pricePolicy: { daily: 0, weekly: 0, monthly: 0 },
    price: '',
    content: ''
  })
  const [units, setUnits] = useState<VehicleUnit[]>([])
  const [newPlate, setNewPlate] = useState('')
  const [isAddingUnit, setIsAddingUnit] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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
        category_id: '',
        pricePolicy: { daily: 0, weekly: 0, monthly: 0 },
        price: '',
        content: ''
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image: publicUrl })
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: car?.id || '',
      price: ((formData.pricePolicy?.monthly || formData.pricePolicy?.daily || 0) * 30).toLocaleString()
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
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">카테고리</label>
                <select
                  value={formData.category_id || ''}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">카테고리 선택 (예: 소형, 중형)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

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
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">차량 이미지</label>
                <div className="relative group">
                  {formData.image ? (
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-200">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer p-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-2">
                          <Camera size={16} />
                          이미지 변경
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                      isUploading ? "bg-slate-50 border-slate-200" : "bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30"
                    )}>
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-xs font-bold text-slate-500">업로드 중...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                            <Camera size={24} />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-slate-600">클릭하여 이미지 업로드</p>
                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP (최대 5MB)</p>
                          </div>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-4">
                <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase">상세 내용</label>
                <RichEditor
                  content={formData.content || ''}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder="차량 상세 설명을 입력하세요..."
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
                      <p className="text-xs text-slate-400 font-medium whitespace-pre-wrap">등록된 실물 차량 번호가 없습니다.\n사용자에게 &quot;예약 불가&quot;로 표시됩니다.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center bg-white border border-slate-200 rounded-xl px-6">
                <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 italic font-medium leading-relaxed">
                  개별 차량 번호 등록 및 재고 관리는<br/>기본 차량 모델 정보를 상단에서 저장한 후에 가능합니다.
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
