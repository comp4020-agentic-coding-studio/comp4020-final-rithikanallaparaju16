# Five Windows: RICE

What to build next, ranked by **(Reach × Impact × Confidence) ÷ Effort**.
The candidates are the bugs from the 21 October test sweep that are still open
(each has a skipped test in `spec/` that passes once it's fixed), the ideas
raised in [prfaq.md](prfaq.md) and [personas.md](personas.md), and new ideas
from what's been built since. Scored on 4 November 2026, five days before the
final project is due (9 November, noon). Letters are fixed IDs that the
personas refer to, so they stay put if the scores change; new rows start at
AA.

## What changed since 1 November

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
| F | The Updates dot shows when there's nothing new to read there | bug | 20 | 0.25 | 100% | 0.25 | **20** |
| G | A front door key for each house, so desk notes and photos are private | idea | 45 | 1 | 80% | 2 | **18** |
| H | UNO deals a friend in after she's left the house | bug | 8 | 1 | 100% | 0.5 | **16** |
| I | The live house maker waits up to about 40 s on a Claude it can't reach | ops | 10 | 0.5 | 80% | 0.25 | **16** |
| AF | A free widget for Android: the house's own picture, refreshed | idea | 12 | 1 | 50% | 0.5 | **12** |
| J | A question on the wall now and then, for anyone to answer | idea | 45 | 0.5 | 50% | 1 | **11.25** |
| K | The Everyone tab offers "Come in as" a friend who's already home | bug | 5 | 0.5 | 100% | 0.25 | **10** |
| L | A second batch of kettle Maggi takes the first one's note with it | bug | 5 | 0.5 | 100% | 0.25 | **10** |
| M | Updates stops at 40 lines, and its "more" link leads back to itself | bug | 10 | 0.5 | 100% | 0.5 | **10** |
| N | A garden planted just now looks thirsty | bug | 10 | 0.25 | 100% | 0.25 | **10** |
| P | Claude writes made houses on the live site (a key that calls Anthropic directly) | idea | 40 | 0.25 | 50% | 0.5 | **10** |
| AH | A song left playing in the living room | idea | 45 | 0.5 | 50% | 1.5 | **7.5** |
| S | A sticker's note to the writer cuts an emoji in half | bug | 5 | 0.25 | 100% | 0.25 | **5** |
| AG | A festival in the house (Diwali lights on 8 November) | idea | 5 | 1 | 50% | 0.5 | **5** |
| U | An UNO card played in the first half second of a turn is silently dropped | bug | 3 | 1 | 80% | 0.5 | **4.8** |
| V | An open door doesn't light a window back up when her two minutes run out | bug | 5 | 0.5 | 80% | 0.5 | **4** |
| W | Change a made house after making it | idea | 10 | 0.5 | 80% | 2 | **2** |
| X | `//` addresses answer 500, and `HEAD /live` never answers | bug | 1 | 0.25 | 100% | 0.25 | **1** |
| Y | Invisible names and notes (zero-width spaces) and 31 February are accepted | bug | 1 | 0.25 | 100% | 0.25 | **1** |
| Z | Houses asked for at the same moment all get past the cap | bug | 1 | 0.25 | 100% | 0.5 | **0.5** |

Sorted by score. Ties are broken by confidence, then impact. A, D and AA
were done on 5 November and are off the table (above).

## Why each one scores what it does

New rows first, then the old ones that changed. Rows with no note here
scored the same as on 1 November for the same reasons.

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

1. **AE now.** Rithika is testing the widget on her iPhone and Mac; fix
   what she finds, the same day. It's the answer to the house's biggest risk.
2. **AA is built** (5 Nov), in time for Aswathy's birthday on 8 November.
   Built with the agent's calls on Rithika's two questions: she sees who
   wrote before it opens, never the words, and nobody reads anyone else's
   card. She can redirect either.
3. **F, K, L and N together.** Four bugs, each a quarter of a day, each
   with a skipped test ready to turn back on. (A was done on 5 Nov.)
4. **E is done** (5 Nov), with D: a made house's first visit has its own
   about page and the right clocks.
5. **Ask Rithika about AD, AG and I.** On 5 November she passed on AD
   ("found your note") and AG (Diwali) when picking features; I is one
   command on her secret.
6. **G after 9 November.**

## Not scored

- **More than seven friends.** Each size needs a new picture and layout
  (ADR 0021). Nobody has asked.
- **Likes, counts, feeds, profiles, notifications the house sends.** Ruled
  out by the brief, whatever they'd score. The widget shows; it never
  buzzes.
- **Streaks, "you haven't been here in a week".** They punish absence, which
  the house never does.
- **Drawings, voice notes and real-time chat.** Possibilities in `CLAUDE.md`,
  not candidates until someone shows they'd make five people feel closer.
