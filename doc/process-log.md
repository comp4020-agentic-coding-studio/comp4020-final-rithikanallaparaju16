# Process log

The full record behind [PROCESS.md](../PROCESS.md): every decision by
session, what went wrong, how the harness changed, and one entry per
prompt, with its commits. Until 6 October 2026 this was PROCESS.md itself.
It moved here when PROCESS.md became the 900–1100-word overview the brief
asks for (entry 17).

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
[0001](adr/0001-a-zero-dependency-node-server-with-html-forms.md) to
[0003](adr/0003-a-person-is-one-of-five-fixed-ids.md) record the session 1
choices after the fact, and
[0004](adr/0004-a-top-down-house-drawn-as-server-side-svg.md),
[0005](adr/0005-one-log-of-things-with-state-derived-from-time.md) and
[0006](adr/0006-each-bedroom-keeps-its-owners-clock.md) cover the drawn
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
[ADR 0007](adr/0007-the-stitch-illustration-with-an-svg-layer-and-a-little-javascript.md)
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
iPads, like PUBG. [ADR 0008](adr/0008-you-walk-yourself-and-nobody-else-moves.md)
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

Later in the session I asked for a small emoji on every action, for Shinzo
to be awake once someone pets him, and for simple, cute signs that
something is being done or is done, like when planting or watering. The
agent's calls:

- **Every action has one emoji,** on its button in the house and on the
  pages:
  - 😴 sleep, 🛋️ sit, 🧘 meditate, 🧹 tidy
  - 💌 leave something on a desk, 📬 see your own desk
  - 🥒 face mask (for the cucumber slices), 🍜 kettle Maggi
  - ✏️ write on the wall, 📌 pin it, 👀 read the wall, 🍳 cook
  - 💧 water, 🌱 plant
  - 🐾 pet, 🦴 treat
  - 🎬 suggest a movie, ✅ watched it, 🍿 movie night

  The cushion on Amirdha's mat shares 🛋️ with the sofa, since there's no
  cushion emoji. Going into a room has none, because it isn't something you
  do there.
- **Doing:** the moment you press a button in the house, its emoji pops up
  over the thing. If nothing needs zooming to, there's half a second to see
  it before the form posts.
- **Done:** the page you land on pops something up where it happened, once,
  for three seconds, and the line that says it's done starts with it:
  - 💧 drops fall on the sunflower bed and on every patch in the close-up
  - 🌱 a sprout comes up, in your own patch in the close-up
  - 💕💗💕 hearts over Shinzo when petted, 🦴😋 for a treat
  - ✨ sparkles where the clutter was after tidying
  - 💤 over you in bed, 😌 when you sit down, 🥒✨ with a face mask
  - 💌 on the desk, 📌 on the wall, 🍳 on the counter, 🍜 by the kettle

  Under reduced motion the emoji just sit there until the next page.
- **Shinzo wakes up when petted.** He already counted as awake for three
  hours after a pet or a treat. Now he also wakes on the spot when you press
  the button: the z's go and he starts hopping before the page changes.

On 6 October I asked for the dog to wake up and come behind whoever pets
him, and for food to leave the kitchen table once it's eaten. The agent's
calls:

- **Shinzo gets up and comes over.** When you pet him or give him a treat,
  the page remembers where he was, for one page load. On the page you land
  on he starts there, wakes, and trots to your heels in about a second. He
  bounds as he goes, faces the way he's walking, then turns to face you. This
  works from the room pages' Pet and Treat buttons too. His one picture
  still lies on the blanket, so moving is what shows he's up.
- **Food can be eaten (`eat`).** There was no way to eat anything before;
  food just disappeared after three days. Now:
  - The kitchen counter's glow offers "😋 Eat Neha's dosa" and the like, as
    well as "Cook something".
  - Each plate on the kitchen page has an "Eat it" button.
  - Anyone can eat anything, their own cooking included. Eating takes the
    plate off the counter for everyone, and the cook hears "Rithika ate your
    dosa".
  - 😋✨ pops over whoever ate it.

### Session 8: live, one of us at a time, hugs, birthdays, UNO, and Shinzo's own day

On 8 October I asked for one big batch:
- live updates without refreshing
- nobody else can pick a friend who's already in, so at most five people
- hugs and group hugs with online friends who are close
- birthdays, celebrated all month with decorations and a crown
- Shinzo getting up and wandering, instead of moving while asleep on his
  blanket
- Neha's sleeping hours "to be 10"
- UNO for friends sitting together in Amirdhavarshini's room, seven cards
  each, up to five players

I also asked for every prompt to go into `PROCESS.md` with its hash, and
encouraged fanning the work out to agents that work together.

How it was split:
- The agent laid a small shared base itself: birthdays and Neha's hours in
  `src/people.ts`, the new kinds, the emoji, and a `SHOT_PORT` for
  screenshots.
- Four agents then worked in parallel, each in its own git worktree, port and
  scratch house:
  - live updates and one of us at a time
  - hugs and birthdays
  - Shinzo
  - UNO
- None of them touched `public/house.js`. A fifth agent took it on once the
  others' markup existed, so the walking script had one owner.
- The lead agent merged each branch into `main`, resolved the conflicts (the
  same functions, the end of `style.css`, the end of the spec), and ran the
  whole spec after each merge.

The calls, each one mine to redirect:

- **The house is live** (ADR 0010):
  - Every open page holds a server-sent events line to `GET /live`.
  - A write anywhere makes open pages fetch themselves and swap in what
    changed, without touching a note you're typing.
  - Friends who are in at the same time walk on your screen, a step every
    300 ms or so.
  - Nothing needs it: everything still waits for whoever comes later.
- **One of us at a time** (ADR 0011):
  - Picking a friend gives your browser a token, and only that token is her
    from then on.
  - While her page is open, or for 2 minutes after her last page, her window
    at the door is shut and says she's in the house.
  - That includes her own second device. Leaving opens it again.
- **Hugs:**
  - Walk up to friends who are here (within 120 picture px) and hug one, or
    all of you who are close, up to five.
  - You stay huddled with hearts over you for up to 5 minutes, or until
    someone walks off.
  - Whoever you hugged hears about it.
- **Birthdays:**
  - Rithanya 12 January, Amirdhavarshini 19 May, Neha 2 June, Rithika 16
    October, Aswathy 8 November.
  - All month, by her own clock, her room has bunting, balloons and a
    banner, and she wears a crown on every drawing of her.
  - Friends can wish her from the balloons, and get a party hat for two
    hours.
  - On the day itself there's cake on her desk and confetti.
- **Shinzo's own day** (ADR 0012):
  - He wanders on a plan worked out from the clock alone, so everyone sees
    him in the same place.
  - In 10-minute slots he either walks between spots at 60–90 px/s, stopping
    to sniff, or naps.
  - He's drawn standing, and is his curled-up picture only while napping.
    His blanket stays under the tree when he's off it.
  - A pet or a treat has him follow you for 30 minutes (it was half a day).
    Napping by the visitor's clock is gone.
- **Neha sleeps 10 pm to 8 am.** "10" was read as both her bedtime and her
  hours of sleep. Her room no longer says she sleeps the longest; it says
  she's first to bed, at 10.
- **UNO on the mat** (ADR 0013):
  - Two to five friends sitting on Amirdhavarshini's mat can deal.
  - The full 108-card deck, seven cards each; the game is replayed from its
    moves in the log.
  - Once dealt it waits for whoever's turn it is, with no timeouts or
    penalties.

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
- The emoji pops fade within three seconds, and `scripts/shot.ts` waits 2.5
  seconds before capturing, so a plain screenshot catches them half gone.
  The agent took them with reduced motion emulated, where they hold still,
  using a scratch copy of the script. The first one showed Shinzo's hearts
  over the sticker of the person he was beside, so they moved onto his
  back and got a little smaller.
- Session 8: the lead agent ran `lsof` to see whether ports 8080–8095 were
  taken, and I rejected it. It went on with its own port and a scratch copy
  of the data instead, which never needed a port scan.
- Session 8: each worktree had `node_modules` symlinked from the main
  checkout. In a worktree, `pnpm check` tried to reinstall through the
  symlink, which would have emptied the main checkout's copy. It stopped
  only because there was no terminal to confirm in. The agents switched to
  `node_modules/.bin/tsc` and `vitest`, and `CLAUDE.md` now says so.
- Session 8: every merge after the first conflicted, because the branches
  all added to the same places: `server.ts`'s route list, `pages.ts`'s
  imports and room pages, `scene.ts`'s `figures()` and Shinzo's code, and
  the ends of `style.css` and the spec. Each was resolved by keeping both
  sides. The live agent's `data-live` slots also went round the hug buttons
  and birthday card, so those update live too. The full spec ran after
  every merge: 32, 33, then 36 tests.
- Session 8, left open:
  - A hug's shared name label, and a birthday crown on someone standing on
    a room's first spot, can hide under a room's name tag, the way names
    already could.
  - A friend who walks out of a hug stays drawn at her hug spot on other
    screens until the next live update.
  - Shinzo's standing drawing is simpler than the Stitch art; a Stitch
    picture of him standing would match better.

## Deliberately left out

Photos, drawings, prompts, notifications, editing or deleting what you left,
and real authentication. Rooms came in during session 2, and real-time
presence in session 8, because I asked for them. Each of the rest has to show
it makes five people feel closer before it goes in.

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
  hid the painted-out table. Later it gained where action emoji live
  (`EMOJI` and `POP` in `src/art.ts`), and that a new action needs both.
- **6 October:** this log moved out of `PROCESS.md` into
  `doc/process-log.md`, and the process rules in `CLAUDE.md` now say so. They
  also say `PROCESS.md` is my 900–1100-word overview: rewritten at each crit
  rather than appended to, every claim citing a commit, and drafted by me.
  Later that day, `CLAUDE.md`'s Tooling section changed: CI deploys every
  push now that the repo is public, so hand deploys with `flyctl` stopped,
  and crit cutoffs get a `crit-<n>` tag on the deployed commit.
- **Session 8:**
  - The leftover manual deploy steps left `CLAUDE.md`.
  - `CLAUDE.md` now describes the live house (ADR 0010), one of us at a time
    (ADR 0011), Shinzo's own day (ADR 0012, and that "no automatic
    wandering" means the five), hugs, birthdays, UNO (ADR 0013) and Neha's
    bedtime.
  - A new Tooling rule covers parallel agents: one worktree, port, data
    folder and `SHOT_PORT` each; never `pnpm` in a worktree with symlinked
    `node_modules`; one agent owns `house.js` at a time.
  - New testing notes: the spec signs in through the door, and a crashed run
    or a screenshot holds a friend for 2 minutes.
  - The process rules gained my standing request: every prompt goes into
    `PROCESS.md`'s Prompts section with its commit, without committing my
    own draft.
  - `scripts/shot.ts` takes `SHOT_PORT` and signs in through the door.

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

**Commits:** [`4c7722a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/4c7722a)
(this log update).

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
(the Stitch house), and [`e79943b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/e79943b)
(this log entry).

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
(this log entry, deployed), and [`abd92a0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/abd92a0)
(the deploy note). Not pushed to GitHub.

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

**Commits:** none of its own. The work went into [`8c0b81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c0b81e)
with entry 14, and this entry was written in [`6d0ff95`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/6d0ff95).

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

**Commits:** none, since nothing changed. This entry was written in
[`6d0ff95`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/6d0ff95).

### 13. "open live site" (3 Oct 2026)

**Asked:** "open live site", sent twice; the second came in while the agent
was answering the first.

**Agent:** opened https://comp4020-final-rithikanallaparaju16.fly.dev/ in
the browser, once. It said the live site was still session 6, without the
glow or the table changes, because that work wasn't finished or deployed.

**Correction:** none.

**Commits:** none, since nothing changed. This entry was written in
[`6d0ff95`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/6d0ff95).

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

**Deploy:** the agent deployed `6d0ff95` with the remote builder. The new
`visits` columns are added on boot, so nothing had to be run by hand.

**Verified on the live app (https://comp4020-final-rithikanallaparaju16.fly.dev):**

- The door loads (200).
- `/readme/` has the new sections: "lights up gold", "The house keeps where
  you stopped", and "Pet Shinzo, or give him a treat".
- The read-only spec passed 4 and skipped 20.
- The live `house.js` sends your spot to `/here` and has the glow code.
- The door asks for `house.jpg?v=4d5fefd737`, the picture with one table
  each.
- A hit-test on the live door, with no tap and no visit, still finds Neha's
  button under the finger.

**Not verified on Fly:** walking, the glow, sleeping, sitting, treats, and
coming back to your spot. All of them need someone in the real house, and
the spec doesn't write there.

**Commits:** [`8c0b81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c0b81e)
(the code, the art, the spec, README, `CLAUDE.md` and ADR 0009),
[`6d0ff95`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/6d0ff95)
(this log entry, deployed), and [`23d71e2`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/23d71e2)
(the deploy note). Not pushed to GitHub.

### 15. "make the actions have a small emoji" (3 Oct 2026)

**Asked:** "make the actions have a small emoji, not example when pet
shinzo, let him be awake once somebody pets him, when im plant sumn, show it
with an emoji, when im watering it show an emoji, simple cute ways show that
the action is done or doing"

**Agent:** built what's under "Later in the session" in Session 7 above:

- One list of emoji in `src/art.ts` (`EMOJI`), used by the lit-up buttons
  in the house (`house.js`) and the buttons on every page.
- `?did=` now carries through to the scene. `pops()` in `src/scene.ts`
  draws what popped up, and `patchesSvg` does the garden close-up.
- `house.js` pops the button's emoji over the thing as you press it, and
  wakes Shinzo when you pet him or give him a treat.

The spec gained one test: watering, planting and petting each pop up
(💧, 🌱, 💕), the line that says it's done starts with the drop, Shinzo is
awake after being petted, and nothing pops on an ordinary visit. The hotspot
test also checks that every action has an emoji. `pnpm check` passed 25/25
against the scratch house in `/tmp`.

**How it was checked in a browser** (with reduced motion emulated, so the
pops hold still for the screenshot):

- `/garden?did=water` at 390px and on a laptop: three drops over the
  sunflower bed, drops over all five patches in the close-up, and 💧 on
  the done line and on the Water button.
- `/garden?did=play` at 390px: hearts over Shinzo, first over the sticker
  beside him and then, after the fix, on his back.
- Walking Rithika up to the patches with the keys lit them with "💧 Water
  the garden" and "🌱 Plant something". Pressing Enter popped a 💧 over the
  patches before the zoom.
- After a real nap in Amirdhavarshini's bed: 💤 over "you" in it, and on
  the done line.
- On an iPad (820px, touch), walking to her mat offered "🛋️ Sit on your
  cushion" and "🍜 Make kettle Maggi" clear of the thumb stick.
- A real tap on Neha's window at the door still let me in as Neha.

**Correction:** none this prompt.

**Deploy:** the agent deployed `d287c91` with the remote builder. There was
no schema change.

**Verified on the live app (https://comp4020-final-rithikanallaparaju16.fly.dev):**

- The door loads (200).
- `/readme/` has the emoji paragraph and "wakes him straight away".
- The live `house.js` has the emoji buttons and the pop, and the live
  stylesheet has the `pop` and `fall` animations.
- The read-only spec passed 4 and skipped 21.
- A hit-test on the live door, with no tap and no visit, still finds Neha's
  button under the finger.

**Not verified on Fly:** the pops themselves, which need someone to do
something in the real house.

**Commits:** [`d5599d6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d5599d6)
(the emoji, the pops, the spec, README, `CLAUDE.md` and the session 7
notes), [`d287c91`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d287c91)
(this log entry, deployed), and [`bebcf39`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/bebcf39)
(the deploy note). Not pushed to GitHub.

### 16. "update prcess.md with the commit hashes as well so i can modify it now" (6 Oct 2026)

**Asked:** "i need you to update prcess.md with the commit hashes as well so
i can modify it now"

**Agent:** checked every **Commits** line against `git log`. It filled in
the four that named a commit without its hash:

- entry 4's log update: `4c7722a`
- entry 6's log entry: `e79943b`
- entry 10's deploy note: `abd92a0`
- entry 15's deploy note: `bebcf39`

It also added a **Commits** line to entries 11, 12 and 13, which had none:
entry 11's work went into `8c0b81e`, and all three entries were written in
`6d0ff95`. Nothing else in the log changed, and nothing was deployed, since
`PROCESS.md` isn't part of the app.

**Correction:** none.

**Commits:** [`6ca0dc5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/6ca0dc5)
(this log entry), committed so my own edits start from a clean copy. A
commit can't contain its own hash, so the agent gave it to me in its reply
and added it here in entry 17.

### 17. "now i want you to rewrite process.md to meet the rules" (6 Oct 2026)

**Asked:** "now i want you to rewrite process.md to meet the rules"

**Agent:** read the rules on the course site: the assessment page's "What
you submit" and "Word counts", and the final project brief. For
`PROCESS.md` they say:

- it's my own account, written for a reader, 900–1100 words
- it's rewritten at each crit, not appended to
- it makes the case for the stack and agent workflow
- it cites commits as links whose text is the hash
- it shows corrections landing in the harness
- `pnpm check:evidence` passes

The brief also advises drafting it myself, because a document that reads
like an agent's tells the marker I've added little.

The old `PROCESS.md` was 9,764 words, 4,803 of them this log. The agent
moved the whole file here with `git mv`, so its history follows it. Nothing
was cut: only the title, a one-paragraph intro and the ADR links' relative
paths changed. It then wrote a new `PROCESS.md`, about 1,080 words of
prose, with these sections:

- the principle
- from a brief to a harness
- why this stack, with the trade-offs, and real-time named as not built yet
- corrections that ended up in the harness
- what was thrown away
- how I know it works

Before citing a commit for a rule, it used `git log -S` to find the commit
that brought the rule into `CLAUDE.md`. It cut two claims the record didn't
support: "25 tests" counted the course's two shipped checks, and "I look at
the screenshots" isn't something the log shows.

It also changed three other files:

- `CLAUDE.md`'s process rules now point the log here and describe what
  `PROCESS.md` is.
- `README.md`'s pointer to where live checks are recorded now names this
  file.
- Entry 16 now has its hash.

**Checks:** all eight commits cited in `PROCESS.md` exist. `pnpm
check:evidence` still fails on one thing: there's no
`reflections/crit-8.md`. That's mine to write, so the agent left it.

**Correction:** none.

**Commits:** [`ca52e26`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/ca52e26)
(this log entry, with the new `PROCESS.md`, the move, and the `CLAUDE.md` and
README changes).

### 18. "ship it" (6 Oct 2026)

**Asked:** "ship it"

**Agent:** ran the course's ship steps. The first two commands didn't run,
because Claude Code's safety check was rate-limited. I sent "claude" and it
retried them.

- **The repo:** `comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16`
  was already public. I'd also already pushed my own two commits,
  [`c1e1047`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/c1e1047)
  (`reflections/README.md`) and
  [`5224588`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/5224588)
  (`reflections/crit-8.md`). So there was no visibility flip to do.
- **The deliverable:** crit 8, "It's alive!", with its cutoff at Wednesday
  7 October 2026, 1:30 pm.
- **Preflight:** all passed.
  - The working tree was clean and nothing was waiting to be pushed.
  - The remote is on GitHub and the repo is public.
  - `pnpm check:evidence` passed: it found `reflections/crit-8.md`, and all
    8 cited commits resolve.
  - CI's `check` and `deploy` jobs both passed on `5224588`.
  - The live `/` and `/readme/` answered 200, and `/readme/` had the latest
    README.
  - Fly showed the one machine stopped. `fly.toml` stops it when idle and
    starts it on the next request, which is what the 200 did.
- **Secret scan:** clean, across the working tree and all reachable history.
  The repo was already public, so the scan couldn't have stopped anything.
  It would only have shown something to rotate.
- **Tag:** `crit-8` on `5224588`, the commit CI deployed, pushed to GitHub.

**Correction:** none.

**Commits:** [`2c57ed6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/2c57ed6)
(this log entry). It was committed locally after the tag, and pushed with
entry 19.

### 19. "once i pet the dog, make the dog wake up and come behind the person thatt pet it" (6 Oct 2026)

**Asked:** "once i pet the dog, make the dog wake up and come behind the
person thatt pet it. also once the food is eaten, it has to leave the
kitchen table. and ship the chnages"

**Agent:** built what's under "On 6 October" in Session 7 above:

- `public/house.js` saves Shinzo's spot in `sessionStorage` when you pet or
  feed him, from the glow or from a room page's buttons. On the page you
  land on, he trots from there (`trot()` now faces him and adds a `trotting`
  class), and `style.css` gives him bounds while he moves.
- A new `eat` kind, whose place is `dish:<id>`. `counter()` leaves out
  eaten dishes. `POST /kitchen/eat` refuses a dish that's gone. A happening
  tells the cook. The counter's hotspot and the kitchen page offer it.

One spec test is new: a cooked biryani leaves the counter once a friend
eats it, the cook hears "ate your biryani", and eating it again is
refused. `/kitchen/eat` was added to the "only takes things" test.
`pnpm check` passed 26/26 against the scratch house in `/tmp`.

**How it was checked in a browser:**

- Neha petted Shinzo in the garden, so he was beside her at (1265, 306).
  Rithika stood a step away, and a scratch script pressed Enter and sampled
  him every 100ms. On `/garden?did=play` he started at Neha's side, trotted
  facing right with the `trotting` class, and stopped behind Rithika at
  (1350, 346) after about a second. Then he turned to face her.
- Standing Rithika at the counter lit it with "🍳 Cook something" and
  "😋 Eat Neha's dosa" (plus two older dosas from spec runs). Pressing 2
  landed on `/kitchen`, the plate was gone, and Neha's Updates said
  "Rithika ate your dosa".
- The first 😋✨ pop sat over the counter, which put it right on Rithika's
  face, so it moved above the eater's head. At 390px it shows there, and
  every plate in the list has its Eat it button.
- A real tap on Neha's window at the door still let me in as Neha.

**Correction:** none this prompt.

**Ship (after this commit):** the plan is to push this commit to `main` for
CI to check and deploy. Then the `crit-8` tag moves to it, since the cutoff
(7 October, 1:30 pm) hasn't passed. Whether that worked, and what the live
checks found, goes in the next entry, so this commit stays the one that
ships.

**Commits:** [`06c8c86`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/06c8c86)
(this log entry, with the code, the spec, README and `CLAUDE.md`).

### 20. "update all chnages and ship now" (6 Oct 2026)

**Asked:** "update all chnages and ship now"

**What happened to entry 19's ship:**

- The secret scan came back clean before the push.
- `06c8c86` was pushed to `main`, and CI run 37425669073 passed both
  `check` and `deploy`.
- On the live app, `/` and `/readme/` answered 200. `/readme/` had the
  new kitchen and Shinzo lines, and the live `house.js` had the code that
  saves Shinzo's spot and the trotting.
- The read-only spec passed 4 and skipped 22.
- A hit-test on the live door, with no tap and no visit, still found Neha's
  button under the finger.
- The `crit-8` tag moved from `5224588` to `06c8c86` (it's a tag, so only
  that ref was force-pushed).

**Agent:** found nothing uncommitted: my machine and GitHub were both at
`06c8c86`. So "update" meant the written record:

- `PROCESS.md`'s test count went from 23 to 24, since the eating test was
  new. Nothing else in it was out of date.
- This log got entry 19's hash and this entry.

The code didn't change, so `pnpm check` runs in CI.

**Correction:** none.

**Ship (after this commit):** the same steps as entry 19: a secret scan,
push, CI's `check` and `deploy`, the live checks, and then `crit-8` moves
to this commit. The results go in the next entry.

**Commits:** this log entry, with the `PROCESS.md` count.

### 21. "update claude.md, remove the lines that are chnaged later" (8 Oct 2026)

**Asked:** "update claude.md, remove the lines that are chnaged later"

**Agent:** looked for instructions in `CLAUDE.md` that a later line
overrides. Only one was found: the old manual `flyctl deploy` command and
its token note, kept after "Don't `flyctl deploy` by hand any more". It
went, and "`flyctl status` and `flyctl logs` are still fine for reading"
stayed. The ADR 0008/0009 history and the Laddoo naming note were left in,
because they still explain why the code looks the way it does.

**Correction:** none.

**What happened to entry 20's ship** (from GitHub, read on 8 Oct): `d22650a`
was pushed, CI run 37432453927 passed `check` and `deploy`, and `crit-8`
points at `d22650a`.

**Commits:** [`4dd46d7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/4dd46d7).

### 22. "you can remember the laddoo part" (8 Oct 2026)

**Asked:** Rithika pasted the `CLAUDE.md` lines about Shinzo having been
Laddoo until session 7, with "you can remember the laddoo part".

**Agent:** saved it to the agent's own memory, outside the repo. The note
says Shinzo is the name people see, but code, CSS, the picture and stored
rows keep `laddoo` and `play`, and must never be renamed.

**Correction:** none.

**Commits:** none (memory lives outside the repo).

### 23. Live view, one of us at a time, hugs, birthdays, Shinzo wandering, Neha's hours and UNO (8 Oct 2026)

**Asked:** "i want you to use liveview for viewing all the updates live, i
should not need to refresh my page everytime to see what is going on. and if
one person is logged in as one of us, nobody else can choose that person. so
max of 5 users can only use my website. i want the avatars to be able to hug
eachother. there can be a group hugs of 1,2,3,4 or evan and at max 5 people.
the option should show if im close to any user that is online. i also wanna
add birthdays and the avatars should be able to celebrate in the whole
birthday month. the whole month there should be some decorations in the
birthday girls room and a crown on her head. the dog, shinzo can wander
whenever he wants. i want him to get up and wander, rn he wanders while
sleeping on the mat.Fanning work out to subagents is encouraged for complex
tasks. make sure they work together.make nehas sleeping hours to be 10. and
give option of the avatars to play uno wheneber they sit togther in amirdhas
room. make a uno game w 7 cards to each player. max of 5 players can play
this game. so now i will add the birthdays rithika 16th october neha 2nd june
aswathy 8th november rithanya january 12th Amirdha may 19th", then on a new
line, "in process.md add this prompt and its hash. do this for every prompt
so i can change it later"

**Agent:** built everything under "Session 8" above:
- read the code first, then laid the shared base itself
- ran four agents in parallel worktrees (live and sessions, hugs and
  birthdays, Shinzo, UNO), each with its own port, scratch house and
  `SHOT_PORT`, plus a fifth for `public/house.js` once the markup existed
- merged each branch, resolving every conflict, and ran the full spec after
  each merge
- read the house at 390px and 1280px, and tapped Rithanya's window at the
  door for real
- updated README, `CLAUDE.md` and this log, and wrote ADRs 0010–0013

`pnpm check` passed 36/36 on the merged code against a scratch house in
`/tmp`.

**Interruptions and corrections:**
- Rithika rejected the agent's `lsof` port check, with no reason given, and
  then said "continue and open the live after". The agent used its own port
  and a scratch house instead of checking.
- After the progress update she said "continue and ship it when done and
  open it live", and later "continue".

**Decisions to redirect:**
- Neha 10 pm–8 am.
- A friend's own second device waits too.
- Shinzo follows for 30 minutes, on one plan for everyone.
- UNO starts only while two or more sit on the mat, then plays in anyone's
  own time.

**Commits:**
- [`2627210`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/2627210): the shared base
- [`a305895`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/a305895): live and one of us at a time, merged in [`a6c47bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/a6c47bb)
- [`f6e6f02`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/f6e6f02): UNO, merged in [`d148152`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d148152)
- [`c8b7b02`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/c8b7b02): Shinzo, merged in [`27faf1b`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/27faf1b)
- [`1b47e2c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/1b47e2c): hugs and birthdays, merged in [`9be0483`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/9be0483)
- [`f8f3ecd`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/f8f3ecd) and [`e11cc6e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/e11cc6e): the walking script, merged in [`cd89e32`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/cd89e32)
- this log entry, with README and `CLAUDE.md`
- then the prompt in `PROCESS.md`

**Ship (after these commits):**
1. Push to `main` for CI to check and deploy.
2. Check the live door and `/readme/`, and run the read-only spec.
3. Tag the deployed commit `crit-9`, since crit 9's cutoff (14 October,
   1:30 pm) is ahead.
