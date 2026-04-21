# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Root is an npm workspaces monorepo (`client`, `server`). Run everything from the repo root unless noted.

- `npm install` — installs both workspaces
- `npm run dev` — starts client (Vite, port 5173) and server (tsx watch, port 3001) concurrently
- `npm run dev:client` / `npm run dev:server` — run one side in isolation
- `npm run build` — builds server first (`tsc -p server/tsconfig.json`), then client (`tsc -b && vite build`). Order matters in prod: the Express app serves `client/dist` as static files.
- `npm run start` — runs the built server only (`node server/dist/server.js`); expects the client bundle at `client/dist` relative to the compiled server file
- No test runner, linter, or formatter is configured — do not invent commands

Environment variables:
- Server: `PORT` (default 3001), `CLIENT_ORIGIN` (default `http://localhost:5173`, used for Socket.IO CORS)
- Client: `VITE_SERVER_URL` — when unset in production, the client connects to the page's own origin (the server hosts the client bundle, so same-origin works out of the box on Railway)

Deployment: `railway.json` builds with Nixpacks using `npm run build`, starts with `npm run start`, and health-checks `/health`.

## Architecture

Real-time social deduction game. A single Express server hosts both the Socket.IO game loop and (in prod) the static client bundle. All state is in-memory — restarting the server wipes every room.

### State model (server)

- `server/src/store/roomStore.ts` — two module-level `Map`s: `rooms` (by room code) and `socketToPlayer` (socket id → player id). This is the only place mutable state lives. No database.
- `server/src/game/roomService.ts` — all game rules. Mutates `Room` objects in place, then calls `saveRoom` to persist back to the map. This file is the source of truth for phase transitions, role assignment, vote resolution, scoring, and host transfer on disconnect.
- `server/src/sockets/registerGameHandlers.ts` — thin adapter between Socket.IO events and `roomService`. It resolves `playerId` from the socket via `getPlayerIdBySocket(socket.id)` for every host-gated action, so never trust a `playerId` from the client payload.

Phase machine: `lobby → speaking → voting → result → lobby` (via `prepareNextRound`, which preserves `roundNumber` and scores but clears per-round state). Disconnects during non-lobby phases mark a player `connected: false` rather than removing them; if active players drop below `MIN_PLAYERS_TO_START` (3), the round is force-reset to lobby. Host leaves trigger host reassignment to the next connected player.

### Public vs private state

The server exposes two distinct shapes for the same round:
- `PublicRoomState` (via `toPublicRoomState`) — broadcast to the whole room on the `room_state` event. Scrubs `spyPlayerIds`, `civilianWord`, `spyWord`, and `votes` except during the `result` phase, when `revealedSpyIds` and `winnerSide` are filled.
- `PrivateRoundInfo` — emitted directly to each player's socket via `private_word` at game start, carrying only that player's role and word.

When adding new round state, decide explicitly whether it goes on the public or private channel — leaking spy identities via a careless public field would break the game.

### Socket event contract

Event names are defined in **two** places that must stay in sync: `server/src/config/constants.ts` (`SOCKET_EVENTS`) and `client/src/lib/socket.ts` (`SOCKET_EVENTS`). Same for the duplicated type files: `server/src/types/game.ts` + `server/src/types/socket.ts` mirror `client/src/types/game.ts` + `client/src/types/socket.ts`. There is no shared package — when changing an event payload or adding an event, update all four locations.

Host-only actions: `start_game`, `update_room_settings`, `next_turn`, `next_round`. Enforced server-side by `ensureHost`.

### Client structure

- `client/src/App.tsx` — single stateful component. Owns the entire `AppState`, wires all socket listeners in one `useEffect`, and renders one of five screens (`HomeScreen`, `LobbyScreen`, `SpeakingScreen`, `VotingScreen`, `ResultScreen`) based on `room.round.phase`. Phase routing is purely derived from server state — no client-side router.
- `client/src/features/*` — one folder per screen; each screen is a pure presentational component receiving `room`, `playerId`, and callbacks from `App.tsx`.
- `client/src/components/` — shared presentational primitives (`Badge`, `Button`, `Panel`, `PlayerList`).
- Styling is Tailwind with a small extended palette (`night`, `mist`, `coral`, `aqua`, `gold`) and custom `float`/`fadeUp` animations defined in `client/tailwind.config.ts`.

### Module system gotcha

The server uses `"type": "module"` + `"module": "NodeNext"` TypeScript. Every intra-project import in server source code must use an **explicit `.js` extension** even though the file on disk is `.ts` (e.g. `import { createApp } from './app.js'`). The compiled output preserves these specifiers. New server files should follow the same pattern or Node will fail to resolve them at runtime.
