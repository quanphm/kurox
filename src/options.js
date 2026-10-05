const apiKeyEl = document.getElementById("apiKey");
const hideEl = document.getElementById("hide");
const blurEl = document.getElementById("blur");
const hideValueEl = document.getElementById("hideValue");
const blurValueEl = document.getElementById("blurValue");
const orderWarningEl = document.getElementById("orderWarning");
const statusEl = document.getElementById("status");
const formEl = document.getElementById("form");
const toggleKeyEl = document.getElementById("toggleKey");

const format = (value) => Number(value).toFixed(2);
let statusTimer = null;

const render = () => {
  hideValueEl.textContent = format(hideEl.value);
  blurValueEl.textContent = format(blurEl.value);
  orderWarningEl.hidden = Number(blurEl.value) > Number(hideEl.value);
};

const showStatus = (message) => {
  statusEl.textContent = message;
  statusEl.classList.add("visible");
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.classList.remove("visible");
  }, 2000);
};

chrome.storage.sync.get({ apiKey: "", hideThreshold: 0.7, blurThreshold: 0.4 }, (items) => {
  apiKeyEl.value = items.apiKey;
  hideEl.value = items.hideThreshold;
  blurEl.value = items.blurThreshold;
  render();
});

for (const slider of [hideEl, blurEl]) {
  slider.addEventListener("input", render);
}

toggleKeyEl.addEventListener("click", () => {
  const revealed = apiKeyEl.type === "text";
  apiKeyEl.type = revealed ? "password" : "text";
  toggleKeyEl.textContent = revealed ? "Show" : "Hide";
  toggleKeyEl.setAttribute("aria-label", revealed ? "Show API key" : "Hide API key");
});

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  await chrome.storage.sync.set({
    apiKey: apiKeyEl.value.trim(),
    hideThreshold: Number(hideEl.value),
    blurThreshold: Number(blurEl.value),
  });
  showStatus("Saved");
});
