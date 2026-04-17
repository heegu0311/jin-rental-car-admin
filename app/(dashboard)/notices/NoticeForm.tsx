'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Pin,
  Check
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const RichEditor = dynamic(() => import('@/components/admin/RichEditor').then(mod => mod.RichEditor), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-xl border border-slate-200" />
})

interface NoticeFormProps {
  initialData?: {
    id?: string
    title: string
    content: string
    is_pinned: boolean
  }
}

export function NoticeForm({ initialData }: NoticeFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned ?? false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!title) {
      setError('제목을 입력해주세요.')
      setLoading(false)
      return
    }

    if (!content || content === '<p></p>') {
      setError('내용을 입력해주세요.')
      setLoading(false)
      return
    }

    const noticeData = {
      title,
      content,
      is_pinned: isPinned,
    }

    try {
      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from('notices')
          .update(noticeData)
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        // Create
        // Note: author_id handles current user if needed, but schema allows null or we can get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        const { error } = await supabase
          .from('notices')
          .insert([{ ...noticeData, author_id: user?.id }])

        if (error) throw error
      }

      router.push('/notices')
      router.refresh()
    } catch (err: any) {
      console.error('Error saving notice:', err)
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
            href="/notices"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all font-bold"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {initialData ? '공지사항 수정' : '새 공지사항 등록'}
            </h1>
            <p className="text-slate-500">공지사항 내용을 입력하고 게시하세요.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notices"
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">공지 제목 <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="공지사항 제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">상세 내용 <span className="text-rose-500">*</span></label>
              <RichEditor
                content={content}
                onChange={setContent}
                placeholder="공지할 내용을 상세히 입력하세요. 이미지와 링크를 포함할 수 있습니다."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">게시 설정</h3>

            <div className="space-y-4">
              <div 
                onClick={() => setIsPinned(!isPinned)}
                className={cn(
                  "cursor-pointer flex items-center justify-between p-4 rounded-xl border transition-all",
                  isPinned 
                    ? "bg-orange-50 border-orange-200" 
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isPinned ? "bg-orange-500 text-white" : "bg-white text-slate-400 shadow-sm border border-slate-100"
                  )}>
                    <Pin size={18} fill={isPinned ? "currentColor" : "none"} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">상단 고정</p>
                    <p className="text-xs text-slate-500">목록 최상단에 노출</p>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                  isPinned ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-200"
                )}>
                  {isPinned && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-[11px] text-blue-600 font-semibold leading-relaxed">
                  상단 고정된 공지사항은 등록일과 관계없이 목록의 처음에 표시되며, 주황색 강조 표시가 붙습니다. 중요한 공지사항에 활용하세요.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">도움말</h3>
            <ul className="space-y-3">
              {[
                '이미지는 에디터 툴바의 이미지 아이콘을 통해 URL로 삽입할 수 있습니다.',
                '단락, 제목, 목록 등 서식을 활용하여 가독성을 높여주세요.',
                '저장 후에는 사용자 웹사이트의 공지사항 페이지에 바로 반영됩니다.'
              ].map((text, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
                  <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </form>
  )
}
