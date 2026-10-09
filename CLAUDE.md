# Five Windows: the harness

A shared house for five friends who live apart: Rithika (Canberra), Neha (New
Jersey), Amirdhavarshini (Tamil Nadu), Rithanya and Aswathy (Bangalore). The
one principle: **connection must not require being online at the same time.**
Someone comes by for 30 seconds, leaves something and goes; someone else finds
it hours or days later. Real-time is a bonus (the house is live since session
8, ADR 0010), never a prerequisite: everything still waits for whoever comes
by later. The one exception, at Rithika's asking, is UNO's twenty-second turns
(ADR 0016).

The core loop every change protects: enter → pick who you are → leave something
somewhere in the house → it persists → come back → "while you were away" shows
what friends left.

The house (since session 3): Rithika's Google Stitch illustration of a
cutaway house, seen from above, with five bedrooms, a living room with the
shared wall, a kitchen, a garden, and Shinzo the dog (Laddoo until session
7; his code, CSS and picture are still `laddoo`, and petting him is still the
`play` kind). The five are her Stitch stickers. Since session 5 nobody moves
on their own: you walk yourself (keys, or a thumb stick on touch screens),
and friends stand where they last were (ADR 0008). Since session 7 the
house keeps where everyone stopped (ADR 0009). Don't bring back automatic
wandering for the five. Shinzo is the exception: since session 8 he has his
own day, worked out from the clock alone and the same for every viewer, and
lies down only to nap (ADR 0012). A pet or a treat has him follow that
friend for 30 minutes.

