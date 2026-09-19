// Pure ad/CTA matchers. Source of truth for the patterns also inlined in
// src/content.js (classic content scripts cannot use ES imports).
// Keep both copies in sync.
export const AD_LABEL_RE = /^(Ad|Promoted|Sponsored)$/i;
export const AD_SUFFIX_RE = /·\s*(Ad|Promoted|Sponsored)$/i;
export const MAX_LABEL_CHARS = 80;

export const CTA_RE =
  /^(Learn More|Shop Now|Sign Up|Install Now|Play Now|Order Now|Book Now|Subscribe|Download|Get Offer|Try Now|Join Now)$/i;

export const isAdLabelText = (text) => {
  const trimmed = text.trim();
  if (trimmed.length > MAX_LABEL_CHARS) return false;
  return AD_LABEL_RE.test(trimmed) || AD_SUFFIX_RE.test(trimmed);
};

export const isCtaText = (text) => CTA_RE.test(text.trim());

// Machine-readable ad attributes (e.g. Reddit's ad click-tracker link:
// rel="noopener nofollow sponsored", data-ad-click-location,
// aria-label="Advertisement: ...", href on alb.reddit.com).
export const hasAdAttributes = ({
  rel = "",
  ariaLabel = "",
  href = "",
  adClick = false,
  promoted = false,
}) =>
  rel.split(/\s+/).includes("sponsored") ||
  ariaLabel.startsWith("Advertisement") ||
  href.includes("alb.reddit.com") ||
  adClick === true ||
  promoted === true;

// Promotion markers on a post root element (e.g. Reddit's
// <shreddit-comments-page-ad class="promotedlink" ad-type campaign-id ...>).
// Mirrored by the matches() selector in isPromotedContainer — keep in sync.
// NOTE: is-ad="" is deliberately excluded; it appears empty on organic menus.
const PROMOTED_ROOT_TAGS = ["SHREDDIT-COMMENTS-PAGE-AD"];
const PROMOTED_ROOT_CLASSES = ["promotedlink", "promoted"];
const PROMOTED_ROOT_ATTRS = [
  "ad-type",
  "campaign-id",
  "ad-events",
  "ads-correlation-id",
  "data-promoted",
];

export const isPromotedRoot = ({ tagName = "", classNames = [], attrNames = [] }) =>
  PROMOTED_ROOT_TAGS.includes(tagName.toUpperCase()) ||
  classNames.some((cls) => PROMOTED_ROOT_CLASSES.includes(cls)) ||
  attrNames.some((attr) => PROMOTED_ROOT_ATTRS.includes(attr));
