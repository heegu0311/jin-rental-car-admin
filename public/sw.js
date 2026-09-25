// Admin PWA service worker: shows push notifications only (no offline cache).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const url =
    typeof data.url === "string" && /^\/(?!\/)/.test(data.url) ? data.url : "/";
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
  const target = new URL(event.notification.data?.url || "/", self.location.origin);
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if (new URL(client.url).origin === target.origin && "focus" in client)
            return client.navigate(target.href).then((c) => (c || client).focus());
        }
        return self.clients.openWindow(target.href);
      }),
  );
});