Since session 7, whatever you walk up to that you can use (beds, desks, the
mat, mirror, yoga mat, sofas, wall, stove, garden patches, Shinzo) lights up,
and buttons for it appear above Go in. Each is a `<g class="act">` hotspot in
`hotspots()` in `src/scene.ts`, and each button is a link or a form the
page already has. Anyone can sleep in any bed (`nap`) or sit on a seat in
`SEATS` (`sit`). Every action has an emoji (`EMOJI` in `src/art.ts`) on its
button. After a form posts, the `?did=` it redirects with pops `POP`'s emoji
up where it happened (`pops()` in `src/scene.ts`, `g.pops`); the script
pops the button's emoji as you press it. A new action gets both. Since
session 8, friends who are here (`.walker.here`) within `HUG_REACH` are
hotspots too, built by `public/house.js`: "Hug Neha" or a group hug, up to
all five (`hug`, the others' ids in `item`). Someone sitting is offered only
`.act.seated` hotspots (UNO on the mat). Each bedroom keeps
its owner's local time and personal details (listed in README.md). Only
bedrooms dim, each by its owner's clock; the living room, kitchen, garden and
halls are always in daylight (ADR 0015, Rithika: "no common area should be
dim"). Laptop: the house with updates beside it. Phone: the house
fills the screen, with Home, Updates, Movies and Everyone tabs at the bottom.

Since session 4, two rooms have an activity of their own: face masks in
Rithanya's (`MASK_ROOM`) and kettle Maggi in Amirdhavarshini's (`KETTLE_ROOM`),
both in `src/house.ts`. Movie time (`/movies`) is its own tab because Rithanya
loves movies. Since session 8, UNO is played on Amirdhavarshini's mat: two to
five friends sitting on it can deal (seven cards each), and the game is
replayed from `uno`/`unomove` rows by `src/uno.ts` (ADR 0013). Each turn
lasts twenty seconds (it was ten until 9 Oct), worked out from timestamps: whoever runs out, or leaves
the house (a `quit` move), is out, and the rest play on (ADR 0016). Each friend's birthday is in `src/people.ts`: all
through her birthday month (her own clock) her room has bunting and balloons
and she wears a crown; friends can wish her (`wish`). Neha sleeps 10 pm to
8 am ("make nehas sleeping hours to be 10", read as both bedtime and length;
she can redirect it). These details come from Rithika; ask her before
inventing new ones for the friends. (The agent once read the Stitch art's
boxes as cats; they were KitKats.)

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
rooms get lived-in but never gross, Shinzo naps but is never sad. Coming back
should feel like being missed, not like being behind. UNO's twenty-second turns
are the one deliberate exception, because Rithika asked for them (ADR 0016);
don't spread it to anything else without asking her.

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
  lives in memory or the browser. The only thing in memory is who has a page
  open right now (`src/live.ts`), which is presence, not state.
- Everything people leave is a row in the append-only `things` table. Mess,
  thirst, growth, Shinzo's day, who's asleep, sitting or hugging where, UNO
  hands, and the counter are worked out from timestamps in `src/house.ts`
  and `src/uno.ts`, with no timers (ADR 0005). Add new `kind` and `item`
  values; never rename one, since stored rows use them.
- The house is live (ADR 0010). Every open page holds `GET /live`
  (server-sent events, a heartbeat every 25 s). `src/store.ts` reports every
  write: `leave()` is `changed`, `walkTo()` is `moved`, and a page load only
  counts when someone comes home or changes place, so pages fetching
  themselves never set each other off. `public/live.js` re-fetches the page
  on `changed` (with an `x-live` header, which keeps your place) and swaps
  every `data-live` region (pages.ts `slot()`), skipping one you're typing
  in; then it fires `house:fresh`, and `public/house.js` swaps the SVG's
  groups, keeping your own walker. `moved` becomes `house:moved`, which
  walks that friend. A new card or list on a page needs a `data-live` key,
  or it won't update live (the UNO page missed one at first, and felt like
  lag: a friend's move only showed after a reload). A form marked
  `data-quick` (UNO's hand) posts with `fetch` and swaps the answer's live
  parts in without leaving the page; a refusal posts again the ordinary way
  to show why. Focus on a button never holds back a live swap; only typing
  does.
- One of us at a time (ADR 0011). The cookie is `who=<id>.<token>`, and the
  token must match `visits.token`. A friend is held while a page with her
  token is open, or for 2 minutes after her last page load; the door shows
  her window as a disabled `button.person.taken`, and `POST /me` answers 409.
  `POST /leave` lets go.
- Pages are server-rendered HTML forms that post and redirect. Every
  user-written string goes through `esc()` in `src/html.ts`.
- The house is `public/art/house.jpg` with an SVG layer from `src/scene.ts`
  on top, in the image's own pixels (1376 × 768). Rooms, walking spots,
  pillows, desks and name tags are coordinates in `ROOMS`; a room page is the
  same SVG with that room's viewBox (ADR 0007). Small drawings (food, notes,
  clutter, plants) stay in `src/art.ts`. One house SVG per page, so its ids
  (`head`, `glow`, `sit`) stay unique.
- `public/art/` is generated by `python3 scripts/cut-art.py` from
  `stitch_virtual_shared_house/` (needs Pillow; dev-only, never in the
  image). Change the script and rerun it rather than editing the images.
  The script also paints out the second study table in Amirdhavarshini's and
  Aswathy's rooms (`one_desk_each`). Pages ask for art through `art()` in
  `src/assets.ts`, which adds a fingerprint of the file. Browsers keep art
  for a day, so without it a changed picture doesn't show. After moving
  anything, look at it over the picture before trusting the coordinates.
- Client JavaScript is enhancement only: `public/house.js` builds the walking
  controls (arrow keys/WASD, the thumb stick, the Go in button), walks you to
  a tapped room, keeps a phone's view on you, zooms in going into a room and
  out leaving one, walks Shinzo along his day (`data-path`) and after
  whoever petted or fed him, lights up the hotspot you're next to, offers
  hugs, and moves friends as they walk. Where you stepped out of a room, and where
  Shinzo was when you petted or fed him (so he gets up and comes over on the
  page you land on), ride in `sessionStorage` for one page load only. Where you are goes to the
  server with `sendBeacon` to `POST /here` (204, no page) a few times a
  second while you walk and when you stop, the one write that needs the
  script, since only the script walks. It reads the room
  outlines and hotspots from the page, so `ROOMS` and `hotspots()` stay the
  one source of coordinates. Every link and form must work without it, and
  the spec never relies on it. Automatic animations stop under
  `prefers-reduced-motion`; walking yourself doesn't. Keys are ignored while
  someone's typing in a form.
- `visits` keeps each friend's last page load, the start of their current
  visit, the place they were last in (`place`), when they came into it or
  last walked (`arrived`), and the spot they stopped at (`x`, `y`, NULL for
  the place's first spot) (ADR 0009), plus the session token and when it was
  claimed (ADR 0011). Everyone is drawn there, except in their own bed
  during their sleep hours. Friends seen in the last ten minutes (an open
  page keeps it fresh) are "home now" and glow.
- The five are fixed in `src/people.ts`, with city, IANA zone, sleep hours
  and birthday.
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
- The repo has been public since 6 October 2026, and CI now checks and
  deploys every push to `main` (`.github/workflows/checks.yml`). Shipping is
  push, then `gh run watch` until `check` and `deploy` pass. Don't
  `flyctl deploy` by hand any more; a second deploy races CI's. `flyctl
  status` and `flyctl logs` are still fine for reading.
- Crit cutoffs are tagged: after a shipped deploy before a crit's cutoff, tag
  the deployed commit `crit-<n>` and push the tag. Re-shipping before the
  cutoff moves it (`git tag -fa`, then force-push that tag only). Never move
  one after its cutoff.
- If port 8080 is already taken (Rithika may have a server running), don't
  kill it. Use `PORT=8091 pnpm start` and `APP_URL=http://localhost:8091 pnpm
  check`. `src/store.ts` migrates the database when it loads, before the server
  binds its port, so even a server that fails to start can migrate `./data`
  under one that's already running. To leave `./data` alone entirely, copy
  it and run with `DATA_DIR=/tmp/<somewhere>`.
- The server doesn't reload code. Use `node --watch src/server.ts` while
  iterating, or restart it before screenshots, or you'll be looking at the
  old code.
- Parallel agents (session 8) each get a git worktree under
  `.claude/worktrees/<name>` on its own branch, their own `PORT`,
  `DATA_DIR=/tmp/<name>` and `SHOT_PORT` (so two `scripts/shot.ts` runs don't
  share a browser), with `node_modules` symlinked from the main checkout.
  Don't run `pnpm` in such a worktree: it tries to reinstall through the
  symlink, which would empty the main checkout's `node_modules`. Run
  `node_modules/.bin/tsc` and `node_modules/.bin/vitest` instead, and stage
  files by name (the symlink shows as untracked). One agent owns
  `public/house.js` at a time; the lead merges the branches.

## Testing rules

- `pnpm start` in one terminal, `pnpm check` in another. The spec runs against
  the running app over HTTP.
- One test per promise the product makes; no tests for test count.
- Spec tests that write notes or record visits stay inside the `throwaway`
  gate in `spec/house.test.ts`. They must never write into the real house on
  Fly.
- The spec's `page()`/`post()` take a friend's id and sign in through
  `POST /me` once, caching the session; `afterAll` signs everyone out. A run
  that crashes holds its friends for 2 minutes, and so does a
  `scripts/shot.ts` run (it signs in through the door too), so a second run
  straight after gets 409s. Wait, or use a fresh `DATA_DIR`.
- Look at UI changes at phone width (390px) and desktop before calling them
  done: `node scripts/shot.ts <url> <out.png> 390 <who>`, then read the PNG.
  It uses headless Chrome's device emulation, which goes below the ~500px
  window minimum and can carry a signed-in cookie. The old 390px-iframe trick can't
  send the cookie, so it only ever shows the door. Phone widths are emulated
  as touch screens (so the thumb stick shows); `TOUCH=1` makes a wider one
  touch too. Check an iPad as well (`TOUCH=1`, 820px): the 700–999px range
  has its own bar and layout, and in session 4 it broke without anyone
  looking. A page that fits the screen is captured as it is; capturing past
  the screen re-lays it out and shifted the phone house off-centre in
  session 6's screenshots, so measure positions in the page before blaming
  the code.
- The spec posts forms directly, so it can't tell if a button actually takes
  a tap. After touching CSS or the SVG layer, tap the door's windows and any
  changed button for real: `node scripts/shot.ts <url> <out.png> 390 none
  'button[name=who][value="2"]'`. It says what's under the finger. Never use
  `element.click()` for this; it skips hit-testing. In session 3 a
  `pointer-events: none` meant for the SVG's `g.people` also matched the
  door's `ul.people`, and the deployed door stopped letting anyone in.
- Class names are shared between the SVG layer and the HTML around it. Scope
  SVG-only rules to the element (`g.people`, not `.people`).

## Deploying

The deployed app is the real app. After CI deploys, check the live URL: the door
loads, `/readme/` renders, and the read-only spec passes
(`APP_URL=https://comp4020-final-rithikanallaparaju16.fly.dev pnpm test`). Never
call a deploy working without that check.

## Process rules

- After every prompt, add an entry to the project log at the bottom of
  `doc/process-log.md`: what was asked, what the agent did, any correction
  Rithika made, and the commit hash(es). Session decisions, what went wrong
  and how the harness changed go in that file too.
- `PROCESS.md` is Rithika's overview for markers, not the log. It runs to
  900–1100 words and is rewritten, not appended to, at each crit. Every claim
  cites a commit as a link whose text is the hash, and `pnpm check:evidence`
  checks they resolve. Don't add to it unless she asks. The brief advises
  she drafts it herself. One standing request (8 Oct 2026): every prompt goes
  into the "Prompts" section at the bottom of `PROCESS.md`, word for word,
  with a link to the commit it led to, "so i can change it later". Add only
  to that section, and never commit her uncommitted draft with it: stage
  `git show HEAD:PROCESS.md` plus the new section (`git hash-object -w`,
  `git update-index --cacheinfo`), so only the prompt lines are committed.
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
