import { describe, expect, test } from "bun:test";
import { hasAdAttributes, isAdLabelText, isCtaText, isPromotedRoot } from "../src/labels.js";

describe("isAdLabelText", () => {
  test("exact badges match", () => {
    expect(isAdLabelText("Ad")).toBe(true);
    expect(isAdLabelText("Promoted")).toBe(true);
    expect(isAdLabelText("Sponsored")).toBe(true);
    expect(isAdLabelText("ad")).toBe(true);
  });

  test("Reddit '· Ad' header suffix matches", () => {
    expect(isAdLabelText("Official_Klaviyo · Ad")).toBe(true);
    expect(isAdLabelText("u/Glarpenheimer · Ad")).toBe(true);
    expect(isAdLabelText("· Ad")).toBe(true);
  });

  test("negatives do not match", () => {
    expect(isAdLabelText("Already read")).toBe(false);
    expect(isAdLabelText("Ad-free experience")).toBe(false);
    expect(isAdLabelText("I saw an ad today")).toBe(false);
    expect(isAdLabelText("Download")).toBe(false);
    expect(isAdLabelText("")).toBe(false);
  });

  test("long text never matches even with suffix", () => {
    expect(isAdLabelText(`${"x".repeat(100)} · Ad`)).toBe(false);
  });
});

describe("hasAdAttributes", () => {
  test("Reddit ad click-tracker link matches", () => {
    expect(
      hasAdAttributes({
        rel: "noopener nofollow sponsored",
        ariaLabel: "Advertisement: This is what a truly effective SAT solution looks like.",
        href: "https://alb.reddit.com/cr?za=rsyuMJKnV5Rsach6MZo9dYV37h6ykiYvJqvSekZ458&sponsored",
        adClick: true,
      }),
    ).toBe(true);
  });

  test("each signal matches on its own", () => {
    expect(hasAdAttributes({ rel: "nofollow sponsored" })).toBe(true);
    expect(hasAdAttributes({ ariaLabel: "Advertisement: cheap CRM" })).toBe(true);
    expect(hasAdAttributes({ href: "https://alb.reddit.com/click" })).toBe(true);
    expect(hasAdAttributes({ adClick: true })).toBe(true);
  });

  test("organic links do not match", () => {
    expect(hasAdAttributes({ rel: "noopener nofollow", href: "https://example.com" })).toBe(false);
    expect(hasAdAttributes({ ariaLabel: "Post by u/someone" })).toBe(false);
    expect(hasAdAttributes({})).toBe(false);
  });

  test("is-promoted marker matches", () => {
    expect(hasAdAttributes({ promoted: true })).toBe(true);
  });
});

describe("isPromotedRoot", () => {
  test("Reddit comments-page ad root matches", () => {
    expect(
      isPromotedRoot({
        tagName: "shreddit-comments-page-ad",
        classNames: ["promotedlink", "relative", "block"],
        attrNames: ["id", "post-id", "ad-type", "campaign-id", "ad-events", "placement"],
      }),
    ).toBe(true);
  });

  test("each marker matches on its own", () => {
    expect(isPromotedRoot({ tagName: "SHREDDIT-COMMENTS-PAGE-AD" })).toBe(true);
    expect(isPromotedRoot({ classNames: ["promotedlink"] })).toBe(true);
    expect(isPromotedRoot({ attrNames: ["campaign-id"] })).toBe(true);
    expect(isPromotedRoot({ attrNames: ["ad-type"] })).toBe(true);
  });

  test("organic roots do not match", () => {
    expect(isPromotedRoot({ tagName: "shreddit-post", classNames: [], attrNames: ["id"] })).toBe(
      false,
    );
    expect(isPromotedRoot({})).toBe(false);
  });

  test("is-ad is not trusted", () => {
    expect(isPromotedRoot({ tagName: "div", classNames: [], attrNames: ["is-ad"] })).toBe(false);
  });
});
describe("isCtaText", () => {
  test("known CTAs match", () => {
    expect(isCtaText("Learn More")).toBe(true);
    expect(isCtaText("Shop Now")).toBe(true);
    expect(isCtaText("Sign Up")).toBe(true);
  });

  test("organic chrome does not match", () => {
    expect(isCtaText("Share")).toBe(false);
    expect(isCtaText("Join")).toBe(false);
    expect(isCtaText("Reply")).toBe(false);
    expect(isCtaText("")).toBe(false);
  });
});
