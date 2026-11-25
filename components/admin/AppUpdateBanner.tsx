"use client";

import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 60_000;

export function AppUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const currentBuildId = process.env.ADMIN_BUILD_ID;
    if (!currentBuildId || currentBuildId === "development") return;

    const abort = new AbortController();
    let checking = false;

    async function checkForUpdate() {
      if (document.hidden || checking) return;
      checking = true;

      try {
        const response = await fetch("/api/app-version", {
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) return;

        const { buildId } = await response.json();
        if (!abort.signal.aborted && typeof buildId === "string" && buildId) {
          setUpdateAvailable(buildId !== currentBuildId);
        }
      } catch {
        // Keep the current screen usable and retry on the next check.
      } finally {
        checking = false;
      }
    }

    void checkForUpdate();
    const interval = window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("pageshow", checkForUpdate);

    return () => {
      abort.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("pageshow", checkForUpdate);
    };
  }, []);

  if (!updateAvailable && !updating) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-950 md:px-8">
      <span role="status">{updating ? "업데이트 중입니다…" : "새 버전이 있어요."}</span>
      <button
        type="button"
        className="rounded-md bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        disabled={updating}
        onClick={() => {
          setUpdating(true);
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => window.location.reload());
          });
        }}
      >
        업데이트
      </button>
    </div>
  );
}
