# Last Alive

A free-to-play, mobile-first, persistent multiplayer survival game played
through a **server-authoritative terminal**. You are a survivor of the Anura
Labs containment breach; your only lifeline is a salvaged ops terminal. The
world is text, the infection spreads in real time, and AI is woven through the
characters, the puzzles, and — eventually — the other "survivors".

This repository is a ground-up rebuild of the original `LastAliveTerminal`
prototype. The implementation plan and milestone roadmap are summarised below.

---

## Why this architecture

The original prototype shipped **all game logic in client JavaScript** — puzzle
answers, passwords, even the contract ABIs — so it was trivially cheatable, and
playing it cost real crypto. The rebuild is organised around three principles
that everything else follows from:

1. **Server-authoritative.** The client is a thin renderer. It sends a command
   string and receives an ordered list of **frames** to draw. No game state,
   puzzle answer, AI prompt, or world data is ever sent that the player has not
   earned. Inspecting the client or the network tab reveals nothing.

2. **A pure, deterministic engine.** `packages/engine` has no I/O and no
   framework imports. The same inputs always produce the same result, so the
   API path, the (future) world tick, and the unit tests all run the *same*
   logic. AI and persistence live outside the engine and never break its
   determinism — AI only ever *proposes*; the engine validates and applies.

3. **Free to play.** No wallet, no payment, no configuration needed to start.
   The blockchain (planned, M4) is used only as a tamper-proof trophy case and
   season ledger — never as the game database.

---

## The Frame contract

The wire boundary between server and client is a single discriminated union,
defined and Zod-validated in `packages/shared`:

```
text | ascii | status | map | choice | prompt | fx | stream
```

The server emits an ordered list of frames; the client renders them and knows
nothing else. `choice` frames drive the mobile command-palette chips; `prompt`
frames put the UI into puzzle/conversation mode. This contract is the reason
the game cannot be cheated from the client.

---

## Monorepo layout

pnpm workspaces + Turborepo. TypeScript throughout, strict mode.

```
packages/
  shared      Zod schemas + the Frame / command wire contract. Zero deps.
  engine      The pure, deterministic game core — no I/O, no framework:
                · command parser + command handlers (look, move, scan, bite,
                  say, broadcast, status, help)
                · puzzles — classic seeded puzzles + AI-gated puzzles
                · interactions — multi-turn puzzle / conversation state
                · simulation — lazy vitals decay + status transitions
                · world graph — the season-01 map
  ai          All Claude integration (server-side only):
                · ANURA persona + conversation (Opus 4.7)
                · the AI-puzzle judge — separate model, structured verdict
                · chat moderation (Haiku 4.5)
                · a MOCK fallback so the game runs with no API key
  db          Supabase Postgres schema, migrations and RLS policies

apps/
  web         Next.js 15 app: the mobile PWA terminal, the command API,
              and the server-side game service
```

### The stack

| Concern | Choice |
|---|---|
| Frontend + API | Next.js 15 (App Router), React 19, deployed target Vercel |
| Persistence | A `GameStore` interface with two implementations (see below) |
| Database (production) | Supabase Postgres — RLS on every gameplay table |
| AI | Claude API via `@anthropic-ai/sdk` — tiered models, prompt caching |
| Blockchain (planned) | Base L2 — gas-sponsored achievement NFTs |
| Tests | Vitest (unit), Turborepo task graph, GitHub Actions CI |

---

## How a command flows

```
client                  /api/command            game service            engine
  │  POST {command} ───────▶ │                        │                     │
  │                          │ auth (httpOnly cookie) │                     │
  │                          │ rate limit             │                     │
  │                          │──── loadContext ──────▶│                     │
  │                          │                        │── runCommand ──────▶│  (pure)
  │                          │                        │◀── frames + ────────│
  │                          │                        │    mutations/events │
  │                          │                        │ applyMutations      │
  │                          │                        │ (AI / chat / etc.)  │
  │  ◀───── frames ──────────│◀─── frames ────────────│                     │
```

