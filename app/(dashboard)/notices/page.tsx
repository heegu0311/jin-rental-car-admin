"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { refreshPublicSiteOrNotify } from "@/lib/public-site";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export default function NoticesPage() {
  const [page, setPage] = useState(1);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "normal">("all");
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    const client = createClient();
    client
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error)
          setLoadError("목록을 불러오지 못했습니다. 다시 시도해주세요.");
        else setNotices(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const togglePin = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("notices")
      .update({ is_pinned: !currentStatus })
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      toast.error("변경을 저장하지 못했습니다.");
    } else {
      refreshPublicSiteOrNotify("상단 고정 설정을 변경했습니다.");
      setNotices(
        notices.map((n) =>
          n.id === id ? { ...n, is_pinned: !currentStatus } : n,
        ),
      );
    }
  };

  const deleteNotice = async (id: string) => {
    if (!window.confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) {
      toast.error("삭제하지 못했습니다.");
    } else {
      refreshPublicSiteOrNotify("공지사항을 삭제했습니다.");
      setNotices(notices.filter((n) => n.id !== id));
    }
  };

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch = notice.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "pinned"
          ? notice.is_pinned
          : !notice.is_pinned;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / 10));
  const currentPage = Math.min(page, totalPages);
  const visibleNotices = filteredNotices.slice(
    (currentPage - 1) * 10,
    currentPage * 10,
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            공지사항 관리
          </h1>
          <p className="text-slate-500">
            고객들에게 알릴 중요한 소식과 안내사항을 관리합니다.
          </p>
        </div>
        <Link
          href="/notices/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          <span>새 공지사항 등록</span>
        </Link>
      </div>

      {loadError && (
        <p role="alert" className="text-red-600">
          {loadError}
        </p>
      )}
      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="공지사항 제목으로 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 mr-1" />
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === "all"
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600",
            )}
          >
            전체
          </button>
          <button
            onClick={() => setFilter("pinned")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === "pinned"
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-500",
            )}
          >
            고정됨
          </button>
          <button
            onClick={() => setFilter("normal")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
              filter === "normal"
                ? "bg-slate-600 border-slate-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-600",
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
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 md:w-16 text-center">
                  고정
                </th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 hidden md:table-cell">
                  등록일
                </th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 md:w-32 text-center">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 text-center">
                      <div className="w-4 h-4 bg-slate-100 rounded mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-16 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredNotices.length > 0 ? (
                visibleNotices.map((notice) => (
                  <tr
                    key={notice.id}
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors group",
                      notice.is_pinned && "bg-orange-50/30",
                    )}
                  >
                    <td className="px-4 md:px-6 py-4 text-center">
                      <button
                        onClick={() => togglePin(notice.id, notice.is_pinned)}
                        className={cn(
                          "p-1.5 md:p-2 rounded-lg transition-all",
                          notice.is_pinned
                            ? "text-orange-500 bg-orange-100 hover:bg-orange-200"
                            : "text-slate-300 hover:text-slate-500 hover:bg-slate-100",
                        )}
                        title={notice.is_pinned ? "고정 해제" : "상단 고정"}
                      >
                        <Pin
                          size={16}
                          fill={notice.is_pinned ? "currentColor" : "none"}
                        />
                      </button>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex flex-col">
                        <Link
                          href={`/notices/${notice.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 text-sm md:text-base"
                        >
                          {notice.title}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 md:hidden">
                          <Clock size={10} />
                          {format(new Date(notice.created_at), "yy.MM.dd", {
                            locale: ko,
                          })}
                          {notice.is_pinned && (
                            <span className="ml-1 text-orange-500 font-bold">
                              #중요
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {format(
                          new Date(notice.created_at),
                          "yyyy.MM.dd HH:mm",
                          { locale: ko },
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        <Link
                          href={`/notices/${notice.id}`}
                          className="p-1.5 md:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="수정"
                        >
                          <Edit2 size={14} className="md:size-4" />
                        </Link>
                        <button
                          onClick={() => deleteNotice(notice.id)}
                          className="p-1.5 md:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="삭제"
                        >
                          <Trash2 size={14} className="md:size-4" />
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
                      <p className="text-lg font-bold text-slate-900 mb-1">
                        등록된 공지사항이 없습니다
                      </p>
                      <p className="text-sm">
                        새로운 소식을 등록하여 공유해보세요.
                      </p>
                      <Link
                        href="/notices/new"
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm"
                      >
                        첫 공지사항 등록하기
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredNotices.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              전체 {filteredNotices.length}개 · {currentPage} / {totalPages}{" "}
              페이지
            </span>
            <div className="flex gap-2">
              <button
                aria-label="이전 페이지"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="p-1.5 rounded-md border border-slate-200 text-slate-300 cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="다음 페이지"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="p-1.5 rounded-md border border-slate-200 text-slate-300 cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
