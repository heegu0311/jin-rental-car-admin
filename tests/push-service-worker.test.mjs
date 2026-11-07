import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);
const origin = "https://admin.example.test";

function worker({ openedClient = null } = {}) {
  const handlers = new Map();
  const opened = [];
  const notifications = [];
  let updates = 0;
  vm.runInNewContext(source, {
    URL,
    self: {
      location: { origin },
      addEventListener: (name, handler) => handlers.set(name, handler),
      skipWaiting: async () => {
        updates += 1;
      },
      clients: {
        // An ordinary browser tab must never intercept an installed-app launch.
        matchAll: async () => {
          throw new Error("Must let the browser route the app");
        },
        openWindow: async (url) => {
          opened.push(url);
          return openedClient;
        },
      },
      registration: {
        showNotification: async (title, options) =>
          notifications.push({ title, options }),
      },
    },
  });
  async function dispatch(name, event = {}) {
    let pending;
    handlers.get(name)({
      ...event,
      waitUntil: (promise) => {
        pending = promise;
      },
    });
    await pending;
  }
  async function click(url) {
    let closed = false;
    await dispatch("notificationclick", {
      notification: {
        data: { url },
        close: () => {
          closed = true;
        },
      },
    });
    assert.equal(closed, true);
  }
  return { dispatch, click, opened, notifications, updates: () => updates };
}

test("알림 클릭은 기존 브라우저 탭을 선택하지 않고 앱 실행을 브라우저에 맡긴다", async () => {
  let focused = 0;
  const sw = worker({
    openedClient: {
      focus: async () => {
        focused += 1;
      },
    },
  });
  await sw.click("/reservations?status=pending#latest");
  assert.deepEqual(sw.opened, [`${origin}/reservations?status=pending#latest`]);
  assert.equal(focused, 1);
});

test("openWindow가 null을 반환해도 알림 클릭을 완료한다", async () => {
  const sw = worker();
  await sw.click("/inquiries");
  assert.deepEqual(sw.opened, [`${origin}/inquiries`]);
});

test("이전 알림의 잘못된 주소도 관리자 홈으로 제한한다", async () => {
  for (const url of [
    undefined,
    "",
    42,
    "https://outside.test/",
    "//outside.test/",
    "/\\outside.test/",
    "javascript:alert(1)",
  ]) {
    const sw = worker();
    await sw.click(url);
    assert.deepEqual(sw.opened, [`${origin}/`]);
  }
});

test("푸시 수신과 클릭에 같은 내부 주소 검증을 적용한다", async () => {
  for (const [url, expected] of [
    ["/new-car", "/new-car"],
    ["/\\outside.test/", "/"],
  ]) {
    const sw = worker();
    await sw.dispatch("push", {
      data: { json: () => ({ url, title: "새 상담", body: "상담 접수" }) },
    });
    assert.equal(sw.notifications[0].options.data.url, expected);
    await sw.click(sw.notifications[0].options.data.url);
    assert.deepEqual(sw.opened, [origin + expected]);
  }
});

test("열려 있는 관리자 창 때문에 알림 수정 버전이 대기하지 않는다", async () => {
  const sw = worker();
  await sw.dispatch("install");
  assert.equal(sw.updates(), 1);
});
