# Five Windows: RICE

What to build next, ranked by **(Reach × Impact × Confidence) ÷ Effort**.
The candidates are the bugs from the 21 October test sweep that are still open
(each has a skipped test in `spec/` that passes once it's fixed), the ideas
raised in [prfaq.md](prfaq.md) and [personas.md](personas.md), and new ideas
from what's been built since. Scored on 4 November 2026 and rescored on
7 November, two days before the final project is due (9 November, noon).
Letters are fixed IDs that the personas refer to, so they stay put if the
scores change; new rows start at AA, and this round's at AI.

## Done on 7 November, the same day

After the review, Rithika said "yes do all that". Off the table:

- **AI.** An upright phone gets the house, with one line under the bar
  saying the whole house is there sideways (ADR 0035, superseding 0032's
  cover). Checked at 390 × 844 with touch: Home, a room, a real tap on a
  door window and on the Updates tab.
- **AJ.** A live page fetches itself again whenever its line opens after
  the first time. A new spec runs the served `public/live.js` in jsdom and
  drops the line; it fails on the old script.
- **AM.** `spec/access.test.ts`, the accessibility floor over every page,
  at the door and inside. Every page passed first time; a made-up bad
  page shows it catches each problem.
- **AL** was already there. The 21 October sweep wrote it: five friends
  eating one dish at once, a hug both ways at once, a double-tapped UNO
  move, five walking at once, and twenty browsers pressing the same window.
  Scoring it as missing was the agent's mistake, from not searching the
  spec first.
- **F, K, L and N.** Their skipped tests are on again and pass: the Updates
  dot asks what Updates lists; the Everyone tab shuts "Come in as" for a
  friend who's in, like the door; every kettle batch still out keeps its
  note, with whose; and planting waters a seedling in, so a garden is
  thirsty two days after the later of the last watering and the newest
  planting. (That also means planting perks up the whole garden: the
  agent's call, in keeping with plants never being punished.)

## What changed since 5 November

Built, and not rows here: a layout for a phone on its side, with the walking
corners on the screen's own corners (ADR 0032); the house as an app, with an
app page, a QR code and a kind offline page (ADR 0033); and "Hi Rithika 👋"
with "Not you? Change" as you come in (ADR 0034). Called off before any code:
a keepsake box and a TestFlight app ("noo lets skip that, omnly a good, well
designed website", log 94).

New rows, AI to AO, come from reading the house the way the final project's
marker will: only the address, two Chrome profiles, one at 1920 × 1080 and
one at the iPhone preset (390 × 844), and the brief's top band ("holds up
under use it wasn't designed for": two people at once, a slow connection,
the keyboard). Two of them are bugs found by looking:

- **AI.** On a touch screen held upright at 600 px or narrower, every page
  inside the house (Home, rooms, Updates, Everyone, Movies, UNO) is covered
  by "Turn your phone sideways". That's the marking phone viewport. A
  screenshot at 390 × 844 with touch on shows only the notice, its white
  words on the pale sky behind it; with touch off, the upright house
  underneath works (the house, the hotspot buttons, the tabs). The spec
  asks for the notice (`spec/door.test.ts`, "an upright phone isn't asked to
  turn").
- **AJ.** A live page that loses its connection for less than the two-minute
  hold reconnects (the browser retries every 2 s) but doesn't fetch the page
  again, so whatever friends did meanwhile only shows after the next change.

## What changed between 1 and 5 November

Done, and off the table:

- **B.** A made house's name is on its door and on every page (1 Nov).
- **T.** An open Movies page's planner keeps up with friends' suggestions (3 Nov).
- **Q.** Photos on the memory wall (ADR 0024, 3 Nov).
- **A.** Home's line on a phone names who came by, even if they left
  nothing, in Rithika's house and made houses (5 Nov).
- **D.** A made house's clocks: whole words only, the place written first
  wins, and more places known, so Indiana, Western Australia and Dubai keep
  the right time (5 Nov).
- **AA.** Birthday cards, sealed until her day (ADR 0030, 5 Nov).
- **AC, AB, C, O and E** (ADR 0031, 5 Nov): leaving the light on, a line
  under a photo, a message to send the group yourself, a made house's own
  dog, and its own about page. Also new: on this day, and the next call
  on the widget.
- **AE**, in part: each widget says whose it is, made houses get faces and
  rooms on theirs, what's new for you shows first, and the wall reaches
  widgets only when its writer says (ADR 0028, 0029; 4 and 5 Nov). Still
  open: the other cards and sizes on real phones.
- **R** is replaced by the widget, which does its job (bringing friends back)
  without email, a schedule or a new dependency (ADR 0025, 0027).
- From the feature lists in log 66 and 70, and not rows here: saved plates
  (ADR 0022), writing back, the home-screen icon, the planner for video calls
  (ADR 0023), the time strip, and the monthly wall with its recap (ADR 0026).

C dropped because the widget does most of its job. D rose because the
planner and time strip now show the wrong clocks as well.

## How each number is scored

**Reach**: people affected in a typical month. No live counts were read for
this, so every reach comes from one assumed population; replace it with real
counts and re-sort:

- Rithika's five, plus about ten made houses in use with about four friends
  each: **about 45 people**.
- **About 10 people a month** make a house.
- **About 25** of the 45 come in on a phone; guessing half are iPhones, **about
  12 on Android**.

**Impact**: how much it moves the test in `CLAUDE.md` (friends feel closer,
the core loop holds, coming back is worth it): 3 massive, 2 high, 1 medium,
0.5 low, 0.25 minimal.

**Confidence**: how sure the reach and impact are. 100% for a bug a failing
test shows, when how often it happens is clear; 80% for a known problem
whose size is a guess; 50% for an idea nobody has tried.

**Effort**: days of work with the agent, including the spec test and looking
at it at phone, iPad and laptop widths. 0.25 is the smallest. A bug with a
skipped test is mostly done once that test passes.

## The ranking

| ID | Change | Kind | Reach | Impact | Conf. | Effort | Score |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| AE | Try the widget on the five's real phones, and fix what breaks | check | 45 | 2 | 80% | 0.5 | **144** |
| AD | The writer hears her desk note was found, once, without a time | idea | 45 | 0.5 | 50% | 0.5 | **22.5** |
| AO | Shinzo waits at your door with what's new for you | idea | 45 | 0.5 | 50% | 0.5 | **22.5** |
| G | A front door key for each house, so desk notes and photos are private | idea | 45 | 1 | 80% | 2 | **18** |
| H | UNO deals a friend in after she's left the house | bug | 8 | 1 | 100% | 0.5 | **16** |
| I | The live house maker waits up to about 40 s on a Claude it can't reach | ops | 10 | 0.5 | 80% | 0.25 | **16** |
| AK | With every window taken, the door says so and offers somewhere to go | idea | 10 | 0.5 | 80% | 0.25 | **16** |
| AF | A free widget for Android: the house's own picture, refreshed | idea | 12 | 1 | 50% | 0.5 | **12** |
| J | A question on the wall now and then, for anyone to answer | idea | 45 | 0.5 | 50% | 1 | **11.25** |
| M | Updates stops at 40 lines, and its "more" link leads back to itself | bug | 10 | 0.5 | 100% | 0.5 | **10** |
| P | Claude writes made houses on the live site (a key that calls Anthropic directly) | idea | 40 | 0.25 | 50% | 0.5 | **10** |
| AH | A song left playing in the living room | idea | 45 | 0.5 | 50% | 1.5 | **7.5** |
| AN | A guest book by the door, for visitors who aren't one of the five | idea | 30 | 0.5 | 50% | 1 | **7.5** |
| S | A sticker's note to the writer cuts an emoji in half | bug | 5 | 0.25 | 100% | 0.25 | **5** |
| AG | A festival in the house (Diwali lights on 8 November) | idea | 5 | 1 | 50% | 0.5 | **5** |
| U | An UNO card played in the first half second of a turn is silently dropped | bug | 3 | 1 | 80% | 0.5 | **4.8** |
| V | An open door doesn't light a window back up when her two minutes run out | bug | 5 | 0.5 | 80% | 0.5 | **4** |
| W | Change a made house after making it | idea | 10 | 0.5 | 80% | 2 | **2** |
| X | `//` addresses answer 500, and `HEAD /live` never answers | bug | 1 | 0.25 | 100% | 0.25 | **1** |
| Y | Invisible names and notes (zero-width spaces) and 31 February are accepted | bug | 1 | 0.25 | 100% | 0.25 | **1** |
| Z | Houses asked for at the same moment all get past the cap | bug | 1 | 0.25 | 100% | 0.5 | **0.5** |

Sorted by score. Ties are broken by confidence, then impact, then the older
row first. A, D and AA were done on 5 November and are off the table
(above). AN's reach is the capstone showcase (11 November), one afternoon
rather than a month.

## Why each one scores what it does

This round's rows first (7 November), then the 4 November notes. Rows with
no note here scored the same as on 1 November for the same reasons.

- **AI.** The biggest score in the table because it's at the front of every
  phone visit: a phone is held upright when a link is opened, so everyone
  arriving on one meets the notice before the house. Impact 3 because the
  house can't be used until the phone turns, and the final project's marker
  checks at exactly 390 × 844, where a broken viewport is a band down. The
  personas who'd hit it most are Arjun (one thumb on the bus, which a
  sideways phone doesn't suit), Kavya (in bed) and Lea (off a night shift).
  The sideways layout stays: it's what Rithika asked for (log 93), and the
  house is roomier on its side. The change is that upright gets the upright
  house (it still exists, under the notice) with a small line suggesting
  sideways, instead of a full-screen wall; the spec line that asks for the
  wall changes with it, and ADR 0032 is superseded in a new record. A
  quarter of a day. **Rithika's call**, since it reverses part of her "force
  only landscape".
- **AJ.** The live line already asks the browser to retry in 2 s, and the
  house keeps a friend "here" through a two-minute gap, so a dropped
  connection is invisible: no "changed" is sent on her return, and the page
  never asks for itself again. On a phone on patchy data (Arjun), or a laptop
  waking from sleep, the house stays as it was until a friend does something
  else. The fix is a few lines in `public/live.js`: when the line opens again
  after the first time, fetch the page once. 80% because how often a line
  drops is a guess.
- **AM.** The course's starter shipped no accessibility checks for the
  final project; they're the project's to write. The house has an SVG layer
  with hotspots, buttons with emoji on them, and a full-screen notice marked
  `role="alert"`. A spec over each page's HTML (a `main` landmark, `lang`,
  every `img` with `alt`, every button and link with a name a screen reader
  can say) protects what's there. Half a day, mostly finding what fails.
- **AL.** The house runs one Node process with a synchronous SQLite, so
  two writes at the same moment shouldn't both win, but nothing checks it.
  One spec: two friends post "eat" on the same plate at once (one eats it),
  two play on the same UNO turn (one card goes down), two browsers ask for the
  same window at once (one gets it, the other a 409). The brief's top band
  asks for exactly this.
- **AO.** When you come home after a while, Shinzo is waiting by your door,
  facing you, and the newest thing left for you is beside him: the house
  saying "you were missed" without a word. Worked out from timestamps like
  the rest of his day (ADR 0012), with nothing stored. Untested, so 50%.
  **Rithika's call**, since it changes what Shinzo does.
- **AK.** With all five windows taken (a crit, the showcase, five friends
  home at once), the door shows five greyed windows and nothing else to do.
  One line, "Everyone's home right now", above the "Make your own house"
  button that's already there. Reach is small for the five themselves.
- **AN.** A guest book on a table by the front door: anyone with the address
  who isn't one of the five can sign it with a name and a line, without
  coming in, and the five find who visited. Real houses have one, so it
  stays a place, not a feed. It would let a room full of visitors at the
  showcase (11 November) all do something at once without taking a window.
  It touches "built for exactly five", so **Rithika's call**, and after the
  deadline if at all.
- **AE.** The widget is the answer to the house's biggest risk. Its first
  run on a real phone was Rithika's iPhone on 4 November at 8:28 pm: the
  small widget showed "All five of you" with every face and clock, Neha
  asleep. The other cards (a note, a plate, the wall, her room, Shinzo), the
  medium and large sizes and the Mac haven't been seen on a real screen yet,
  and a sandbox isn't a phone: picture sizes, how iOS crops a large widget,
  how the room cut-out looks at a phone's scale. One thing the photo shows:
  in the small size, the second row's two faces sit at the edges with a gap
  between them. Half a day to fix what turns up. The widget
  updates itself, so fixes reach every phone without anyone pasting again.
  Not 100% because what turns up is unknown.
- **AA.** On her birthday, each friend finds the words her friends wrote her
  weeks ago, sealed until the day. A wish today is a row with no words
  (`wish` carries no body). Sealing is the most "made for being apart" thing
  the house could do: written whenever you think of it, opened on her day in
  her clock, however far apart you are. The widget already shows her picture
  on the day and the day before, and could show "3 cards waiting". **Aswathy's
  birthday is 8 November**, in four days, so it has a deadline. 80% because
  birthdays are proven in the house already (bunting, crowns, wishes); only
  the sealing is new. Rithika's call on the words (does a card say who it's
  from before it opens?).
- **AC.** Leave a lamp lit in a friend's window, and it stays lit until she
  next comes home and sees it: a hug that doesn't need both of you there.
  Hugs today need both friends near each other at once (`HUG_REACH`), which
  Lea and Kavya rarely manage. The house already draws lamps (`lamp` in
  `src/pages.ts`), so it's mostly a new `kind`. Untested, so 50%.
- **AD.** The writer of a desk note hears, once, "Kavya found your note",
  with no time. Saved plates already do this ("found the plate of dosa you
  saved her"), and it's what Kavya wanted. Without a time it isn't a read
  receipt: it says it landed, not when or that she's ignoring you. Rithika's
  call, since it's the line between warm and watched.
- **AB.** One line under a friend's photo, from anyone, shown under it on the
  wall, the way you'd write on the back of a print. Stickers say how you felt;
  this says what it reminded you of. It must stay one line each, never a
  thread, or the wall turns into comments (CLAUDE.md: never a forum).
- **AF.** On Android, the widget needs KWGT and a paid key, which leaves out
  Arjun, the friend it would help most. A free way: Android home-screen
  photo widgets (most phones have one) can show a picture from a folder, and
  apps like "Web Widget" show a page. The house could serve a small daily
  postcard image at the widget's link, and the page would show how to set it.
  Half a day to try; 50% because it depends on what each Android phone has.
- **AG.** On a festival, the house dresses up for everyone: diyas along the
  windows for Diwali, which is Sunday 8 November this year, the same day as
  Aswathy's birthday. Reach is Rithika's five only (a made house's friends
  may not celebrate it), and **only Rithika can say whether the five
  celebrate it** (CLAUDE.md: ask her before inventing details for the
  friends). Low reach, so low score, but it's the kind of detail that makes
  the house theirs.
- **AH.** Leave a song playing in the living room: a title and a link that
  stays until someone changes it. The house says who chose it. Movies
  already works this way for films. 1.5 days because of what a song link
  can open on each phone. A possibility, not a commitment.
- **A** still scores 100. On a phone, Home's top line is all of "While you
  were away" you see, and it can say the opposite of the house's main
  promise. The widget makes it matter a little less, but the phone's
  Home is still where most friends come in.
- **C** drops from 45 to 22.5: the widget now does most of what a nudge was
  for (something reaching a friend without the house pinging her), so its
  impact halves. Still useful for Android friends without the widget.
- **D** stays about 21 by the numbers, but understates it more than before. A wrong
  clock now shows in the planner's row for that friend and in her lane on
  the time strip, so planning a call in a made house gives the wrong hours,
  which is the first thing Priya came for.
- **G.** Photos raised the stakes: a couple's photos are as private as
  their notes. Still **after the final project is marked (9 November)**:
  markers and crit visitors walk in through those windows. Rithika confirmed
  on 3 November: no passwords for now, so her tutor can check it.
- **M.** The monthly recap shows all of last month, so this bites less across
  months, but a busy week away still hits the 40-line limit.

## What to build next

As of 7 November, with the deadline at noon on 9 November:

AI, AJ, AL, AM, F, K, L and N were done the same day (above). Left:

1. **I** is one command on Rithika's secret: take the course key off Fly,
   and the live maker builds from the form straight away instead of waiting
   about 40 s for a Claude it can't reach.
2. **AE** whenever Rithika has her phone to hand.
3. **Ask Rithika about AO, AK and AN.** AD (found your note) and AG (Diwali)
   she passed on on 5 November.
4. **G after 9 November.**

Done on 5 November, from the last round: AA (sealed birthday cards, in time
for Aswathy's birthday on 8 November), E and D (a made house's own about
page and the right clocks), and A (Home's line on a phone).

## Not scored

- **More than seven friends.** Each size needs a new picture and layout
  (ADR 0021). Nobody has asked.
- **Likes, counts, feeds, profiles, notifications the house sends.** Ruled
  out by the brief, whatever they'd score. The widget shows; it never
  buzzes.
- **Streaks, "you haven't been here in a week".** They punish absence, which
  the house never does.
- **Real-time chat.** Rithika asked for drawings, voice notes and chat on
  8 November ("do it if its possible"), then "Skip chat for now". Drawings
  and voice notes were built the same day (ADR 0037); chat stays out, since
  it's the one thing the house isn't.
