"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pendingConsultationCount } from "@/lib/push/actions";

export function PendingConsultations() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const next = await pendingConsultationCount();
        if (!active) return;
        setCount(next);
        if (next === null) return;
        try {
          if (next > 0) await navigator.setAppBadge?.(next);
          else await navigator.clearAppBadge?.();
        } catch {
          // Badge support varies by Android browser and launcher.
        }
      } catch {
        if (active) setCount(null);
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    const onFocus = () => void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (count === null || count === 0) return null;
  return (
    <Link href="/consultations" aria-label={`상담 대기 ${count}건 보기`}
      className="rounded-full bg-blue-50 px-3 py-2 font-semibold text-blue-800">
      상담 대기 {count}건
    </Link>
  );
}
