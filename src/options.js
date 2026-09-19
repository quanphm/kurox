const apiKeyEl = document.getElementById("apiKey");
const hideEl = document.getElementById("hide");
const blurEl = document.getElementById("blur");
const statusEl = document.getElementById("status");

chrome.storage.sync.get({ apiKey: "", hideThreshold: 0.7, blurThreshold: 0.4 }, (items) => {
  apiKeyEl.value = items.apiKey;
  hideEl.value = items.hideThreshold;
  blurEl.value = items.blurThreshold;
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    apiKey: apiKeyEl.value.trim(),
    hideThreshold: Number(hideEl.value),
    blurThreshold: Number(blurEl.value),
  });
  statusEl.textContent = "Saved";
  setTimeout(() => {
    statusEl.textContent = "";
  }, 1500);
});
