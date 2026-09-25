import test from "node:test";
import assert from "node:assert/strict";
import {
  pushSubscriptionInput,
  validPushEndpoint,
} from "../lib/push/subscription.ts";
const keys = {
  p256dh:
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
  auth: "tBHItJI5svbpez7KI4CCXg",
};
test("https 푸시 엔드포인트와 base64url 키만 허용", () => {
  assert.deepEqual(
    pushSubscriptionInput({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      keys,
    }),
    { endpoint: "https://fcm.googleapis.com/fcm/send/abc", ...keys },
  );
  for (const endpoint of [
    "http://push.example/x",
    "javascript:alert(1)",
    "https://u:p@push.example/x",
    "",
    42,
  ])
    assert.equal(pushSubscriptionInput({ endpoint, keys }), null);
  assert.equal(
    pushSubscriptionInput({
      endpoint: "https://push.example/x",
      keys: { ...keys, auth: "<script>" },
    }),
    null,
  );
  assert.equal(
    pushSubscriptionInput({ endpoint: "https://push.example/x" }),
    null,
  );
  assert.equal(pushSubscriptionInput(null), null);
  assert.equal(
    validPushEndpoint("https://push.example/" + "a".repeat(1000)),
    false,
  );
});
