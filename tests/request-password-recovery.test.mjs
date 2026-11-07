import test from "node:test";
import assert from "node:assert/strict";
import { requestAdminPasswordRecovery } from "../lib/request-password-recovery.ts";

function mockDb({
  eligible = true,
  lookupError = null,
  sendError = null,
} = {}) {
  const sent = [];
  const checks = [];
  return {
    sent,
    checks,
    db: {
      rpc: async (name, args) => {
        checks.push({ name, args });
        return { data: eligible, error: lookupError };
      },
      auth: {
        resetPasswordForEmail: async (...args) => {
          sent.push(args);
          return { error: sendError };
        },
      },
    },
  };
}

test("미등록 또는 비관리자 이메일은 명시적 오류를 반환하고 메일을 보내지 않음", async () => {
  const { db, sent } = mockDb({ eligible: false });
  assert.deepEqual(
    await requestAdminPasswordRecovery(
      db,
      "unknown@example.invalid",
      "https://admin.example.com",
    ),
    { error: "유효한 관리자 이메일이 아닙니다." },
  );
  assert.deepEqual(sent, []);
});

test("조회 실패를 미등록 계정으로 오인하지 않고 발송 차단", async () => {
  for (const input of [
    { lookupError: Error("offline") },
    { eligible: null },
    { eligible: "true" },
  ]) {
    const { db, sent } = mockDb(input);
    assert.match(
      (
        await requestAdminPasswordRecovery(
          db,
          "admin@example.invalid",
          "https://admin.example.com",
        )
      ).error,
      /확인하지 못했습니다/,
    );
    assert.deepEqual(sent, []);
  }
});

test("관리자로 확인된 이메일만 원래 콜백으로 재설정 메일 요청", async () => {
  const { db, sent, checks } = mockDb();
  assert.deepEqual(
    await requestAdminPasswordRecovery(
      db,
      "Admin@example.invalid",
      "https://admin.example.com",
    ),
    { success: true },
  );
  assert.deepEqual(checks, [
    {
      name: "is_admin_recovery_email",
      args: { email_input: "admin@example.invalid" },
    },
  ]);
  assert.deepEqual(sent, [
    [
      "Admin@example.invalid",
      { redirectTo: "https://admin.example.com/auth/recovery" },
    ],
  ]);
});

test("발송 제한과 발송 실패를 성공으로 표시하지 않음", async () => {
  for (const status of [429, 500]) {
    const { db } = mockDb({ sendError: { status } });
    const result = await requestAdminPasswordRecovery(
      db,
      "admin@example.invalid",
      "https://admin.example.com",
    );
    assert.match(
      result.error,
      status === 429 ? /요청이 많습니다/ : /요청하지 못했습니다/,
    );
    assert.equal(result.success, undefined);
  }
});
