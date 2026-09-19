// Keep in sync with src/labels.js (content scripts cannot import modules).
const AD_LABEL_RE = /^(Ad|Promoted|Sponsored)$/i;
const AD_SUFFIX_RE = /·\s*(Ad|Promoted|Sponsored)$/i;
const PROCESSED = "data-kurox-processed";
const MAX_LABEL_CHARS = 80;

// CTA list also lives in src/labels.js — keep in sync.
const CTA_RE =
  /^(Learn More|Shop Now|Sign Up|Install Now|Play Now|Order Now|Book Now|Subscribe|Download|Get Offer|Try Now|Join Now)$/i;

const SITES = {
  x: {
    postSelector: 'article[data-testid="tweet"]',
    bodySelector: '[data-testid="tweetText"]',
    authorSelector: '[data-testid="User-Name"]',
  },
  reddit: {
    postSelector:
      'shreddit-post, shreddit-comments-page-ad, div[data-testid="post-container"], div.thing[data-type="link"]',
    bodySelector:
      '[data-click-id="text"], div[data-testid="post-content"], .usertext-body, [slot="text-body"]',
    authorSelector: 'a[href*="/user/"], a[href*="/r/"]',
  },
};

const site = window.location.hostname.includes("reddit") ? SITES.reddit : SITES.x;

const isPromotedContainer = (post) =>
  // Mirrors isPromotedRoot in src/labels.js — keep in sync.
  // is-ad="" excluded: present-but-empty on organic overflow menus.
  post.matches(
    "shreddit-comments-page-ad, [ad-type], [campaign-id], [ad-events], [ads-correlation-id], [data-promoted], .promoted, .promotedlink, li.promotedlink",
  );

// TreeWalker and querySelectorAll stop at shadow boundaries, but Reddit
// renders its ad link inside an open shadow root — so walk manually and
// recurse into every open shadowRoot.
const walkElements = (root, visit) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    visit(node);
    if (node.shadowRoot) walkElements(node.shadowRoot, visit);
    node = walker.nextNode();
  }
};

// Same logic as hasAdAttributes in src/labels.js — keep in sync.
const isAdElement = (node) => {
  if (
    node.hasAttribute("data-ad-click-location") ||
    node.hasAttribute("data-ad-click-action") ||
    node.hasAttribute("is-promoted")
  ) {
    return true;
  }
  const rel = node.getAttribute("rel") || "";
  if (rel.split(/\s+/).includes("sponsored")) return true;
  const ariaLabel = node.getAttribute("aria-label") || "";
  if (ariaLabel.startsWith("Advertisement")) return true;
  if (node.tagName === "A" && (node.getAttribute("href") || "").includes("alb.reddit.com")) {
    return true;
  }
  return false;
};

const hasExplicitAdLabel = (post) => {
  if (isPromotedContainer(post)) return true;
  // The badge can be any element type: exact "Ad" leaf, a "name · Ad"
  // suffix as in Reddit headers, or ad-tracker attributes. Exclude the
  // post body to avoid matching post text.
  const body = post.querySelector(site.bodySelector);
  let found = false;
  walkElements(post, (node) => {
    if (found) return;
    if (isAdElement(node)) {
      found = true;
      return;
    }
    const insideBody = body !== null && (node === body || body.contains(node));
    if (!insideBody && node.children.length === 0) {
      const text = node.textContent.trim();
      if (text.length <= MAX_LABEL_CHARS && (AD_LABEL_RE.test(text) || AD_SUFFIX_RE.test(text))) {
        found = true;
      }
    }
  });
  return found;
};

const hasCtaButton = (post) => {
  const buttons = post.querySelectorAll("a, button");
  for (const button of buttons) {
    if (CTA_RE.test(button.textContent.trim())) return true;
  }
  return false;
};

const extractPost = (post) => {
  const textNode = post.querySelector(site.bodySelector);
  const userNode = post.querySelector(site.authorSelector);
  const text = textNode ? textNode.innerText : post.innerText;
  const author = userNode ? userNode.innerText.split("\n")[0].trim() : "unknown";
  const ctaHint = hasCtaButton(post) ? "\n[Post contains a call-to-action button]" : "";
  return { text: `${text.slice(0, 2000)}${ctaHint}`, author };
};

const hide = (post) => {
  post.style.display = "none";
};

const blur = (post) => {
  post.style.filter = "blur(6px)";
  post.style.cursor = "pointer";
  post.title = "Possibly promoted — click to reveal";
  post.addEventListener(
    "click",
    () => {
      post.style.filter = "";
      post.style.cursor = "";
      post.title = "";
    },
    { once: true },
  );
};

const processPost = async (post) => {
  if (post.hasAttribute(PROCESSED)) return;
  post.setAttribute(PROCESSED, "true");

  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  if (!enabled) return;

  if (hasExplicitAdLabel(post)) {
    hide(post);
    chrome.runtime.sendMessage({ type: "AD_COUNTED" });
    return;
  }

  const { text, author } = extractPost(post);
  if (!text.trim()) return;

  const response = await chrome.runtime.sendMessage({
    type: "CLASSIFY",
    post: { text, author },
  });
  if (!response) return;
  if (response.verdict === "hide") hide(post);
  else if (response.verdict === "blur") blur(post);
};

const scan = () => {
  document.querySelectorAll(site.postSelector).forEach((post) => {
    processPost(post);
  });
};

const observer = new MutationObserver(scan);
observer.observe(document.body, { childList: true, subtree: true });
scan();
