'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  Filter,
  User,
  Phone,
  Mail,
  Send,
  X,
  Trash2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Inquiry {
  id: string
  user_name: string
  user_phone: string
  user_email: string | null
  title: string
  content: string
  status: 'pending' | 'answered'
  answer_content: string | null
  answered_at: string | null
  created_at: string
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [answerContent, setAnswerContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inquiries:', error)
    } else {
      // If DB is empty, provide some default mock data for visualization
      const realData = data || []
      if (realData.length === 0) {
        setInquiries([
          {
            id: 'mock-1',
            user_name: '홍길동',
            user_phone: '010-1234-5678',
            user_email: 'hong@example.com',
            title: '장기 렌트 및 보험 조건 문의',
            content: '안녕하세요.\n\n여름 휴가 기간 동안 아반떼나 K5 정도로 2주일 정도 렌트하고 싶습니다.\n만 26세 이상 보험 가입 조건과 완전자차 포함 시 총 견적이 어떻게 되는지 궁금합니다.',
            status: 'pending',
            answer_content: null,
            answered_at: null,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'mock-2',
            user_name: '이순신',
            user_phone: '010-9999-8888',
            user_email: 'sunshin@joseon.com',
            title: '차량 정비 및 세차 상태 문의',
            content: '차량 내부 세차 상태가 항상 청결한지 궁금합니다. 아이들과 함께 탈 예정이라 위생이 중요해서요.',
            status: 'answered',
            answer_content: '안녕하세요 고객님!\n\n저희 진렌트카는 모든 차량 반납 시 전문 세차팀이 고온 스팀 소독 및 실내 클리닝을 진행하고 있습니다. 안심하고 이용하셔도 좋습니다.\n\n감사합니다.',
            answered_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ])
      } else {
        setInquiries(realData)
      }
    }
    setLoading(false)
  }

  const handleReply = async () => {
    if (!selectedInquiry || !answerContent.trim()) return

    setIsSubmitting(true)
    const { error } = await supabase
      .from('inquiries')
      .update({
        status: 'answered',
        answer_content: answerContent,
        answered_at: new Date().toISOString()
      })
      .eq('id', selectedInquiry.id)

    if (error) {
      alert('답변 등록 중 오류가 발생했습니다.')
      console.error('Error replying:', error)
    } else {
      setInquiries(inquiries.map(iq => 
        iq.id === selectedInquiry.id 
          ? { ...iq, status: 'answered', answer_content: answerContent, answered_at: new Date().toISOString() } 
          : iq
      ))
      setSelectedInquiry(null)
      setAnswerContent('')
    }
    setIsSubmitting(false)
  }

  const deleteInquiry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('정말로 이 문의를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting inquiry:', error)
    } else {
      setInquiries(inquiries.filter(iq => iq.id !== id))
    }
  }

  const filteredInquiries = inquiries.filter(iq => {
    const matchesSearch = 
      iq.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iq.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' ? true : iq.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">1:1 문의 관리</h1>
          <p className="text-slate-500">고객들이 남긴 문의사항을 확인하고 답변을 관리합니다.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="이름 또는 제목으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 mr-1" />
          <button 
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              statusFilter === 'all' 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
            )}
          >
            전체
          </button>
          <button 
            onClick={() => setStatusFilter('pending')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              statusFilter === 'pending' 
                ? "bg-amber-500 border-amber-500 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-500"
            )}
          >
            대기중
          </button>
          <button 
            onClick={() => setStatusFilter('answered')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              statusFilter === 'answered' 
                ? "bg-emerald-500 border-emerald-500 text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-500"
            )}
          >
            답변완료
          </button>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-[#020617]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 md:w-32 text-center">상태</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 md:w-32">작성자</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">문의 제목</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 hidden md:table-cell">등록일</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 md:w-20 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-20 h-6 bg-slate-100 rounded-full mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-3/4" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                    <td className="px-6 py-4"><div className="w-8 h-8 bg-slate-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : filteredInquiries.length > 0 ? (
                filteredInquiries.map((iq) => (
                  <tr 
                    key={iq.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedInquiry(iq)}
                  >
                    <td className="px-4 md:px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold",
                        iq.status === 'answered' 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      )}>
                        {iq.status === 'answered' ? (
                          <>
                            <CheckCircle2 size={10} className="mr-1 md:size-3" />
                            <span className="hidden sm:inline">답변완료</span>
                            <span className="sm:hidden">완료</span>
                          </>
                        ) : (
                          <>
                            <Clock size={10} className="mr-1 md:size-3" />
                            <span className="hidden sm:inline">대기중</span>
                            <span className="sm:hidden">대기</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className="font-semibold text-slate-900 text-sm md:text-base">{iq.user_name}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-sm md:text-base">
                          {iq.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 md:hidden">
                          <Clock size={10} />
                          {format(new Date(iq.created_at), 'yy.MM.dd', { locale: ko })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {format(new Date(iq.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <button 
                        onClick={(e) => deleteInquiry(iq.id, e)}
                        className="p-1.5 md:p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="삭제"
                      >
                        <Trash2 size={14} className="md:size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <MessageSquare size={40} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold text-slate-900 mb-1">문의 내역이 없습니다</p>
                      <p className="text-sm">고객들의 소중한 문의를 기다려주세요.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 shadow-2xl">
          <div 
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] text-[#020617]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  selectedInquiry.status === 'answered' ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <h3 className="font-bold text-slate-900">문의 상세 내역</h3>
              </div>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* User Info Card */}
              <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">성함</p>
                    <p className="text-sm font-bold text-slate-900">{selectedInquiry.user_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">연락처</p>
                    <p className="text-sm font-bold text-slate-900">{selectedInquiry.user_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">이메일</p>
                    <p className="text-sm font-bold text-slate-900">{selectedInquiry.user_email || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Inquiry Message */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">문의 내용</h4>
                  <span className="text-xs text-slate-400 font-medium">
                    {format(new Date(selectedInquiry.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </span>
                </div>
                <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <h5 className="font-bold text-slate-900 mb-3 text-lg border-b border-slate-50 pb-2">
                    {selectedInquiry.title}
                  </h5>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedInquiry.content}
                  </p>
                </div>
              </div>

              {/* Reply Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">관리자 답변</h4>
                {selectedInquiry.status === 'answered' ? (
                  <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <div className="flex items-center justify-between mb-3 border-b border-emerald-100/50 pb-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        답변 완료
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {selectedInquiry.answered_at && format(new Date(selectedInquiry.answered_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                      {selectedInquiry.answer_content}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea 
                      placeholder="고객님께 전달할 정성스러운 답변을 작성해주세요."
                      value={answerContent}
                      onChange={(e) => setAnswerContent(e.target.value)}
                      className="w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 resize-none opacity-100 placeholder:text-slate-400"
                    />
                    <button 
                      onClick={handleReply}
                      disabled={isSubmitting || !answerContent.trim()}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          답변 등록하기
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
