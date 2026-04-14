'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Calendar as CalendarIcon,
  AlertCircle,
  X
} from 'lucide-react'
import Link from 'next/link'
import { RichEditor } from '@/components/admin/RichEditor'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface EventFormProps {
  initialData?: {
    id?: string
    title: string
    description: string
    image_url: string
    start_date: string
    end_date: string
    is_active: boolean
  }
}

export function EventForm({ initialData }: EventFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '')
  const [startDate, setStartDate] = useState(initialData?.start_date?.split('T')[0] || '')
  const [endDate, setEndDate] = useState(initialData?.end_date?.split('T')[0] || '')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!title) {
      setError('제목을 입력해주세요.')
      setLoading(false)
      return
    }

    const eventData = {
      title,
      description,
      image_url: imageUrl,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      is_active: isActive,
    }

    try {
      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialData.id)
        
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('events')
          .insert([eventData])
        
        if (error) throw error
      }

      router.push('/events')
      router.refresh()
    } catch (err: any) {
      console.error('Error saving event:', err)
      setError(err.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/events" 
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {initialData ? '이벤트 수정' : '새 이벤트 등록'}
            </h1>
            <p className="text-slate-500">이벤트 정보를 입력하고 발행하세요.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/events"
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            취소
          </Link>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{loading ? '저장 중...' : '저장하기'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-700">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">이벤트 제목 <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                placeholder="예) 봄맞이 전 차종 20% 할인 이벤트"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">이벤트 상세 내용</label>
              <RichEditor 
                content={description}
                onChange={setDescription}
                placeholder="이벤트 상세 내용을 입력하세요. 이미지, 링크 등을 활용할 수 있습니다."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Settings */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">설정</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">활성화 상태</p>
                  <p className="text-xs text-slate-500">사용자에게 노출 여부</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    isActive ? "bg-blue-600" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      isActive ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <div className="space-y-2 text-sm font-bold text-slate-700">공개 기간</div>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex items-center justify-center text-slate-400 font-bold">~</div>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">대표 이미지 (썸네일)</h3>
            
            <div className="space-y-4">
              <div 
                className={cn(
                  "relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden bg-slate-50 group",
                  imageUrl ? "border-solid border-slate-200" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                )}
              >
                {imageUrl ? (
                  <>
                    <img 
                      src={imageUrl} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="p-2 bg-white text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-400 p-4 text-center">
                    <ImageIcon size={32} className="mb-2 opacity-30" />
                    <p className="text-xs font-semibold">이벤트 대표 이미지를 설정하세요.</p>
                    <p className="text-[10px] mt-1 opacity-70">URL을 입력하거나 아래 필드에 입력하세요.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">이미지 URL</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
