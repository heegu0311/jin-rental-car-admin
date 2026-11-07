import test from "node:test";
import assert from "node:assert/strict";
import { accountIdentity, validProfileName } from "../lib/account.ts";

test("로그인 이메일의 첫 글자와 저장된 표시 이름으로 프로필 구성", () => {
  assert.deepEqual(
    accountIdentity({
      email: "heegu@example.invalid",
      user_metadata: { display_name: "진렌트카", full_name: "Other" },
    }),
    { email: "heegu@example.invalid", name: "진렌트카", initial: "H" },
  );
  assert.equal(
    accountIdentity({
      email: "admin@example.invalid",
      user_metadata: { full_name: "Google Name" },
    }).name,
    "Google Name",
  );
  assert.equal(
    accountIdentity({
      email: "admin@example.invalid",
      user_metadata: { display_name: 42 },
    }).name,
    "admin",
  );
  assert.equal(accountIdentity({}).initial, "?");
});

test("표시 이름은 1~40자 일반 텍스트로 서버 검증", () => {
  assert.equal(validProfileName("  운영 담당자  "), "운영 담당자");
  for (const value of [
    null,
    1,
    "",
    "   ",
    "a".repeat(41),
    "name\nname",
    "name\u0000",
  ])
    assert.equal(validProfileName(value), null);
});
