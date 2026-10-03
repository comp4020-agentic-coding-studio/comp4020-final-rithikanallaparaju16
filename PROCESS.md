# Process

## Why this project

Four close friends and I, five people in all, live away from each other and are
rarely online at the same time. I didn't want another messaging app. The
problem I wrote down for the agent was: *we want to feel connected even when
we're not online at the same time.* One of us might open the app for 30 seconds,
leave something behind and disappear. Another might come back hours or days
later and find it. So the app should feel like a shared little world that
remembers the people who live in it, and keeps existing when nobody's there.

## How I'm working with the agent

I wrote a long direction prompt covering the product, the feeling I'm after,
what to avoid, a seven-point definition of good, architecture preferences,
testing and deployment philosophy, and how I want to work. I gave it to Claude
Code in this repo. `CLAUDE.md` is the harness. It holds the rules future
sessions need, condensed from that prompt and from what happens in sessions. It
doesn't restate the course brief.

## Decisions so far

These were made in session 1. Unless noted, the agent made the call and I can
still redirect it.

- **The metaphor is a house with five windows and a kitchen table.** Five
  windows make the five-person constraint visible. A window is lit if that
  friend came by in the last day, so the house remembers people even when they
  left nothing. The table is a shared surface rather than a feed.
- **The first "something" is a short note (up to 500 characters).** It's the
  smallest thing that carries a piece of someone. Photos, drawings and prompts
  wait until the loop is proven.
- **Identity is "pick your window".** A cookie remembers it for a year, and
  there are no passwords. Anyone with the link can pick any window. That's
  deliberate for now, since strangers at the crit need to walk in. A shared
  front-door key is the likely next step.
- **Discovery is "new since your last visit".** A visit ends after a 30-minute
  gap, and the greeting names who left things. The agent chose the gap up front:
  if every page load counted as a visit, the *new* marks would vanish the moment
  you left a note (leaving one redirects you back to the house).
- **The stack is as small as the problem.** Node 24 runs the TypeScript
  directly, with `node:http`, `node:sqlite` on the Fly `/data` volume,
  server-rendered HTML forms, no client-side JavaScript and no runtime
  dependencies. It fits the 256 MB machine, there's nothing to build, and the
  data sits in the one place that survives a redeploy. The agent considered a
  JSON file, which would be fine for five people, but SQLite gives crash-safe
  writes for free. It also considered `marked` for rendering the README at
  `/readme/`, but wrote a small renderer for the subset the README uses, to stay
  at zero runtime dependencies. The cost is that the README has to stay within
  that subset, which is now a rule in `CLAUDE.md`.
