// ============================================================
// service-worker.js — プッシュ通知を受け取って表示する
// このページと同じフォルダに置くことで、このページを
// 制御スコープに含められます（Service Workerの仕様上の制約）。
// ============================================================

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }

  const title = data.title || "メモリーアルバム";
  const options = {
    body: data.body || "更新がありました",
    icon: "../shared/icon-192.png",
    badge: "../shared/icon-192.png",
    data: { url: data.url || "./index.html" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "./index.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
