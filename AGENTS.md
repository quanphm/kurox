# AGENTS.md

MV3 Chrome extension at repo root (manifest.json). Bun + oxlint + oxfmt. No bundler, no tests.

## Layout

- `manifest.json` — extension manifest; load repo root as unpacked extension.
- `src/content.js` — MutationObserver on timeline articles; explicit `Ad`/`Promoted`/`Sponsored` labels hidden without API calls; rest sent to background.
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
- API key lives in `chrome.storage.sync` (user-provided via Options page); never hardcode it.
- Thresholds: `noul >= hideThreshold` (0.7) hide, `>= blurThreshold` (0.4) blur, else leave. Tune against real timeline data.