- **Identity** is an httpOnly session cookie — client JS can neither read nor
  forge it.
- **The engine is pure.** A command returns `{ frames, mutations, events }` —
  it *describes* changes; the game service applies them.
- **AI and chat are I/O**, so they happen in the game service, not the engine:
  the engine emits a `chat` event or opens an `npc` interaction; the service
  performs the Claude call or message fan-out.
- **Notifications** (a bite landing, an incoming message) are queued and
  delivered out-of-band via `/api/poll` — the poll-based stand-in for Web Push.

### The two stores

`GameStore` abstracts persistence so the game runs with zero configuration:

- **memory store** — module-level Maps, *shared across all players in one
  process*. The default; makes local multiplayer testing work with no setup.
- **supabase store** — durable Postgres, service-role (the trusted authority).
  Activates automatically when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are
  set. Required for multi-instance production.

### AI integration

AI is server-side only and never sees the client. Models are tiered by job:
**Opus 4.7** for characters (ANURA), **Sonnet 4.6** for the puzzle judge,
**Haiku 4.5** for chat moderation. The judge is a *separate* model call from the
role-played character, so a player cannot talk a character into scoring itself.
With no `ANTHROPIC_API_KEY`, the package runs in **mock mode** — deterministic
stand-in characters and a keyword judge — so the whole game is playable offline.

---

## Current status

The game is **playable now** — `pnpm dev`, zero configuration. Verified by 77
passing tests plus live end-to-end runs.

| Milestone | Status | What works |
|---|---|---|
| **M0** Skeleton & engine core | ✅ | Monorepo, pure engine, Frame contract, CI |
| **M1** Server-authoritative loop | ✅ | Mobile CRT terminal, `/api/command`, the two stores |
| **M2** Puzzles & AI characters | ✅ | Seeded classic puzzles; ANURA — an AI you must talk past — with a separate structured-output judge; lazy vitals decay |
| **M3a** Multiplayer & infection | ✅ | Shared world, presence, `bite`, HUMAN→INFECTED→ZOMBIE, playable zombies, poll-based notifications |
| **M3b** Mesh messaging | ✅ | `say` (node) / `broadcast` (world) with Haiku moderation |

**Playable today:** boot into the quarantine zone, solve a binary-keypad puzzle
to enter a lab, talk the overseer AI into opening the vault, manage decaying
vitals — and, with a second browser tab, infect another survivor and talk on
the mesh.

---

## Roadmap

| Milestone | Planned work |
|---|---|
| **M3c** Safehouses | Create / join / leave; a safehouse radio channel; lockdowns & vote-outs |
| **M3d** AI players | Autonomous agents that play via the command API at a human-plausible cadence — so the world is never empty and you cannot reliably tell who is real |
| **M4** Chain & seasons | Base L2 contracts (`AchievementNFT`, `SeasonLedger`); gas-sponsored minting; the AI Director; offline AI world/puzzle generation; season lifecycle |
| **M5** Launch | Marketing site, public leaderboards, cosmetic-only monetisation, Web Push, observability, public launch |

**Infrastructure deferred until deployment:** real Supabase Realtime wiring, Web
Push (VAPID + service worker), and the dedicated worker process. Their game
logic is built; local builds use in-process / poll-based equivalents.

---

## Develop

```bash
corepack enable          # provides pnpm
pnpm install
pnpm dev                 # http://localhost:3000 — open on a phone on the same Wi-Fi
                         #   (open a second tab to be a second survivor)

pnpm test                # all package test suites (Vitest)
pnpm typecheck           # type-check every package
pnpm lint                # eslint
```

Runs zero-config on the in-memory store and mock AI. To enable durable storage
and live Claude, copy the variables documented in `apps/web/.env.example`
(`SUPABASE_*`, `ANTHROPIC_API_KEY`), apply `packages/db/migrations`, and run
`pnpm --filter @last-alive/db seed`.
