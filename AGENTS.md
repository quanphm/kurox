# AGENTS.md

MV3 Chrome extension at repo root (manifest.json). Bun + oxlint + oxfmt. No bundler, no tests.

## Layout

- `manifest.json` — extension manifest; load repo root as unpacked extension.
- `src/content.js` — per-site adapters (X articles / Reddit `shreddit-post` etc.) via MutationObserver; explicit `Ad`/`Promoted`/`Sponsored` leaves, Reddit `· Ad` header suffixes, and ad-tracker attributes (`rel*=sponsored`, `data-ad-click-*`, `aria-label^=Advertisement:`, `alb.reddit.com` href) hidden without API calls. The element walk recurses into open shadow roots (Reddit renders its ad link inside one); CTA presence appended to Jev state as a hint.
- `src/labels.js` — pure ad/CTA matchers (testable); patterns duplicated in `content.js` because MV3 content scripts cannot import modules. Keep both in sync. Trusts `shreddit-comments-page-ad` / `ad-type` / `campaign-id` / `ad-events` / `is-promoted`; deliberately distrusts `is-ad` (present-but-empty on organic menus).
- `src/background.js` — batches posts (10/call, 300ms debounce) to `POST https://api.typesafe.ai/v1/systemone` (model `jev-latest`, one Noul `is_ad` per post); caches verdicts by text hash.
- `src/popup.*` — enable toggle + hidden counter. `src/options.*` — API key + thresholds.
- `.agents/skills/chrome-extensions/` — MV3 best practices; follow when writing extension code.

## Commands

```sh
bun install
bun run lint          # oxlint . — required before PR
bun run format        # oxfmt --write . — required before PR
bunx oxlint <path>    # focused lint
```

- Pre-commit hook runs `oxlint --fix` + `oxfmt --write`.
- No typecheck, no tests. Verify by loading root as unpacked extension and scrolling X timeline.

## Rules that bite

- oxlint: `no-var` error, `no-unused-vars` warn with `^_` ignore, correctness deny + suspicious warn. Ignores: `dist/`, `**/third-party/**`, `.agents/` (vendored skill docs, never reformat).
- Manifest must be MV3. Reference only icon/image files that exist (currently none — icons omitted).
- Thresholds: `noul >= hideThreshold` (0.7) hide, `>= blurThreshold` (0.4) blur, else leave. Tune against real timeline data.
