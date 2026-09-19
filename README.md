# Kurox

A Chrome MV3 extension that hides promoted posts on X/Twitter and Reddit timelines.

## How it works

- **Instant hiding, no network calls.** Posts carrying an explicit marker disappear on sight: `Ad` / `Promoted` / `Sponsored` badges, Reddit's `· Ad` header suffix, ad-tracker attributes (`rel="sponsored"`, `data-ad-click-*`, `aria-label="Advertisement:…"`, `alb.reddit.com` links), and Reddit's `<shreddit-comments-page-ad>` containers. The scan recurses into open shadow roots, where Reddit renders its ad links.
- **Semantic judgment for the rest.** Unlabeled posts are evaluated by TypeSafe's Jev model with a single yes/no question — "is this paid promotion?" — and hidden, blurred, or left alone based on configurable thresholds.
- **Reversible by design.** Uncertain posts are blurred instead of hidden; click one to reveal it. The toolbar popup shows a running hidden count plus an enable/disable toggle.

## Install

1. Open `chrome://extensions`, enable Developer mode.
2. Load unpacked → select the repo root (where `manifest.json` lives).
3. Browse X or Reddit. Open the popup → Settings to tune the hide/blur thresholds.

## Layout

- `manifest.json` — MV3 manifest; repo root loads directly as an unpacked extension.
- `src/content.js` — per-site timeline observers (X articles, Reddit `shreddit-post` / comments-page ads), fast-path label and attribute detection.
- `src/labels.js` — pure ad/CTA matchers; patterns duplicated in `content.js` (MV3 content scripts cannot import modules — keep both in sync).
- `src/jev.js` — Jev request shaping, verdict thresholds, text hashing.
- `src/background.js` — batched classification (10 posts/call, 300ms debounce), verdict cache, retry with backoff.
- `src/popup.*` — enable toggle + hidden counter. `src/options.*` — threshold settings.
- `test/` — `bun:test` suites plus labeled ad fixtures for threshold calibration.

## Commands

```sh
bun install
bun test             # unit tests + fixture checks
bun run lint         # oxlint
bun run format       # oxfmt --write
bun run format:check # oxfmt --check
```
