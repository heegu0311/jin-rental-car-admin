"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Feedback } from "@/components/shared/feedback";
import {
  pushPublicKey,
  registerPush,
  removePush,
  sendTestPush,
} from "@/lib/push/actions";

type Support = "checking" | "supported" | "install" | "unsupported";
function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
function detectSupport(): Support {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
    return "supported";
  // iOS exposes Web Push only to apps added to the home screen.
  return ios && !standalone ? "install" : "unsupported";
}

export function PushToggle() {
  const [support, setSupport] = useState<Support>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "error" | "success" | "info";
  } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = detectSupport();
    let active = true;
    setSupport(next);
    if (next !== "supported") return () => void (active = false);
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => active && setSubscription(sub))
      .catch(() => active && setSupport("unsupported"));
    return () => void (active = false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !panel.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage({
          text: "알림 권한이 허용되지 않았습니다. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.",
          tone: "error",
        });
        return;
      }
      const key = await pushPublicKey();
      if (!key.publicKey) {
        setMessage({
          text: key.error ?? "알림 서버 설정이 완료되지 않았습니다.",
          tone: "error",
        });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(key.publicKey),
        }));
      const saved = await registerPush(sub.toJSON(), navigator.userAgent);
      if (saved.error) {
        await sub.unsubscribe();
        setMessage({ text: saved.error, tone: "error" });
        return;
      }
      setSubscription(sub);
      setMessage({
        text: "이 기기에서 새 상담·문의 알림을 받습니다.",
        tone: "success",
      });
    } catch {
      setMessage({
        text: "알림을 켜지 못했습니다. 잠시 후 다시 시도해주세요.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    if (!subscription) return;
    setBusy(true);
    setMessage(null);
    try {
      const removed = await removePush(subscription.endpoint);
      if (removed.error) {
        setMessage({ text: removed.error, tone: "error" });
        return;
      }
      await subscription.unsubscribe();
      setSubscription(null);
      setMessage({ text: "이 기기의 알림을 해제했습니다.", tone: "info" });
    } catch {
      setMessage({
        text: "알림을 해제하지 못했습니다. 다시 시도해주세요.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  async function test() {
    setBusy(true);
    setMessage(null);
    const result = await sendTestPush().catch(() => ({
      error: "테스트 알림 요청에 실패했습니다.",
    }));
    setMessage(
      result.error
        ? { text: result.error, tone: "error" }
        : {
            text: "테스트 알림을 요청했습니다. 잠시 후 이 기기에 도착하는지 확인해주세요.",
            tone: "info",
          },
    );
    setBusy(false);
  }

  const on = support === "supported" && !!subscription;
  const Icon = on ? BellRing : support === "supported" ? Bell : BellOff;
  return (
    <div ref={panel} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={on ? "관리자 알림 켜짐" : "관리자 알림 설정"}
        className={`grid size-8 place-items-center rounded-full ${on ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}
      >
        <Icon size={16} />
      </button>
      {open && (
        <div className="fixed inset-x-4 top-[76px] z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-10 sm:w-80 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg">
          <p className="font-bold text-slate-900">새 상담·문의 푸시 알림</p>
          {support === "checking" && <p className="text-slate-500">확인 중…</p>}
          {support === "install" && (
            <p className="leading-6 text-slate-600">
              iPhone에서는 Safari 공유 버튼 → <strong>홈 화면에 추가</strong>로
              설치한 뒤, 설치된 앱에서 알림을 켜주세요.
            </p>
          )}
          {support === "unsupported" && (
            <p className="leading-6 text-slate-600">
              이 브라우저는 푸시 알림을 지원하지 않습니다.
            </p>
          )}
          {support === "supported" && (
            <>
              <p className="leading-6 text-slate-600">
                {on
                  ? "이 기기에서 예약·신차 상담과 고객 문의 접수 알림을 받고 있습니다."
                  : "이 기기에서 예약·신차 상담과 고객 문의 접수 알림을 받으려면 켜주세요."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={on ? disable : enable}
                  className={`rounded-lg px-3 py-2 font-semibold disabled:opacity-50 ${on ? "border border-slate-200 text-slate-700" : "bg-slate-900 text-white"}`}
                >
                  {busy ? "처리 중…" : on ? "알림 끄기" : "알림 켜기"}
                </button>
                {on && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={test}
                    className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-50"
                  >
                    테스트 알림
                  </button>
                )}
              </div>
            </>
          )}
          <Feedback message={message?.text} tone={message?.tone} />
        </div>
      )}
    </div>
  );
}
