// Admin PWA service worker: shows push notifications only (no offline cache).
// Activate notification fixes even while an older admin window remains open.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

function notificationUrl(value) {
  const fallback = new URL("/", self.location.origin);
  if (typeof value !== "string" || !/^\/(?!\/)/.test(value)) return fallback;
  const target = new URL(value, self.location.origin);
  return target.origin === fallback.origin ? target : fallback;
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const target = notificationUrl(data.url);
  const url = target.pathname + target.search + target.hash;
  event.waitUntil(
    self.registration.showNotification(data.title || "진렌트카 관리자", {
      body: data.body || "",
      tag: data.tag || undefined,
      icon: "/pwa-icon-192.png",
      badge: "/pwa-icon-192.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = notificationUrl(event.notification.data?.url);
  // Let Chrome Android route into the installed standalone app. Selecting a
  // same-origin WindowClient ourselves can bring an ordinary browser tab forward.
  event.waitUntil(
    self.clients.openWindow(target.href).then((client) => client?.focus()),
  );
});
