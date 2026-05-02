# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FM-DX Webserver is a cross-platform Node.js web application that provides a browser-based control interface for FM radio receivers (TEF668x, XDR F1HD, SDR). It handles real-time radio control, RDS metadata decoding via a native C library (librdsparser), and low-latency audio streaming to web clients.

## Commands

```bash
npm install          # Install dependencies
npm run webserver    # Start server (production)
npm run debug        # Start with debug logging
npm run debug_full   # Start with all debug output (includes FFmpeg)
node index.js --config path/to/config.json  # Use custom config file
```

No test suite exists — testing is manual. Logs are written to `serverlog.txt`.

## Architecture

### Entry Point and Server

`index.js` is a thin wrapper that requires `./server/index.js`, which is the real entry point (~811 lines). It sets up Express, multiple WebSocket servers, device connections, audio streaming, and plugin loading.

### WebSocket Architecture

Four independent WebSocket servers share one HTTP server, routed by the `upgrade` event:

| WebSocket | Purpose |
|-----------|---------|
| `wss` | Main data/RDS stream (frequency, signal, RDS fields) |
| `chatWss` | Chat messages |
| `rdsWss` | RDS-specific broadcast |
| `pluginsWss` | Plugin message bus |

### Data Flow

```
Hardware (Serial/Network)
    ↓
server/datahandler.js  ← RDS parsed via koffi FFI → librdsparser native binary
    ↓
server/index.js (WebSocket broadcast)
    ↓
web/js/websocket.js (client) → UI updates via web/js/main.js
```

Audio pipeline: platform audio device → FFmpeg (PCM-16LE 48kHz) → `server/stream/3las.server.js` → browser Web Audio API via `web/js/3las/`.

### Key Server Files

- `server/index.js` — Express setup, WebSocket routing, device connection management, plugin loading
- `server/endpoints.js` — All REST API route handlers
- `server/datahandler.js` — XDR device communication, RDS callback registration via koffi FFI
- `server/server_config.js` — Config load/merge/save; deep-merges new defaults onto existing config at startup
- `server/plugins.js` — Plugin discovery, symlink/junction creation from `/plugins/` into `/web/js/plugins/`
- `server/console.js` — Logging (5 levels: DEBUG, INFO, WARN, ERROR, CHAT/FFMPEG); strips ANSI for file output; rotates at 5000 lines
- `server/helpers.js` — Utilities: custom markdown parser, IP geolocation, crypto helpers

### Frontend

EJS templates rendered server-side (`web/index.ejs` is the main dashboard). Client-side logic is jQuery-based — no framework. Key frontend modules in `web/js/`:

- `main.js` — UI initialization and event wiring
- `websocket.js` — WebSocket client, message dispatch
- `api.js` — Wrapper for REST calls
- `estacoes.js` — Station database and logging UI
- `toast.js` / `modal.js` — Notification and dialog systems

### Plugin System

Plugins are two-part: `plugins/{name}_server.js` (backend) + a frontend JS file declared in `pluginConfig.frontEndPath`. On startup, `server/plugins.js` creates symlinks (Unix) or junctions (Windows) from each plugin's frontend dir into `web/js/plugins/`. Server plugins are loaded with 3-second staggered delays. Each plugin exports a `pluginConfig` object with `name`, `version`, `author`, and `frontEndPath`.

### Configuration

`config.json` at the project root is auto-created on first run. `server/server_config.js` deep-merges missing fields from defaults on every startup — so new config keys added in code will be backfilled for existing users automatically. Config is saved async to disk on any change.

### Native Library (RDS Parsing)

`librdsparser` is a native C shared library loaded via `koffi` (FFI). The correct binary is selected at runtime by `os.platform()` + `os.arch()` from `server/libraries/`. RDS fields (PI, PS, RT, PTY, etc.) are exposed via C function pointer callbacks registered in `server/datahandler.js`.

### Authentication

Session-based via `express-session`. Two password tiers: `tunePass` (tuning control) and `adminPass` (settings access). IP banning is config-driven (stored in `config.webserver.banlist`).
