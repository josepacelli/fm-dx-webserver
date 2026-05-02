# AGENTS.md

## Quick Start

```bash
npm install          # first time only
npm run webserver    # production
npm run debug        # + debug logging
npm run debug_full   # + FFmpeg debug
node index.js --config path/to/file.json  # custom config
```

No lint, typecheck, formatter, or test suite exists. Verification is manual. Logs go to `serverlog.txt`.

## Key Gitignore Rules

- `config.json` is gitignored — it is local-only and auto-created on first run
- `web/js/plugins/` is gitignored — auto-created symlinks (Unix) or junctions (Windows) on server startup; do not commit
- `serverlog.txt` is gitignored

## Architecture

- `index.js` → `server/index.js` (real entrypoint, ~811 lines)
- Frontend: EJS templates (`web/index.ejs`) + vanilla JS/jQuery (`web/js/`), no framework
- Four WebSocket servers on one HTTP server: `wss` (main data/RDS), `chatWss`, `rdsWss`, `pluginsWss`
- REST API: `server/endpoints.js`
- RDS parsing: `koffi` FFI → native `librdsparser` binary from `server/libraries/`, selected by `os.platform()` + `os.arch()`
- Audio: FFmpeg (PCM-16LE 48kHz) → `server/stream/3las.server.js` → browser Web Audio API
- Config: `server/server_config.js` deep-merges defaults onto existing config at startup; saves async on every change

## Plugin System

- Backend: `plugins/{name}_server.js` loaded by `server/plugins.js` with 3-second staggered delays
- Frontend: `server/plugins.js` creates symlinks/junctions into `web/js/plugins/` at startup
- Each plugin exports `{ name, version, author, frontEndPath }`

## Authentication

Session-based (`express-session`). Two password tiers: `tunePass` (tuning) and `adminPass` (admin settings). IP banlist: `config.webserver.banlist`.

## CI

Single workflow (`.github/workflows/librdsparser.yml`): fetches and commits `librdsparser` native binaries for multiple platforms. No CI for the app itself.
