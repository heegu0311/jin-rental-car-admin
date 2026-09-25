"use client";
import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { CircleHelp, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "ios" | "android";
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const STEPS: Record<Platform, { title: string; body: string }[]> = {
  ios: [
    {
      title: "Safari로 관리자 사이트 열기",
      body: "iOS 16.4 이상에서 Safari로 접속해 주세요. 카카오톡 등 앱 내 브라우저에서는 홈 화면 추가가 되지 않습니다.",
    },
    {
      title: "공유 버튼 누르기",
      body: "화면 하단(또는 주소창 옆)의 네모에 위쪽 화살표가 있는 공유 버튼을 누릅니다.",
    },
    {
      title: "‘홈 화면에 추가’ 선택",
      body: "목록을 아래로 내려 ‘홈 화면에 추가’를 누르고, 이름을 확인한 뒤 오른쪽 위 ‘추가’를 누릅니다.",
    },
    {
      title: "홈 화면 아이콘으로 실행",
      body: "홈 화면의 ‘진렌트카 관리’ 아이콘으로 열고 관리자 계정으로 로그인합니다.",
    },
    {
      title: "알림 켜기",
      body: "설치된 앱의 상단 종 아이콘 → ‘알림 켜기’ → 알림 허용 후 ‘테스트 알림’으로 수신을 확인합니다.",
    },
  ],
  android: [
    {
      title: "Chrome으로 관리자 사이트 열기",
      body: "Android Chrome으로 접속해 주세요. 앱 내 브라우저에서는 설치 메뉴가 나오지 않을 수 있습니다.",
    },
    {
      title: "메뉴에서 설치",
      body: "오른쪽 위 ⋮ 메뉴 → ‘앱 설치’ 또는 ‘홈 화면에 추가’를 누르고 ‘설치’를 선택합니다. 아래 ‘지금 설치’ 버튼이 보이면 바로 설치할 수 있습니다.",
    },
    {
      title: "홈 화면 아이콘으로 실행",
      body: "홈 화면 또는 앱 목록의 ‘진렌트카 관리’ 아이콘으로 열고 로그인합니다.",
    },
    {
      title: "알림 켜기",
      body: "상단 종 아이콘 → ‘알림 켜기’ → 알림 허용 후 ‘테스트 알림’으로 수신을 확인합니다.",
    },
  ],
};

export function InstallGuide() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("ios");
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    // Chromium offers a native install prompt once the PWA is installable.
    const capture = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const done = () => {
      setPrompt(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  function toggle(next: boolean) {
    if (next) {
      setPlatform(/Android/i.test(navigator.userAgent) ? "android" : "ios");
      setInstalled(
        window.matchMedia("(display-mode: standalone)").matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone ===
            true,
      );
    }
    setOpen(next);
  }
  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    if (outcome === "accepted") setInstalled(true);
  }

  return (
    <Dialog.Root open={open} onOpenChange={toggle}>
      <Dialog.Trigger
        aria-label="홈 화면 설치 가이드"
        className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500"
      >
        <CircleHelp size={16} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                홈 화면에 관리자 앱 추가
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-slate-500">
                홈 화면에 추가하면 앱처럼 실행되고, 새 상담·문의 푸시 알림을
                받을 수 있습니다.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="닫기"
              className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          {installed && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              지금 홈 화면 앱으로 실행 중입니다. 종 아이콘에서 알림을 켜주세요.
            </p>
          )}
          <div
            role="tablist"
            aria-label="기기 선택"
            className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm"
          >
            {(
              [
                ["ios", "iPhone · iPad"],
                ["android", "Android"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={platform === value}
                onClick={() => setPlatform(value)}
                className={cn(
                  "rounded-lg py-2 font-semibold",
                  platform === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <ol className="space-y-4" role="tabpanel">
            {STEPS[platform].map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {platform === "android" && prompt && !installed && (
            <button
              type="button"
              onClick={install}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white"
            >
              지금 설치
            </button>
          )}
          <p className="text-xs leading-5 text-slate-500">
            알림은 기기마다 따로 켜야 합니다. 앱을 삭제했거나 브라우저 데이터를
            지웠다면 다시 설치하고 알림을 켜주세요.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
