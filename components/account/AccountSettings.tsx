"use client";

import { useState } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { toast } from "sonner";
import { useSubmitLock } from "@/lib/hooks/use-submit-lock";
import type { AccountIdentity } from "@/lib/account";
import { Panel } from "@/components/shared/Panel";
import { Feedback } from "@/components/shared/feedback";
import {
  saveAccountProfile,
  changeAccountPassword,
} from "@/app/(dashboard)/mypage/actions";
import { logout } from "@/app/login/actions";

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const buttonClass =
  "rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50";

export function AccountSettings({
  identity,
  hasPassword,
}: {
  identity: AccountIdentity;
  hasPassword: boolean;
}) {
  const { busy, run } = useSubmitLock();
  const [showPassword, setShowPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      setProfileError("");
      try {
        const result = await saveAccountProfile(data);
        if (result.error) {
          setProfileError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success("프로필을 저장했습니다.");
      } catch (error) {
        unstable_rethrow(error);
        const message =
          "프로필을 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.";
        setProfileError(message);
        toast.error(message);
      }
    });
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      setPasswordError("");
      try {
        const result = await changeAccountPassword(data);
        if (!result) return;
        if (result.error) {
          setPasswordError(result.error);
          toast.error(result.error);
          return;
        }
        form.reset();
        setPasswordSaved(true);
        toast.success(
          "비밀번호가 변경되었습니다. 로그아웃 후 다시 로그인해 주세요.",
        );
      } catch (error) {
        unstable_rethrow(error);
        const message =
          "비밀번호를 변경하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.";
        setPasswordError(message);
        toast.error(message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Panel title="프로필 설정">
        <div className="mb-6 flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-blue-700 text-2xl font-bold text-white"
          >
            {identity.initial}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{identity.name}</p>
            <p className="mt-1 break-all text-sm text-slate-500">
              {identity.email}
            </p>
          </div>
        </div>
        <form onSubmit={saveProfile} className="space-y-5">
          <Feedback message={profileError} />
          <fieldset disabled={busy} className="space-y-5">
            <div>
              <label
                htmlFor="profile-name"
                className="text-sm font-medium text-slate-700"
              >
                프로필 이름
              </label>
              <input
                id="profile-name"
                name="name"
                autoComplete="nickname"
                defaultValue={identity.name}
                maxLength={40}
                required
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-500">
                헤더에 표시할 이름을 1~40자로 입력해 주세요.
              </p>
            </div>
            <div>
              <label
                htmlFor="profile-email"
                className="text-sm font-medium text-slate-700"
              >
                로그인 이메일
              </label>
              <input
                id="profile-email"
                type="email"
                value={identity.email}
                readOnly
                className={`${inputClass} bg-slate-50 text-slate-500`}
              />
              <p className="mt-2 text-xs text-slate-500">
                프로필 아이콘은 이메일의 첫 글자로 표시합니다.
              </p>
            </div>
            <button type="submit" disabled={busy} className={buttonClass}>
              {busy ? "처리 중..." : "프로필 저장"}
            </button>
          </fieldset>
        </form>
      </Panel>
      <Panel title="계정 보안">
        <p className="mb-5 text-sm leading-6 text-slate-500">
          비밀번호 변경이 완료되면 로그아웃됩니다. 새 비밀번호로 다시 로그인해
          주세요.
        </p>
        {passwordSaved ? (
          <div className="space-y-4">
            <Feedback
              tone="success"
              message="비밀번호가 변경되었습니다. 자동 로그아웃을 완료하지 못했으니 아래 버튼으로 로그아웃해 주세요."
            />
            <form action={logout}>
              <button type="submit" className={buttonClass}>
                로그아웃
              </button>
            </form>
          </div>
        ) : !showPassword ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowPassword(true)}
            className={buttonClass}
          >
            비밀번호 변경
          </button>
        ) : hasPassword ? (
          <form onSubmit={savePassword} className="space-y-5">
            <Feedback message={passwordError} />
            <fieldset disabled={busy} className="space-y-5">
              <div>
                <label
                  htmlFor="current-password"
                  className="text-sm font-medium text-slate-700"
                >
                  현재 비밀번호
                </label>
                <input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  maxLength={1024}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="account-password"
                  className="text-sm font-medium text-slate-700"
                >
                  새 비밀번호
                </label>
                <input
                  id="account-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  aria-describedby="account-password-help"
                  className={inputClass}
                />
                <p
                  id="account-password-help"
                  className="mt-2 text-xs text-slate-500"
                >
                  영문과 숫자를 포함한 12~128자
                </p>
              </div>
              <div>
                <label
                  htmlFor="account-confirmation"
                  className="text-sm font-medium text-slate-700"
                >
                  새 비밀번호 확인
                </label>
                <input
                  id="account-confirmation"
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  className={inputClass}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={busy} className={buttonClass}>
                  {busy ? "처리 중..." : "비밀번호 변경 저장"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(false)}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm"
                >
                  취소
                </button>
              </div>
            </fieldset>
            <Link
              href="/login/forgot-password"
              className="inline-block text-sm text-blue-700 underline underline-offset-4"
            >
              현재 비밀번호를 잊으셨나요?
            </Link>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Google 로그인으로 연결된 계정입니다. 로그인 이메일로 재설정 링크를
              받아 비밀번호를 설정할 수 있습니다.
            </p>
            <Link
              href="/login/forgot-password"
              className={`${buttonClass} inline-block`}
            >
              이메일로 비밀번호 설정
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
}
