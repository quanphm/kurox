const enabledEl = document.getElementById("enabled");
const countEl = document.getElementById("count");

chrome.storage.sync.get({ enabled: true, hiddenCount: 0 }, ({ enabled, hiddenCount }) => {
  enabledEl.checked = enabled;
  countEl.textContent = hiddenCount;
});

enabledEl.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabledEl.checked });
});
