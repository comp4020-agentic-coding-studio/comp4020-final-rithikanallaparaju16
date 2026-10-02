# Five Windows: the harness

A shared house for five friends who live apart: Rithika (Canberra), Neha (New
Jersey), Amirdhavarshini (Tamil Nadu), Rithanya and Aswathy (Bangalore). The
one principle: **connection must not require being online at the same time.**
Someone comes by for 30 seconds, leaves something and goes; someone else finds
it hours or days later. Real-time is a later bonus, never a prerequisite.

The core loop every change protects: enter → pick who you are → leave something
somewhere in the house → it persists → come back → "while you were away" shows
what friends left.

The house (since session 2): a top-down floor plan with a garden, five
bedrooms on a hallway, a living room with the shared wall, a kitchen, and
Laddoo the dog. Each bedroom keeps its owner's local time and personal details
(listed in README.md). Shared rooms follow the visitor's clock.

## What good means

README.md's "What good means here" is the public version; this is the test for
every change:

1. Works asynchronously: one person alone gets something out of a visit.
2. Remembers people: what's left survives refresh, restart and redeploy.
3. Makes coming back worth it: returning shows who was here and what's new.
4. Feels like a place, not a feed or a chat app with a skin.
5. Is built for exactly five, so it can assume familiarity.
6. Has few interactions, each one making people feel closer.
7. Gets more alive when friends overlap, without requiring it.

## Feel

Personal, playful, intimate, warm, slightly nostalgic. Never Discord, WhatsApp,
Instagram, a forum or a dashboard. No likes, counts, engagement metrics,
algorithmic feeds, public profiles, infinite scroll or unrequested
notifications.

## Before building a feature

Ask: does it help five friends feel connected across distance, and does it
strengthen the core loop enough to justify its complexity? If not, don't build
it. Photos, drawings, prompts and real-time are possibilities, not a backlog. A
feature that changes the core interaction or the house metaphor goes back to
Rithika first.

Rules in the house never punish absence: plants get thirsty but never die,
rooms get lived-in but never gross, Laddoo naps but is never sad. Coming back
should feel like being missed, not like being behind.

## Decisions

Architecture decisions live in `doc/adr/`, one numbered file each. Read them
before proposing a change to the stack, storage, data model, drawing approach
or clocks. To change one, write a new record that supersedes it. Don't edit an
accepted record.

## Architecture rules

- Node 24 runs `src/*.ts` directly (type stripping). Use erasable TypeScript
  only (no enums or parameter properties); `pnpm typecheck` enforces it.
- No build step and no runtime dependencies. The Dockerfile copies `src/`,
  `public/` and `README.md` and runs node. Adding a runtime dependency needs a
  reason written in PROCESS.md, and the Dockerfile must then install it.
- All state lives in SQLite at `$DATA_DIR/house.db` (`/data` on Fly, the only
  storage that survives a redeploy; `./data` locally). Nothing friends must see
  lives in memory or the browser.
- Everything people leave is a row in the append-only `things` table. Mess,
  thirst, growth, Laddoo's spot and the counter are worked out from
  timestamps in `src/house.ts`, with no timers (ADR 0005). Add new `kind` and
  `item` values; never rename one, since stored rows use them.
- Pages are server-rendered HTML forms that post and redirect. Every
  user-written string goes through `esc()` in `src/html.ts`.
- Drawings are SVG strings built in `src/art.ts`. Each room is drawn once in
  its own coordinates and reused by the floor plan and its room page (ADR
  0004). SVG ids (masks, patterns) must stay unique within a page.
- The five are fixed in `src/people.ts`, with city, IANA zone and sleep hours.
  Ids are window numbers; never change an id, since everything left
  references it. Rename by changing `name`.
- `/readme/` renders README.md with `src/markdown.ts`, which supports headings,
  paragraphs, flat lists, blockquotes, code, links, images and emphasis only.
  Keep README.md within that, and don't add relative links to repo files
  (they 404 at `/readme/`).
- Don't change the settings `fly.toml` marks as fixed.

## Tooling

- mise isn't active in the agent's shell, so node isn't on PATH. Run
  everything as `mise exec -- <command>` (`mise exec -- pnpm check`).
- Deploy with `mise exec -- flyctl deploy --remote-only --ha=false -a
  comp4020-final-rithikanallaparaju16`. mise supplies the token from
  `mise.local.toml`. If mise says that file isn't trusted, `mise trust
  mise.local.toml` is the fix; it's Rithika's own file.
- There's no Docker locally, so Fly's remote builder is the only place the
  image gets built before CI.
- If port 8080 is already taken (Rithika may have a server running), don't
  kill it. Use `PORT=8091 pnpm start` and `APP_URL=http://localhost:8091 pnpm
  check`. `src/store.ts` migrates the database when it loads, before the server
  binds its port, so even a server that fails to start can migrate `./data`
  under one that's already running.

## Testing rules

- `pnpm start` in one terminal, `pnpm check` in another. The spec runs against
  the running app over HTTP.
- One test per promise the product makes; no tests for test count.
- Spec tests that write notes or record visits stay inside the `throwaway`
  gate in `spec/house.test.ts`. They must never write into the real house on
  Fly.
- Look at UI changes at phone width (390px) and desktop before calling them
  done: `node scripts/shot.ts <url> <out.png> 390 <who>`, then read the PNG.
  It uses headless Chrome's device emulation, which goes below the ~500px
  window minimum and can set the `who` cookie. The old 390px-iframe trick can't
  send the cookie, so it only ever shows the door.

## Deploying

The deployed app is the real app. After deploying, check the live URL: the door
loads, `/readme/` renders, and the read-only spec passes
(`APP_URL=https://comp4020-final-rithikanallaparaju16.fly.dev pnpm test`). Never
call a deploy working without that check.

## Process rules

- After every prompt, add an entry to the project log at the bottom of
  PROCESS.md: what was asked, what the agent did, any correction Rithika made,
  and the commit hash(es).
- Record corrections and interruptions as they happened. Don't invent
  interactions or guess at motives.
- Never read or print `mise.local.toml`; it holds the Fly token.
- `reflections/crit-*.md` are Rithika's to write, not the agent's.

## Working with Rithika

- When asked for a working version, build it, and keep pre-build assessments
  short. In the first session Rithika rejected two of the agent's inspection
  commands. After the first came "give me a working version"; after the second,
  the brief came back with the inspect-first and wait-for-confirmation sections
  cut.
- Make the small calls yourself, but name every product decision in the reply
  so it can be redirected.
- Keep shell commands single-purpose. Both rejected commands were multi-part
  environment checks; no reason was given, so don't read more into it than
  "fewer, plainer commands".