4. Open the live site for Rithika.

The results go in the next entry.

### 24. "why is the living room dark" (8 Oct 2026)

**What happened to entry 23's ship:**
- The diff scan for secrets found only prose about passwords and the
  session-token code.
- `571fac5` was pushed to `main`, and CI run 37747374629 passed `check` and
  `deploy`.
- On the live app, `/`, `/readme/`, `/live.js` and `/house.js` answered
  200, and `/readme/` had the new UNO, Shinzo and bedtime lines.
- `/live` answered `text/event-stream` through Fly's proxy.
- The read-only spec passed 5 and skipped 31.
- `crit-9` was tagged on `571fac5` and pushed, and the live site was opened
  for Rithika.
- The five worktrees were removed after their branches were merged; the
  main checkout's `node_modules` was untouched.

**Asked:** "why is the living room dark"

**Agent:** checked the time in Canberra: 9:38 pm. The shared rooms follow
the visitor's clock (session 3), so after 8 pm they get the night shade,
with the fireplace glowing, while bedrooms follow their owners' clocks. Then
it checked that session 8 hadn't made it worse:
- the shading code in `src/scene.ts` is unchanged since `d22650a`
- `house.js`'s live swap removes the old `g.light` before putting the new
  one in, so the shade can't stack

It offered a lighter night shade, or lamps in the living room while someone's
home, if Rithika wants either.

**Correction:** none.

**Commits:** none for the code. This entry and the prompt in `PROCESS.md`
are committed locally and go out with the next push.

### 25. "the living room cant be dark, make it have light everything" (8 Oct 2026)

**Asked:** "the living room cant be dark, make it have light everything"

**Agent:** read it as the living room being lit at every hour, and asked
nothing first:
- The living room's outline joined the bedrooms in the `not-bedrooms`
  mask, so the visitor's night, dusk and dawn shades never reach it.
- After dark, a warm tint and a lamp glow over the sofas join the fireplace.
- The kitchen and garden still follow the visitor's clock, and bedrooms
  their owners'. ADR 0014 records it, superseding that part of 0006.

A new spec test checks that the living room's outline is in the mask on the
house and on `/living`. It failed against the old code (with the change
stashed, on a second scratch server) and passes with it. `pnpm check`
passed 37/37. A 1280px screenshot at 9:48 pm in Canberra showed the living
room lit and warm, with the kitchen and garden in night shade.

**Decision to redirect:** only the living room. "Everything" could also
mean the kitchen or the whole house; either is a small change.

**Correction:** none.

**Commits:** [`e81ef0d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/e81ef0d)
(the code, test, ADR, README and `CLAUDE.md`), then this entry with the
prompt in `PROCESS.md`.

**Ship (after this commit):**
1. Push to `main` and watch CI.
2. Check the live door and `/readme/`, and run the read-only spec.
3. Move `crit-9` to the new deployed commit, since the cutoff (14 October)
   hasn't passed.
4. Open the live site.

The results go in the next entry.

### 26. "the uno game is lagging, pls fix it" (8 Oct 2026)

**What happened to entry 25's ship:**
- `e92ca39` was pushed, and CI run 37766045529 passed `check` and `deploy`.
- The live `/` and `/readme/` answered 200, and `/readme/` had the living
  room line.
- The read-only spec passed 5 and skipped 32.
- `crit-9` moved to `e92ca39`; only that tag was force-pushed.
- The live site was opened.

**Asked:** "the uno game is lagging, pls fix it"

**Agent:** measured before changing anything. The server wasn't slow: on a
scratch house, `/uno` rendered in about 1 ms and a move took under 3 ms. The
lag was the page:
- **The UNO page had no `data-live` part.** It was built in parallel with
  the live house, so when a friend played, an open `/uno` fetched itself and
  had nothing to swap. You only saw her move after a reload. The game is now
  one live part (`display: contents`, so the page's grid is unchanged).
- **Every card was a whole page load.** A post, a redirect and a reload,
  each a round trip to Sydney, then reconnecting the live line. The hand is
  now a `data-quick` form: `public/live.js` posts it with `fetch` and swaps
  the answer in. The card you pressed lifts while it goes. A refused move
  posts again the ordinary way to show why, and a win still goes to the page
  that pops 🎉.
- **A pressed button counted as busy**, so a card you'd just clicked could
  stop your own hand updating. Now only typing does.
- Live fetches start 150 ms after a change instead of 250.

A new spec test checks that the table and the quick hand are inside the
live part, and that a friend's draw shows in it. `pnpm check` passed 38/38.

In headless Chrome, with two sessions on `/uno` at 390px:
- Rithika clicked the yellow 8 for real (it was under the finger), and her
  own page showed "You played the yellow 8." after 34 ms, with no reload.
- Neha's open page showed "Rithika played the yellow 8." and "It's your
  turn." after 172 ms, also with no reload.

The 390px screenshot kept its layout.

**Correction:** none.

**Commits:** [`fdd9f94`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/fdd9f94)
(the fix, the test, ADR 0010's note, README and `CLAUDE.md`), then this
entry with the prompt in `PROCESS.md`.

**Ship (after this commit):** push and watch CI, check the live door,
`/readme/` and the read-only spec, move `crit-9`, and open the live site.
The results go in the next entry.

### 27. "no common area should be dim … every player gets 10 sec for their turn" (8 Oct 2026)

**What happened to entry 26's ship:**
- `08d8c9b` was pushed, and CI run 37767236185 passed `check` and `deploy`.
- The live `/` and `/readme/` answered 200, and the live `live.js` had the
  quick form.
- The read-only spec passed 5 and skipped 33.
- `crit-9` moved to `08d8c9b`, and `/uno` was opened.

**Asked:** "no common area should be dim, let it always have light, only
rooms dim up in that particular persons timezone. and if somebody leaves the
house, they quit from the game, dont make the others wait for their turn.
and best way to check if someone is away is by a 10 sec timer. every player
gets 10 sec for their turn"

**Agent:**
- **Always-lit common areas** (ADR 0015, superseding 0014 and that part of
  0006): the visitor's shade over everything but the bedrooms, its
  `not-bedrooms` mask and 0014's lamps went. The fireplace still glows
  after dark. The test now checks that the light layer only ever shades
  bedrooms, on `/` and the living room, kitchen and garden pages.
- **Ten-second UNO turns** (ADR 0016), worked out from timestamps with no
  timer:
  - A turn starts at the deal or the move before it. Replay plays out every
    turn that ran out, between moves and up to now.
  - Whoever runs out is out; her cards go under the draw pile and the next
    player gets a fresh ten seconds. Someone who'd just drawn only passes.
    The last one left wins.
  - Leaving the house, or coming in as someone else, writes a `quit` move.
  - Stored moves get half a second of grace, so a move the server took at
    the buzzer still counts.
  - The table counts down from `data-deadline`, and `live.js` fetches the
    page when time's up, since nothing is written then.
  - The page's "the game waits for whoever's turn it is" lines were
    rewritten.
- **Flagged in the reply and the ADR:** the timer is a deliberate exception
  to the house's rule that it never punishes absence. `CLAUDE.md` now says
  not to spread it without asking.

**Checks:**
- Two new spec tests: one waits out a real turn (play moves on, and the late
  player's move is refused); the other has a player leave the house and
  checks she's out. `pnpm check` passed 40/40.
- In headless Chrome, with two sessions on `/uno`, nobody played on
  Rithika's turn. Neha's page counted 8 → 1, then showed "It's your turn.
  10s" and "Rithika's ten seconds ran out, so she's out and play moved on",
  without a reload. Rithika's page caught up to "Your ten seconds ran out".
- A 390px screenshot showed the countdown pill. A 1280px screenshot as
  Rithanya had only Rithika's room dim (10:21 pm in Canberra).
- **What went wrong:** the first screenshot setup signed its players out at
  the end, which now quits them from the game. It was redone with the
  players left in.

**Decisions to redirect:**
- A missed turn puts you out (not just a pass), unless you'd drawn.
- The last one left wins.
- Ten seconds counts from the move before yours.

**Correction:** none.

**Commits:** [`d0bcf63`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d0bcf63),
then this entry with the prompt in `PROCESS.md`.

**Ship (after this commit):** push and watch CI, check the live door,
`/readme/` and the read-only spec, move `crit-9`, and open the live site.
The results go in the next entry.

### 28. "make it 20 seconds and push. i added reflections as well" (9 Oct 2026)

**What happened to entry 27's ship:**
- `f3ea663` was pushed, and CI run 37769810881 passed `check` and `deploy`.
- The live `/` and `/readme/` answered 200, and the README had the lit
  common areas and the turn timer.
- The read-only spec passed 5 and skipped 35.
- `crit-9` moved to `f3ea663`, and the site was opened.

**Asked:** "make it 20 seconds and push. i added reflections as well"

**Agent:** changed `TURN` in `src/uno.ts` to 20 seconds, and every "ten
seconds" in the pages, README and `CLAUDE.md` to twenty. ADR 0016 got a
dated note, and the spec now waits out a real 20-second turn. `pnpm check`
passed 40/40.

`reflections/crit-9.md` is Rithika's own writing. The agent only scanned it
for anything secret-looking (nothing) and committed it as it was. Her
uncommitted `PROCESS.md` draft is still left alone.

**Correction:** none.

**Commits:**
- [`0095db4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0095db4): twenty seconds
- [`8c66048`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c66048): her reflection
- then this entry with the prompt in `PROCESS.md`

**Ship (after this commit):** push and watch CI, check the live door,
`/readme/` and the read-only spec, move `crit-9`, and open the live site.
The results go in the next entry.

### 29. "so for the new update in the game-uno, i asked my friends to try it and 10 sec was too less so i chnaged it to 20sec. add this with the commit hash of prev prompt" (9 Oct 2026)

**What happened to entry 28's ship:**
- `2f61693` was pushed, and CI run 37864138233 passed `check` and `deploy`.
- The live `/` and `/readme/` answered 200, and the README said "twenty
  seconds a turn".
- The read-only spec passed 5 and skipped 35.
- `crit-9` moved to `2f61693`, and the site was opened.

**Asked:** the sentence above, for `PROCESS.md`, with the previous
prompt's commit.

**What it records:** Rithika had her friends try UNO, and ten seconds a turn
was too short for them. That's why entry 28 changed it to twenty.

