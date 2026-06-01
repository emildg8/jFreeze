const baseUrlInput = document.getElementById("baseUrl");
const statusEl = document.getElementById("status");

chrome.storage.sync.get(["baseUrl"], (data) => {
  baseUrlInput.value = data.baseUrl || "http://localhost:3000";
});

document.getElementById("save").addEventListener("click", () => {
  const url = baseUrlInput.value.trim().replace(/\/$/, "");
  chrome.storage.sync.set({ baseUrl: url }, () => {
    statusEl.textContent = "Сохранено";
  });
});

document.getElementById("open").addEventListener("click", () => {
  const url = baseUrlInput.value.trim().replace(/\/$/, "") || "http://localhost:3000";
  chrome.tabs.create({ url: `${url}/orders` });
});
