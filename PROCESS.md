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
  (Wrong: they're KitKats. I corrected it in session 4.)
- **The door** shows the house, dimmed, behind the five windows, and each
  window now has the sticker in it.

### Session 4: KitKats, face masks, kettle Maggi and movie time

I told the agent the things in Rithanya's room are KitKats, not cats. I also
asked for a mirror and face masks (she always has face mask powder for all of
us), the kettle Maggi we used to make in Amirdha's room in the hostel, and a
movie page, because Rithanya loves movies. These are the agent's calls, not
yet reviewed:

- **Rithanya's room is redrawn over the art,** not regenerated: KitKat bars in
  the pink basket, a KitKat box on the study table, rolled towels in the
  wicker basket where the other cat was, an arched mirror on the wall and
  three tubs of mask powder.
- **A face mask lasts two hours.** Your sticker wears a green mask with
  cucumber slices wherever you go in the house, so a friend who comes by can
  catch you in it. Rithanya hears "X used your face mask powder"; everyone
  else hears "X did a face mask with Rithanya's powder".
- **Kettle Maggi stays out for twelve hours:** a kettle and two steaming bowls
  on Amirdha's mat, with a note if you leave one. Amirdha hears "X made kettle
  Maggi in your room".
- **Movies is a tab of its own.** You can suggest a movie and say why, or
  say you've watched one. You can also plan a movie night: you pick the time
  in your own clock, and each of us sees it in ours, marked if it falls while
  she's usually asleep. The latest plan replaces the old one and drops off
  three hours after it starts. Rithanya's suggestions are marked as her picks.
  The living room's sofa links to it.
- **A KitKat from Rithanya's box** joins the things you can leave on a desk.
- **Switching who you are:** your sticker and "Not Rithika?" sit in the top
  bar and take you back to the door. Everyone has "Come in as" buttons.

### Session 5: walking yourself around

I asked for avatars to move only when their person is there, and for easy
movement: the keyboard on a laptop, and game-style controls on phones and
iPads, like PUBG. [ADR 0008](doc/adr/0008-you-walk-yourself-and-nobody-else-moves.md)
records it, and is *proposed* until I review it. The agent's calls:

- **Nobody moves on their own.** The wandering loop is gone. Friends stand
  where they last were. Someone who's here right now breathes a little
  (a slow bob) and glows underfoot; nobody else moves at all.
- **You walk yourself.** On a laptop it's the arrow keys or WASD. On a touch
  screen it's a thumb stick in the bottom-left: push a little to walk
  slowly, all the way to go faster. A Go in button in the bottom-right names
  the room you're standing in ("Go into Neha's room", "Go out to the
  garden"); Enter or E does it on a keyboard. Tapping a room still walks you
  there and goes in.
- **Walls don't stop you.** You walk straight through the walls between
  rooms, so there's never a door to hunt for, but you stay inside the house.
- **Where you stand inside a room isn't saved.** Going into a room is what
  tells friends where you are, as before; walking about doesn't.
- **The stick shows on touch screens** (including iPads), and the keyboard
  always works unless you're typing in a form. A "Walk with the arrow keys
  or WASD" hint shows on laptops until you first walk.
- **The owner gets her room's first spot**, so a visitor never stands on
  Aswathy's yoga mat while she's beside it.

### Session 6: Laddoo comes with you, and rooms zoom

I asked for Laddoo to come with whoever pets him, and for the view to zoom
back out when I leave a room I'd zoomed into. The agent's calls:

- **Laddoo goes wherever the last person to pet him goes,** while she's in
  the house: beside her in the kitchen, the garden, a friend's room, and a
  step behind as she walks. Once she's gone he naps at the foot of her bed,
  and after half a day he wanders back to his blanket, as before.
- **You pet him in whichever room he's in.** Every room page shows him when
  he's there, with a "Pet Laddoo" button, and petting him keeps you in that
  room. The garden always says where he's gone. "Play with" became "Pet",
  which is the word I used. The stored kind is still `play`, since stored
  rows can't be renamed.
- **Leaving a room zooms out.** Walk more than a step past a room's walls,
  or tap any link back to the whole house, and the view zooms out to the
  whole house. You carry on from where you stepped out.
- **Going in zooms in,** to match: the Go in button, Enter, or tapping a
  room. This one I didn't ask for.
- **Walking out of a room doesn't tell friends you've left it.** As before,
  friends see you in the last room you went into.

### Session 7: things light up, the house keeps where you stopped, and Shinzo

I asked for whatever I can do to light up when I'm near it, for sleeping in
any bed, for an option to pet or feed the dog, and for one study table each
in Amirdha's and Aswathy's rooms, with two chairs for Aswathy (one to work
on, one for her clothes). Then I reported that where I was and where the dog
was weren't being kept, asked for the dog to be called Shinzo, and asked
for him not to be asleep all the time. The agent's calls:

- **What lights up, and what it offers.** You walk up to it and it glows
  gold. Buttons appear above Go in; on a keyboard, Enter or E does the
  first one, ahead of going in, and the number keys do the rest.
  - Any bed: "Sleep in Amirdhavarshini's bed", or "your bed".
  - Your desk: what's on it. A friend's desk: leave her something.
  - Amirdha's mat: sit on your own cushion, or make kettle Maggi. I'd said
    "sit on the couches" in her room; she has floor cushions round the mat,
    not couches, so the cushions are the seats.
  - Rithanya's mirror: do a face mask.
  - Aswathy's yoga mat: meditate.
  - The sofas: sit down, or plan a movie night.
  - The wall of notes: write on it, or read it.
  - The kitchen stove: cook something. I didn't ask for this one.
  - The garden patches: water them, or plant something.
  - Shinzo: pet him or give him a treat.

  Each button is a link or a form the page already has, and the room pages
  have the same buttons, so nothing needs the script.
- **Anyone can sleep in anyone's bed, and sit down.** It's a `nap` or `sit`
  row, so it shows in "while you were away" ("Neha slept in your bed").
  Friends who come by see you lying or sitting there. You get up when you
  walk, or after two hours.
- **A treat is new (`treat`).** Shinzo follows whoever last petted or fed
  him, the same way.
- **One study table each.** In Amirdha's room the spare laptop table and
  its chair are painted out, and the floorboards run on to the wall.
  Aswathy keeps the table at the foot of her bed, with the two chairs
  already in the picture: one to work on, and the one with the pile of
  clothes. Her desk notes moved onto the table she kept.
- **The house keeps where you stopped (ADR 0009).** When you stop walking,
  the page sends your spot to the server, and you're there next time,
  after a reload or a week. Friends stay where they stopped too, instead of
  going back to their own rooms once they've been away ten minutes. During
  their sleep hours they're in bed. Shinzo is drawn beside whoever he's
  with, so he's kept too.
- **Laddoo is Shinzo** everywhere anyone sees him. His code, CSS and picture
  are still called `laddoo`, and petting is still the `play` kind, since
  stored rows can't be renamed.
- **Shinzo is up in the daytime.** He's awake during the day by your own
  clock. He naps only at night (8 pm to 5 am for you), unless someone petted
  or fed him in the last three hours, or he's with a friend who's here.
  His only picture lies on his blanket, so awake now means he hops and
  wiggles, rather than the old 2° wag. I didn't ask for the hop.
- **The house's pictures carry a fingerprint in their address,** so a
  changed picture shows straight away instead of after a day.

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
- After session 3 went live, tapping a friend at the door did nothing, and I
  couldn't get into the house. In session 3 the agent had made the SVG's
  stickers (`g.people`) ignore taps so the rooms under them could take them.
  The rule was written as `.people`, which also matched the door's list of
  windows (`ul.people`), and the buttons inside inherited it. The spec
  didn't catch it, because it posts the form directly. The agent's first
  local check didn't either, because it used `element.click()`, which skips
  hit-testing. It only showed when the agent tapped the middle of a window
  with a real mouse event and found the `<form>` under the finger. The rule
  is now scoped to SVG groups, and `scripts/shot.ts` can tap for real.
- In session 5, the first keyboard test stopped dead at the wall between
  the living room and the bedrooms. The room outlines leave gaps of up to
  about 50px where walls are drawn, and the agent had only allowed 14px.
  From the kitchen, the only ways down were a sliver through Amirdha's room
  or round by the garden. It now allows 28px either side, so every wall
  can be crossed.
- Once the wandering stopped, everyone stood on her room's first spot all
  the time. Aswathy's first spot was under her own name tag, and Rithika's
  nearly was. A visitor could also take the owner's spot. The spots were
  reordered, and the owner now goes first.
- The iPad screenshot (820px) showed the top bar broken: the greeting
  squeezed into a one-word-wide column over the Home tab. It was caused by
  session 4's long "Not Amirdhavarshini?" switch, and nobody had looked
  between phone and laptop widths. At tablet widths the greeting now goes and
  the switch is just your sticker. Wider than that, the greeting stays on one
  line and trails off.
- In session 6, the phone screenshots showed "you" well right of centre after
  walking out of a room. That looked like the view-following was broken.
  Measuring in the page first showed "you" exactly in the middle (195 of
  390px). A screenshot of just the screen matched that. The cause was
  `scripts/shot.ts`: capturing past the screen made Chrome lay the page out
  again, which moved the sideways-scrolled house. It now captures a page that
  fits the screen as it is.
- In session 7, painting out the spare study tables took four goes. Rows
  copied from too high up brought a dark wedge of ceiling beam with them.
  A straight line drawn along the beam came out jagged, so it was dropped.
  Floor copied from beside Aswathy's table brought the table's front edge
  along, so the floor is now copied from open boards further left. A
  stepped patch in Amirdha's room left a seam, so it became a rectangle.
- Before session 7, persistence only covered the room you went into, not
  where you walked inside it. The database on Fly was fine: one machine, one
  volume since the day before, and friends still "home now". Where you walked
  only lived in your own browser, and Shinzo's place followed from it.
- The first test for keeping your spot used (1215, 300), which is the
  garden's own first spot, so it would have passed with nothing saved. The
  agent moved it to (1290, 380), where only walking could put you.
- After the spare table was painted out, the browser still showed it.
  Pictures were cached for a day under the same address. They're now asked
  for by a fingerprint of the file.
- The glow was too faint to see over the picture at first, so the agent
  made it stronger. Later, screenshots showed Shinzo looking asleep even when
  he was awake. His only picture lies down, and "awake" was a 2° wag. It's
  now a hop.

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
- **Session 4:** `CLAUDE.md` names the face mask and kettle rooms and the
  Movies tab. It says details about the friends come from me, because the
  agent had read KitKats as cats. Two testing rules came from the door bug:
  - check that buttons take a real tap with `scripts/shot.ts`'s new tap
    argument, never `element.click()`
  - scope SVG-only CSS to the element (`g.people`), because class names are
    shared with the HTML
- **Session 5:** `CLAUDE.md` now says nobody moves on their own (ADR 0008),
  and that automatic wandering shouldn't come back. Its client JavaScript rule
  describes the controls, and says to read room outlines from the page so
  `ROOMS` stays the only place coordinates live. `scripts/shot.ts` emulates
  touch at phone widths (`TOUCH=1` for wider screens). The testing rules now
  ask for an iPad check at 820px, because that range broke in session 4
  without anyone looking.
- **Session 6:** `scripts/shot.ts` no longer captures past the screen when a
  page fits on it. `CLAUDE.md` says why, and to measure positions in the page
  before blaming the code. Its client JavaScript rule now covers the zooms,
  Laddoo trotting after you, and the one-load `sessionStorage` handoff.
- **Session 7:** `CLAUDE.md` calls the dog Shinzo and says his code is still
  `laddoo`. It describes the hotspots in `hotspots()` and the `nap` and
  `sit` kinds. It explains `POST /here` as the one write that needs the
  script, and lists the new `visits` columns (ADR 0009). It also says pages
  ask for art through `art()` in `src/assets.ts`, because a cached picture
  hid the painted-out table.

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

### 7. "continue the response, and open the live site for me, keep updating process.md with all the logs and commit hashes" (3 Oct 2026)

**Asked:** finish entry 6, open the live site, and keep this log current with
every commit hash.

**Agent:** finished the checks and docs for entry 6 and committed them
(`d6fc9d0`, `e79943b`). It also filled in entry 5's missing hash
(`aebbd8c`). Session 2 had never been deployed, so this deploy also ran
session 2's migration on the real house: wall notes move into `things`, and
the old `notes` table is dropped, in one transaction. Before deploying, the
agent tried to copy the live database to a backup file on the volume over
`flyctl ssh`. Claude Code's auto-mode safety check denied it as a write over
a remote shell. The agent didn't try another way. It deployed without that
backup, relying on the migration being a single transaction (tested locally)
and on Fly's daily volume snapshots. It deployed `e79943b` with the remote
builder, and the machine passed its health checks. flyctl's own DNS lookup
timed out locally, but the domain was already answering.

**Verified on the live app (https://comp4020-final-rithikanallaparaju16.fly.dev):**

- The read-only spec against the live URL passed 4 and skipped 12. The four
  passing checks: `/` answers, `/readme/` publishes the README, the door offers
  the five of us, and each clock shows the right zone. The 12 checks that
  write skipped themselves, as designed.
- `/art/house.jpg` is served (370,491 bytes, `image/jpeg`), and `/readme/`
  answers 200.
- A 390px screenshot of the live door, taken without a cookie so it recorded
  no visit, matches the local one. All five show "hasn't been home yet", so
  nothing has written into the real house.

The agent then opened the live site in my browser.

**Not verified on Fly:** the house itself, the rooms and the tabs. Seeing them
needs picking someone at the door, which would record a visit in the real
house, so I'm the first one in. A note surviving a restart on Fly is still
unchecked from entry 4.

**Correction:** none.

**Commits:** [`d6fc9d0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d6fc9d0)
and [`e79943b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/e79943b)
(deployed), and [`40b9cce`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/40b9cce)
(this log entry). Not pushed to GitHub.

### 8. "rithanya doesnt have cats, its kitkat chocolate" (3 Oct 2026)

**Asked:** "okayokay, rithanya doesnt have cats, its kitkat chocolate. and she
always has face mask powder for all of us, so try adding a mirror in her room
and face mask as an activity. when we were in hostel we used to eat maggi that
we cooked in kettle a lot in amirdhas room, so add that as well. then also add
a small movie time or movie suggestions page. rithanya loves movies. also
right now when i click on somebody i wanna enter the house as them. this is
not happening"

**Correction:** the cats. The agent had read the boxes and baskets in
Rithanya's room in the Stitch art as cats, and the README, the room text and
session 3's decisions all said so. They're KitKats.

**Agent:** built what's under "Session 4" above. That's five new `kind`
values (`mask`, `kettle`, `movie`, `watched`, `movienight`), all worked out
from timestamps in `src/house.ts` like the rest. There's also a `kitkat` gift,
the Movies tab and its routes, and `fromLocal` in `src/time.ts`, which turns
a time picked in your own clock into an instant (two passes, so daylight
saving is handled). The spec gained four checks, for 20 in all:

- a face mask shows on the friend wearing it, and Rithanya hears whose it was
- kettle Maggi stays out in Amirdha's room
- a suggestion and who watched it are there for everyone
- a movie night planned for 8 pm in Canberra shows at the right time in each
  zone

"Only takes things" now also refuses a mask outside Rithanya's room, a kettle
outside Amirdha's, and a movie that doesn't exist. `pnpm check` passed 20/20
against a scratch copy of the local house. The agent looked at Rithanya's
room at 1280px and 390px, Amirdha's room at 1280px, Movies at 390px and
1280px, Everyone at 390px and the house at 1280px. It moved Rithanya's name
tag twice: first it covered the mirror, then it overlapped Amirdha's room
when zoomed in.

**The door, step by step:**

1. The agent signed in at the local door with a script calling
   `element.click()`, and it worked.
2. It looked at the live door, where nobody had ever been home, and at the
   Fly logs, which had no errors.
3. It tried to sign in on the live app with a `curl` POST to `/me`. Claude
   Code's auto-mode safety check denied that as changing a shared resource,
   and the agent didn't try another way.
4. Without a cause yet, it added two other ways in: the sticker and "Not
   Rithika?" in the bar, and "Come in as" on Everyone.
5. It then tapped the middle of a door window with a real mouse event,
   instead of `element.click()`, and found the `<form>` under the finger, not
   the button.

The cause and the fix are under "What went wrong" above. After the fix, real
taps at 390px and 1280px sign in from the door, and "Come in as" and the bar
switch work too. `scripts/shot.ts` now takes a selector to tap, and
`CLAUDE.md` has the rule.

**Interruption:** the agent ran out of context partway through this prompt
and carried on from a summary.

**Deploy:** the agent deployed `babd141` with the remote builder (69 MB), and
the machine reached a good state. There was no schema change this time: the
new kinds are just new values in `things`, which has no constraint on `kind`.
flyctl's DNS check timed out locally again, but the site was answering.

**Verified on the live app (https://comp4020-final-rithikanallaparaju16.fly.dev):**

- The read-only spec against the live URL passed 4 and skipped 16.
- The live `style.css` has the rule scoped to `g.people`, and `/readme/`
  has the KitKat, kettle Maggi and Movie time text.
- Hit-testing the middle of Neha's window on the live door at 390px finds the
  sticker inside her button, where before it found the `<form>`. The agent
  only hit-tested and didn't tap, so no visit was recorded. The door still
  shows all five as "hasn't been home yet".

**Not verified on Fly:** actually getting in, the face masks, the Maggi and
Movies. Each of those writes to the real house, so I'm the first one in.

**Commits:** [`df979fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df979fe)
(the door fix and the features), [`babd141`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/babd141)
(this log entry, deployed), and [`8755c3e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8755c3e)
(the deploy note). Not pushed to GitHub.

### 9. "dont make the avatars move if the user is not using it" (3 Oct 2026)

**Asked:** "okay this is good, but dont make the avatars move if the user is
not using it, movemet should only be there if the user is there. then make
the movement easy, for laptop, we can use the keyboard to move, for phone and
ipad like online games-pubg etc"

**Agent:** read ADR 0007, which had turned down a walkable avatar, and wrote
ADR 0008 instead of changing it. Then it built what's under "Session 5"
above:

- `src/scene.ts` stopped generating the walking keyframes.
- `public/house.js` was rewritten around the keys, the stick and the Go in
  button.
- `scripts/shot.ts` now emulates touch at phone widths, with `TOUCH=1` for
  an iPad.

The spec gained one check, "never walks anyone around on their own", for 21
in all. The agent unpacked the previous commit into `/tmp`, ran it on another
port, and saw the check fail there ("person 1 is set to wander") before
trusting it. `pnpm check` passed 21/21 against a scratch copy of the local
house.

**How walking was checked:** a scratch script in `/tmp` sent real key
presses and touch drags through Chrome's DevTools protocol:

- On a laptop it held the right arrow, then down, then A, then pressed
  Enter. "You" went from the kitchen through the living room into Aswathy's
  room, then Rithanya's, and the button followed along each step ("Go into
  the living room", "Go into Aswathy's room"…). Enter opened `/room/4`.
- On a phone it dragged the stick to the right. The knob followed the
  finger, "you" walked into Aswathy's room, and the view scrolled from 289
  to 594 to keep up.

Screenshots: the house at 390px and 1280px, the house and Aswathy's room on
an iPad (820px, touch), Rithanya's room at 1280px and Aswathy's room at 390px.
A real tap on a door window still signs in.

**Fixed along the way:** the walls blocking the bedrooms, Aswathy under her
tag, a visitor on the owner's spot, and the iPad bar (all under "What went
wrong").

**Correction:** none this prompt.

**Deploy:** the agent deployed `5739e84` with the remote builder, and the
machine passed its health checks. There was no schema change. flyctl's DNS
check timed out locally again.

**Verified on the live app (https://comp4020-final-rithikanallaparaju16.fly.dev):**
the read-only spec passed 4 and skipped 17. The live `house.js` is the new
walking script, and `/readme/` has the walking section. A hit-test on the
live door (no tap, no visit) still finds Neha's sticker under the finger.

**Not verified on Fly:** walking itself. Seeing the house needs someone to
come in, which records a visit in the real house.

**Commits:** [`3e04bde`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3e04bde)
(walking, the fixes and the docs), [`5739e84`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/5739e84)
(this log entry, deployed), and [`2051ccc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/2051ccc)
(the deploy note). Not pushed to GitHub.

### 10. "whenever i pet laddoo he has to come w me" (3 Oct 2026)

**Asked:** "okay whenever i pet laddoo he has to come w me, then if i zoomed
into someones room to do sumn and now im leaving the room, then the screen
has to zoom out again"

**Agent:** built what's under "Session 6" above:

- **Laddoo:** where he is now comes from where the friend who last petted
  him is, so there's still no new table and no timer. `laddooCard` puts a
  "Pet Laddoo" button on the page of whichever room he's in. `/garden/dog`
  sends you back to that room.
- **Zoom:** room links carry their zoom target (`data-view`).
  `public/house.js` zooms in on the way into a room, and zooms out once you
  walk more than 10px past the room's outline. It also catches the room
  page's links back to the house. Laddoo trots after you while you walk.

The Laddoo check in the spec now covers the new promise: someone pets him in
the kitchen, stays in the kitchen, and he's there with her. When she goes to
her room, he follows. `pnpm check` passed 21/21 against a scratch copy of
the local house.

**How it was checked in a browser:**

- A real tap on "Pet Laddoo" in Neha's room stayed on `/room/2?did=play`,
  and he was at "your" feet.
- Holding the left arrow walked "you" out of Neha's room with Laddoo a step
  behind. The view zoomed out to `0 0 1376 768`, and the whole house picked
  up at the same spot (1009.7, 590) with Laddoo beside you.
- The same with the thumb stick at 390px.
- Pressing Enter caught the view mid-zoom (`569.82 224.72 961.89 536.86`) on
  its way into Neha's room.
- The garden's card said where Laddoo had gone ("He went off with Neha, and
  he's in Neha's room") and had no button, because he wasn't there.

**What went wrong:** the phone screenshots looked off-centre (see "What went
wrong").

**Correction:** none this prompt.

**Deploy:** the agent deployed `5ab3a80` with the remote builder. There was
no schema change. flyctl's DNS check timed out locally again.

**Verified on the live app (https://comp4020-final-rithikanallaparaju16.fly.dev):**
the read-only spec passed 4 and skipped 17. The live `house.js` has the zoom
and Laddoo code, and `/readme/` has "Pet Laddoo". A hit-test on the live door
(no tap, no visit) still finds the sticker under the finger.

**Not verified on Fly:** petting Laddoo and the zooms. Both need someone in
the real house.

**Commits:** [`ccf0229`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/ccf0229)
(Laddoo, the zooms, the shot fix and the docs), [`5ab3a80`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/5ab3a80)
(this log entry, deployed), and the deploy note. Not pushed to GitHub.

### 11. "every time i can do stuff, highlight the things i can do" (3 Oct 2026)

**Asked:** "every time i can do stuff, highlight the things i can do, for
example when i enter  amirdhas room, i can sit on the couches, sleep on her
bed wtc. then when i go near laddoo, give me an option to pet or give him
food. then everytime i go near the memory or note wall, highlihg them so i
know i can do that, everytime i go to the garden also same.add feature like
this. and aswathys and amirdhas room has 2 study tables, one is enough for
each room, aswthy can have 2 chairs. one to work on and one to put her
clothes on. and sleep option when we go near beds. everybody can sleep on
all beds"

**Agent:** started on what's under "Session 7" above. It gridded each room
of the picture to read off coordinates for beds, desks, seats and the
other spots. It painted out the spare tables in `scripts/cut-art.py`
(four goes, see "What went wrong") and began the code: the `nap`, `sit`
and `treat` kinds, `resting()`, the hotspots in `src/scene.ts`, the room
page buttons, and the server routes.

**Interruption:** partway through, at the first typecheck, the response
stopped with "Your computer went to sleep mid-response". The work sat
uncommitted until entry 14 picked it up.

**Correction:** none this prompt.

### 12. The session 4 message, sent again (3 Oct 2026)

**Asked:** the same message as entry 8, word for word: "okayokay, rithanya
doesnt have cats, its kitkat chocolate. … also right now when i click on
somebody i wanna enter the house as them. this is not happening"

**Agent:** said everything in it was already built and live since session
4, and listed where each part is: the KitKats, the mirror and face masks,
kettle Maggi, the Movies tab, and coming in as someone from the door or
the Everyone tab. It hit-tested the live door without tapping or signing in:
a tap on a window lands on that friend's button. It suggested a hard
refresh in case the browser had an old copy. It also said entry 11 was
about half done and that it would carry on. It changed nothing.

**Correction:** none.

### 13. "open live site" (3 Oct 2026)

**Asked:** "open live site", sent twice; the second came in while the agent
was answering the first.

**Agent:** opened https://comp4020-final-rithikanallaparaju16.fly.dev/ in
the browser, once. It said the live site was still session 6, without the
glow or the table changes, because that work wasn't finished or deployed.

**Correction:** none.

### 14. "the persistence still doesnt work, and name the dog shinzo, also dont make it always sleep" (3 Oct 2026)

**Asked:** "the persistence still doesnt work, and name the dog shinzo,
also dont make it always sleep"

**Agent:** checked Fly read-only first (`flyctl machines list` and
`volumes list`). There was one machine with one volume, there since the
day before, and the Dockerfile sets `DATA_DIR=/data`. It then asked what
wasn't being remembered, with four options: where I walked, things I
left, who I am, and Laddoo following me.

**Correction:** I turned the question down to explain in my own words:
"where i was, where the dog was etc, data is not persisting".

**Agent, after that:** built the rest of "Session 7" above, together with
the unfinished work from entry 11:

- Your spot goes to `POST /here` when you stop walking and when the page
  closes, onto new `visits` columns (ADR 0009). Everyone is drawn where
  she stopped.
- Shinzo is the dog's name in every word anyone sees, and he's awake in
  the daytime.
- Things light up, with buttons, when you're near them.
- One study table each.
- The art addresses carry a fingerprint.

Three spec tests are new: keeping your spot (with Shinzo beside you after
a treat), sleeping or sitting anywhere, and the hotspots offering the right
things. `/sit` and `/here` were added to the "only takes things" test.
`pnpm check` passed 24/24 against a scratch house in `/tmp`.

**How it was checked in a browser:**

- Rithika walked to (495, 296). A reload in a fresh browser brought her
  back to the same spot.
- Walking her to Amirdhavarshini's bed lit it gold. "Sleep in
  Amirdhavarshini's bed" appeared above "Go into Amirdhavarshini's room",
  at laptop width, at 390px with the stick, and on an iPad (820px, touch).
- Her room now has one study table.
- `/room/3` at 390px showed tidy, sleep, and sit on your cushion together.
- A real tap on Neha's window at the door let me in as Neha. She was still
  sitting on the living room sofa, with Shinzo beside her.

**Commits:** [`8c0b81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c0b81e)
(the code, the art, the spec, README, `CLAUDE.md` and ADR 0009), and this
log entry.