**Agent:** the sentence was in Rithika's editor but not saved in the file.
It went in under the "make it 20 seconds" prompt in `PROCESS.md`, word for
word, linked to [`0095db4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0095db4).
Only that line was committed; the rest of her draft is still uncommitted.

**Correction:** none.

**Commits:** [`e1c6183`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/e1c6183)
(this entry, with the line in `PROCESS.md`). It was committed locally and
not pushed, because this prompt didn't say to push.

### 30. "push and ship it" (11 Oct 2026)

**Asked:** "push and ship it"

**Agent:**
- Found Rithika had changed one line of `reflections/crit-9.md` since it
  was committed. It's her writing and it was in her working copy, so it
  ships too: committed exactly as she left it, after a scan for anything
  secret-looking (nothing).
- Her `PROCESS.md` draft still stays uncommitted, apart from the Prompts
  lines.

**Correction:** none.

**Commits:** her reflection's edit, then this entry with the prompt in
`PROCESS.md`, pushed together with `e1c6183`.

**Ship (after this commit):** push and watch CI, check the live door,
`/readme/` and the read-only spec, move `crit-9` (its cutoff is 14 October,
1:30 pm), and open the live site. The results go in the next entry.

### 31. "in the big memory wall, make it in a way that we can react to the news posted on it" (11 Oct 2026)

**What happened to entry 30's ship:**
- `d38f5e2` was pushed, and CI run 38096641269 passed `check` and `deploy`.
- The live `/` and `/readme/` answered 200.
- The read-only spec passed 5 and skipped 35.
- `crit-9` moved to `d38f5e2`, and the site was opened.

**Asked:** "in the big memory wall, make it in a way that we can react to
the news posted on it, like the person should know that we read it and how i
feel so give everybody options of stickers to put on each news on memory
board"

**Agent:** built stickers for notes on the living room wall (big news and
everyday notes, the memory box too):
- **The stickers:** eight in `STICKERS` in `src/house.ts` (❤️ love it,
  😂 haha, 🥹 aww, 🎉 yay, 🤗 a hug, 😮 wow, 🙏 so proud, 👀 read it).
  Each friend sticks one per note on friends' notes. Picking another swaps
  it, and picking the same one peels it off. A new `sticker` kind is placed
  `note:<id>`, and the latest per friend counts.
- **On the note:** each sticker is a little tilted chip in the friend's
  colour with her name. There are no counts, because the house's own rules
  forbid likes and counts. A "Stick a sticker on it" toggle opens the eight
  buttons. A sticker pops 💛✨ over the wall, says "Stuck on…", and comes
  back to the same note.
- **Who hears:** only the writer, in "While you were away" ("Neha stuck 🥹
  on your note “…”"), and only about each friend's latest sticker. Her
  living room sparkles.
- **Live updates:** a sticker arrives on everyone's open wall. A picker or
  the memory box you've opened stays open through the swap.

**What went wrong:**
- The toggle was first called `stick`, the thumb stick's class, so it was
  hidden off touch screens. A real tap in `scripts/shot.ts` landed on the
  header instead of it, which showed something was wrong. It's now
  `sticker-pick`, and `CLAUDE.md` says to grep the stylesheet before naming
  a class.
- The sticker chips' name span first used `.who`, the drawing's label
  class; it was renamed before anything shipped.
- The spec failed once when two stickers were stored in the same
  millisecond, so ties now go by row id. Two runs in a row then passed
  41/41.

**Checks:** in headless Chrome at 390px as Rithanya, a real tap opened the
picker, and a real tap on 🎉 posted it. The note then read "❤️
Amirdhavarshini, love it | 🥹 Neha, aww | 🎉 you, yay", back at
`#note-4`. All eight buttons fit in one row on a phone after shrinking them
to 34px.

**Correction:** none.

**Commits:** [`eecb5f6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/eecb5f6),
then this entry with the prompt in `PROCESS.md`.

**Ship (after this commit):** push and watch CI, check the live door,
`/readme/` and the read-only spec, move `crit-9`, and open the live site.
The results go in the next entry.

### 32. "can we ship it now" (14 Oct 2026, crit 9 cutoff day)

**What happened to entry 31's ship:**
- `ce99177` was pushed, and CI run 38097990966 passed `check` and `deploy`.
- The live `/` and `/readme/` answered 200, the README had the stickers,
  and the live stylesheet had `sticker-pick`.
- The read-only spec passed 5 and skipped 36.
- `crit-9` moved to `ce99177`, and `/living` was opened.

**Asked:** "can we ship it now", at 12:50 pm in Canberra, 40 minutes before
crit 9's 1:30 pm cutoff.

**Agent:** checked before doing anything:
- `main` on GitHub was `ce99177`, CI had passed it, and `crit-9` pointed at
  it, so everything built was already shipped.
- The live door and `/readme/` answered 200, and the read-only spec passed
  5 and skipped 36.
- The only thing not shipped was Rithika's own `PROCESS.md` draft (14 lines
  added, 70 removed), which the agent never commits. So it asked whether to
  ship her draft in the crit 9 snapshot. Rithika picked "Leave it, it's
  done".

**What went wrong:** the first commit for this entry,
[`3b8cd7f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3b8cd7f),
went in with only the `PROCESS.md` line. The edit adding this entry had
failed (its anchor text appeared four times in this log), and the commit
command ran anyway. This entry follows in its own commit.

**Correction:** none.

**Commits:** `3b8cd7f` (the prompt in `PROCESS.md`), then this entry. Both
are committed locally and not pushed. A push before the cutoff would set off
a new deploy and the question of moving `crit-9`; after the cutoff the tag
must stay on `ce99177`.

### 33. "push it now after adding the commit hash for so for the new update in the game-uno …" (14 Oct 2026, 12:55 pm)

**Asked:** "push it now after adding the commit hash for so for the new update in
the game-uno, i asked my friends to try it and 10 sec was too less so i
chnaged it to 20sec."

**Agent:**
- Found the sentence already in `PROCESS.md` with its commit,
  [`0095db4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0095db4).
  It was added in `e1c6183` (entry 29) and live since `d38f5e2`, now on line
  89 of the saved file.
- Rithika's line 79 was typed in her editor but not saved; the saved line 79
  is the Prompts section's opening line. So it wasn't added a second time.
- Pushed entry 32's two local commits with this one.

**Correction:** none.

**Commits:** this entry, with the prompt in `PROCESS.md`.

**Ship (after this commit):**
1. Push and watch CI.
2. If the deploy passes before crit 9's 1:30 pm cutoff, move `crit-9` to
   it (`CLAUDE.md`: re-shipping before the cutoff moves the tag). If it
   lands after 1:30, `crit-9` stays on `ce99177`.
3. Check the live door, `/readme/` and the read-only spec.

The results go in the next entry.

### 34. "no push everything" (14 Oct 2026, 1:01 pm)

**What happened to entry 33's ship:** `1827490` was pushed at 12:56, CI run
38498430142 passed `check` and `deploy` at 12:58, the live `/` and
`/readme/` answered 200, the read-only spec passed 5 and skipped 36, and
`crit-9` moved to `1827490` at 12:59.

**Asked:** Rithika quoted the agent's last reply ("This push also carried the
log entries for this prompt and the last one. Your own draft of the rest of
PROCESS.md is still uncommitted, as you chose.") and said "no push
everything".

**Correction:** this reverses the "Leave it, it's done" she'd picked in entry
32: her `PROCESS.md` draft goes into the crit 9 snapshot after all.

**Agent:** at 1:01 pm the only uncommitted file was her draft (14 lines
added, 70 removed). `pnpm check:evidence` passed on it (17 cited commits,
all resolve), and a scan for anything secret-looking found nothing. It's
about 1,190 words, over the 900–1,100 `CLAUDE.md` asks for; that's hers to
judge, so it wasn't edited. It was committed exactly as she left it,
[`3627ef5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3627ef5),
and pushed at 1:02.

**Ship:** CI run 38498940365 passed `check` and `deploy` at 1:04. The live
`/` and `/readme/` answered 200, and the read-only spec passed 5 and skipped
36. `crit-9` moved to `3627ef5` at 1:05, before the 1:30 pm cutoff, and must
not move again.

**Commits:** `3627ef5`, then this entry, committed locally and not pushed.
A push now would deploy something the tag no longer covers. It goes up with
the next push after the cutoff, and `crit-9` stays on `3627ef5`.

### 35. "is this the final process.md? cuz i want the ending to have commit hash" (14 Oct 2026, 1:07 pm)

**Asked:** "is this the final process.md? cuz i want the ending to have commit
hash"

**Agent:** confirmed the shipped `PROCESS.md` (`3627ef5`) was the file on
disk. It found its ending out of date:
- the "can we ship it now" line still said Rithika had left her draft out
  of the snapshot, which "no push everything" reversed
- the last two prompts had no lines

So, before the 1:30 pm cutoff:
- That line now says she changed her mind.
- A line went in for "no push everything" and one for this prompt, each
  ending on its commit,
  [`3627ef5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3627ef5),
  so the file ends with a commit hash.
- `pnpm check:evidence` passed (18 cited commits, all resolve).
- An editor warning that the file had changed on disk was checked: the only
  differences from `3627ef5` were these three edits.

**Correction:** none.

**Commits:** this entry with the `PROCESS.md` ending, then the push with the
earlier unpushed `f5fd555`. If CI deploys before 1:30, `crit-9` moves to it.
The results go in the next entry.

### 36. Crit 10: "lets start crit 10 … i wanna add an LLM where this website becomes for everybody" (18 Oct 2026)

**Asked:** "hi queen , lets start crit 10, first lets talk ab this idea. i
wanna add an LLM where this website becomes for everybody because this is j
for me and my friends, so i want to make it for everybody using an LLM, so
the user is asked to list how many ffriends and a few qualities of them, and
also what specific things should be in their room, what things they want as
memories in living room etc make a new branch and do this on a diff branch
so we can j throw it away if its bad, we can talk ab thisd= before you start
if you feel like we have sumn to discuss"

**Agent:**
- Read the crit 10 brief first. "Fly by instruments" asks for two
  classmates in separate browsers, told apart from the server's logs alone,
  with server-side checks on who may change what.
- Made the branch `llm-any-friends` and built nothing yet.
- Raised three things before starting:
  - The crit's real ask is logging, which the house barely has.
  - The LLM idea turns "exactly five" into a house-maker for anyone. The
    art is the hard part: an LLM can write rooms, not draw a new house.
  - The cutoff was three days away.
- Suggested the crit 10 logging first, and for the branch a first slice
  with the same picture and new friends and contents.

### 37. "but rooms should increase if its more friends, for now lets stick to 5 friends for the prototype, try your best to make this work" (18 Oct 2026)

**Asked:** "but rooms should increase if its more friends, for now lets stick to
5 friends for the prototype, try your best to make this work, you can fan out
subagents and make them talk and intereact w eachother queen, goodluck"

**Agent, on `llm-any-friends`:**
- **Checks first:**
  - No other AI provider in the project.
  - No `ANTHROPIC_API_KEY` for the app. The shell's token is the course
    proxy for Claude Code and isn't the app's to use.
  - Loaded the Claude API reference.
- **The SDK:** pinned `@anthropic-ai/sdk@0.131.0`, the newest release at
  least two weeks old (0.135.0 was three days old), and confirmed it imports
  under Node's type stripping. It's the app's first runtime dependency, so
  the Dockerfile and an ADR have to say so.
- **Multi-house base,** [`0997905`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0997905):
  - Each made house lives under `/h/<code>/` with its own SQLite file, its
    own five friends and its own `who=` cookie path.
  - `AsyncLocalStorage` runs each request inside one house. `PEOPLE` became
    a Proxy over that house's five, `store.ts` keeps one set of statements
    per house, and `live.ts` only tells a house's own pages.
  - Responses in a made house have their links rebased onto `/h/<code>`.
    So about 100 hard-coded paths, and Rithika's house at `/`, didn't change.
  - All 41 existing tests passed unchanged. A scratch script against a
    hand-seeded house passed 15 checks: its own five, its own cookie, its
    own wall, its live line, and Rithika's wall untouched.
- **Fanned out** two agents in their own worktrees, told to message each
  other about the shared `Friend`/`HouseSpec` fields:
  - **maker:** the `/make` form, the Claude call with structured output, and
    an offline maker used when there's no key.
  - **rooms:** made friends' things in their rooms and the memories on the
    wall, and Rithika's own details hidden in made houses.

**Decision to redirect:** five fixed windows for the prototype, since more
friends means more rooms, which means new art.

**Correction:** none.

**Commits:** `0997905` so far; the agents' work is merged later.

### 38. "continue and open the live site when youre donw", "live site, because i want to it be in process.md", "continue and ship it when done, then open the live4 site" (18 Oct 2026)

**Asked:** first "continue and open the live site when youre donw". The agent
asked whether to open the branch locally or put it on the live site, since
the live site only runs `main`. Rithika chose to clarify, then said "live
site, because i want to it be in process.md", and later "continue and ship
it when done, then open the live4 site".

**Correction:** the prototype was meant to stay on a branch to throw away.
Rithika chose to ship it, so it's merged to `main`. Throwing it away now
means reverting it there.

**Agent:**
- **Before shipping:** told the maker agent to add a cap and make the image
  install the SDK, since `/make` would be public and real calls cost money.
- **Crit 10 logging,** [`d669cbc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d669cbc):
  every `store.leave`, coming in and leaving (with the browser's first 6
  token characters), each change of room, and every refused write, each
  tagged with its house. No note text. A rehearsal with Neha and Aswathy in
  separate cookie jars read cleanly from the log alone, including "Aswathy
  was refused POST /me (409)" when she tried to be Neha.
- **Merged the maker,** [`083033e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/083033e):
  - the `/make` form, and the Claude call (`claude-opus-5-5`, structured
    output, effort low)
  - the offline maker, used when there's no key (the live site has none)
  - the cap: 3 an hour per visitor and 30 an hour in all
  - the Dockerfile installing the SDK with `--prod --frozen-lockfile`
  - ADR 0017
- **Merged the rooms,** [`71209b0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/71209b0):
  each made friend's things as tags in her room and a card on her page, the
  memories pinned on the wall, rooms named after their owners, and Rithika's
  five's own details shown only in her house.
- **The merge,** [`09269ed`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/09269ed),
  conflicted only at the ends of `style.css` and the spec. The rooms agent's
  made-house test, skipped while `/make` was a stub, was un-skipped and given
  its own visitor header for the cap. 47/47 passed, twice.
- **Checks:** a real fill-in of `/make` at 390px, with real typing and a
  real tap, built "The Pune flat" for Priya, Sara, Kavya, Diya and Meera.
  Screenshots showed rooms named after them, their things pinned in their
  rooms, "Very Priya: always late, loves chai…" on her page, and no KitKat
  gift.

**What went wrong:** the per-visitor cap trusts the `fly-client-ip` header,
which a caller can send themselves, so it can be dodged. The 30-an-hour
total still bounds the cost. ADR 0017 says so.

**Commits:** the above, then
[`056bfee`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/056bfee)
(README and `CLAUDE.md`), then this entry. The branch merges into `main` for
CI to deploy, and the results go in the next entry.

### 39. Shipping the house maker (18 Oct 2026)

**What happened to entry 38's ship:**
- `llm-any-friends` merged into `main` as `aa5cc94`. `main` hadn't moved,
  so it merged cleanly.
- The Dockerfile's new install step was checked before pushing: the
  `prepare` script ends in `|| true`, so a missing git in the slim image
  can't fail it.
- The diff scan for secrets found nothing.
- CI run 39103092566 built the image with the SDK, passed `check` with all
  47 tests against the container, and passed `deploy`.
- The live `/`, `/readme/` and `/make` answered 200. The door had "Make a
  house for your own friends", and `/readme/` had the new section.
- The read-only spec passed 5 and skipped 42.
- A real fill-in of `/make` on the live site at 390px built "The Pune flat"
  at `/h/g30muizqfr/`. `flyctl logs` read `maker: offline` and `made house
  g30muizqfr for 5 friends (offline) in 3ms`: the crit 10 logs working on
  Fly, with no names or answers in them.
- That house stays up as a demo.
- Fly has no `ANTHROPIC_API_KEY`, so the live maker is the offline one until
  Rithika sets one with `flyctl secrets set`. That's her call, since it
  spends her money.

**Tags:** `crit-10` isn't set yet. Its cutoff is 21 October, 1:30 pm, and
the tag goes on whatever's deployed then.

### 40. "continue and open the llm part for me to try" / "yes do whatever you should, its okay i trust you w my key" (18 Oct 2026)

**Asked:** "continue and open the llm part for me to try". The agent found no
API key on Fly or on Rithika's machine and asked how to try it. She chose
"Try it locally first", then said "yes do whatever you should, its okay i
trust you w my key".

**Agent:**
- Used the course key Claude Code already runs on (`ANTHROPIC_AUTH_TOKEN`
  with its base URL, which the SDK reads itself), only on her machine.
  Nothing was written into a file, and it was never put on Fly, where anyone
  making a house would spend it.
- The maker had only switched to Claude on `ANTHROPIC_API_KEY`. It now uses
  either credential, and `HOUSE_MAKER=fake` still forces offline. CI and Fly
  have neither credential, so they stay offline.
- **Ran it for real** on a scratch house at port 8130: one real fill-in of
  `/make` logged `maker: claude` and `made house qo87wd9fun for 5 friends
  (claude) in 10303ms`.
  - From "artist, quiet, funny" and "paint tubes everywhere, an easel",
    Claude wrote Kavya's room as "Paint tubes scattered everywhere, an easel
    by the window, and a quiet calm that hides a very funny streak", in
    Chennai's time.
- **The spec** ran with `HOUSE_MAKER=fake`: 47/47, and all six houses it
  made were offline, none through Claude. `CLAUDE.md` now says the agent's
  spec server must set it, since the agent's shell carries the course key.
- Opened `localhost:8130/make` and the house Claude wrote for Rithika to
  try.

**Correction:** none.

**Commits:** [`1e762fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/1e762fe),
then this entry with the prompt in `PROCESS.md`. Both are committed locally
and go out with the next push.

### 41. "open it for me" / "okayokay, ask gender and make the avatras accordingly" (18 Oct 2026)

**Asked:** "open it for me". The agent checked the local server answered
and opened `localhost:8130/make`.

Then: "okayokay, ask gender and make the avatras accordingly".

**Agent:**
- **Found the gap:** every avatar is one of Rithika's five Stitch stickers,
  all girls, and that's all the art there is. A made house had reused them,
  so a "boy" would still wear a friend's face. The text also says she/her
  about 160 times.
- **Asked two things:**
  - Who draws the new stickers? Rithika chose "You draw them".
  - What does the form offer? She chose "Girl / boy / just their name".
- **The base,** [`17c0351`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/17c0351):
  - The form asks each friend's gender, and Claude hears the pronouns.
  - Each made friend gets a `look` (gender, skin, hair, style), picked
    deterministically from the house's code and window.
  - Every picture of a person goes through `avatarUrl()`. Rithika's five
    keep their Stitch PNGs; made friends get `/avatar/<look>.svg`, drawn on
    the server (a placeholder at first).
  - A scratch check passed: the form asks, a boy gets `/avatar/boy-…`, all
    five look different, a made-up look is a 404, and Rithika's door still
    shows her Stitch stickers.
- **Fanned out** two agents in their own worktrees, told to tell each other
  before touching the same lines:
  - **art:** draws the chibi girl, boy and no-gender stickers in SVG, in
    six skin tones and hair colours and a few hairstyles, checked against
    Rithika's Stitch stickers by eye.
  - **words:** he/him, she/her and they/them through every sentence a made
    house says about a friend. Rithika's house's HTML must not change at
    all, checked by a before-and-after diff.

**Correction:** none.

**Commits:** `17c0351` so far; the agents' work is merged later.

**Finished:**
- **words,** [`003f110`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/003f110), merged in `8a7f799`:
  - A made house's friends are she, he or they in every line about them:
    rooms, Updates, Everyone, the birthday card, UNO, movie night, and the
    door's 409.
  - Rithika's pages are byte-for-byte the same as before.
- **art,** [`5b5e779`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/5b5e779):
  - Chibi stickers drawn in SVG on the Stitch stickers' canvas:
    - girls: long hair, ponytail, bob, or bun and braids;
    - boys: crop, curls, or side part;
    - just-their-name: beanie, hood, or backwards cap.
  - Each comes in six skins and six hair colours, with a white die-cut edge.
- **A check turned up two things:**
  - Arjun's hair came out the colour of his skin. The art agent made
    `lookFor` step to a hair colour that contrasts with the skin, and lined
    every sticker's hair, [`443b809`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/443b809).
  - Dealing UNO still said the game waits "however long she's away". That
    stopped being true with twenty-second turns, so it now says twenty
    seconds in every house. The offline maker didn't know Pune's time zone
    either; it does now, [`20e848e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/20e848e).
- **Merged the art,** [`0e39059`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0e39059):
  - The spec conflicted, and both sides were kept.
  - Sticker addresses had no fingerprint, so browsers would have kept an
    old drawing for a day. The merge gave them `?v=` with a hash of
    `src/avatars.ts`, the way `art()` does.
  - 50/50 tests passed twice, with `HOUSE_MAKER=fake` so no test called
    Claude.
- **Tried it with Claude** on Rithika's machine (port 8130, her course key):
  - Made "The Bangalore gang" with headless Chrome: real typing, and each
    gender picked with a real tap. The friends were Arjun (boy), Priya
    (girl), Sam (just their name), Ravi (boy) and Meera (girl). Claude took
    11.6 s.
  - Looked at the house at 1280 and Arjun's room at 390: each sticker
    matches the gender given, Sam wears a cap, and Arjun's room says "his
    laugh carries down the hall".
- Opened the house and `/make` for Rithika.

**Commits:** `17c0351`, `5b5e779`, `003f110`, `8a7f799`, `443b809`, `20e848e`, `0e39059`.

### 42. "continue and open it for me when done" (18 Oct 2026)

**Asked:** "continue and open it for me when done", in reply to the offer to
push and tag `crit-10`.

**Agent:**
- Pushed `main` (`a9fe1d1..3da0f14`). CI's `check` and `deploy` both passed.
- **Checked the live site:**
  - the door loads, with Rithika's five still on their Stitch stickers;
  - `/readme/` renders;
  - `/make` asks each friend's gender;
  - the read-only spec passes (5 passed, 45 skipped by the `throwaway` gate).
- GitHub's push reported a high Dependabot alert: `source-map-js` 1.2.1,
  an event-loop denial of service fixed in 1.2.2. `pnpm why` shows only
  vitest and jsdom pull it in. Both are dev dependencies, and the Dockerfile
  installs `--prod`, so it isn't in the live app. Left for Rithika to
  decide.
- Pushed this entry, tagged the deployed commit `crit-10`, and opened the
  live site and `/make`.

**Correction:** none.

**Commits:** `3da0f14` shipped; this entry's commit is the `crit-10` tag.

### 43. "just commit it" (20 Oct 2026)

**Asked:** "just commit it", about `reflections/crit-10.md`, which the last
reply said was still untracked because it's Rithika's to write.

**Agent:** Committed her reflection as she wrote it, unchanged,
[`b17a158`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/b17a158).
Not pushed, so `crit-10` is still on `94f1e1b`, without the reflection.

**Correction:** none.

**Commits:** `b17a158`.

### 44. "deploy the site with llm" (20 Oct 2026)

**Asked:**
- "open the live site bro"
- "where is my llm"
- "try /make locally"
- "can you swutch thiz to live?"
- "deploy the site with llm"
- "i want the llm to work on the live site / cant you do this without making
  my tokens public?"
- "But visitors do spend your credits. yes thats okay"
- "done"

**Agent:**
- Opened the live site, then answered "where is my llm": it's the house
  maker at `/make`, which used Claude only where a credential was set, and
  Fly had none.
- Started the app locally on 8080 with the course credentials and opened
  `/make`. Rithika made a house there, and Claude wrote it in 12 seconds
  (`made house … (claude) in 12445ms`).
- Asked what "swutch thiz to live" meant; she picked opening the deployed
  site.
- On "deploy the site with llm", pointed out that CLAUDE.md said her key
  never goes on Fly, and asked. She turned the question down to clarify:
  she wanted the LLM live, without making her tokens public.
- Explained that a Fly secret isn't public, but that visitors making houses
  would spend her key, within ADR 0017's cap (3 an hour per visitor, 30 in
  all). Checked first that the `/make` tests are all inside the `throwaway`
  gate, so the read-only spec against Fly never makes a house.
