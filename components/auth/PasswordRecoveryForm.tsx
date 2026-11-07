"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSubmitLock } from "@/lib/hooks/use-submit-lock";
import {
  requestPasswordRecovery,
  saveRecoveredPassword,
} from "@/app/login/password-actions";
import { logout } from "@/app/login/actions";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function PasswordRecoveryForm({
  mode,
  invalidLink = false,
}: {
  mode: "request" | "reset";
  invalidLink?: boolean;
}) {
  const { busy, run } = useSubmitLock();
  const [error, setError] = useState(
    invalidLink
      ? "재설정 링크가 만료되었거나 유효하지 않습니다. 메일을 요청한 브라우저에서 열거나 새 메일을 요청해 주세요."
      : "",
  );
  const [done, setDone] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const reset = mode === "reset";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      setError("");
      try {
        if (reset) {
          const result = await saveRecoveredPassword(data);
          if (!result) return;
          if (result.error) {
            setError(result.error);
            return;
          }
          setSignOutFailed(
            "signOutFailed" in result && result.signOutFailed === true,
          );
        } else {
          const result = await requestPasswordRecovery(data);
          if (result.error) {
            setError(result.error);
            toast.error(result.error);
            return;
          }
        }
        form.reset();
        setDone(true);
      } catch (error) {
        unstable_rethrow(error);
        const message =
          "요청을 완료하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.";
        setError(message);
        if (!reset) toast.error(message);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/jintrental-logo.jpeg"
            width={180}
            height={84}
            alt="진렌트카"
            className="mb-4 h-[84px] w-[180px] object-contain"
            priority
          />
          <h1 className="text-2xl font-bold text-slate-900">
            {reset ? "새 비밀번호 설정" : "비밀번호 찾기"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {reset
              ? "관리자 계정에 사용할 새 비밀번호를 입력해 주세요."
              : "관리자 계정의 이메일로 재설정 링크를 요청합니다."}
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {done ? (
          <div
            role="status"
            className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700"
          >
            {reset ? (
              <>
                비밀번호가 변경되었습니다.{" "}
                {signOutFailed
                  ? "자동 로그아웃을 완료하지 못했습니다. 보안을 위해 로그아웃해 주세요."
                  : "새 비밀번호로 다시 로그인해 주세요."}
              </>
            ) : (
              <>
                재설정 메일을 요청했습니다. 받은편지함과 스팸함을 확인해 주세요.
                링크는 메일을 요청한 브라우저에서 열어 주세요.
              </>
            )}
          </div>
        ) : (
          <form onSubmit={submit}>
            <fieldset disabled={busy} className="space-y-5">
              {reset ? (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="recovery-password"
                      className="text-sm font-medium text-slate-700"
                    >
                      새 비밀번호
                    </label>
                    <input
                      id="recovery-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      required
                      aria-describedby="password-help"
                      className={inputClass}
                    />
                    <p id="password-help" className="text-xs text-slate-500">
                      영문과 숫자를 포함한 12~128자
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="recovery-confirmation"
                      className="text-sm font-medium text-slate-700"
                    >
                      새 비밀번호 확인
                    </label>
                    <input
                      id="recovery-confirmation"
                      name="confirmation"
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={128}
                      required
                      className={inputClass}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="recovery-email"
                      className="text-sm font-medium text-slate-700"
                    >
                      이메일
                    </label>
                    <input
                      id="recovery-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      className={inputClass}
                    />
                  </div>
                  <label className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                    <input
                      name="consent"
                      type="checkbox"
                      required
                      className="mt-1 h-4 w-4 shrink-0 accent-slate-900"
                    />
                    <span>
                      비밀번호 재설정 메일 발송을 위한 이메일 이용에 동의합니다.
                      입력한 이메일은 재설정 요청에만 사용합니다.
                    </span>
                  </label>
                </>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {busy && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                {busy
                  ? "처리 중..."
                  : reset
                    ? "비밀번호 변경"
                    : "재설정 메일 요청"}
              </button>
            </fieldset>
          </form>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-blue-700">
          <Link href="/login" className="underline underline-offset-4">
            로그인으로 돌아가기
          </Link>
          {done && signOutFailed && (
            <form action={logout}>
              <button type="submit" className="underline underline-offset-4">
                로그아웃
              </button>
            </form>
          )}
          {reset && !done && (
            <Link
              href="/login/forgot-password"
              className="underline underline-offset-4"
            >
              메일 다시 요청
            </Link>
          )}
          {!reset && done && (
            <button
              type="button"
              onClick={() => setDone(false)}
              className="underline underline-offset-4"
            >
              다시 요청하기
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
