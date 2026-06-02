const MENU_ID = "jfreeze-send-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Отправить в jFreeze",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText?.trim()) return;
  void sendToJfreeze(info.selectionText.trim(), tab?.url);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "jfreeze-send-page") {
    void sendToJfreeze(msg.text, msg.url).then(sendResponse);
    return true;
  }
  return false;
});

async function getBaseUrl() {
  const { baseUrl } = await chrome.storage.sync.get(["baseUrl"]);
  return (baseUrl || "http://localhost:3000").replace(/\/$/, "");
}

async function sendToJfreeze(text, pageUrl) {
  const baseUrl = await getBaseUrl();
  const form = new FormData();
  form.append("text", text);
  if (pageUrl) form.append("sourceUrl", pageUrl);

  const res = await fetch(`${baseUrl}/api/receipts/import`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `HTTP ${res.status}`;
    await chrome.notifications?.create?.({
      type: "basic",
      iconUrl: "icons/icon48.svg",
      title: "jFreeze",
      message: msg,
    });
    throw new Error(msg);
  }
  const count = data.items?.length ?? 0;
  const note =
    data.autoImport
      ? "Чек добавлен в заказы"
      : count
        ? `Разобрано позиций: ${count}. Откройте jFreeze для подтверждения.`
        : "Текст отправлен";
  if (chrome.notifications) {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.svg",
      title: "jFreeze",
      message: note,
    });
  }
  return data;
}
