// ============================================================
// push-notifications.js — 通知のオン/オフを切り替える
// VAPID_PUBLIC_KEY は、通知を送れるようにする設定が済んだら
// あなたの公開鍵に書き換えてください（NOTIFICATIONS_SETUP.md 参照）
// ============================================================

const VAPID_PUBLIC_KEY = "YOUR_VAPID_PUBLIC_KEY";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function initPushNotifications() {
  const btn = document.getElementById("push-toggle");
  if (!btn) return;

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || VAPID_PUBLIC_KEY === "YOUR_VAPID_PUBLIC_KEY") {
    btn.style.display = "none";
    return;
  }

  let registration;
  try {
    registration = await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
  } catch (e) {
    console.error("service worker registration failed:", e);
    btn.style.display = "none";
    return;
  }

  const existing = await registration.pushManager.getSubscription();
  setButtonState(!!existing);

  btn.addEventListener("click", async () => {
    const current = await registration.pushManager.getSubscription();

    if (current) {
      await current.unsubscribe();
      await supabaseClient.from("push_subscriptions").delete().eq("endpoint", current.endpoint);
      setButtonState(false);
      showToast("通知をオフにしました");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showToast("通知が許可されませんでした");
      return;
    }

    let sub;
    try {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    } catch (e) {
      console.error("push subscribe failed:", e);
      showToast("通知の設定に失敗しました");
      return;
    }

    const subJson = sub.toJSON();
    const { error } = await supabaseClient.from("push_subscriptions").insert({
      community,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth
    });
    if (error) {
      console.error("saving subscription failed:", error);
      showToast("通知の保存に失敗しました");
      return;
    }
    setButtonState(true);
    showToast("通知をオンにしました");
  });

  function setButtonState(on) {
    btn.classList.toggle("on", on);
    btn.title = on ? "通知をオフにする" : "通知を受け取る";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initPushNotifications();
});
