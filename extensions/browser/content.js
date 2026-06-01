/** Плавающая кнопка на страницах почты и маркетплейсов (опционально). */
const HOST_HINT =
  /(mail\.|outlook\.|gmail|ozon\.|samokat|sbermarket|wildberries|yandex\.)/i;

if (HOST_HINT.test(location.hostname)) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "→ jFreeze";
  btn.title = "Отправить видимый текст письма в jFreeze";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: "2147483646",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    background: "#0ea5e9",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,.2)",
  });
  btn.addEventListener("click", () => {
    const text = document.body?.innerText?.slice(0, 120_000) ?? "";
    chrome.runtime.sendMessage(
      { type: "jfreeze-send-page", text, url: location.href },
      () => {
        btn.textContent = chrome.runtime.lastError ? "Ошибка" : "Отправлено ✓";
        setTimeout(() => {
          btn.textContent = "→ jFreeze";
        }, 2500);
      },
    );
  });
  document.documentElement.appendChild(btn);
}
