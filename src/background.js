import { API_URL, buildRequest, decideVerdict, hash } from "./jev.js";

const BATCH_SIZE = 10;
const DEBOUNCE_MS = 300;
const MAX_ATTEMPTS = 3;

const verdictCache = new Map();
let queue = [];
let timer = null;

const fetchWithRetry = async (url, options) => {
  let delay = 500;
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(url, options);
    if ((res.status === 429 || res.status === 529) && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
      continue;
    }
    return res;
  }
};

const classifyBatch = async (posts, apiKey) => {
  const res = await fetchWithRetry(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRequest(posts)),
  });
  if (!res.ok) throw new Error(`TypeSafe API error: ${res.status}`);
  return res.json();
};

const flush = async () => {
  const batch = queue.splice(0, BATCH_SIZE);
  if (batch.length === 0) return;

  const { apiKey, hideThreshold, blurThreshold } = await chrome.storage.sync.get({
    apiKey: "",
    hideThreshold: 0.7,
    blurThreshold: 0.4,
  });
  if (!apiKey) {
    for (const { resolve } of batch) resolve({ verdict: "leave" });
    return;
  }

  try {
    const data = await classifyBatch(
      batch.map((item) => item.post),
      apiKey,
    );
    for (const [i, item] of batch.entries()) {
      const noul = data.answers[`post_${i}`]?.noul ?? 0;
      const verdict = decideVerdict(noul, { hideThreshold, blurThreshold });
      verdictCache.set(hash(item.post.text), verdict);
      if (verdict === "hide") {
        const { hiddenCount } = await chrome.storage.sync.get({ hiddenCount: 0 });
        await chrome.storage.sync.set({ hiddenCount: hiddenCount + 1 });
      }
      item.resolve({ verdict });
    }
  } catch {
    for (const { resolve } of batch) resolve({ verdict: "leave" });
  }
};

const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "AD_COUNTED") {
    chrome.storage.sync.get({ hiddenCount: 0 }).then(({ hiddenCount }) => {
      chrome.storage.sync.set({ hiddenCount: hiddenCount + 1 });
    });
    return false;
  }
  if (message.type !== "CLASSIFY") return false;

  const cached = verdictCache.get(hash(message.post.text));
  if (cached) {
    sendResponse({ verdict: cached });
    return false;
  }
  queue.push({ post: message.post, resolve: sendResponse });
  schedule();
  return true;
});
