"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Bell,
  Edit2,
  Trash2,
  Clock,
  Pin,
  ChevronRight,
  ChevronLeft,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { FilterPill, SearchInput } from "@/components/shared/ListFilters";
import { useAdminTable } from "@/lib/hooks/use-admin-table";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

const ORDER = [
  { column: "is_pinned", ascending: false },
  { column: "created_at", ascending: false },
] as const;
const PAGE_SIZE = 10;

export default function NoticesPage() {
  const {
    rows: notices,
    loading,
    loadError,
    toggle,
    remove,
  } = useAdminTable<Notice>("notices", ORDER);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "normal">("all");

  const togglePin = (notice: Notice) =>
    toggle(notice, "is_pinned", "상단 고정 설정을 변경했습니다.");
  const deleteNotice = (id: string) =>
    remove(id, {
      confirm: "정말로 이 공지사항을 삭제하시겠습니까?",
      done: "공지사항을 삭제했습니다.",
    });
  /** 조건을 바꾸면 첫 페이지로 돌아간다. */
  const changeSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };
  const changeFilter = (value: typeof filter) => {
    setFilter(value);
    setPage(1);
  };

  const filteredNotices = notices.filter(
    (notice) =>
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filter === "all" || notice.is_pinned === (filter === "pinned")),
  );
  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleNotices = filteredNotices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
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
        <SearchInput
          value={searchTerm}
          onChange={changeSearch}
          placeholder="공지사항 제목으로 검색..."
        />

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 mr-1" />
          <FilterPill
            active={filter === "all"}
            onClick={() => changeFilter("all")}
          >
            전체
          </FilterPill>
          <FilterPill
            active={filter === "pinned"}
            tone="orange"
            onClick={() => changeFilter("pinned")}
          >
            고정됨
          </FilterPill>
          <FilterPill
            active={filter === "normal"}
            tone="slate"
            onClick={() => changeFilter("normal")}
          >
            일반
          </FilterPill>
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
                        onClick={() => togglePin(notice)}
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
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:bg-transparent disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="다음 페이지"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:bg-transparent disabled:text-slate-300 disabled:cursor-not-allowed"
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
