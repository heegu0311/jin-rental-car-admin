/** 목록 하단 "이전 · n / 전체 · 다음". page는 0부터 시작한다. */
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-end gap-4 text-sm">
      <button
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="rounded border bg-white px-4 py-2 disabled:opacity-30"
      >
        이전
      </button>
      <span>
        {page + 1} / {pages}
      </span>
      <button
        disabled={(page + 1) * pageSize >= total}
        onClick={() => onChange(page + 1)}
        className="rounded border bg-white px-4 py-2 disabled:opacity-30"
      >
        다음
      </button>
    </div>
  );
}
