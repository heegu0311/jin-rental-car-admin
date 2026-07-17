'use client'

import { Car } from './types'
import { VehicleImage } from './VehicleImage'
import { Hash, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VehicleListProps {
  cars: Car[]
  viewMode: 'grid' | 'table'
  onEdit: (car: Car) => void
  onDelete: (id: string) => void
}

export function VehicleList({ cars, viewMode, onEdit, onDelete }: VehicleListProps) {
  if (cars.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">등록된 차량이 없습니다.</p>
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cars.map((car) => (
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
                {(car.availableCount ?? 0) === 0 && (
                  <span className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-500/30 uppercase tracking-widest">
                    매진
                  </span>
                )}
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Hash size={10} /> {car.availableCount ?? 0} / {car.unitCount ?? 0}대 사용 가능
                </span>
              </div>
              <div className="absolute top-4 right-4 flex gap-1.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  onClick={() => onEdit(car)}
                  className="p-2.5 bg-white/95 backdrop-blur-sm text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(car.id)}
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
                    onClick={() => onEdit(car)}
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
    )
  }

  return (
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
        <tbody>
          {cars.map((car) => (
            <tr key={car.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <VehicleImage src={car.image} alt={car.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{car.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{car.condition}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{car.year}</span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{car.fuel}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="font-bold text-slate-700">₩{(car.pricePolicy.daily).toLocaleString()}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
                  <Hash size={12} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">
                    <span className={car.availableCount === 0 ? "text-red-500" : "text-blue-600"}>{car.availableCount ?? 0}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    {car.unitCount ?? 0}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                {car.badge ? (
                  <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {car.badge}
                  </span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(car)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(car.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