- **Spec checks that write only run against a throwaway house** (localhost or
  CI's container). Running the spec against the live URL never leaves test
  notes in the real house.

### Session 2: the shared house

I asked for the first design to be thrown away and replaced with the house I
actually want: the five of us living together, each in our own room on our own
clock. I gave the agent where everyone lives and what each room should have.
The agent asked me three things before building: who lives in New Jersey
(Neha), who lives in Tamil Nadu (Amirdhavarshini), and whether my opening line
about the week 8 ADR examples meant I wanted ADRs (yes). The big decisions are
recorded in `doc/adr/`:
[0001](doc/adr/0001-a-zero-dependency-node-server-with-html-forms.md) to
[0003](doc/adr/0003-a-person-is-one-of-five-fixed-ids.md) record the session 1
choices after the fact, and
[0004](doc/adr/0004-a-top-down-house-drawn-as-server-side-svg.md),
[0005](doc/adr/0005-one-log-of-things-with-state-derived-from-time.md) and
[0006](doc/adr/0006-each-bedroom-keeps-its-owners-clock.md) cover the drawn
house, the log of things, and the clocks. Those three are marked *proposed*
until I've reviewed them.

These are the smaller product calls the agent made. I haven't reviewed them yet:

- **The name stays Five Windows.** Each window now shows the sky where that
  friend is.
- **Ids:** Neha 2, Amirdhavarshini 3, Rithanya 4, Aswathy 5 (I'm still 1).
- **Sleep hours:** Neha 11:30 pm to 10:30 am, Rithanya 11:30 pm to 9:30 am,
  everyone else 11 pm to 7 am. Anyone in the house in the last ten minutes is
  drawn awake, whatever the hour.
- **Shared rooms follow the visitor's clock.** Only bedrooms keep their
  owner's.
- **Desk notes are private.** Only the owner and the author can read them;
  everyone else sees "a folded note". Gifts are visible to anyone.
- **What you can leave:** masala chai, filter coffee, dosa, biryani, Maggi,
  cake, a mango, a flower or chocolate. Food left in the kitchen stays out for
  three days.
- **The dog is Laddoo.** He follows whoever last played with him to their room
  for twelve hours.
- **Nothing punishes absence.** Rooms get lived-in after two days and messy
  after five. Plants get thirsty after two dry days but never die. Each of us
  has one garden patch, and plants bloom after three days.
- **The wall:** "big news" stays pinned at the top. After 24 notes, older ones
  move to a memory box.
- **Things I didn't specify:** my own room got fairy lights and a plant. The
  avatars use warm brown skin tones and one colour each, as a placeholder until
  I fix them.

### Session 3: the Stitch house

I made the house and the five of us in Google Stitch and asked for them to be
used, with avatars that move, the updates beside the house on a laptop, and
the house filling a phone's screen with tabs. The drawing approach changed, so
[ADR 0007](doc/adr/0007-the-stitch-illustration-with-an-svg-layer-and-a-little-javascript.md)
supersedes 0004 and is *proposed* until I review it. These are the agent's
product calls, not yet reviewed:

- **Stitch's dog Milo is Laddoo.** He and his blanket were cut out of the
  picture, so he can follow whoever played with him to her room.
- **Which room is whose** follows the labelled Stitch export: Amirdhavarshini
  in the big corner room, then Rithika, Rithanya, Aswathy and Neha along the
  front.
- **Who's where:** a friend who's been in the house in the last ten minutes is
  drawn wherever she last went (her room, the kitchen, the garden). Everyone
  else wanders her own room, and during her sleep hours she's a head on her
  pillow with "z z" floating up.
- **Tabs:** Home, Updates and Everyone. At 1000px and wider, the house has
  "while you were away" and everyone's clocks beside it. Below 700px the house
  fills the screen and pans sideways, with a one-line "while you were away"
  strip above it and the tabs at the bottom. In between, the panels sit under
  the house.
- **No counts, but cues:** the Updates tab gets a dot when something's new.
  Rooms with something new for you twinkle (your room, the wall, the kitchen,
  the garden; friends' desks stay their business).
- **Updates is never empty:** under "while you were away" it lists the last ten
  things that happened before, your own included ("You watered the garden").
- **Room descriptions now match the art:** my room has shelves of bottles and
  jars instead of fairy lights, Aswathy's has a yoga mat for meditating instead
  of a corner with cushions, and Rithanya's cats are in boxes and baskets.
- **The door** shows the house, dimmed, behind the five windows, and each
  window now has the sticker in it.

## What went wrong, and what we found

- The agent's shell didn't have node on its PATH, because mise wasn't active.
  `mise install` fixed it, and commands now run through `mise exec --`.
- The first phone-width screenshot was misleading: headless Chrome won't render
  a window narrower than about 500px. Framing the pages in a 390px iframe gave a
  true phone view. That view showed the roof overhanging the screen (a 4px
  horizontal scroll), the windows wrapping 4+1, and "Friend 2 (you)" wrapping
  and knocking its window out of line. All three were fixed: the roof stays
  inside the gutter, phones get a 3+2 grid like two floors, and your own window
  says "you're here". The iframe trick is now a rule in `CLAUDE.md`.
- There's no Docker on my machine, so Fly's remote builder was the first thing
  to build the image. It built and booted on the first try.
- The first deploy attempt had no Fly token. Once I'd added it to
  `mise.local.toml`, mise refused to load the file until it was trusted
  (`mise trust`). Both are now notes in `CLAUDE.md`.
- In session 2, port 8080 was already taken by a `pnpm start` from 16:12
  running the old code. The agent's new server failed to bind, but it had
  already loaded `src/store.ts`, which migrated `./data/house.db`. That moved
  the old notes onto the new wall and dropped the `notes` table, so the old
  server's house page began returning 500. Only local data was involved, and
  the agent had copied the database to `/tmp` beforehand. The agent left the
  old server running and used port 8091 instead. Both facts are now in
  `CLAUDE.md` and ADR 0002.
- The phone-width check from session 1 (a 390px iframe) can't send the
  login cookie, so it would only ever show the door. The agent wrote
  `scripts/shot.ts`, which uses headless Chrome's device emulation instead. That
  goes down to 390px and can set the cookie.
- In session 3, cutting the stickers out of the Stitch lineup took three tries.
  The first flood fill also ate each sticker's white border. The stickers touch
  at the hands, so cutting by columns merged neighbours. And the first fill
  where Milo had been left a blurred ghost of him on the lawn. The script now
  keeps the borders, keeps only each sticker's own blob, and fills the lawn
  from the shade around it.
- The first laptop screenshot of the new house had every room's name tag
  piled up, tilted, in the top-left corner. The tags used the class `tag`,
  which the "new" badges already use, and that rule's CSS `transform` replaced
  the SVG's own positioning. The fix was a rename to `nametag`. The first
  attempt at the rename renamed the badge rule too; the agent saw it in the
  output and put it back.
- The next screenshot still showed the bug, because the server was still
  running the old code (node doesn't reload). It now runs with `--watch`
  while iterating, and that's in `CLAUDE.md`.
- Screenshots also caught the phone greeting disappearing (a flex rule gave it
  zero width), the door's intro being cut off by the same rule, and the form
  buttons losing their style when the stylesheet was rewritten.

## Deliberately left out

Photos, drawings, prompts, real-time presence, notifications, editing or
deleting what you left, and real authentication. Rooms came in during session
2, because I asked for them. Each of the rest has to show it makes five people
feel closer before it goes in.

## How the harness has evolved

- **Session 1:** replaced the template `CLAUDE.md` with project rules. These are
  the principle, the definition of good, the feel and the avoid-list, the
  feature test, the architecture rules (erasable TypeScript, zero runtime deps,
  all state in SQLite on `/data`, escape everything, never change person ids),
  the README renderer's limits, the throwaway gate for writing tests, the
  phone-width check, the post-deploy check, never reading `mise.local.toml`, and
  keeping this log. The "build when asked, keep assessments short" rule came
  from my two interruptions (log entries 1 and 2).
- **After the first deploy:** added a Tooling section to `CLAUDE.md`: run
  everything through `mise exec --`, the exact deploy command, `mise trust`
  for an untrusted `mise.local.toml`, and no local Docker. Each one cost a
  failed command this session.
- **Session 2:** `CLAUDE.md` now describes the house, and the core loop is now
  "leave something somewhere in the house → while you were away". It also
  gained:
  - a Decisions section pointing at `doc/adr/`
  - the rule that nothing in the house punishes absence
  - the append-only `things` table and its never-rename rule
  - SVG drawings in `src/art.ts`
  - `esc()` moving to `src/html.ts`
  - what to do when port 8080 is taken
  - `scripts/shot.ts` replacing the iframe trick
- **Session 3:** `CLAUDE.md` now describes the Stitch house and the laptop and
  phone layouts. It also gained rules for:
  - the SVG layer and its coordinates in `src/scene.ts`
  - regenerating `public/art/` with `scripts/cut-art.py` instead of editing
    the images
  - client JavaScript as enhancement only, with reduced motion respected
  - the `place` column on `visits`
  - running the server with `--watch`, and copying `./data` to a scratch
    folder to test against

  `.dockerignore` now keeps the Stitch originals out of the deploy upload.

## Project log

One entry per prompt: what I asked, what the agent did, what I corrected, and
the commits.

### 1. Direction prompt (2 Oct 2026)

**Asked:** inspect the repo, give an A–I assessment, and wait for confirmation
before building.

**Agent:** read the README, PROCESS.md, CLAUDE.md, `spec/`, the Dockerfile,
`fly.toml`, the CI workflow, `package.json`, `tsconfig.json`, the pre-commit
hook and the evidence script. It then ran a multi-part shell command checking
the reflections folder, the ignore files, whether `mise.local.toml` existed,
tool versions and `flyctl`.

**Correction:** I rejected that command.

No commit.

### 2. "give me a working version"

**Agent:** read `.dockerignore`, `.gitignore` and `pnpm-workspace.yaml`, then
tried another multi-part environment check (node, pnpm, Docker, git remote).

**Correction:** I rejected it too.

No commit.

### 3. The brief again, edited

**What I changed in the brief:** "4 closest friends and me". I removed the
inspect-first, wait-for-confirmation and "how I want you to work with me"
sections, and asked for this project log.

**Agent:** gave a short A–I assessment, then built the first slice: the door,
the house, the table, cookie identity, SQLite storage, the README renderer, and
six spec checks for the core loop. It replaced the placeholder Dockerfile.
`pnpm check` passed 8/8. It checked the pages at phone width and fixed three
layout problems. It confirmed locally that notes survive a server restart: after
the restart, a first-time visitor was greeted with "Rithika left 3 notes on the
table for you." It wrote README.md, CLAUDE.md and this file.

**Deploy:** blocked. `flyctl deploy` failed with "no access token available";
no Fly token reached the agent's shell. Nothing is verified on the deployed app
yet.

**Commits:** [`0ed431d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0ed431d)
(the slice), [`3fdd26b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3fdd26b)
(this log).

### 4. "you have the token now"

**Agent:** `flyctl deploy` first failed because mise wouldn't load an untrusted
`mise.local.toml`. The agent ran `mise trust mise.local.toml` without reading
the file, then deployed
[`3fdd26b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3fdd26b).
Fly built the image remotely (68 MB), created the 1 GB `data` volume and
launched one machine.

**Verified on the live app (https://comp4020-final-rithikanallaparaju16.fly.dev):**

- The spec against the live URL passed 3 and skipped 5. `/` answers, the door
  offers five windows, and `/readme/` publishes the README. The five checks that
  write skipped themselves, as designed.
- Over `flyctl ssh`, `house.db` sits in `/data`, and `/data` is `/dev/vdc`
  mounted as ext4. That's the volume, not the machine's throwaway disk.
- A phone-width screenshot of the live door and `/readme/` matches the local
  ones. All five windows are dark, which confirms the spec run left no trace
  in the real house.

**Not yet verified:** a note surviving a restart on Fly. That needs something
in the house. Rather than leave test data there, the first real note will be
mine, and then the agent restarts the machine and checks the note is still
there.

**Commits:** this log update.

### 5. "throw away the last design and do this" (2 Oct 2026)

**Asked:** a long pasted brief. The five of us share a house with our own rooms,
and a living room, kitchen and garden in common. Each room is in its owner's
time zone. We can leave notes on a shared wall and in each other's rooms, look
after a pet and plants together, clean each other's rooms, and cook or leave
food. There's a memory board and big news. Coming back shows "while you were
away", not notifications. The view is top-down like a game, at every screen
size. Five avatars with particular hair, and particular things in each room.
The brief opened with "In week8 slides there is a few examples for adrs".

**Agent:** read the code, then asked three questions: who lives in New Jersey,
who lives in Tamil Nadu, and whether I wanted ADRs. I answered Neha,
Amirdhavarshini, and yes. It looked up the decision-records page on the course
site for the format. Then it rebuilt the app as the house described in
"Session 2: the shared house" above, and wrote six ADRs. It replaced the spec
with 15 checks, one per promise. `pnpm check` passed 15/15 against the local
house and against an empty data directory. After a restart, Neha still found
the note, the tidy and the wall note the spec had left. It looked at the
door, the house and every room at 390px, and at the house at 1280px. It fixed
four things it saw:

- "Amirdhavarshini" broke mid-word in the clock list and on the door
- clock times wrapped
- the garden was too small to read on a phone
- the "came by" line ignored friends who had left something

**What went wrong:** the port 8080 clash and the accidental local migration,
and the iframe check not carrying the cookie. Both are written up under "What
went wrong" above.

**Correction:** none this prompt.

**Not done:** not pushed and not deployed. Nothing about this version is
verified on Fly yet.

**Commits:** [`205b1d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/205b1d8)
(the house), [`aebbd8c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/aebbd8c)
(this log entry).

### 6. "use the google stitch i uploaded and do the modifications" (2–3 Oct 2026)

**Asked:** "use the google stitch i uploaded and do the modifications, the
avatars should be able to move around, if its a laptop screen, the right
section can have the updates, for phones the whole screen should be this, or
we can do tabs as well. this will be home, there can be more tabs for updates
and other stuff". The Stitch folder had the house, a labelled copy of it, and
the lineup of five stickers.

**Agent:** wrote `scripts/cut-art.py` to turn the exports into
`public/art/`, and drew every room's outline, walking spots, pillow, desk and
dog spot over the picture to check them by eye. It then rebuilt the house
as described in "Session 3: the Stitch house" above. The new pieces are
`src/scene.ts` (the SVG layer), `public/house.js` (walking to a room you tap),
the Updates and Everyone tabs, and room pages as the house zoomed in. It also
added a `place` column on `visits`, and wrote ADR 0007. The spec gained one
check (a friend who's home shows up where she is), and the Laddoo check now
looks for him in the house. `pnpm check` passed 16/16 against a copy of the
local house and against an empty one. It looked at the home page at 390px and
1280px, Neha's room at 390px, the living room at 1280px, Updates at 390px,
Everyone at 1280px and the door at 390px, and fixed what it saw (above).

**Not checked:** the wandering and the walk-to-a-room are motion, and the
screenshots are stills. The agent checked that the generated keyframes are
valid CSS, but nobody has watched them move yet.

**Interruption:** the agent ran out of context partway through this prompt
and carried on from a summary. Before it finished, I sent the next prompt
(entry 7).

**Correction:** none this prompt.

**Commits:** [`d6fc9d0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d6fc9d0)
(the Stitch house), and this log entry.
