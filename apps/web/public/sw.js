const CACHE = "jfreeze-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CHECK_EXPIRY") {
    event.waitUntil(checkExpiryAndNotify());
  }
});

async function checkExpiryAndNotify() {
  try {
    const res = await fetch("/api/expiry?days=3");
    const data = await res.json();
    const alerts = data.alerts ?? [];
    if (alerts.length === 0) return;

    const title = "jFreeze: срок годности";
    const body = alerts
      .slice(0, 3)
      .map((a) => `${a.name} — ${a.urgency === "expired" ? "просрочено" : "скоро"}`)
      .join(", ");

    await self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.svg",
      tag: "jfreeze-expiry",
    });
  } catch {
    /* offline */
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
