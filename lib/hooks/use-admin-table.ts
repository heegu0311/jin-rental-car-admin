"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { refreshPublicSiteOrNotify } from "@/lib/public-site";
import {
  deletePublishedRecord,
  togglePublishedField,
} from "@/lib/admin-mutations";

type Order = { column: string; ascending: boolean };

/**
 * 공개 게시물 테이블(events, notices)의 관리 목록.
 * 브라우저 세션 + RLS로 조회하고, 변경 성공 시 고객 사이트 즉시 반영을 요청한다.
 * 조회 실패는 loadError로 알리고 빈 목록으로 바꾸지 않는다.
 * order는 렌더마다 다시 조회하지 않도록 모듈 상수로 넘긴다.
 */
export function useAdminTable<T extends { id: string }>(
  table: "events" | "notices",
  order: readonly Order[],
) {
  const [supabase] = useState(createClient);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    let query = supabase.from(table).select("*");
    for (const { column, ascending } of order)
      query = query.order(column, { ascending });
    query.then(({ data, error }) => {
      if (!active) return;
      if (error) setLoadError("목록을 불러오지 못했습니다. 다시 시도해주세요.");
      else setRows((data || []) as T[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [supabase, table, order]);

  /** 참/거짓 열(노출·고정)을 뒤집는다. */
  async function toggle(row: T, field: keyof T & string, doneMessage: string) {
    const next = !row[field];
    const result = await togglePublishedField(
      table,
      row.id,
      field as "is_active" | "is_pinned",
      Boolean(next),
    );
    if (result.error) {
      toast.error("변경을 저장하지 못했습니다.");
      return;
    }
    refreshPublicSiteOrNotify(doneMessage);
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, [field]: next } : r)),
    );
  }

  async function remove(
    id: string,
    { confirm, done }: { confirm: string; done: string },
  ) {
    if (!window.confirm(confirm)) return;
    const result = await deletePublishedRecord(table, id);
    if (result.error) {
      toast.error("삭제하지 못했습니다.");
      return;
    }
    refreshPublicSiteOrNotify(done);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return { rows, loading, loadError, toggle, remove };
}
