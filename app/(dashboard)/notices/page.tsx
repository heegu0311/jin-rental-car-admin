'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Bell, 
  Edit2, 
  Trash2, 
  Clock,
  Pin,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Notice {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pinned' | 'normal'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notices:', error)
    } else {
      setNotices(data || [])
    }
    setLoading(false)
  }

  const togglePin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('notices')
      .update({ is_pinned: !currentStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating notice:', error)
    } else {
      setNotices(notices.map(n => n.id === id ? { ...n, is_pinned: !currentStatus } : n))
    }
  }

  const deleteNotice = async (id: string) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting notice:', error)
    } else {
      setNotices(notices.filter(n => n.id !== id))
    }
  }

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filter === 'all' ? true : 
      filter === 'pinned' ? notice.is_pinned : !notice.is_pinned
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">공지사항 관리</h1>
          <p className="text-slate-500">고객들에게 알릴 중요한 소식과 안내사항을 관리합니다.</p>
        </div>
        <Link 
          href="/notices/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          <span>새 공지사항 등록</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="공지사항 제목으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 mr-1" />
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
            onClick={() => setFilter('pinned')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === 'pinned' 
                ? "bg-orange-500 border-orange-500 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-500"
            )}
          >
            고정됨
          </button>
          <button 
            onClick={() => setFilter('normal')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === 'normal' 
                ? "bg-slate-600 border-slate-600 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-600"
            )}
          >
            일반
          </button>
        </div>
      </div>

      {/* Notices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">고정</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">등록일</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 text-center"><div className="w-4 h-4 bg-slate-100 rounded mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-3/4" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredNotices.length > 0 ? (
                filteredNotices.map((notice) => (
                  <tr 
                    key={notice.id} 
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors group",
                      notice.is_pinned && "bg-orange-50/30"
                    )}
                  >
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => togglePin(notice.id, notice.is_pinned)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          notice.is_pinned 
                            ? "text-orange-500 bg-orange-100 hover:bg-orange-200" 
                            : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                        )}
                        title={notice.is_pinned ? "고정 해제" : "상단 고정"}
                      >
                        <Pin size={16} fill={notice.is_pinned ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link 
                          href={`/notices/${notice.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {notice.title}
                          {notice.is_pinned && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600">
                              중요
                            </span>
                          )}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {format(new Date(notice.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/notices/${notice.id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="수정"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button 
                          onClick={() => deleteNotice(notice.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Bell size={40} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold text-slate-900 mb-1">등록된 공지사항이 없습니다</p>
                      <p className="text-sm">새로운 소식을 등록하여 공유해보세요.</p>
                      <Link 
                        href="/notices/new"
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm"
                      >
                        첫 공지사항 등록하기
                      </Link>
                      <button 
                        onClick={async () => {
                          const exampleNotices = [
                            {
                              title: '[안내] 진렌트카 서비스 그랜드 오픈!',
                              content: '<h1>진렌트카 공식 홈페이지가 오픈되었습니다!</h1><p>안녕하세요, 진렌트카입니다. 고객님들께 더 나은 렌탈 경험을 제공해드리기 위해 공식 홈페이지를 새롭게 오픈하였습니다.</p><p>앞으로 홈페이지를 통해 차량 예약, 이벤트 소식 등을 편리하게 확인하실 수 있습니다.</p><p>많은 관심과 성원 부탁드립니다. 감사합니다.</p>',
                              is_pinned: true,
                            },
                            {
                              title: '[공지] 2024년 봄맞이 전 차종 할인 프로모션 안내',
                              content: '<h2>봄맞이 전 차종 10%~20% 할인!</h2><p>따뜻한 봄을 맞아 진렌트카에서 파격적인 할인 프로모션을 준비했습니다.</p><ul><li>기한: 2024년 4월 1일 ~ 5월 31일</li><li>대상: 홈페이지 예약 전 객체</li><li>내용: 주중 20%, 주말 10% 할인</li></ul><p>지금 바로 예약하시고 즐거운 봄나들이 떠나보세요!</p>',
                              is_pinned: true,
                            },
                            {
                              title: '[필독] 렌트 차량 반납 시 주의사항 안내',
                              content: '<p>차량 반납 시 아래 사항을 반드시 확인해 주시기 바랍니다.</p><ol><li>연료 부족 시 주유비가 청구될 수 있습니다.</li><li>차량 내 쓰레기는 수거해 주세요.</li><li>반납 시간을 엄수해 주시기 바랍니다. (지연 시 추가 요금 발생)</li></ol>',
                              is_pinned: false,
                            },
                            {
                              title: '장기 렌트 서비스 이용 가이드',
                              content: '<p>진렌트카 장기 렌트 서비스는 1개월 이상의 렌탈 고객님을 위한 경제적인 서비스입니다.</p><p>자세한 상담은 1:1 문의 또는 고객센터를 이용해 주세요.</p>',
                              is_pinned: false,
                            },
                            {
                              title: '신규 가입 회원 5,000원 쿠폰 지급 종료 안내',
                              content: '<p>그동안 진행되었던 신규 가입 회원 쿠폰 지급 이벤트가 종료될 예정입니다.</p><p>종료일: 2024년 4월 30일</p><p>이미 발급 받으신 쿠폰은 유효기간 내에 사용이 가능합니다.</p>',
                              is_pinned: false,
                            }
                          ];
                          
                          setLoading(true);
                          const { data, error } = await supabase.from('notices').insert(exampleNotices);
                          if (error) {
                            alert('예시 데이터 추가 중 오류가 발생했습니다: ' + error.message);
                          } else {
                            fetchNotices();
                          }
                          setLoading(false);
                        }}
                        className="mt-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        예시 데이터로 채우기
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        {filteredNotices.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              전체 {filteredNotices.length}개 중 1-{filteredNotices.length} 표시
            </span>
            <div className="flex gap-2">
              <button disabled className="p-1.5 rounded-md border border-slate-200 text-slate-300 cursor-not-allowed">
                <ChevronLeft size={18} />
              </button>
              <button disabled className="p-1.5 rounded-md border border-slate-200 text-slate-300 cursor-not-allowed">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
