const API_URL = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const BATCH_SIZE = 10;
const DEBOUNCE_MS = 300;

const verdictCache = new Map();
let queue = [];
let timer = null;

const hash = (text) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return String(h);
};

const classifyBatch = async (posts, apiKey) => {
  const questions = {};
  for (const [i] of posts.entries()) {
    questions[`post_${i}`] = {
      type: "noul",
      instructions: "Is this timeline post a paid advertisement or promoted content?",
      criteria: {
        true: "Promotional CTA, product pitch, or sponsored messaging, even without an Ad label",
        false: "Organic user post, reply, or editorial content",
      },
    };
  }
  const state = posts.map((post) => ({ text: post.text, author: post.author }));

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ state, model: MODEL, questions }),
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
      const verdict = noul >= hideThreshold ? "hide" : noul >= blurThreshold ? "blur" : "leave";
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
