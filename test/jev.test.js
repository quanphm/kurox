import { describe, expect, test } from "bun:test";
import { buildRequest, decideVerdict, hash, MODEL } from "../src/jev.js";
import fixtures from "./fixtures/ads.json";

const DEFAULTS = { hideThreshold: 0.7, blurThreshold: 0.4 };

describe("decideVerdict", () => {
  test("high noul hides", () => {
    expect(decideVerdict(0.95, DEFAULTS)).toBe("hide");
    expect(decideVerdict(0.7, DEFAULTS)).toBe("hide");
  });

  test("mid noul blurs", () => {
    expect(decideVerdict(0.69, DEFAULTS)).toBe("blur");
    expect(decideVerdict(0.4, DEFAULTS)).toBe("blur");
  });

  test("low noul leaves", () => {
    expect(decideVerdict(0.39, DEFAULTS)).toBe("leave");
    expect(decideVerdict(0, DEFAULTS)).toBe("leave");
  });

  test("custom thresholds are honored", () => {
    const strict = { hideThreshold: 0.9, blurThreshold: 0.8 };
    expect(decideVerdict(0.85, strict)).toBe("blur");
    expect(decideVerdict(0.79, strict)).toBe("leave");
  });
});

describe("hash", () => {
  test("deterministic and text-sensitive", () => {
    expect(hash("hello")).toBe(hash("hello"));
    expect(hash("hello")).not.toBe(hash("world"));
  });
});

describe("buildRequest", () => {
  test("shapes a valid Jev request", () => {
    const posts = [
      { text: "Buy now, 81% off!", author: "@seller" },
      { text: "Good morning everyone", author: "@friend" },
    ];
    const req = buildRequest(posts);
    expect(req.model).toBe(MODEL);
    expect(req.state.posts).toHaveLength(2);
    expect(Object.keys(req.questions)).toEqual(["post_0", "post_1"]);
    for (const q of Object.values(req.questions)) {
      expect(q.type).toBe("noul");
      expect(q.instructions).toBeString();
      expect(q.criteria.true).toBeString();
      expect(q.criteria.false).toBeString();
    }
  });

  test("each question references its own evidence path", () => {
    const req = buildRequest([
      { text: "a", author: "x" },
      { text: "b", author: "y" },
    ]);
    expect(req.questions.post_0.instructions).toContain("posts[0]");
    expect(req.questions.post_1.instructions).toContain("posts[1]");
  });
});

describe("ad fixtures", () => {
  test("every fixture is well-formed and expected to hide", () => {
    expect(fixtures.length).toBeGreaterThan(0);
    for (const fixture of fixtures) {
      expect(fixture.text.length).toBeGreaterThan(0);
      expect(fixture.expected).toBe("hide");
      // A clear-cut promo pitch must clear the default hide threshold
      // once judged; fixtures pin the calibration target.
      expect(decideVerdict(0.95, DEFAULTS)).toBe(fixture.expected);
    }
  });
});
