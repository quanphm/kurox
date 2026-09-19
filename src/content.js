const AD_LABEL_RE = /^(Ad|Promoted|Sponsored)$/i;
const PROCESSED = "data-jev-processed";

const hasExplicitAdLabel = (article) => {
  // The Ad/Promoted/Sponsored badge can be any element type, so check all
  // leaf elements. Exclude the tweet body to avoid matching post text.
  const body = article.querySelector('[data-testid="tweetText"]');
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;
  while (node) {
    const insideBody = body !== null && (node === body || body.contains(node));
    if (!insideBody && node.children.length === 0) {
      if (AD_LABEL_RE.test(node.textContent.trim())) return true;
    }
    node = walker.nextNode();
  }
  return false;
};

const extractPost = (article) => {
  const textNode = article.querySelector('[data-testid="tweetText"]');
  const userNode = article.querySelector('[data-testid="User-Name"]');
  return {
    text: textNode ? textNode.innerText.slice(0, 2000) : article.innerText.slice(0, 2000),
    author: userNode ? userNode.innerText.split("\n")[0] : "unknown",
  };
};

const hide = (article) => {
  article.style.display = "none";
};

const blur = (article) => {
  article.style.filter = "blur(6px)";
  article.style.pointerEvents = "none";
};

const processArticle = async (article) => {
  if (article.hasAttribute(PROCESSED)) return;
  article.setAttribute(PROCESSED, "true");

  if (hasExplicitAdLabel(article)) {
    hide(article);
    chrome.runtime.sendMessage({ type: "AD_COUNTED" });
    return;
  }

  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  if (!enabled) return;

  const { text, author } = extractPost(article);
  if (!text.trim()) return;

  const response = await chrome.runtime.sendMessage({
    type: "CLASSIFY",
    post: { text, author },
  });
  if (!response) return;
  if (response.verdict === "hide") hide(article);
  else if (response.verdict === "blur") blur(article);
};

const scan = () => {
  document.querySelectorAll('article[data-testid="tweet"]').forEach((article) => {
    processArticle(article);
  });
};

const observer = new MutationObserver(scan);
observer.observe(document.body, { childList: true, subtree: true });
scan();
