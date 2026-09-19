# Jev Twitter Ads Blocker

A Chrome MV3 extension that hides promoted posts on X/Twitter. Explicitly labeled ads (`Ad`, `Promoted`, `Sponsored`) are hidden in code; ambiguous posts are judged by TypeSafe's Jev model (`noul: is this a paid ad?`) and hidden or blurred by threshold.

## Layout

- `manifest.json` — MV3 manifest (root = extension dir, load unpacked directly).
- `src/content.js` — timeline observer, deterministic Ad-label fast path, hide/blur.
- `src/background.js` — batched Jev classification via `POST https://api.typesafe.ai/v1/systemone`, verdict cache, thresholds.
- `src/popup.html`, `src/popup.js` — enable toggle + hidden count.
- `src/options.html`, `src/options.js` — API key + threshold settings.

## Commands

```sh
bun install
bun run lint         # oxlint
bun run lint:fix      # oxlint --fix
bun run format        # oxfmt --write
bun run format:check  # oxfmt --check
```

Verify by loading the repo root as an unpacked extension and scrolling the X timeline.

## Setup

Set your TypeSafe API key in the extension's Settings (Options page). Without a key, only explicitly labeled ads are hidden.
