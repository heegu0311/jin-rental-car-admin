import test from "node:test";
import assert from "node:assert/strict";
import {
  recoveryEmail,
  recoveryOrigin,
  passwordRecoveryError,
} from "../lib/password-recovery.ts";
import { recoverAdminPassword } from "../lib/recover-admin-password.ts";

test("재설정 이메일의 타입·길이·형식을 검증하고 앞뒤 공백만 제거", () => {
  assert.equal(recoveryEmail("  admin@example.com  "), "admin@example.com");
  for (const value of [
    null,
    1,
    {},
    "",
    "a@b",
    "a b@example.com",
    "a@example.com\nx",
    "a".repeat(250) + "@example.com",
  ])
    assert.equal(recoveryEmail(value), null);
});

test("재설정 주소는 HTTPS origin 또는 로컬 HTTP만 허용", () => {
  for (const origin of [
    "https://admin.example.com",
    "http://localhost:3102",
    "http://127.0.0.1:3102",
    "http://[::1]:3102",
  ])
    assert.equal(recoveryOrigin(origin), origin);
  for (const origin of [
    null,
    "",
    "//evil.example",
    "javascript:alert(1)",
    "http://admin.example.com",
    "https://u:p@example.com",
    "https://example.com/path",
    "https://example.com?next=x",
  ])
    assert.equal(recoveryOrigin(origin), null);
});

test("새 비밀번호는 서버에서 길이·영문/숫자·확인 일치를 검증", () => {
  const password = "NewPassword1234";
  assert.equal(passwordRecoveryError(password, password), null);
  assert.equal(passwordRecoveryError("a1".repeat(64), "a1".repeat(64)), null);
  for (const [value, confirmation] of [
    [null, null],
    ["short123", "short123"],
    ["a1".repeat(65), "a1".repeat(65)],
    ["abcdefghijklm", "abcdefghijklm"],
    ["123456789012", "123456789012"],
    [password, "different"],
  ])
    assert.ok(passwordRecoveryError(value, confirmation));
});

function mockDb({
  user = { id: "test-admin" },
  sessionError = null,
  role = "admin",
  profileError = null,
  updateError = null,
  signOutError = null,
  signOutThrows = false,
} = {}) {
  const calls = [];
  return {
    calls,
    db: {
      auth: {
        getUser: async () => ({ data: { user }, error: sessionError }),
        updateUser: async (data) => {
          calls.push(["update", data]);
          return { error: updateError };
        },
        signOut: async () => {
          calls.push(["signOut"]);
          if (signOutThrows) throw Error("offline");
          return { error: signOutError };
        },
      },
      from(table) {
        assert.equal(table, "profiles");
        return {
          select(column) {
            assert.equal(column, "role");
            return {
              eq(column, value) {
                assert.equal(column, "id");
                assert.equal(value, user.id);
                return {
                  single: async () => ({
                    data: role === null ? null : { role },
                    error: profileError,
                  }),
                };
              },
            };
          },
        };
      },
    },
  };
}

test("세션 없음·인증 실패·비관리자·프로필 조회 실패는 비밀번호 변경 차단", async () => {
  for (const input of [
    { user: null },
    { sessionError: Error("expired") },
    { role: "user" },
    { role: null },
    { profileError: Error("RLS") },
  ]) {
    const { db, calls } = mockDb(input);
    assert.ok((await recoverAdminPassword(db, "NewPassword1234")).error);
    assert.deepEqual(calls, []);
  }
});

test("admin/superadmin 본인 계정만 저장 후 로그아웃", async () => {
  for (const role of ["admin", "superadmin"]) {
    const { db, calls } = mockDb({ role });
    assert.deepEqual(await recoverAdminPassword(db, "NewPassword1234"), {
      success: true,
      signOutFailed: false,
    });
    assert.deepEqual(calls, [
      ["update", { password: "NewPassword1234" }],
      ["signOut"],
    ]);
  }
});

test("저장 실패를 성공으로 표시하지 않고 세션 유지로 재시도 허용", async () => {
  const { db, calls } = mockDb({ updateError: { code: "same_password" } });
  assert.match(
    (await recoverAdminPassword(db, "NewPassword1234")).error,
    /기존 비밀번호/,
  );
  assert.equal(calls.length, 1);
});

test("저장 후 로그아웃 실패는 저장 성공과 구분", async () => {
  for (const input of [
    { signOutError: Error("offline") },
    { signOutThrows: true },
  ]) {
    const { db } = mockDb(input);
    assert.deepEqual(await recoverAdminPassword(db, "NewPassword1234"), {
      success: true,
      signOutFailed: true,
    });
  }
});