- The agent's `flyctl secrets set --stage` was refused by Claude Code's
  auto-mode classifier (secret-store writes). Rithika ran the same command
  herself ("done").
- Changed the CLAUDE.md rule to say the key is a Fly secret and visitors may
  spend it, quoting her, and pushed it; CI's `check` and `deploy` passed and
  both secrets show as deployed.
- Made one house on Fly to test it: `maker: offline`, in 8 ms. The secrets
  reached Fly empty (both show the same digest), since the shell the command
  ran in didn't have the two variables. That test house (`ssg6r3qq1b`) is
  still on the live site.

**Corrections:** she turned down the agent's question about the key to
clarify what she wanted. The classifier refused the agent's secret write.

**Commits:** [`7642f54`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/7642f54).
The live maker isn't on Claude yet.

### 45. "where should the token be for you", "bro open live" and "give me an option to make my own house, like make a button" (20 Oct 2026)

**Asked:**
- She pasted her terminal: the command from entry 44, with its `!`, run in
  her own shell, then "where should the token be for you".
- "bro open live", twice.
- "give me an option to make my own house, like make a button".

**Agent:**
- Read the paste: in her own terminal the `!` turned the check around, so
  `flyctl` ran because the key was missing, and set both secrets empty again
  (digests unchanged). Found the key in `~/.claude/settings.json`, where
  Claude Code passes it to the agent's shell, and gave her a command that
  reads it from there with `jq`, without printing it.
- Opened the live site each time she asked. The secrets were still empty,
  and the agent said so.
- The door already linked to `/make`, as small text under the windows. Made
  it a rounded button, "🏡 Make your own house", in the door card's colour.
  It's still a plain link, so it works without the script.
- Checked it at 390 px, 820 px (touch) and 1280 px. Real taps at 390 and
  820 land on the button and go to `/make`. `pnpm check` passed (50 tests)
  against a server on 8091 with a copy of the data and `HOUSE_MAKER=fake`.
- Stopped that server, and the one on 8080 the agent started in entry 44,
  which was still serving old code.

**Correction:** none.

**Commits:** [`a590225`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/a590225).
The live maker still isn't on Claude.

### 46. "ship it thanks" (20 Oct 2026)

**Asked:** "ship it thanks", about the house-maker button.

**Agent:**
- Pushed `main` (`7642f54..1f12c1f`). CI's `check` and `deploy` both passed.
- **Checked the live site:**
  - the door has the "🏡 Make your own house" button;
  - `/readme/` renders;
  - the read-only spec passes (5 passed, 45 skipped by the `throwaway` gate).
- Left `crit-10` where it is, on `94f1e1b`.
- Opened the live site, then pushed this entry.

**Correction:** none.

**Commits:** `1f12c1f` shipped; this entry's commit.

### 47. "okay now all you do when i mention what should be there in the room is, just put a stiky note and write that on top, i want you to use the picture credits yuou have and actually draw what should be in the room, do this and ship the code" (20 Oct 2026)

**Asked:** sent while the agent was watching CI for entry 46.

**Agent:**
- The Claude API takes pictures in but doesn't paint them, so Claude draws
  each thing as a few flat SVG shapes (circles, boxes, outlines) in a
  100 × 100 box, and the app turns them into SVG. Wrote ADR 0018 with the
  other options: Claude writing raw SVG (rejected: markup from a stranger's
  answers), hand-made drawings for common things, an image model.
- `src/drawings.ts`: when Claude makes a house, one more call per friend,
  all at once, draws her first three things. `tidyDrawings` keeps only the
  five shape kinds, numbers clamped to the box and `#rrggbb` colours. The
  drawings are saved in the house's spec, stand in her room where the tags
  were, and sit beside each thing on her room page. A failed call keeps the
  tags; houses made without Claude keep them too.
- Tried one friend's things first ("a yoga mat", "too many plants", "a box
  of KitKats"): all three drawn in 12 s, clear and in the house's style.
  Then made a house with Claude on port 8092: 15 things drawn, the house
  made in 23 s (12 s before). Looked at it at 1280 px and 390 px, the house
  and Dev's room page.
- `spec/drawings.test.ts` feeds in a `script` shape, an `onload` colour and
  out-of-box numbers and checks none reach the page. `pnpm check` passed
  (52 tests) against a fake-maker server on 8093.
- The live maker still has an empty key, so houses made there keep tags
  until the Fly secret is set.

**Correction:** none.

**Commits:** [`8cf868f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8cf868f).

### 48. "done" (21 Oct 2026)

**Asked:** "done", after running the `jq` command from entry 47 in her own
terminal.

**Agent:**
- Fly's two secrets now have their own digests, so the real key arrived.
- Made one house on Fly to test it: 503 after 33 s. The log says
  `maker: claude`, then `make failed (claude) in 32728ms: The house maker
  couldn't be reached`.
- The key's base URL is `strproxy.comp.anu.edu.au`. Its address is public,
  but the course's LLM access page says it "is only reachable from the ANU
  network: that's a university-wide network rule", so Fly's Sydney machine
  can't reach it. `flyctl ssh` timed out before the agent could test from
  the machine itself.
- Updated CLAUDE.md: the course key can't serve the live maker.

**Correction:** none.

**Commits:** this entry's commit. The live maker on Claude needs a key that
calls Anthropic directly; Rithika's to decide.

### 49. "do 3 and ship it" (21 Oct 2026)

**Asked:** "do 3 and ship it", choosing the third of entry 48's options: when
Claude can't be reached, make the house from the answers instead of showing an
error.

**Agent:**
- `src/maker.ts`: any failure from Claude (can't reach it, rate limit, refused
  key, refusal, cut-off or garbled answer) is logged as `claude failed in
  <ms>ms, making it offline: <why>` and the house is made from the answers.
  Nothing is drawn for a house Claude didn't write, so an unreachable Claude
  isn't waited on twice. The failure reasons are now short log words, not
  sentences for the form.
- Cut Claude's timeouts: 20 s and one retry to write (was 90 s and two), 45 s
  and one retry to draw. The worst wait is about 40 s.
- Wrote this up as ADR 0019, superseding the line of 0017 that had failures
  show on the form. The agent first appended it to 0018, then moved it into
  its own record, since accepted records aren't edited.
- A spec test, run only with `MAKER_UNREACHABLE=1`, makes a house against a
  server whose Claude points at a closed port: 201, built from the answers, in
  460 ms. The full `pnpm check` passed (52, that one skipped) against a
  fake-maker server.

**Correction:** none.

**Commits:** [`1934d52`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/1934d52).

### 50. "push everything" (21 Oct 2026)

**Asked:** "push everything".

**Agent:** `git status` was clean and `main` matched `origin/main`: entry 49
had already pushed everything. Pushed only this entry and its prompts line.

**Correction:** none.

**Commits:** this entry's commit.

### 51. "where is my LLM stored?" (21 Oct 2026)

**Asked:** "where is my LLM stored?"

**Agent:** Answered, no code change: Claude runs on Anthropic's servers and
isn't stored in the app. The code that calls it is `src/maker.ts` and
`src/drawings.ts`; the key is in `~/.claude/settings.json` and in Fly's
secrets; what Claude writes and draws is saved in `houses.db`. Left an
untracked `image.png` in the repo root alone.

**Correction:** none.

**Commits:** this entry's commit.

### 52. "how can we create images then" (21 Oct 2026)

**Asked:** "how can we create images then", after hearing Claude runs on
Anthropic's servers and can't reach the API from Fly.

**Agent:** Answered, no code change. Read the course's "Generating images"
page: the course key generates images through strproxy
(`/api/images/generations`), $0.10 each from a $30 course budget that never
resets, with URLs that expire, and the same ANU-network-only rule. Checked
`/api/images/models`: five models (flux-schnell, flux-dev, flux-1.1-pro,
ideogram-v3-quality, recraft-v3), $30 left, nothing spent. Suggested making a
set of room-thing pictures once on her laptop and committing them, since Fly
can't reach the proxy, and asked before building.

**Correction:** none.

**Commits:** this entry's commit.

### 53. "when the user prompts in LLM, casn we use the course key to make those images?" (21 Oct 2026)

**Asked:** whether the course key could make pictures for each house as it's
made.

**Agent:** Answered, no code change: only where the server can reach
strproxy, so on her laptop with the VPN, never from Fly. Fifteen pictures a
house at $0.10 is $1.50, about 20 houses from her $30. Said the agent
wouldn't relay requests through her laptop to get round the ANU-only rule.
Offered a committed set of pictures, or her own image-service key on Fly, for
the live site.

**Correction:** none.

**Commits:** this entry's commit.

### 54. "lets do this, make a set of images that people will generally use, and when the user is making 5 rooms for thier friends, give these opetions only" (21 Oct 2026)

**Asked:** quoting the agent's option of a set of pictures made once and
committed, "lets do this ... give these opetions only".

**Agent:**
- Tried one guitar with two models ($0.20): Flux gave a clean outlined
  sticker like the friends' own; Recraft added stars and a wash. Chose
  `flux-1.1-pro`.
- `src/belongings.ts` lists 42 common bedroom things (key, words, prompt).
  `scripts/make-belongings.py` makes each with the course endpoint, saves it
  at once (the URLs expire), cuts away the white and writes
  `public/art/thing-<key>.png`. python.org's Python has no certificates, so
  it fetches through `curl`, with the key on stdin rather than the command
  line.
- Made two first ($0.20), then 40 ($4.00). Four came out wrong: posters as a
  whole room, a tiny beanbag in a grey box, the journal and laptop on
  background patches. Made their prompts specific and remade them ($0.40).
  $4.60 of $30 in all. Shrank the set from 3.4 MB to 464 KB.
- The form's "What's in their room" box is now a grid of ticks, up to six,
  eight showing and the rest behind "Show all 42" (it ran to 11,000 px on a
  phone with all of them open). Only keys in the set are kept.
- A friend's `things` are now the words for the pictures ticked; the keys go
  in `belongings`, and the first three stand in her room. Claude no longer
  writes or draws the things; the code that asked it to draw is gone, but
  older houses still show their drawings (checked on yesterday's test house:
  all 15).
- ADR 0020, superseding 0018 for new houses. README and CLAUDE.md updated.
- `pnpm check`: 53 passed (one new: only pictured things get in). Looked at
  the form at 390 px and 820 px, tapped pictures at both, and a made house at
  1280 px and its room at 390 px.

**Correction:** none.

**Commits:** [`8f71174`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8f71174).

### 55. "the images work good, but the persistence is weird whwn we use an LLM, pls check that, its not doing the "multiuser" part very well" (21 Oct 2026)

**Asked:** after switching the session to Opus 5.5 with `/model`: made houses
weren't keeping things between friends properly.

**Agent:**
- Found the cause: the page scripts call some addresses by fixed paths, and
  the server's `rebase()` only rewrites the HTML it sends, never the script
  files. In a made house:
  - `public/live.js` listened on `/live`, Rithika's house's live line, so
    friends never saw each other move or leave things until they reloaded;
  - `public/house.js` sent steps to `/here`, so where you stopped was never
    kept in your own house (and was refused, since the sign-in only works in
    its own house);
  - the house's buttons (`data-do`: nap, tidy, sit, Shinzo, hugs, UNO)
    posted to `/room/1/nap` and so on, outside the house;
  - walking out of a room went to `/`, Rithika's door.
  `rebase()` had a rule for `"/here"` and `"/live"` in scripts, but it only
  ever ran on HTML, so it never applied.
- Fix: each page carries its house's base in `<body data-base>`; both
  scripts start their own addresses with it (`at()` in `house.js`). Removed
  the dead script rule from `rebase()`.
- A spec test makes a house, checks `data-base`, posts every `data-do`
  button inside it (none 404 or 403), saves a step and finds it kept, and
  opens the house's live line. Checked it fails on the old code (stashed the
  fix, reran: fails), then passes. `pnpm check`: 54 passed.
- Drove two headless Chromes as Asha and Ben in one made house: Asha walked
  right with the arrow keys and Ben's page showed her move without a reload;
  a fresh load showed where she stopped.

**Correction:** none.

**Commits:** [`2696224`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/2696224).

### 56. "open live site, and ship all the chnages" (21 Oct 2026)

**Asked:** "open live site, and ship all the chnages".

**Agent:**
- Everything from entry 55 was already pushed. Two untracked files were
  waiting: `reflections/crit-11.md` and `image.png`.
- Committed Rithika's crit 11 reflection unchanged,
  [`b7810fc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/b7810fc).
- Left `image.png` out: a 2 MB screenshot in the repo root of a made house
  from before the picture set (paper tags), which nothing refers to. Asked
  her whether to keep it.
- Pushed, watched CI, checked the live site and opened it.

**Correction:** none.

**Commits:** `b7810fc`; this entry's commit.

### 57. "now add test cases and test all parts of the website, fan out subagents and try the multiuser part as well, and report the issues" (21 Oct 2026)

**Asked:** "now add test cases and test all parts of the website, fan out subagents and try the multiuser part as well, and report the issues".

**Agent:**
- First checked how the spec signs friends in (one session per friend, ADR
  0011) and how many houses a run makes (`/make` allows 30 an hour), so
  parallel test files wouldn't lock each other out or hit the cap.
- Fanned out four background agents, each with its own server, port and
  `DATA_DIR` (all `HOUSE_MAKER=fake`): the door and sign-in, the house maker,
  the house and its activities, and two to five friends at once (live
  walking, hugs, UNO, house isolation, concurrent writes).
- Each wrote a spec file (`spec/door.test.ts`, `made-houses.test.ts`,
  `activities.test.ts`, `multiuser.test.ts`), with a `BUG:` comment on each
  test that shows a defect. Those tests fail on purpose, so the files were
  not committed: CI deploys only when every test passes. The findings went
  to Rithika ranked by severity, to pick which to fix.
- What held up under the multiuser agent: live walking between pages, hugs,
  UNO moves arriving live, made houses kept apart, and concurrent writes.

**Correction:** none.

**Commits:** none yet (the spec files wait on Rithika's call).

### 58. "can you use more credits for images and make house layouts for diffeernt number of people.2,3,4,6,7 should be enpugh, try how much ever yu can, show me the images first, then we will proceed" (21 Oct 2026)

**Asked:** sent while the test agents were running: "can you use more
credits for images and make house layouts for diffeernt number of
people.2,3,4,6,7 should be enpugh, try how much ever yu can, show me the
images first, then we will proceed".

**Agent:**
- Tried the course's image models for cutaway houses with a bedroom per
  friend. Neither counted bedrooms reliably at first (a 3-friend picture
  with 4 beds, a 4-friend one with 5); naming each bedroom by its quilt
  colour fixed most. Counted the beds in every candidate by eye.
- About 38 pictures, $3.80, bringing the image budget to $8.60 of $30.
- Showed Rithika one picture per size beside her house, and said plainly
  that they're cleaner line drawings than her watercolour house; the model
  closer to her style kept miscounting beds.

**Correction:** none.

**Commits:** none (pictures only, kept in `/tmp` until approved).

### 59. "continue" (21 Oct 2026)

**Asked:** "continue", after the session ran out of context partway
through the layout pictures.

**Agent:** made a matching set of all five sizes in the style that counted
beds right, kept the ones with the right rooms, and put the best of each on
one sheet for Rithika.

**Correction:** none.

**Commits:** none.

### 60. "yes perfect rooms, continue" (21 Oct 2026)

**Asked:** "yes perfect rooms, continue".

**Agent:**
- `scripts/make-layouts.py` lifts each house and a separately made garden
  strip off their backgrounds and sets them on a lawn at house.jpg's size,
  writing `public/art/house-<n>.jpg`.
- Moved every coordinate out of `src/scene.ts` into `src/layouts.ts`, one
  `Layout` per size; Rithika's five are `STITCH`, moved unchanged.
  Measured each new picture's rooms, beds, desks, walking spots, sofas,
  wall, stove and garden, and drew them all over the pictures to check
  before trusting them.
- The new bedrooms have no room for a mat, so in houses of 2, 3, 4, 6 or 7,
  UNO and its cushions are at the living room's coffee table (up to seven
  players). Wording comes from `matWords()`.
- `/make` asks "How many of you?" first; the door's windows, the greeting
  ("A little house for seven friends") and the maker's texts follow the
  count.
- Fixed one of the test agents' findings on the way: leaving a room in a
  made house didn't zoom out, since `house.js` looked for a link to `/`.
- ADR 0021. Spec test: houses for 3 and 7 are made with a room each, drawn
  on their own picture, and two friends can sit at the coffee table and
  deal UNO. `pnpm check`: 55 passed. Looked at 7 friends at 1280 px, iPad
  (820, touch) and the phone door, 2 friends on a phone, and 6 friends'
  living room; tapped window 6 on the 7-friend door at 390 px, and it let
  Fen in.

**Correction:** none.

**Commits:** [`9289cc5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/9289cc5).

### 61. "ship everything" (21 Oct 2026)

**Asked:** "ship everything", sent while the layouts were being finished.

**Agent:** finished the checks above, merged the `layouts` branch into
`main`, pushed, watched CI's check and deploy, and checked the live site.
Left out the four test agents' spec files (their bug tests fail on purpose)
and `image.png`/`image-1.png` in the repo root, which nothing refers to.

**Correction:** none.

**Commits:** `9289cc5`; this entry's commit.

### 62. "open the live site for this" (28 Oct 2026)

**Asked:** "open the live site for this".

**Agent:** opened the live site in the browser. No code change.

**Correction:** none.

**Commits:** none.

### 63. The inside joke (28 Oct 2026)

**Asked:** "so now when making your own house, we have an option in the end
where we tell sumn that we did in a group, then ask them for like an inside
joke or quote ab it and keep that in the living room, just sumn for them to
giggle when they enter their home".

**Agent:**
- `/make` ends with "One last thing, if you like": something you all did
  together (up to 120 characters) and the inside joke or quote from it (up
  to 280). Both are optional, but what you did together without a joke is
  turned down, since the joke is the point.
- They're saved word for word as `together` and `joke` on the house's spec
  in `houses.db`. Claude never sees them, so nobody's joke gets tidied.
  Houses made before have neither and look as they did.
- A made house's living room shows the joke in a wooden frame under the
  heading, with what you did together as its caption. Rithika's own house
  has no frame. The ready page says it's framed by the door.
- Product calls made without asking: the frame sits at the top of the
  living room page rather than in the house picture; it's one joke per
  house, fixed when the house is made, not something friends add later.
- Spec test: the joke and caption come out exactly as typed, even when
  they look like markup, and what you did together without a joke is
  turned down. The "keeps everything you wrote" test now covers both new
  fields. 56 passed in `house`, `drawings` and `invariants`. Looked at the
  living room at 390, 820 (touch) and 1280 and the form's end at 390; the
  first screenshots showed the movie-night link jammed under the frame and
  a cut-off placeholder, both fixed. Tapped "Make our house" for real at
  390 px.
- CI has been red since `a34c5dc`, which committed the test agents' bug
  specs (they fail on purpose), so nothing after it deploys until they're
  fixed or skipped.

**Correction:** none.

**Commits:** [`3aac38e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3aac38e).

### 64. "skip those tests and ship it, then open live" (28 Oct 2026)

**Asked:** "skip those tests and ship it, then open live".

**Agent:**
- CI had failed since `a34c5dc`, which committed the four test agents'
  files. Most of CI's failures weren't the bugs: the files ran at the same
  time against one server and signed in as the same friends, so they
  locked each other out ("someone else is in the house as 1"). Set
  `fileParallelism: false` in `vitest.config.ts` so files run one at a
  time.
- Run that way, 21 tests still failed: the bugs the agents found. Marked
  each `it.skip`, by exact title, and changed nothing else in them.
  `pnpm check` against a fresh throwaway server: 96 passed, 23 skipped.
- Pushed; CI's check and deploy passed. Live: the door and `/readme/`
  answer 200, `/make` has the new fields, and the read-only spec passes
  (15 passed, the rest skipped as writes). Opened the live house maker.
- Didn't tag: crit cutoffs past `crit-10` aren't tagged in this repo.

**Correction:** none.

**Commits:** [`b0daaf5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/b0daaf5), with the inside joke ([`3aac38e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3aac38e)) and its log; this entry's commit.

### 65. PRFAQ, personas and RICE (1 Nov 2026)

**Asked:** pasted a list of "The three main frameworks" (PRFAQ; personas:
"five realistic people, each with a background, a reason to use the product
and a quote. They test who the product is for and whether it works for each
person"; RICE: "(Reach × Impact × Confidence) ÷ Effort. It ranks what to
build next") and a "Supporting tools" heading with nothing under it, then
"do these for this app".

**Agent:**
- The course site doesn't mention PRFAQ, personas or RICE, so each follows
  its usual form. Did nothing for "Supporting tools", since it listed none.
- `doc/prfaq.md`: a press release for the house and the house maker, a
  customer FAQ and an internal FAQ, written for the app as it is, gaps
  included (no notifications, desk notes aren't locked, the live maker waits
  on a Claude it can't reach). Rithika's quotes are word for word from her
  crit 8 and 10 reflections; a persona's quote is marked as invented.
- `doc/personas.md`: five made-up people, each walked through the app: Kavya
  (Toronto, always asleep), Arjun (Kerala, quiet, on a phone) and Meera
  (Bangalore, wants everyone live) share one five-friend house; Priya makes
  a house for six; Lea uses one for two with her partner. Product call made
  without asking: none of them is one of Rithika's five, since details about
  the real friends come only from her, so all five live in made houses.
- `doc/rice.md`: 26 candidates, the test sweep's skipped bugs alongside the
  ideas the personas raised, scored and sorted. Reach comes from an assumed
  population (about 45 people a month), because reading the live volume to
  count houses was refused by Claude Code's permission check; it says to
  swap in real counts. Top: Home's line on a phone saying nobody came by
  when someone did (100), and a made house's name missing from its door
  (80). It names two of Rithika's calls: a "tell them I was here" nudge you
  send yourself, and taking the unreachable course key off Fly. It puts a
  front door key after the final project is marked.
- Checked the claims against the code on the way: the cap, the 42 room
  things, what Claude is sent, which width hides "While you were away",
  that the course key is still a Fly secret (names only), and that Node
  knows `Asia/Dubai` and `Australia/Perth` for the clock fix it suggests.
- No code change, and nothing deployed.

**Correction:** none.

**Commits:** [`63f3629`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/63f3629); this entry's commit.

### 66. "what features do you suggest to add" (1 Nov 2026)

**Asked:** "what features do you suggest to add".

**Agent:** a question, no code change. Suggested five features, scored with
`doc/rice.md`'s assumptions (scores are guesses until someone tries them):
sealed birthday cards, opened on the friend's day (Aswathy's is 8 November,
so this one has a deadline); leaving the light on for a friend who isn't
here, as a hug that waits for her; a "tell them I was here" nudge you send
the group yourself; a song left playing in the living room; and a question
pinned on the wall. Said the two quarter-day bugs at the top of the RICE
table outscore all of them, and named what it wouldn't add (photos and
voice notes before the deadline, emails, streaks, likes). Checked first that
a birthday wish carries no message today and that hugs need both friends
there.

**Correction:** none.

**Commits:** this entry's commit.

### 67. The house's name, the inside joke, and screenshots in PROCESS.md (1 Nov 2026)

**Asked:** "house name,inside joke shoiuld be incorporated somewhere, then
paste some screenshots of how the whole website workds in process.md".

**Agent:**

- **House name** (RICE row B). A made house's name, typed on the form or
  "<first friend>'s house", is now its door's heading, the top bar's name
  and every page's title (`houseName()` in `src/houses.ts`). Rithika's five
  stay "Five Windows". The skipped test for it passes now.
- **Inside joke.** Framed at the door as well as in the living room, and a
  little frame on the living room wall in each house picture (`jokeFrame` in
  each layout in `src/layouts.ts`, drawn by `src/scene.ts`), with a "Read the
  inside joke" hotspot (😂) that goes to it. Each frame's spot was checked
  over its picture: Rithika's is on the chimney breast. A house made without
  a joke has neither. The joke test now covers the door, the bar, the title
  and the hotspot.
- **Screenshots.** Wrote `scripts/tour.ts`. It starts its own server on a
  throwaway `DATA_DIR` with `HOUSE_MAKER=fake`, fills the five's house through
  its own forms, and moves a few timestamps back so the house has a past:
  plants from three days ago, Rithika last home two days ago. It makes a
  house for six, then screenshots seventeen pages at laptop, phone and iPad
  widths into `doc/screenshots/` as JPEGs (about 2.5 MB).
  - `scripts/shot.ts` gained `SHOT_COOKIE`, to reuse a session the tour
    already holds, and `SHOT_MAX_HEIGHT`.
  - The first run's pictures were wrong. Everyone showed as in the house at
    the door, Updates said "Welcome home", the UNO game was already over, and
    the house maker's page was 4,800 px tall. Fixed in the tour, then looked
    at every picture again.
  - Added a screenshot section to PROCESS.md before "Prompts", with a caption
    for each part of the house.
- **Found on the way.** The house maker's "You are" radio buttons floated
  apart from their words (since `17c0351`): the full-width style for its text
  inputs stretched them too. Fixed in `ce186f9`, and a real tap selects the
  right one.
- **Checks:**
  - Spec against a throwaway server (`HOUSE_MAKER=fake`): 97 passed, 22
    skipped, one fewer skipped than before.
  - Typecheck and `check:evidence` pass.
  - Real taps on the five's door and a made house's door both go in.
  - Looked at the made door at 390 px and on iPad.
- Not pushed, so not deployed.

**Product calls named in the reply:**

- The joke now also shows at the door, which anyone with the address sees
  before picking a window.
- The frame's spot in each picture was chosen by the agent.
- README's description of made houses was updated to match.

**Correction:** none.

**Commits:** [`cac59be`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/cac59be), [`ce186f9`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/ce186f9); this entry's commit.

### 68. The screenshots under "Overview of the website" (1 Nov 2026)

**Asked:** "add these screen shots in process.md under the heading overview
of the website".

**Agent:** renamed the screenshot section added in entry 67 ("How the house
works, in screenshots") to "Overview of the website". It stays where it was,
after "step by step" and before "Prompts". The pictures and captions are
unchanged. PROCESS.md had no uncommitted draft, so nothing of Rithika's was
committed with it. Not pushed.

**Correction:** the heading. Rithika named the section herself.

**Commits:** [`591336a`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/591336a); this entry's commit.

### 69. Push everything; the screenshots weren't showing (1 Nov 2026)

**Asked:** "push everything, and i cant see any screen shots in process.md".

**Agent:**

- **Why the screenshots didn't show.** All 17 were committed (`git
  ls-files`), and every image path in PROCESS.md pointed at a file that
  exists. But the eight commits since entry 64 hadn't been pushed, so
  PROCESS.md on GitHub had neither the section nor the pictures.
- **Pushed.** `803aab1..e2eaaca` to `main`. CI's `check` and `deploy`
  passed (run 41276203989).
- **On GitHub.** Rendered PROCESS.md through GitHub's API: all 17
  `<img>`s are under "Overview of the website", and GitHub lists all 17
  files in `doc/screenshots/`.
- **Live.** The door and `/readme/` answer 200, and `/readme/` has the new
  line about the joke. The read-only spec passes against the live site (15
  passed, 104 skipped). No house was made on the live site to check the name
  and joke, since that writes to the real app; CI's check ran those tests
  against its own throwaway server.
- **No tag.** Crit 10's cutoff (week 11) has passed and `crit-10` stays
  where it is; the final project (due 9 November) isn't a crit.

**Correction:** none. The screenshots' absence was the push still to come,
not a missing file.

**Commits:** this entry's commit.

### 70. More features, from the personas, PRFAQ and RICE (2 Nov 2026)

**Asked:** "from personas,prfaqs and rice, what more featues do you suggest".

**Agent:** a question, no code change. Suggested six features. Each answers a
gap one of the three documents names, none is in entry 66's list, and each is
scored with `doc/rice.md`'s assumptions (guesses until someone tries them):

- Save a plate for a friend who's away (45).
- The writer hears her desk note was found (45).
- Memories and an inside joke for Rithika's own five (32).
- Adding the house to a phone's home screen (25).
- Writing back from your desk (22.5).
- The best time for all of us on movie night (10).

Checked first:

- Food lasts three days, and desk notes stay (the oldest go in a drawer).
- A desk note's writer never hears it was found.
- Rithika's house has no memories or joke (only made houses do).
- The house has no icon or web app manifest.
- Movie night shows each friend's time and who's asleep, but suggests no
  time. By the five's sleep hours all five are never awake at once; four
  are, 3 pm to 11 pm Canberra time, with Neha asleep.

Dropped two ideas on checking: keeping a note you love (desk and wall notes
are already kept, in a drawer and the memory box), and a per-friend link from
the maker (picking your own name at the door is already easy).

Said the RICE bug batch (A, F, K, L, N) still comes first. Named two calls for
Rithika: the words for her five's memories and joke, and whether "found" is
too close to a read receipt.

**Correction:** none.

**Commits:** this entry's commit.

### 71. Save a plate, write back, all five clocks, the joke on the wall, a home-screen icon (3 Nov 2026)

**Asked:** update the screenshots in PROCESS.md, then build and screenshot:
saving a plate; desk notes kept personal with no passwords, said in
PROCESS.md to be on purpose so the tutor can check and mark it; the inside
joke framed on the memory wall; adding the house to an Android or iPhone
home screen; writing back; and movie night's time picked in anyone's clock,
with every friend's time shown at once and changing one moving the others.
All on a separate branch.

**Agent:** made the branch `plates-replies-home-screen-times` from `main` and
built it there.

- A saved plate is a `dish` whose `item` is `<food>:for:<id>` (ADR 0022).
  It's covered on the counter with a tag in her colour, outlasts the three
  days, and only she can eat it (400 for anyone else, and for saving one for
  yourself). The cook hears "found the plate of dosa you saved her".
- Writing back is a new kind, `reply`, on the writer's desk, with the
  answered note's id in `item`. It quotes her note (cut by characters, so an
  emoji isn't split), is private like any desk note, and is offered once per
  note on your own desk.
- The movie planner has a row per friend, yours first. Only yours is the
  form's `when`; `public/live.js` moves the others with `Intl`, daylight
  saving included, and says who's usually asleep in the server's words. The
  planner became a live part of the page, which fixes RICE row T; its skipped
  test is on again.
- A made house's joke moved into the memory wall's Memories.
- `GET /manifest.webmanifest` (a made house's under its own `/h/<code>/`),
  `apple-touch-icon` and the `apple-mobile-web-app-*` tags. Icons at 180,
  192 and 512 px are cut from house.jpg by `scripts/cut-art.py icons`.
- `scripts/shot.ts` takes `SHOT_JS`, a line of script run before the
  picture; the tour uses it to open writing back and to plan from Neha's row.
- Spec tests for each promise, README, ADR 0022, and RICE rows G and T.

Checked on a throwaway server: real taps on the door's windows, Write back,
the "save a plate for" choices and the planner's rows; the kitchen, desk,
planner and memory wall at 390 px, the kitchen at 820 px with touch, and
desktop. `pnpm check` against a fresh throwaway server: 103 passed, 21
skipped. Retook every screenshot with `scripts/tour.ts`, added two (saved
plates, the planner), and rewrote the captions where the picture had changed
(the door is now 4:42 am in India, not 1 am in New Jersey).

Two things went wrong along the way. The planner's script first wrote
"Rithanya's usually asleep" where the server wrote "She's", so the note
changed wording when a row moved; it now reads the server's words from a
`data-says` attribute. The 512 px icon was 500 KB; it's quantized to 256
colours now (173 KB).

Product calls, named for Rithika to redirect:

- A saved plate never goes off, and can't be taken back.
- You write back once per note.
- The planner starts two hours from now, on the hour.
- The icon is the living room's fire and notes wall.

**Correction:** none.

**Commits:** `74069c4` (features, tests, docs, screenshots), and this
entry's commit. Not merged or pushed.

### 72. The planner any time, for video calls; Esc to see the whole house; ship it (3 Nov 2026)

**Asked:** "nono let the planner be there from anytime, because sometimes we
wanna video call as well, its easier to check times, so this planner can be
used for video calling and all aslo, also make the app website show on
homescreen like locket if you can do". Then, while the agent was working:
in bed in your room, Esc should zoom out to the whole house "no matter where
i am", to see who's moving about; open the live site after; and "make these
changed apply to the house made also, not just the main house. so your tests
should cover everything".

**Agent:** on the same branch:

- The planner is one form (`POST /plan`, ADR 0023) on the Everyone tab and on
  Movies. It starts at the next quarter of an hour and goes anywhere; only a
  time that's gone is refused. It plans a video call (new kind `call`, with
  what it's about) or a movie night, and "Back to now" resets every clock.
  The next call is on the Everyone tab, in each friend's own time.
- Esc, from anywhere on a room's page, zooms the drawing out to the whole
  house and back, without leaving the page, so lying in bed you stay in bed
  and friends keep moving live. A "See the whole house" button does the same
  on touch screens. The first try did nothing: the button was set up before
  `const lookButton` was declared (a ReferenceError that stopped the script);
  moved below it.
- Tests for both houses: the planner's rows from now on both tabs, planning
  a call, movie night from the planner, the room page carrying the whole
  house with you asleep in it (what Esc needs), and in a house for four,
  saved plates, writing back, the planner with that house's own clocks, a
  call, and the room page. `pnpm check` on a fresh throwaway server: 109
  passed, 21 skipped. Esc itself was checked in a browser on both houses
  (Rithika asleep in her room, Sana in The Chai Corner), at 1280, 820 (touch)
  and 390; the button, the "movie night" choice and "Back to now" were
  tapped for real.

**Locket:** not built. A Locket-style widget on the home screen needs an app
from the App Store or Play Store; a web page added to the home screen can't
have one. The web's only home-screen signal is a number badge on the icon,
which would be a count, against the house's no-counts rule, so it's
Rithika's call.

**Correction:** the planner had started two hours ahead, on the Movies page
only; Rithika wanted it from any time and for calls.

**Commits:** the code commit is cited in PROCESS.md's Prompts line, and this entry is in the commit after it.

### 73. Drag through time: a strip of everyone's day, and a clock each (3 Nov 2026)

**Asked:** (sent while CI was deploying entry 72) "keep screen shots and never
delete them, because i can record them as a process.md, now for the planner,
especialy the phone part, i wanna be able to scroll through the time an
dsthen, live on the screen all the other time zones should also update, you
can show a large clock, which shows AM and PM with the hands of it updating
live, or a scroll, that scrolls all the timezones live. it has to be updatted
very very quick, i shouldnt enter a time and wait. choose the best
interactive way to do this".

**Agent:** chose both, with the scroll as the main control:

- Above the rows, a strip with one lane per friend, each lane her own day:
  light for day, dusky for early and late, dark for her usual sleep, a
  line at her midnight, and 12a, 6a, 12p, 6p marked. Drag it with a finger
  or the mouse and time slides under a gold needle. A flick glides on and
  slows to a stop (not under reduced motion). A sideways trackpad swipe, a
  mouse wheel once you've clicked into the strip, and the arrow keys (15
  minutes; an hour with Shift) move it too.
- Beside the needle, each friend's time (with 😴 if she'd be asleep), so a
  phone shows all five at once while you drag, without scrolling.
- Each row has an analogue clock whose hands turn as the time moves, with
  the time, AM or PM and the day beside it. Its face goes dark at night.
- Everything updates on the next animation frame. A real finger drag in
  headless Chrome, read halfway with the finger still down, had already
  moved every clock and field (Rithika's from 3:30 to 5:15 pm, Neha's to
  1:15 am). The strip's lanes are drawn once and slid with a transform, and
  redrawn only every six hours of dragging.
- It's all `public/live.js`: the form still sends only your own row's
  field, so without the script the planner works as before. Typing in any
  row moves the strip; Back to now brings it back.
- `scripts/shot.ts` learned `SHOT_DRAG` (a real finger or mouse drag) and
  `SHOT_DRAG_READ` (read the page mid-drag), to check this.
- Screenshots: nothing is overwritten any more. `scripts/tour.ts` copies
  the set that's there to `doc/screenshots/archive/<when it was taken>/`
  before taking new ones. The set from 10:13 this morning (commit `74069c4`)
  is the first one archived. New shots: 20, the planner mid-drag on a phone;
  21, Esc from bed. Saved as a standing rule in the agent's memory too.

Checked in a browser at 390 (touch), 820 (iPad, touch) and 1280 (mouse), on
Rithika's house and a made house of four. `pnpm check` on a fresh
throwaway server: 109 passed, 21 skipped. The strip is client-only, so the spec
doesn't drive it; the spec already checks what it reads from the page
(each row's time zone and sleep hours, in both houses).

**What went wrong:**

- The first strip sat 150 px left of the needle: `translateX(calc(50% + …))`
  took 50% of the lanes' own width, not the strip's. It now measures the
  strip, and re-centres when the strip resizes.
- On a laptop, the wheel over the strip moved time instead of scrolling the
  page, so scrolling down got stuck there. A vertical wheel now moves time
  only once you've clicked into the strip.
- The iPad's date fields were clipped once the clock took a column; the
  field's column is wider.
- A page-wide MutationObserver to set up a planner swapped in live would have
  fired on the strip's own changes every frame; it listens for
  `house:fresh` instead.
- Entry 72's README edit had left two Movie-time sentences stuck to the Esc
  paragraph; moved back.

Product calls, named for Rithika to redirect:

- The strip moves in five-minute steps, and the keys in quarter hours.
- "Dusk" is before 7 am and from 8 pm; "night" is her sleep hours.

**Correction:** none.

PROCESS.md's body is left alone: Rithika said she'd record the screenshots
there herself. Shots 01 to 19 keep their names, so its pictures are the new
ones; 20 and 21 are new files beside them.

**Commits:** this entry is in the code commit; PROCESS.md's Prompts line,
which cites it, is in the commit after.

### 74. Faces on the time strip, not initials (3 Nov 2026)

**Asked:** "open the live site", then "open that branch, let me check it
first", then "instead of name initials there, becasue they might be similar,
give their avatars maybe?"

**Agent:** opened the live site (the strip isn't on it yet), then ran the
`planner-strip` branch on `localhost:8080` with the local house and
`HOUSE_MAKER=fake`, and opened it. Then:

- Each planner row carries its friend's picture (`data-avatar`, from
  `avatarUrl()`). The strip's left edge shows a round face for each lane,
  her Stitch sticker in Rithika's house or her drawn sticker in a made one,
  cropped like the "Not Rithika?" button and ringed in her colour, with a
  small "You" tag on your own. Lanes are 34 px tall now (were 26) to fit a
  face a phone can read.
- Spec: each row's face is that friend's own sticker (Rithika's house), and
  every row of a made house has a drawn one. `pnpm check` on a fresh
  throwaway server: 109 passed, 21 skipped.
- Checked at 390 by dragging for real, in Rithika's house and in a made
  house of four where Ivy and Isha share an initial: every face loaded.
  The check was run as Neha on a copy of the house, since Rithika was signed in
  on 8080.

**Correction:** Rithika's: initials could be the same for two friends.

**Commits:** this entry is in the code commit; PROCESS.md's Prompts line,
which cites it, is in the commit after.

### 75. Merge it all, ship it, and put the screenshots in PROCESS.md (3 Nov 2026)

**Asked:** "yes merge all the chnages now, and pls update process.md with the
relavant screen shots".

**Agent:**

- Retook the tour on `planner-strip`. It kept the set it replaced (the
  strip with initials, 21 pictures) in `doc/screenshots/archive/2026-11-03-1638/`,
  checked byte for byte against the committed set.
- PROCESS.md's "Overview of the website": shot 20 (dragging through time on
  a phone, faces on the strip) beside 19, a paragraph on dragging, and shot
  21 (Esc from bed) with its own paragraph. The intro says where older sets
  are kept. The door's caption had said India's windows were dark at 4:42 am;
  in the retaken picture it's Neha's, at 12:52 am, so the caption says that.
- Merged `planner-strip` into `main`, pushed, and watched CI deploy it.

**Correction:** none.

**Commits:** this entry and the screenshots; the merge and CI run are named
in the reply.

### 76. A widget like Locket, photos on the memory wall, the planner first on Movies (3 Nov 2026)

**Asked:** "can you make this into sumn i can view on the homescreen, like
locket?". The agent asked which phones and what it should show: Rithika
picked iPhone and Android, and the newest thing a friend left you with
everyone's faces and clocks. While it was building, she added "also, on
memory wall, give the user an option to upload an image, so if sumn reminds
them of the group, they can send an image saying, this reminds me of you
guys", then "in movies tab, i want the time thing to come first and then
suggestions".

**Agent:** on the branch `photos-and-widget`:

- Movies: the planner comes first, before suggesting a movie. Its "suggest
  a movie first" link now goes to the suggestion form (`#suggest`).
- Photos on the memory wall (ADR 0024): a "Pin a photo" form under the
  wall's note form, its caption starting as "this reminds me of you guys".
  It goes up as a polaroid and takes stickers. The picture is kept in a new
  `photos` table in the house's own database; the note is an ordinary
  `note` row with item `photo:<id>`. Read without a library
  (`src/photos.ts`), up to 6 MB, and only real JPEG, PNG or WebP by their
  first bytes. Served only to friends signed into that house. The browser
  shrinks a phone's photo to 1600 px first: a 3024 × 4032 test photo went
  up as 1200 × 1600, 64 KB.
- The widget (ADR 0025): a private link per friend, made on her Everyone
  tab. A widget app reads it as JSON: the newest thing a friend left her (a
  photo first) and everyone's face and clock. Reading it isn't a visit and
  never holds her window. A new link turns the old one off. iPhone: a
  Scriptable script served with her link in it. Android: KWGT's steps.
- Tests, in Rithika's house and a made one: pinning a photo, who can see
  it, refusing a file that isn't a picture; the widget's link, what it
  shows, that reading it doesn't hold her window, wrong and old keys;
  Movies' order. `pnpm check` on a fresh throwaway server: 113 passed, 21
  skipped.
- Checked in a browser at 390: picking a photo and tapping Pin for real
  (scripts/shot.ts learned `SHOT_FILE`), the polaroid, the widget card and
  its button. The Scriptable script was run on a laptop with stand-ins for
  Scriptable's parts, small and medium: it draws the photo, Neha's face and
  words, and five faces with clocks, and tapping opens the living room.
  It hasn't been tried on a real iPhone or in KWGT.
- Screenshots retaken; the set they replace is kept in
  `doc/screenshots/archive/2026-11-03-1654/`. New: 22 (a photo on the wall)
  and 23 (the widget card, its key cut short). The tour's photo is a crop
  of the house's own picture, made by `sips` as it runs.

**What went wrong:**

- The file picker's "No file chosen" made the living room 393 px wide on a
  390 px phone. Found by hiding each new piece in turn; it now shrinks.
- Two leftover throwaway servers held port 8099, so one full run was
  against the older one (same code). Re-run on a fresh server.
- Made-house faces are SVG, which Scriptable can't show; the widget draws a
  friend's initial in her colour for those.

Product calls, named for Rithika to redirect:

- A photo on the widget beats a newer line of words unless the words are a
  day newer.
- There's no way to take a photo down, as with notes.
- Android needs KWGT's Pro key (a few dollars) to read a link.

**Correction:** none.

**Commits:** `183b473` (photos, Movies), `ae63c78` (widget), and this
entry's commit with the screenshots.

### 77. Small pictures on the site itself (3 Nov 2026)

**Asked:** "can we not show the pictures on the website itself? like small
images". Read as: a pinned photo should show small wherever the house
mentions it, not only as the wall's polaroid.

**Agent:** on the branch `photos-and-widget`:

- Updates: a line about a pinned photo has the photo beside it, 44 px, as a
  tiny polaroid, linked to the wall (`happeningItem`, `Happening.photo`).
- The wall on a phone: photos are smaller polaroids, two side by side;
  notes in words still take the whole width.
- The house drawing: the living room's cork board carries up to three of
  the newest photos as tiny tilted polaroids, pinned in each friend's
  colour (`boardPhotos()` in `src/scene.ts`, placed across
  `layout().wallBoard`, so they sit on the board in every house size).
  Checked in Rithika's house and a made house of four.
- Tests: the photo test also checks the Updates thumbnail and the board's
  `g.board-photos`. `pnpm check` on a fresh throwaway server: 113 passed,
  21 skipped.
- Screenshots retaken. New: 24 (photos in Updates). Kept: the set before,
  in `doc/screenshots/archive/2026-11-03-1851/`.

**What went wrong:**

- The first retake showed the living room photo twice on the wall, though
  the second photo was a bedroom. Photos were served as cached for a year,
  and the shot browser's profile still had `/photo/1` from an earlier run,
  when a fresh throwaway house had given that address to a different
  photo. Now a photo is kept a day (ADR 0024 amended, since the branch
  isn't shipped), and the tour clears its browser profile before shooting.
  That retake is kept, per the never-delete rule, in
  `doc/screenshots/archive/2026-11-03-1917/`; it's the one with the
  doubled photo.
- A leftover `--watch` server from an earlier throwaway run kept
  restarting on port 8099, so a run hit it instead of the fresh one. Both
  throwaway processes were stopped and the run repeated.

Product calls, named for Rithika to redirect:

- The board shows the three newest photos, not all of them.
- The thumbnail in Updates links to the wall rather than opening the photo
  big.

**Correction:** none.

**Commits:** `6468e4a` (small photos, the one-day cache), and this entry's
commit with the screenshots.

### 78. Push everything and open it live (3 Nov 2026)

**Asked:** "push everything and open it live".

**Agent:** merged `photos-and-widget` into `main` (`86c9c23`) and pushed
both. CI's `check` and `deploy` passed. On the live site the door and
`/readme/` load, `/photo/1` answers 403 to someone not signed in, and the
read-only spec passes (16 passed, 118 skipped by the throwaway gate).
Opened the live site. No crit cutoff is coming, so no tag was moved.

GitHub's push message still reports 10 Dependabot alerts (3 high, 6
moderate, 1 low), untouched.

**Correction:** none.

**Commits:** `86c9c23` (the merge), and this entry's commit.

### 79. Walking on a phone from either bottom corner (3 Nov 2026)

**Asked** (while entry 78's checks were running): "on the phone, its a
little tricky to move charaters, we need to go to the toggle thingee to move
my person in phone, make it like you dont need to go till there, if i touch
botton left or bottom right corner it should be for moving only, and make it
come in phone in a nice way".

**Agent:** first, CI on `main` had failed after entry 78's log-only commit:
`spec/multiuser.test.ts` ("keeps each house's live news to that house")
heard a `changed` in Rithika's house. Re-running it failed the same way, so
it wasn't luck. A friend whose live page closes is only "gone" 3 seconds
later (`GONE`, `src/live.ts`), and door.test.ts, which runs just before,
closes some; that notice landed in the test's 500 ms window. The test now
waits until its lines have been quiet for 3.5 s before listening. Door then
multiuser passed locally; committed on `main` (`146d879`) and pushed. The
live site had kept running `86c9c23`, which had passed.

Then, on the branch `phone-walk-corners` (`1475dc3`):

- On a touch screen both bottom corners of the house are only for walking
  (`.walk-corner`). A thumb down anywhere in one brings the stick up with
  its middle under the thumb, so landing never walks you; sliding past its
  edge drags it along. Lifting the thumb hides it.
- "In a nice way": each corner is a soft glow with a resting ring; they
  rise in when the house loads, and the stick pops in under the thumb. No
  animation under reduced motion.
- The buttons (Go in, and whatever you're next to) used to sit in the
  bottom-right corner; they now stand just above it. Putting them in the
  middle covered your own sticker, which the phone keeps near the middle.
- The hint says "Hold a corner to walk" on touch screens until you first
  walk, as the keys hint does on a laptop. Laptops are unchanged.
- `scripts/shot.ts` can put a finger down at a point and drag any way
  (`SHOT_DRAG="@x,y dx,dy"`) and take the picture with it still down
  (`SHOT_DRAG_HOLD`). The tour uses it for shot 25.
- Checked with a real finger at 390: a drag from the left corner and from
  the right walked her, the stick under the thumb; a tap on Go above the
  corner went into her room; a tap on Neha's window at the door let her in.
  Looked at a room page, the iPad (touch, 820) and a laptop. `pnpm check`
  on a fresh throwaway server: 113 passed, 21 skipped.
- Screenshots retaken; the set before is kept in
  `doc/screenshots/archive/2026-11-03-2003/`. New: 25 (walking from a
  corner). README, CLAUDE.md and PROCESS.md say how walking works now.

**What went wrong:** the first try put the buttons in the middle, over
Rithika's sticker; moved above the right corner. A tap check through
`shot.ts`'s selector scrolled the page and reported the header over Go;
it was the earlier drag having left her in a hall, where Go is hidden.

Product calls, named for Rithika to redirect:

- Each corner is about 160 × 128 px on the house (140 × 112 in a room), so
  anything drawn there (a bed, Shinzo) can't be tapped in that corner.
  Rooms and hotspots are still reachable by walking up to them.
- The buttons are on the right, above the corner, as before.

**Correction:** none.

**Commits:** `146d879` (the flaky test, on `main`), `1475dc3` (walking,
on `phone-walk-corners`), and this entry's commit.

### 80. How many photos the memory wall holds (3 Nov 2026)

**Asked:** "how many images can you hold on the memory wall".

**Agent:** answered from the code, no change. There's no limit on how
many: every photo is kept for good. What limits it is the Fly volume
(1 GB, `fly.toml`), which made houses share. A photo shrunk by the page
(1600 px JPEG) is usually a few hundred KB, so roughly 2,000 to 3,000 fit;
one sent without the script can be up to 6 MB. The wall shows the newest
24 notes and photos (`WALL_SHOWN`), older ones go into the memory box (all
still shown there), and the house drawing's cork board shows the newest 3.

**Correction:** none.

**Commits:** this entry's commit (no code change).

### 81. The wall starts fresh each month, with a recap; is the widget working (3 Nov 2026)

**Asked:** "okay manybe we can refresh the wall every month and give a
recap whenever the user comes after the refresh, making sure nobody misses
anything. also, is the homescreen thing working".

**Agent:** built the monthly wall on `phone-walk-corners` (ADR 0026):

- The wall shows this month's notes and photos under the month's name.
  Each month before is an envelope in the memory box, newest first, with
  everything that was on the wall, stickers and all. Nothing is deleted;
  only where a note is shown changes. Big news stays pinned whatever the
  month. The cork board in the house picture shows this month's photos.
- The month turns over by the first friend's clock (`monthClock()`):
  Rithika's Canberra, the first to reach the 1st, so the five share one
  wall instead of each seeing a different one.
- A friend coming back after the 1st (not on her very first visit) gets
  a recap of the last month the wall had anything in. Updates shows it
  in full: every note and photo, named, what's new to her marked "new to
  you". A laptop's Home shows a card with the month's photos, and Home's
  news line says "The wall started fresh: here's October". It waits
  however long she's away, until she presses "Put October in the memory
  box" (`POST /wall/recap`, which sets the new `visits.recap` column, the
  only thing it writes). That takes her to the living room with October's
  envelope open. Only a month the wall has had is accepted (400
  otherwise), and the marker never goes back.
- Three new spec tests (the wall resets and keeps every month; the recap
  appears with last month's photo, the news line names October, and it
  stays until put away; an unknown month is refused). `pnpm check` on a
  fresh throwaway server: 116 passed, 21 skipped (the same 21 as before).
- Looked at the recap on Updates and Home at 390, Home's side card at
  1280, the envelope's heading, and the landing after putting it away,
  with a real tap on the button.

On the widget: answered from the live site and the spec, no change. The
server side works: the spec checks the link, what it shows (the newest
thing a friend left you, with her face, and everyone's clocks), that a
wrong key is refused, and that reading it never holds your window; a
made-up key on the live site gets a 404 as it should. But nobody has
tried it on a real phone yet (Scriptable on an iPhone, KWGT on Android),
and the live logs show no widget keys made. The agent didn't make a key
on the live site, which would write into the real house.

**What went wrong:**

- The recap card showed each photo twice (a strip and the lines' own
  thumbnails); the strip is now only on Home's short card.
- "2026" was on every month; the year now shows only for another year.
- The envelope's month was cream on cream, because the drawer's summary
  colour reached it; a more specific rule fixed it.
- The "put away" confirmation vanished at once. It was inside the wall's
  `data-live` region, which `live.js` swaps after taking `?did=` out of
  the address. It went back to the top of the page.
- The jump to `#memory-box` landed under the top bar; it now stops 70 px
  short (`scroll-margin-top`).

Product calls, named for Rithika to redirect:

- Canberra's clock decides when the month turns, for everyone.
- Big news stays pinned across months instead of going in an envelope.
- The recap stays until it's put away, not for one visit or a week.
- Only last month gets a recap; earlier months wait in the memory box.

**Correction:** none.

**Commits:** this entry's commit.

### 82. Push it live, to test on a phone (3 Nov 2026)

**Asked:** "just push it live, then i can test it on my phone".

**Agent:** fast-forwarded `main` to `phone-walk-corners` (walking from
either bottom corner, log 80, the monthly wall and recap) and pushed
`65aaa81`. CI's `check` and `deploy` passed. On the live site the door
and `/readme/` load (the README has the monthly wall), `POST /wall/recap`
without a session is refused with 403, and the read-only spec passes
(18 passed, 119 skipped by the throwaway gate). No crit cutoff is coming,
so no tag was moved. GitHub still reports the same 10 Dependabot alerts,
untouched.

Since it's already 3 November, the live wall now shows only what's been
pinned since the 1st, October is in the memory box, and each friend gets
October's recap on her next visit (not on a first visit ever).

**Correction:** none.

**Commits:** `65aaa81` (what went live), and this entry's commit.

### 83. Walk from the screen's corners, like PUBG; where's the widget (3 Nov 2026)

**Asked**, while log 82 was shipping: "the toggle is malfunctioning in
phone, like in pubg if you see, when ever the user touches the bottom
corners of the screen it is for movement, so it comes, here its not
proper, try that well . on the phone when im in amirdhas room, i cant
access the toggle because its far down, so even now if i touch the bottom
corners of my screen it has to work like a toggle". Then: "please do the
widget thing, how can i even ask the app to do that, where is the option".

**Agent**, on the branch `phone-corners-widget`:

- Walking. On a phone, Home's controls were already fixed to the screen,
  but a room's were drawn at the bottom of the room's picture, which sits
  in the middle of the screen (y 302–414 of 844 in Amirdhavarshini's
  room). Touching the screen's bottom corners there did nothing. Now on a
  phone the corners are the screen's own, fixed just above the tabs, on
  a room's page as on Home, each nearly half the screen wide and 150 px
  tall (more than their glow). The stick is placed on the screen where
  the thumb lands. A quick tap in a corner (under 300 ms, under 10 px of
  movement) goes through to what's beneath it, so a corner over a room's
  buttons doesn't take them away; holding walks. Scrolled down a room's
  page, away from the house, the corners hide. iOS is stopped from
  scrolling or zooming from a corner. iPad and laptop are unchanged.
- The widget. Its option was at the bottom of the Everyone tab, about
  three screens down, behind a button that only gave a link. Now Home
  shows "📱 Put the house on your home screen, like Locket ›" (a line
  under the news on a phone, a card in the side column on a laptop) until
  you've made one. "Put it on my home screen" on the Everyone tab makes
  your widget and shows the iPhone steps opened: Get Scriptable (App
  Store link), Copy your widget's script (one tap), Open Scriptable,
  paste and name it, add the widget. Android has Chrome's Add to home
  screen first, then KWGT.
- A real bug in the iPhone widget: `scriptable.js` used `new URL(...)`,
  which Scriptable (plain JavaScriptCore) doesn't have. The error was
  caught as a network failure, so on a real iPhone it would only ever
  have said "The house couldn't be reached". Addresses are now joined
  by hand (checked to give the same result as `URL` for every address
  the widget uses). The widget spec now runs the script in a bare
  `node:vm` sandbox, with no `URL` or `fetch` and Scriptable's objects
  stood in, against the house: it fails on the old script and passes on
  the new one. It also checks the script is on the Everyone tab to copy
  and that Home's way to the widget goes once it's made.
- `scripts/shot.ts` can tap a point on the screen with a finger
  (`SHOT_TAP_AT`), without scrolling anything into view.
- Checked at 390 with a real finger: holding the bottom-left and the
  bottom-right corners of the screen in Amirdhavarshini's room walked
  Rithika, with the stick under the thumb; a quick tap on "Tidy up"
  through the left corner tidied the room; scrolled down the corners
  hide; Home fits with the new line, and a tap on it lands on the widget
  card; "Put it on my home screen" then Copy ("Copied. Now open
  Scriptable"); the door's windows still let you in. Looked at the iPad
  (820, touch) and the laptop. `pnpm check` on a fresh throwaway server:
  116 passed, 21 skipped.

**What went wrong:** the laptop's link first came out with its emoji on a
line of its own. It was given `side` as a modifier, and `.side` is Home's
side column (a grid). Renamed `in-side`/`in-news`; CLAUDE.md now names
both traps (`.side`, and Scriptable not being a browser).

Product calls, named for Rithika to redirect:

- On a phone each walking corner reaches nearly half the screen's width
  and 150 px up. Only holding there walks; a quick tap is a tap.
- In a room the buttons (Sit, Make Maggi, Go in) stay in the picture's
  corner, not down by the screen's corners.
- The Home line shows until you've made a widget, then goes. It never
  nags elsewhere.
- Not tested on a real iPhone or Android yet: Rithika is trying it on
  her phone.

**Correction:** none.

**Commits:** this entry's commit.

### 84. Where's the widget? (4 Nov 2026)

**Asked:** "queen, what happened to the widget thing i told you".

**Agent:** answered, no code change. The widget work (log 83, `74c44de`
and `5db5757` on `phone-corners-widget`) was built and committed but not
live: the live `house.js` and `style.css` had none of it. The push to
`main` at the end of log 83 was refused by Claude Code's permission check
as a production deploy, since "just push it live" had been given for the
batch before (log 82), and the agent stopped there instead of working
around it. Asked Rithika to say "push it".

**Correction:** none.

**Commits:** this entry's commit (no code change).

### 85. The toggle on the phone still, and the kitchen out of sight (4 Nov 2026)

**Asked:** "in my phone, the toggle is still not fixed / i cant see the
kicthen when im trying to move an avatar".

**Agent:** the toggle fix (log 83) still wasn't live, since its push was
refused (log 84), so Rithika's phone had the old corners. For the
kitchen: on a phone the house is wider than the screen and scrolls
sideways, and it only followed you once you were within 30% of the
screen's edge. Walking from Amirdhavarshini's room toward the kitchen,
the kitchen stayed mostly off-screen until you were in it. Now, while
you walk, the view leads the way you're going, like a game's camera:
you ease to a third of the way in from the side you came from, so most
of the screen is what's ahead. Standing still it behaves as before.
Checked at 390 with a real finger: walking right from Amirdhavarshini's
room, the whole kitchen (stove, kettle, island, shelves) is on screen
with Rithika at x 127 of 390; walking left it runs to the house's edge.
`pnpm check` on a fresh throwaway server: 116 passed, 21 skipped.

Product call, named for Rithika to redirect: the view swings ahead
gently (about half a second), not instantly.

Noticed, not changed: in a hall, the Go in button keeps offering the
last room you were in (`lastRoom` in `house.js`), on purpose ("inside a
wall, the one you just left").

**Correction:** none.

**Commits:** this entry's commit.

### 86. Push it all live (4 Nov 2026)

**Asked:** "pls push all this to live now queen".

**Agent:** fast-forwarded `main` to `phone-corners-widget` and pushed
`f9494f3`: walking from the screen's corners on a phone (log 83), the
widget's way in from Home, its one-tap copy and the fixed iPhone script
(log 83), and the view leading the way you walk (log 85). CI's `check`
and `deploy` passed. On the live site the door and `/readme/` load, the
served `house.js`, `style.css` and `live.js` carry the new code, and the
read-only spec passes (18 passed, 119 skipped by the throwaway gate). No
crit cutoff is coming, so no tag was moved. GitHub still reports the
same 10 Dependabot alerts, untouched.

**Correction:** none.

**Commits:** `f9494f3` (what went live), and this entry's commit.

### 87. The download, the widget asked for on Home, and a widget that keeps changing (4 Nov 2026)

**Asked:** first a paste of the live Home page's HTML source, signed in
as Amirdhavarshini, with no words of her own. Then, mid-turn: "this is
what downloaded on my phone as soon i clicked on the link, why did that
happen? fix it / i want the widget thing to work. when i enter the home
through laptop,phone or ipad, there should be an option asking if i want
the widget on my homescreen, if i say yes, it has to work / the widget
can show memory board, their room, show food or the note preview if
somebody left food for them, it could also be the memory board, pictures
of all the avatars / anything wholesome, it can keep chnaging. it can
show the birthday persons avatar on their birday, prev day aslo. sumn
like this." Asked which phones the five have, she answered "We have
both" (iPhone and Android). Then: "widget can rotatae every time the user
uses their phone, i dont want a lot of battery to be consumed. after this
push the live chnages so i can test on my iphone and mac, later i will
test on android as well".

**Agent:**
- The paste was the new Home page, so the server was current, but the
  walking corners are drawn by `house.js`, which (with `style.css` and
  `live.js`) had no fingerprint and no cache header: a phone was free to
  keep yesterday's copies under today's page. They're now asked for as
  `?v=<fingerprint>` (`own()` in `src/assets.ts`) and kept for good,
  and asked for bare they're `no-cache`.
- The download: the paste is Home saved as a file. Every link on that
  page is an ordinary page link, none marked to download, so the agent
  couldn't find which tap did it from the code. The likeliest cause, an
  iPhone's long-press menu on a link (offering Download Linked File), is
  closer than ever to a thumb now that the bottom corners walk you: the
  tabs sit just under them. Held tabs no longer show that menu; a tap
  still goes. Asked Rithika which link she pressed.
- Home asks (ADR 0027): "Put Five Windows on your home screen?" Yes / Not
  now, a slim band on a phone, a card on an iPad or laptop. Not now is a
  cookie in that browser for a fortnight. Yes makes her link (or keeps
  hers) and opens `/home-screen`: steps for the device she's on first
  (iPhone, iPad, Mac, Android), and "It's working" as soon as her widget
  first reads the house (`visits.widget_seen`). The Everyone tab's card
  now points there.
- The widget's JSON gained `cards`, shown one each time the phone draws
  it: a birthday (that day and the day before, by her clock), the newest
  note or gift on her desk with its words, a plate saved for her, this
  month's wall photos, her room cut from the house's picture with her
  sticker in it (dimmed at night), everyone's faces and clocks, and
  Shinzo. What's pasted is now a few lines that fetch the widget itself
  from the house and keep it, so a fixed widget reaches phones on its own.
- Battery: the house is asked at most every four minutes; every picture
  is fetched once and kept. In the sandbox, the first draw made 3
  requests, the next five 0–3 each (a picture the first time it's shown),
  and the seventh none.
- Checked: phone (390, touch), iPad (820, touch) and laptop (1280)
  screenshots; real taps on Yes, Not now and the Everyone tab at 390.
  `pnpm check` on a fresh throwaway server: 118 passed, 21 skipped.

Corrections the agent made to itself: it first told Rithika Chrome on
Android could add a widget with no app, then checked and said it can't
(only Edge on Windows supports web-app widgets). And it first wrote that
the widget changes "each time your phone shows it", which iOS doesn't
promise; the page now says each time the phone refreshes it, about every
quarter of an hour, as the phone decides.

Product calls, named for Rithika to redirect: not now lasts a fortnight
per browser; the widget stops being offered once it has read the house;
the order of cards is what's for her first, then the wall, her room,
everyone, Shinzo; her own birthday gets a card wishing her; a Mac is
told to put it on the iPhone first, since a Mac shows the iPhone's
widgets.

Not tried on a real phone yet: Rithika is testing on her iPhone and Mac.
Two screenshots she took (the kitchen, the wall's polaroids) appeared in
`doc/screenshots/` and were left as they are, uncommitted.

**Correction:** none from Rithika.

**Commits:** `8323d30`, `c11618f` (PROCESS.md prompts), and this entry's
commit.

### 88. The PRFAQ, personas and RICE again, and more ideas (4 Nov 2026)

**Asked:** "now do the same rice,prfaqs,personas and suggest more ideas for
this app".

**Agent:** rewrote all three for the house as it is on 4 November. Since the
first versions (log 65, 1 November) the house had gained photos on the wall,
the widget and Home's question about it, the monthly wall with its recap,
saved plates, writing back, a planner for video calls, the time strip,
walking from a phone's corners and house names at the door. Checked against
the code first: which skipped bug tests are still open (17; B and T are
fixed), that a birthday wish still carries no words, the caps (3 an hour
each, 30 in all), the volume (1 GB), and what the wall and Updates show (24
and 40).

- `doc/prfaq.md`: the press release now leads with the widget and the
  memory wall's photos; new customer questions on the widget, the monthly
  wall and how many photos fit. The internal FAQ's biggest risk moved from
  "nothing brings anyone back" to the widget being untested on real phones
  and paid on Android.
- `doc/personas.md`: the same five people walked through again, with a
  "was" column. Kavya's gap moved from nothing bringing her back to Updates'
  40-line limit (M); Arjun is the one the widget leaves out (Android, paid
  KWGT); Priya's wrong clocks now break the planner and time strip too.
- `doc/rice.md`: done rows taken off (B, T, Q, R), C halved (the widget
  does most of its job), and new rows AA to AH plus AE. Scores were
  recomputed and sorted by a script after the agent's first table was out
  of order. Top: try the widget on the five's real phones (AE, 144), sealed
  birthday cards (AA, 144; Aswathy's birthday is 8 November), then Home's
  phone line (A, 100).

Ideas named as Rithika's calls: whether a birthday card shows who it's from
before it opens; whether "found your note" is too close to a read receipt;
and whether the five celebrate Diwali (8 November this year, the same day
as Aswathy's birthday), which only she can say. No code change, nothing
deployed.

**Correction:** none.

While this was being written, a photo of Rithika's iPhone home screen
appeared in `doc/screenshots/` (8:28 pm): the widget, small size, showing
"All five of you" with every face and clock. The first run on a real phone.
The three documents were corrected where they said it was untested. In the
small size, the second row's two faces sit at the edges; noted in RICE (AE).
Her photo was left where she put it, uncommitted. (The commit `423614f`
carried only the RICE change; a failed edit stopped the rest, which went in
the next commit.)

**Commits:** `eee8d97`, the PROCESS.md prompt line, and this entry's commits.

### 89. Rithika's own widget, and the same widget in made houses (4 Nov 2026)

Asked: "also pls check the login, when i login as rithika, i want my widget
also to show updates for me, pls check that. make sure all these chnaged
are done to "make your own house" as well. even new users using this app,
need to get the same experience".

**Rithika's widget.** The code already gave each friend her own: the
widget's link carries the friend's id and key, and the spec checked it. The
live logs showed why her phone looked wrong. Amirdhavarshini's widget key
was made at 09:23 UTC and her widget checked in at 09:25. Rithika's key
(made 09:09) has never checked in, and a browser said "not now" as Rithika
at 11:39. So the widget on her iPhone is Amirdhavarshini's: it was set up
while signed in as Amirdhavarshini. Nothing was changed in the data. To make it
plain next time, the widget page now opens with "This is Rithika's widget:
it shows what friends left for Rithika", with her face, and the medium and
large everyone card says "Rithika's window". A new spec checks that a second
friend's widget is hers, with her own link, and without the first friend's
private note.

**Made houses.** Walked through a three-friend house as a new user would
(Ivy in London, Rae in Toronto, Kit in Sydney), at 390 px. Home's question,
Yes, the steps, the cards and live "It's working" were all there already.
What fell short:

- A made friend's face is an SVG drawing, which Scriptable can't open, so her
  widget showed initials and her room card had nobody in it. The widget now
  draws each SVG into a picture once, in Scriptable's hidden web view, and
  keeps it (ADR 0028, superseding one line of 0025). The face route stopped
  refusing made friends.
- The widget page, before Yes (reached from the quiet link after Not now),
  showed an empty box to copy. It now offers "Make my widget" in the iPhone,
  iPad and Android steps, and the link's own section stays hidden until
  there is one. Spec'd.
- "Ivy's" on the whose line broke into columns (flex on bare text); wrapped.
- Desk card: "Rae left you flower" became "left you a flower". A blank city
  no longer reads "in .".

The made-house spec now checks Home asks, the four device steps, the script
carrying the made house's own link, `widget.js` served there, the cards
(desk, wall, room, everyone, dog), the room's sticker being her drawing, and
Kit's widget being Kit's.

`pnpm check` against a fresh `HOUSE_MAKER=fake` server: 118 passed, 21
skipped (the sweep's bug tests). Looked at the made house's widget page at
390 px, signed in as Kit. The SVG drawing step was checked in the widget
sandbox, not on a real iPhone. Not pushed: waiting for Rithika's go-ahead,
along with log 88's documents on the same branch.

**Correction:** none.

**Commits:** `68a3b38`, the PROCESS.md prompt line, and this entry's commit.

### 90. Push it; what came from the RICE, PRFAQ and personas; widget previews (4 Nov 2026)

Asked: "push it and give me the feature updates you did from rice,prfaqs
and personas". While CI was deploying, a second message: "when amirdha puts
a note on my desk, i want a small preview. if theres an update on the
mermory wall i want a small preview on my widget / if amirdha leaves a note
on nehas desk, i dont need a preview, but if food is left on the counter
for me i need to see, but if its a note, it could be private, so dont read
it / but memory wall wont be private. so maybe ask if it can be shown on
the widget before you show. because if its like a nice motivational thing
id love to see it".

**Push.** Fast-forwarded `main` to `product-docs-nov` (`f2aeea1`) and
pushed. CI's check and deploy passed. Live: the door and `/readme/` answer
200, the page asks for the new `house.js` fingerprint, and the read-only
spec passes (19, the rest skipped as writes). No crit tag: crit 10's cutoff
has passed, and later cutoffs aren't tagged.

**What came from the three documents.** Gave Rithika the list, traced
through log entries 65 to 89: RICE B (the house's name at its door) and T
(the planner keeping up live) fixed; Q (photos on the wall) built; R
replaced by the widget; and from the ideas lists in 66 and 70, saved
plates, writing back, the home-screen icon, the planner for calls and the
time strip. Not built yet: the top-scoring rows AE (being done now, on her
phones), AA (sealed birthday cards), A, and the quarter-day bug batch.

**Widget previews** (ADR 0029). Checked first what the widget already did:
a note on her own desk already showed its words, a note on anyone else's
desk never did, and a plate showed only when saved for her. What was
missing:

- The wall showed on every widget without its writer knowing. Now both of
  the wall's forms ask "Show it on friends' home-screen widgets too",
  unticked. The writer can switch it on or off on her own note later
  (`POST /wall/widget`, a new `onwidget` kind); friends see "📱 on
  widgets". The widget's wall card, its `latest` and its photo route show
  only what writers said yes to. Notes from before today stay off until
  their writer turns them on.
- Something new waited for its turn. Now the house says when the newest
  desk, plate or wall card was left, and the widget shows it first, once,
  then carries on in turn. A widget's first draw starts from now.
- Food left out for everyone isn't a card (named as a call she can change).

Spec: one new test for the promise (both forms ask, unticked; a friend's
desk note and an unshared wall note never on her widget; the shared one is;
the newest is marked; only the writer can switch it; off widgets isn't off
the wall; not news). The two widget tests now tick the box. Full check on a
fresh `HOUSE_MAKER=fake` server: 119 passed, 21 skipped (a first run on a
reused server failed only because an earlier run's widget had checked in,
so Home rightly stopped asking). Looked at the forms and Neha's switch at
390 px, a friend's view on a laptop, and tapped Neha's switch for real
(the button was under the finger; her yes was written). Ran widget.js in a
bare sandbox: in turn, the new note out of turn, then back in turn.

On the branch `widget-previews`, not pushed: waiting for her go-ahead.

While this was being written, a second photo of Rithika's iPhone appeared in
`doc/screenshots/` (11:58 pm): the small widget showing the memory wall
card, a photo of her laptop with "i think this works now" under it. The
second card seen on a real phone (AE). Under ADR 0029 that photo goes off
widgets once this is pushed, until whoever pinned it turns it on; she was
told before being asked to push. Her photo was left uncommitted.

**Correction:** none.

**Commits:** `b863836`, the PROCESS.md prompt lines, and this entry's commits.

### 91. Sealed birthday cards, Home's line, made houses' clocks; for made houses too; push (5 Nov 2026)

Asked: a paste of the reply's "From this round" and "Highest-scoring ideas
not built yet" lists (AE's three widget changes; AA, A and D), then "do all
of these and push the live site". While it was being built: "make all these
work for "make your own houses" as well".

Read as: build AA, A and D; ship them with the widget previews from entry 90
(still unpushed on `widget-previews`, which "push the live site" now
covers); and make every one work in made houses, with a spec there.

- **A.** Home's top line counted only things left; the card beside it also
  counted visits. Both now ask `visitorsSince()`, so the line says "Kavya
  came by while you were away" when she left nothing. The skipped test is
  on again, and a new one checks it in a made house (calling `housePage`
  inside one, since a visit only ends after 30 minutes away).
- **D.** The local maker matched places by substring, first in the list.
  Now `zoneFor()` matches whole words, takes the place written first (the
  longer if two start together), and knows far more places: Indiana,
  Western Australia, Dubai, Thrissur, Washington DC and Washington state
  among them. When Claude writes "UTC", the house uses the place the maker
  knows. Skipped test on again, with Bloomington, Indiana and Dubai added.
- **AA** (ADR 0030). A `card` kind: written any time in a friend's room,
  sealed until her next birthday by her own clock (`nextBirthday()`: today
  on the day, 28 February for a 29 February birthday in other years). Two of
  Rithika's calls from RICE, made by the agent and named: before the day she
  sees who wrote, never the words; nobody else reads a card. Updates tells
  only her; her widget says cards are waiting, and new ones go first. Past
  years' cards stay hers in a drawer. Spec in Rithika's house (sealed, and
  who reads it) and in a made house (sealed for one friend, open for another
  whose birthday is today, and the widget).
- **Made houses.** The widget previews' rules (a friend's desk note and an
  unshared wall note stay off; the newest thing goes first) added to the
  made-house widget test.
- RICE, PRFAQ and personas updated: A, D and AA off the table, AE partly
  done; Arjun's and Priya's gaps closed.

Full check on a fresh `HOUSE_MAKER=fake` server: 124 passed, 19 skipped (two
fewer skipped). Looked at the card as its writer and as Neha at 390 px, and
tapped Seal for real (the button is what's under the finger; a blank tap
stays put, the box being required). `nextBirthday()` tried on Aswathy's
8 November, today, a birthday just gone and 29 February.

Pushed: `main` fast-forwarded to `b1a42fb`; CI's check and deploy passed.
Live: the door and `/readme/` answer 200, the README has the cards, the page
asks for the new `style.css` fingerprint, and the read-only spec passes (21).
Houses made before this keep the clocks they were made with; the fix is for
houses made from now on.

**Correction:** none.

**Commits:** `51511dd`, the PROCESS.md prompt lines, and this entry's commits.

### 92. More features: six picked, built and pushed (5 Nov 2026)

Asked: "more features". The agent checked what the widget and house
already did, then asked with two lists of four. Rithika rejected the
question ("nono ask again, i loved the ideas"), and on the second asking
picked leave the light on, on this day, the next call on the widget, a line
under a photo, a made house's own dog and page, and tell them I was here.
Not picked: Diwali lights and "found your note". While building: "push it
live", then (after a check without a verdict held up writing the ADR)
"try now, continue".

All six are in ADR 0031, each in Rithika's house and made houses:

- **The light left on:** a `lamp` row; lit while it was left after her
  "new" began (`store.newSince()`), so she comes home to it and it's out
  the visit after. A desk hotspot and a room button; her room and Updates
  say who.
- **On this day:** `onThisDay()` in `src/house.ts`, by her clock, the
  longest ago first, never this month; on Home's side column, Updates and
  the widget (the widget only what writers shared).
- **The next call on the widget:** a `plan` card, the sooner of a call or
  movie night, in her own time.
- **A line under a photo:** a `caption` row, one each, newest wins; the
  photo's writer hears it.
- **A made house's dog and page:** "What's the house dog called?" on the
  form (`dogName()`, Shinzo when blank or older); `aboutHousePage()` instead
  of the README. RICE E's skipped test is on again.
- **Tell them you were here:** Home and Updates, once you've done something
  this visit, say what you did (newest first), never what you wrote; Share
  or Copy in `public/live.js`.

Found while looking at Updates at 390 px: the page was 587 px wide. Long
unbroken words (a test's ids) didn't wrap, and the list's grid column grew
to fit them. `overflow-wrap: anywhere` and a `minmax(0, 1fr)` column fixed
it; the page is 390 px now. The house picture, the tell-them card and a real
tap on "Leave the light on" (the button was under the finger; the row was
written) were checked at 390 px.

Full check on a fresh `HOUSE_MAKER=fake` server: 131 passed, 18 skipped
(one fewer skipped: E). One run failed first because the message listed the
oldest five things; it lists the newest now.

**Correction:** the first feature question was rejected and asked again,
unchanged.

**Commits:** `2afa797`, the PROCESS.md prompt lines, and this entry's commits.

### 93. A phone on its side; the widget question on every browser (5 Nov 2026)

Asked: a photo of Rithika's phone held sideways, with "right now we cant
even see the toggle, i want you to force only landscpae for phone because
you can see the house only then, and make the toggle visibile no matter
where i am.The toggle should be there on the bottom corners of my screen
not the page. fix this and push it live". While it was being built: "also,
amirdha tried from her laptop and her phone, she uses windows and android
she says she didnt get the pop up thingee i got for downloading the widget.
fix the issue". Then a keepsake box (entry 94).

**Why the toggle was missing.** Sideways, her phone is about 932 × 430, so
it got the laptop layout: the walking corners sit on the picture
(`position: absolute`), and the picture was a card mostly below the screen.
Only under 700px wide were they the screen's own.

**What was built** (ADR 0032): a layout for a short touch screen in
landscape. A slim bar with the tabs; the house, or a room, fills the rest;
the walking corners are fixed to the screen's bottom corners on every page
with the house and never step aside; the buttons sit between them. Held
upright, the house's pages show "Turn your phone sideways" (the door, make
form, README and widget steps stay readable). A page can't lock rotation on
an iPhone, so that's the "force"; the manifest asks Android for landscape
from the home screen. `scripts/shot.ts` gained `SHOT_HEIGHT` to emulate a
phone on its side.

**Amirdhavarshini's question.** Home stopped asking once any widget of hers
had looked in, and hers was set up on Rithika's iPhone on 4 November, so
her own Windows laptop and Android never asked (the live logs only reach
back a few hours, and show her using the house, nothing about the widget).
Now each browser is asked until that browser says Yes (kept a year) or Not
now (a fortnight); a widget working elsewhere only changes the words ("on
this screen too?"). Windows is told the widget lives on a phone, with
Android's steps first. On a sideways phone the question is one slim line
above the house.

Checked at 932 × 430 with touch: Home, a room, a room scrolled to its cards
(both corners still on the screen), the question above the house, and a
real tap in the bottom-left corner (on top is `div.walk-corner.left`);
upright at 390 px, the turn notice. Full check on a fresh server: 133
passed, 18 skipped. Two specs added (the sideways promise and the manifest;
each browser asked); one changed to the new rule.

**Correction:** none.

**Commits:** `397f8b1`, the PROCESS.md prompt lines, and this entry's commit.

### 94. A keepsake box, a TestFlight app, then neither (5 Nov 2026)

Asked, while entry 93 was being built and shipped:

- "i also want like a diary or memory box thing, for each avatar. for
  example i like the birthday card neha wrote for me, i should be able to
  save it and revisit later. if i like sumn from memory wall, i should be
  abke to save a copy of it. if the memory is exceeding, give the user an
  option to save it to their devices and delete a few. make these chnages
  for the made houses also"
- "also, make it into a testflight app for now, for android also sumn like
  that"
- "then push everything to live, i want it to work amazing on testflight"

**Agent:** finished and shipped entry 93 first (live and checked), then
asked about the app: TestFlight needs a paid Apple Developer account and
Xcode, and Android a Play account, which the agent can't sign up for.
Rithika answered "nvm, lets j do website for now". The agent said it would
build the keepsake box next ("keepsake box", so it isn't confused with the
wall's memory box, in her own room, 30 keepsakes, download when full), and
Rithika answered "noo lets skip that, omnly a good, well designed website".
The empty `keepsakes` branch was deleted; nothing was written for either.

**Correction:** both the TestFlight app and the keepsake box were called
off before any code: the website only, done well.

**Commits:** this entry's commit; the live site is at `d6976a7`.

### 95. The house as an app on a phone (5 Nov 2026)

Asked: "buid a webapp of this that renders like a mobile app in phone,so
even distribution becaomes easy / same applies for make your owb house as
well" (after the TestFlight app and keepsake box were called off, entry 94).

Read as: no store app; make the website install and spread like one, for
every house. Built (ADR 0033):

- `/app` for each house, open to anyone with the address: icon, name and
  who it's for; Install, shown only when the browser offers it
  (`beforeinstallprompt`); Share and Copy; a QR code of the house's
  address, hidden on phones; steps for iPhone, iPad, Android, Windows and
  Mac, the one you're on first. Linked from the door and every footer.
- `src/qr.ts`, a QR encoder written here (byte mode, level M, versions
  1-10) so the house keeps one runtime dependency. Four codes from 21 to 53
  modules read back exactly with OpenCV, and so did the one on the rendered
  app page.
- `public/sw.js`, served at each house's `/sw.js` with its base written in,
  `no-cache`: keeps art and fonts, never a page; offline, `/offline`. Checked
  in headless Chrome: registered at the house's scope, controlling the page,
  the house drawing all five.
- The manifest gains an `id` and shortcuts; the installed app reaches under
  the notch and doesn't bounce.
- A made house's ready page: Share, Copy, a QR code and its app page.

Looked at `/app` on a laptop and at 390 px (the Install button first had no
style of its own; fixed). Full check on a fresh server: 135 passed, 18
skipped; two specs added (Rithika's house, a made house).

**Correction:** none.

**Commits:** `2e3c9d2`, the PROCESS.md prompt line, and this entry's commit.

### 96. "as rithika why am i getting that widget?" (5 Nov 2026)

Asked: a screenshot of Rithika's iPhone at 10:17 am (the small widget:
"Rithika left you a flower", with the note's words, 19 hours ago), and "as
rithika why am i getting that widget?".

**Agent:** a question, no code change. The desk card only ever shows a
note on the widget owner's own desk, written by someone else
(`widgetCards()`, `desk(v.things, v.me.id)`, author not her), so a card
saying "Rithika left you" can't be on Rithika's widget: it's the widget of
the friend Rithika left the flower for. Entry 89 found the widget on her
iPhone is Amirdhavarshini's (made and first looked in on 4 November while
signed in as her); this fits. The small size never says whose widget it is
(only the medium and large everyone card does), which is why it looked like
hers. Told her how to get her own, and offered to put the owner's name on
every card. Didn't read the live database to check whose desk it was: that
would mean reading what friends wrote.

**Correction:** none.

**Commits:** this entry's commit.

### 97. "suggest me ways to login as only rithika" (5 Nov 2026)

Asked: "nono, dont have to add a line, but suggest me ways to login as only
rithika, idk why im making the mistake of loggin in as some other person
everytime" (declining entry 96's offer of the owner's name on every widget
card).

**Agent:** suggestions, no code. Three likely causes: "Come in as" on each
row of Everyone (one tap, no question), testing the house as friends in the
same browser, and the bar's face and "Not ___?" looking the same at a
glance. Three things she could do without code: a separate browser for
testing as friends, the house on her home screen added while signed in as
herself, and a look at the bar before setting anything up. Four changes:
A, "This is my phone, I'm Rithika" puts her window first at the door; B,
"Come in as" on Everyone asks first; C, a brief "Hi Rithika 👋" on arrival;
D, take "Come in as" off Everyone. Suggested A and B together.

**Correction:** none.

**Commits:** none of its own; it led to entry 98's.

### 98. "i like C", then "push it live" (5 Nov 2026)

Asked: "i like C"; then, while the agent was writing the ADR, "push it
live".

**Agent:** built C for Rithika's house and made houses (ADR 0034). Coming in
as anyone, at the door or with "Come in as" on Everyone, redirects to
`/?hi=1`. Home then shows a card under the bar: her sticker, "Hi Rithika
👋", and "Not you? Change", which posts to `/leave` and lands on the door.
The script fades it after 4.5 s (or on a tap), takes `?hi=1` out of the
address, and skips the fade under reduced motion; a live re-fetch never
carries it. Two specs (Rithika's house, a made house). Looked at it on a
laptop and a phone on its side, and tapped "Change" for real (under the
finger: `button.link`, then the door). Merged to main and pushed (with
entry 96's commit); CI's check and deploy passed. Live: the door, `/readme/`
and `/app` load, the read-only spec passes (24 passed, 131 skipped), and the
live `live.js` and `style.css` carry the greeting. Didn't sign in live as a
friend to see it, since that would hold her window and record a visit.

**What went wrong:** the full check failed twice. The greeting test's
friend was still held by another test (409), so it signs out first and uses
Aswathy. A run now makes more than the maker's 30 houses an hour (429), so
the cap reads `MAKE_CAP` on a test server; CI's container sets 100, and Fly
doesn't set it. After both fixes: 137 passed, 18 skipped. The first draft
of ADR 0034 described options A, B and D wrongly from memory; checked
against the transcript and fixed before committing.

**Correction:** none.

**Commits:** `272a413`, the PROCESS.md prompt lines, and this entry's commit.

### 99. What's left for an amazing grade; RICE, PRFAQ and personas again (7 Nov 2026)

Asked: "now i want you to look at the entire project, and the final
assignment spec / tell me wehat i should do more to get an amazing grade";
while that was being read: "also for the project, do rice,prfaqs and
personas and come up with more chnaged from the prev prompt / after both of
this give me a final message telling me mopre improvements for proj marks
wise and projects wise".

**Agent:** read the final project brief, its spec and the assessment page
from the course site (due noon 9 November; process 50%, deployed app 25%,
response 25%; README 400–600 words, PROCESS.md 900–1100, reflections
150–300 each). Read README.md, PROCESS.md, the reflections, the spec and the
three product documents, ran `pnpm check:evidence` (passes, with a warning
that `reflections/crit-11.md` isn't a name the sweep reads), and checked the
live door and `/readme/` (200). Then looked at the house as the marker
will, on a throwaway copy of `./data` on port 8093 with `HOUSE_MAKER=fake`:

- **At 390 × 844 with touch (the marking phone viewport), Home shows only
  "Turn your phone sideways"**, white on the pale sky. The rule (ADR 0032,
  log 93) covers Home, rooms, Updates, Everyone, Movies and UNO on any touch
  screen held upright at 600 px or narrower, and the spec asks for it
  (`spec/door.test.ts`). The same page with touch off shows the upright
  house working underneath. The live stylesheet has the same rule. The door
  is fine upright.
- At 1920 × 1080 the house, its side column and hotspot buttons are fine.
- A live page whose connection drops for under two minutes reconnects
  without catching up: the server sends nothing on her return, since she was
  held as "here" all along, and `public/live.js` doesn't fetch on reopen.

RICE gained AI to AO (AI, the upright phone, scores 300 and goes first; AJ,
catching up, 80; an accessibility spec, AM, and a spec for two friends at
once, AL, 36 each; Shinzo waiting at your door, a door that says when every
window's taken, and a guest book for showcase visitors, as Rithika's calls).
Scores rechecked by a script. Personas and PRFAQ walked through again for
what shipped on 5 November and for AI. No code changed: AI reverses part of
"force only landscape", so it's Rithika's call.

The reply's marks advice, briefly: the documents the brief marks are the
weakest part of the submission against the rubric. README.md is about 5,300
words against 400–600, cites no sources, and doesn't say which claims are
enforced and which judged; PROCESS.md is about 1,800 words before its
Prompts section, with half-finished notes in it, no case for the stack
against alternatives, and no account of the agent workflow (subagents,
worktrees); the reflections are about 60–110 words each against 150–300,
and crit-11.md repeats crit-10's second answer. The brief advises Rithika
drafts README.md and PROCESS.md herself, so the agent listed what each
needs rather than writing them.

**Correction:** none.

**Commits:** `0ce7d7b`, the PROCESS.md prompt lines, and this entry's commit.

### 100. "yes do all that" (7 Nov 2026)

Asked: "yes do all that", to the end of entry 99's reply ("Should I fix the
phone and merge and push the docs branch?") and its suggested order.

Read as: build everything the agent offered to (the upright phone, AJ, AL,
AM, F, K, L, N, an evidence table for PROCESS.md), and merge, push and check
live. README.md, PROCESS.md and the reflections stay Rithika's to write; the
agent changed only README lines the code made untrue.

- **AI** (ADR 0035, superseding 0032's cover). Upright touch screens at
  600 px or narrower get the upright house, with "📱 Turn your phone
  sideways for the whole house." in a 28 px line under the bar on Home and
  rooms, and the map's height takes it off so the page still fits the
  screen (the first try ran 29 px past 844). Sideways and the manifest's
  landscape are unchanged. The spec now promises nothing covers an upright
  phone's page. Looked at 390 × 844 with touch: Home, the living room, a
  real tap on Aswathy's window at the door (landed on Home with "Hi
  Aswathy 👋") and on the Updates tab; and at 932 × 430 sideways (no line,
  as before).
- **AJ.** `public/live.js` fetches the page on every open of its line after
  the first. `spec/live-client.test.ts` runs the served script in jsdom with
  a stand-in EventSource, drops the line and brings it back; it was run
  against the old script and failed there.
- **AM.** `spec/access.test.ts`: lang, title, one `main`, alt text, a name on
  every button, link and field, and unique ids, over the door's five pages
  (read-only, so it runs live too) and fourteen pages inside. Every page
  passed first time, so a made-up bad page was run through it to see it
  catch each problem; Home alone has 6 buttons, 23 links and 6 pictures.
- **AL** was already in the spec, from the 21 October sweep: five friends
  eating one dish at once, a hug both ways at once, a double-tapped UNO
  move, five walking at once, twenty browsers at one window. The agent had
  scored it as missing in entry 99 without searching the spec; corrected in
  RICE rather than adding a duplicate.
- **F, K, L, N**, their skipped tests on again: the Updates dot asks what
  Updates lists; the Everyone tab shuts "Come in as" for a friend who's in
  ("Neha is in", disabled and dashed, like her window at the door); every
  kettle batch still out shows its note with whose; planting waters a
  seedling in. That last one means planting perks up the whole garden: the
  agent's call, named in RICE.
- `CLAUDE.md`: the marking viewports, and that nothing may cover a whole
  page on an upright phone; a dropped line catches up; client scripts are
  checked in jsdom, and a new check is seen to fail first; the
  accessibility floor's page list.
- `doc/harness-evidence.md`: where each correction landed, with commits,
  for Rithika's PROCESS.md. Every hash checked. The first draft said
  Claude's room drawings were dropped for not being good enough; ADR 0020
  says they never ran live, so that row was corrected before committing.

Full check on a fresh `HOUSE_MAKER=fake` server: 145 passed, 14 skipped (12
known bugs, 2 that need an unreachable maker), from 137 and 18.

**Correction:** none from Rithika. The agent's own: AL scored as missing
when it wasn't, and a wrong reason in the evidence table's first draft.

**Commits:** `df68a9c`, `36478fd`, `1a27d10`, the PROCESS.md prompt line,
and this entry's commit.

### 101. "use the green space on either side for these button only on phones" (8 Nov 2026)

**Asked:** Rithika pointed at her screenshot `doc/screenshots/Five Windows
2.png` (her iPhone on its side): "here you can see that the screen is
blocked by the buttons like "leave sumn on rithanyas desk" leave light on
for rithanya / maybe we can use the green space on either side for these
button only on phones to make it better. do you have anymore ideas?"

**Done:**

- `public/house.js` measures the garden green beside the picture on a
  sideways phone (`sides()`); where there's at least 120 px a side, the
  buttons stack in the right-hand green above the walking corner, Go in at
  the bottom, and any that would rise above the house move to a second
  column on the left (`balance()`). ADR 0036.
- Looked at 844 × 390 by Rithanya's desk (her room clear) and in the
  kitchen (five buttons, split both sides; the first version ran off the
  top there, which is what `balance()` fixed). A real tap on a side button
  went to `/room/4`. Not active on an iPad (820, touch), on a room page,
  upright at 390, or at 1920.
- Ideas answered in the reply at the end of the session (entry 102).

**Correction:** none.

**Commits:** `5dd9db1`.

### 102. Drawings and voice notes; "Skip chat for now" (8 Nov 2026)

**Asked:** Rithika selected the "Not scored" line in `doc/rice.md`
("Drawings, voice notes and real-time chat. Possibilities in `CLAUDE.md`,
not candidates until someone shows they'd make five people feel closer")
with "wait can we do this? do it if its possible". The agent asked about
chat, since it's the one thing `CLAUDE.md` says the house isn't; she picked
"Skip chat for now".

**Done (ADR 0037):**

- A drawing for a friend's desk: a sheet of paper in `public/live.js` with
  seven pens, a rubber, Undo and Clear, finger, pen or mouse. It's sent as
  the form's own file (a PNG), so without the script the field takes a
  picked one. Only she and its writer see it; anyone else sees "A folded
  drawing for Neha". A drawing can go on the wall too, like a photo (shown
  whole, with stickers and a line under it).
- A voice note for a friend's desk, recorded in the page (up to a minute),
  listened back to and left; without a microphone the same field picks a
  recording. Kept in a new `sounds` table. As private as a desk note.
- `/drawing/:id` and `/voice/:id` answer only her and its writer (404 for
  anyone else, 403 for nobody signed in). The house knows a file by its
  first bytes: PNG for a drawing, WebM, Ogg or MP4 for a voice note.
- Updates names them ("left a drawing on your desk", "pinned a drawing on
  the wall", "stuck ❤️ on your drawing"); the widget names a drawing or a
  voice note on her desk but never carries it. Writing back works on both.
- Two spec tests. The privacy one was run against a server with the check
  taken out and failed on "/drawing/4 for a third friend: expected 200 to
  be 404", then passed with it back.
- Looked at, at 390 × 844: the drawing card (a finger drag inked the paper;
  a real hit-tested press of "Leave it on Neha's desk" sent it), the voice
  card, Record with no microphone (the message, then the file field), Neha's
  desk as Neha (the drawing and a player) and as Aswathy (folded). At 1920:
  the card in a room's side column, and a drawing of a sun pinned on the
  wall beside a photo.

**What went wrong on the way:**

- The first look showed Undo and Clear as cream on cream: `.compose button`
  (the send button's colours) matched every button in the card, because
  `compose` was on the `<details>`. Moved onto the form, and the pad's
  buttons given their own.
- Aswathy's browser got the drawing (200) in the first look. It was the
  screenshot script's shared Chrome profile, which had kept the file from
  Neha's run; curl and the spec, with no cache, got 404. The spec now holds
  the line.
- With no microphone, showing the file field made the phone page 393 px
  wide. The field had only `max-width`; it got the photo field's `width:
  100%; min-width: 0; overflow: hidden`, and the page is 390 again.
- Two small fixes found while reading: the widget would have said "left you
  a note" for a drawing, and a sticker on a drawing would have said "your
  photo".

Full check on a fresh `HOUSE_MAKER=fake` server: 147 passed, 14 skipped
(the same 12 known bugs and 2 that need an unreachable maker), from 145.

**Correction:** "Skip chat for now", in answer to the agent's question.

**Commits:** `18e9bbc`, the PROCESS.md prompt lines, and this entry's commit.

### 103. "the buttons are still covering the entire screen", and the widget's room (8 Nov 2026)

**Asked:** with `doc/screenshots/defect_buttons.png` (her iPhone in Chrome,
on its side, standing on Amirdhavarshini's mat, three wide buttons over the
house): "the buttons are still covering the entire screen.use the green
spcaes on either side, maybe make the messages smaller on hpone, could me j
an emoji or a single word,emiji or single word, do whats best". While that
was being built: "the widget in my phone has some defect, im logged in as
rithika. because when i tap on the widget and go tot the web browser, im
rithika / but the widget says "your room" and shows amirdhas room, fix that".

**Why 0036 missed it:** Chrome keeps its address bar on a sideways iPhone,
so the page is about 844 × 346, not the 844 × 390 the agent had checked,
and the green is about 115 px a side. ADR 0036's threshold was 120, so the
side columns never came on. The agent had only looked at Safari's shape.

**Done (ADR 0038):**

- Every action has a one-word `short` ("Sleep", "Light", "Leave", "Maggi",
  "Water"); a dish is its own name ("Biryani"), since three plates out read
  as three "Eat"s in the first look; Go in is "🚪 Neha's", "🚪 Kitchen",
  "🚪 Yours". On a touch phone, either way up, that's what a button shows;
  the sentence is hidden from sight but kept as its name and `title`. An iPad
  and a laptop keep the sentence.
- The columns in the green need 72 px now, at most 132.
- Looked at 844 × 346 sideways on the mat (her screenshot's spot: "Sit" on
  the left, "Maggi" and "🚪 Amirdha…'s" on the right, the house clear) and
  at the stove (five buttons, both sides); at 390 × 844 upright (a narrow
  column at the side); a real tap on a short button (hit its word, went to
  the kitchen); full sentences at 1920 and on an iPad at 820.
- **The widget:** the house's room 1 and room 3 are right, and the widget
  draws whichever friend owns its link. A widget is one friend's for good;
  the one on her phone was made while she was in as Amirdhavarshini (as in
  entry 97), and signing in to the browser as Rithika doesn't change it. Its
  room card now says "Amirdhavarshini's room" instead of "Your room", so a
  widget always says whose it is. The fix for her phone is to paste her own
  script again from Home's Yes as Rithika. A spec line holds it, seen to fail
  on "Your room" first.
- The agent tried to read the live database to see whose widget had checked
  in; the permission was refused, and the agent went on from the code.

Full check on a fresh `HOUSE_MAKER=fake` server: 147 passed, 14 skipped.
(An earlier run on a reused data folder failed two widget tests that expect
a fresh house; the fresh run passed.)

**Correction:** Rithika's: the buttons still covered the house. The
agent's own: 0036's threshold was set from one browser's shape.

**Commits:** `2f29ce6`, the PROCESS.md prompt lines, and this entry's commit.
