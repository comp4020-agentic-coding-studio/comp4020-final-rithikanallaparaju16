# Five Windows: RICE

What to build next, ranked by **(Reach × Impact × Confidence) ÷ Effort**.
The candidates are the bugs from the 21 October test sweep (each has a
skipped test in `spec/` that passes once it's fixed) and the ideas raised in
[prfaq.md](prfaq.md) and [personas.md](personas.md). Scored on 1 November
2026. Letters are fixed IDs that the personas refer to, so they stay put if
the scores change.

## How each number is scored

**Reach**: people affected in a typical month. No live counts were read for
this, so every reach comes from one assumed population; replace it with real
counts and re-sort:

- Rithika's five, plus about ten made houses in use with about four friends
  each: **about 45 people**.
- **About 10 people a month** make a house.
- **About 25** of the 45 come in on a phone.

**Impact**: how much it moves the test in `CLAUDE.md` (friends feel closer,
the core loop holds, coming back is worth it): 3 massive, 2 high, 1 medium,
0.5 low, 0.25 minimal.

**Confidence**: how sure the reach and impact are. 100% for a bug a failing
test shows, when how often it happens is clear; 80% for a known problem
whose size is a guess (a rare timing bug, a share of cities); 50% for an
idea nobody has tried.

**Effort**: days of work with the agent, including the spec test and looking
at it at phone, iPad and laptop widths. 0.25 is the smallest. A bug with a
skipped test is mostly done once that test passes.

## The ranking

| ID | Change | Kind | Reach | Impact | Conf. | Effort | Score |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| A | Home's line on a phone says "Nobody's been by" when someone came and left nothing | bug | 25 | 1 | 100% | 0.25 | **100** |
| B | Show a made house's name at its door and on its pages | bug | 40 | 0.5 | 100% | 0.25 | **80** |
| C | "Tell them I was here": a ready message you send the group yourself | idea | 45 | 1 | 50% | 0.5 | **45** |
| D | Made houses give friends the wrong clock ("Indiana" is India, Dubai is UTC) | bug | 13 | 2 | 80% | 1 | **21** |
| E | A made house's "What is this place?" shows Rithika's README | bug | 10 | 1 | 100% | 0.5 | **20** |
| F | The Updates dot shows when there's nothing new to read there | bug | 20 | 0.25 | 100% | 0.25 | **20** |
| G | A front door key for each house, so desk notes are private | idea | 45 | 1 | 80% | 2 | **18** |
| H | UNO deals a friend in after she's left the house | bug | 8 | 1 | 100% | 0.5 | **16** |
| I | The live house maker waits up to about 40 s on a Claude it can't reach | ops | 10 | 0.5 | 80% | 0.25 | **16** |
| J | A question on the wall now and then, for anyone to answer | idea | 45 | 0.5 | 50% | 1 | **11** |
| K | The Everyone tab offers "Come in as" a friend who's already home | bug | 5 | 0.5 | 100% | 0.25 | **10** |
| L | A second batch of kettle Maggi takes the first one's note with it | bug | 5 | 0.5 | 100% | 0.25 | **10** |
| M | Updates stops at 40 lines, and its "more" link leads back to itself | bug | 10 | 0.5 | 100% | 0.5 | **10** |
| N | A garden planted just now looks thirsty | bug | 10 | 0.25 | 100% | 0.25 | **10** |
| O | Name the dog in a made house (it's always Shinzo) | idea | 40 | 0.25 | 50% | 0.5 | **10** |
| P | Claude writes made houses on the live site (a key that calls Anthropic directly) | idea | 40 | 0.25 | 50% | 0.5 | **10** |
| Q | Photos | idea | 45 | 2 | 50% | 5 | **9** |
| R | A "while you were away" email you ask for | idea | 45 | 1 | 50% | 3 | **7.5** |
| S | A sticker's note to the writer cuts an emoji in half | bug | 5 | 0.25 | 100% | 0.25 | **5** |
| T | An open Movies page's movie-night planner misses friends' suggestions | bug | 5 | 0.25 | 100% | 0.25 | **5** |
| U | An UNO card played in the first half second of a turn is silently dropped | bug | 3 | 1 | 80% | 0.5 | **4.8** |
| V | An open door doesn't light a window back up when her two minutes run out | bug | 5 | 0.5 | 80% | 0.5 | **4** |
| W | Change a made house after making it | idea | 10 | 0.5 | 80% | 2 | **2** |
| X | `//` addresses answer 500, and `HEAD /live` never answers | bug | 1 | 0.25 | 100% | 0.25 | **1** |
| Y | Invisible names and notes (zero-width spaces) and 31 February are accepted | bug | 1 | 0.25 | 100% | 0.25 | **1** |
| Z | Houses asked for at the same moment all get past the cap | bug | 1 | 0.25 | 100% | 0.5 | **0.5** |

Ties are broken by confidence, then impact.

## Why each one scores what it does

- **A.** On a phone, Home's top line is all of "While you were away" you see,
  because the card that names visitors is hidden below 700 px. The line counts
  only things left, so a friend who came and left nothing doesn't count, and it
  says the opposite of the house's main promise. Test:
  `spec/activities.test.ts`, "tells you the same thing at the top of Home…".
- **B.** Every made house has a name, either the one typed or "<first
  friend>'s house", and only the page after making it shows it. Inside, the
  door says "Five Windows". Small, but it's what makes the house theirs.
  Test: `spec/made-houses.test.ts`, "shows the name you gave your house at
  its door".
- **C.** Nothing brings anyone back; that's the biggest risk in the PRFAQ.
  A button after leaving something, such as "Tell Kavya there's something
  on her desk", would open the phone's share sheet or copy a link and a line
  for the group chat. The house sends nothing; a friend does, so it isn't an
  unrequested notification. Untested, hence 50%. **Rithika's call**, since it
  touches how people come back.
- **D.** The local maker builds every live house, and it finds a time zone by
  matching parts of words in list order: "Bloomington, Indiana" contains
  "india", "Western Australia" matches before Perth, "New South Wales" matches
  Wales. Anywhere it doesn't know (Dubai, Thrissur, most of the world) gets UTC.
  A room on the wrong clock dims and sleeps at the wrong hours, the opposite of
  ADR 0006. A third of made-house friends is a guess, hence 80%. Matching
  whole words, most specific first, against the cities in the time zones
  Node knows (`Intl.supportedValuesOf("timeZone")` has `Asia/Dubai` and
  `Australia/Perth`), and showing the guessed clock on the form so it can be
  corrected, is about a day. Test: "keeps each friend's clock where she
  lives".
- **E.** A made house's "What is this place?" and "About this place" links
  show README.md, which describes Rithika's five by name, with their cities,
  birthdays and sleep hours. The README is public on GitHub, so it's
  confusing more than a leak. A short about page for made houses fixes it.
  Test: "keeps Rithika's five's own details out of a made house's about page".
- **F.** The dot on Updates counts any new row, including a sticker on someone
  else's note, which Updates doesn't list. A dot that leads nowhere teaches
  people to ignore it. Test: "only puts the dot on Updates when there's
  something new to read there".
- **G.** Anyone with the address can be anyone whose window is free, so a
  desk note is a courtesy, not a lock. It matters most to a couple (Lea) and
  to anyone a link gets forwarded to. It changes the door, so it needs an
  ADR. **Do it after the final project is marked (9 November)**: markers and
  crit visitors walk in through those windows.
- **H.** Leaving takes a friend out of her game (ADR 0016), but she still
  counts as sitting on the mat, so the next deal includes her and everyone
  waits out her twenty seconds. People often close the tab while sitting.
  Test: `spec/multiuser.test.ts`, "deals UNO only to friends who are still in
  the house".
- **I.** The course key on Fly goes through a proxy only the ANU network can
  reach, so every live house waits for Claude to fail before it's built from
  the form. Taking the key off Fly (`flyctl secrets unset`) removes the wait,
  and the house comes out the same. **Rithika's call**: it's her key and her
  secret. The alternative is P.
- **J.** A question pinned on the wall, such as "what did you eat today?",
  gives a quiet friend (Arjun) something easy to say. The wall already holds
  notes; this is one more kind. Untested.
- **K.** Pressing "Come in as" for a friend who's home is a 409 dead end; the
  door already shows her window shut. Test: "never offers to come in as a
  friend who's already home".
- **L.** The kettle shows only the newest batch, so a friend's note with the
  first batch is gone before Amirdhavarshini reads it. Rithika's house only.
  Test: "keeps a friend's kettle Maggi note in the room after someone else
  makes more".
- **M.** After a busy stretch away, Updates lists the first 40 things, and
  "There's more since you were last here" links back to the same page. What
  was left for you is listed first, so what's cut is the rest of the house.
  Test: "lets you reach everything that happened while you were away from
  Updates".
- **N.** The garden looks thirsty when the last watering was over two days ago,
  even if the only plant went in a moment ago. Test: "never shows a
  just-planted garden as thirsty".
- **O.** Every made house's dog is called Shinzo, Rithika's dog. A field on the
  form would let a group name theirs. His code and pictures stay `laddoo`.
- **P.** Claude writes each room's description from what was said about each
  friend. Without it, rooms are built from the words as typed, which is
  already personal, so the gain is small. It needs a paid key that calls
  Anthropic directly, from Rithika's own account, and then Z starts to matter.
- **Q.** Photos are the biggest change a friend would feel, and the
  biggest effort: resizing on a machine with 256 MB of memory, storage on
  one small volume, what happens to old ones, an ADR. A possibility, not a backlog
  (`CLAUDE.md`). Still out.
- **R.** An email you ask for, with what's new since you were last here. It
  would bring people back, but it needs an email service (another runtime
  dependency) and something that runs on a schedule, which ADR 0005 avoids.
  C does most of the job for a tenth of the effort.
- **S.** The writer's line quoting her note cuts it at 40 code units, which
  can split an emoji into "�". Test: "quotes your note intact when a friend
  stickers it, emoji and all".
- **T.** The planner isn't one of the Movies page's live parts, so a suggestion
  made while it's open only shows in it after a reload. Test: "keeps an open
  Movies page's movie-night planner up to date…".
- **U.** The server checks a move against when it arrives, but the replay
  plays stored moves half a second early, so a card played in that half
  second after the turn before ran out is accepted, then dropped. It's
  rare, but a lost card feels broken. Test: "keeps an UNO move the house took
  right after the turn before ran out".
- **V.** When a friend's two minutes run out, nothing tells open pages, so the
  door shows her window shut until something else happens. It matters mostly
  at crits, where strangers are waiting for a window. Test: "lights a window
  back up on an open door once she's been gone two minutes".
- **W.** A wrong city or a typo means making a new house at a new address and
  sending it round again. Fixing D removes most of the need.
- **X, Y, Z.** Nobody meets these by accident. X: `new URL` throws on an empty
  first segment, and `HEAD /live` opens a stream. Y: `trim()` keeps zero-width
  spaces, and any day goes with any month. Z: the cap is checked before
  Claude is awaited and counted after, which only costs anything once P is
  done. Tests: "never stumbles over an extra slash…", "answers an address
  with no house at it…", "answers odd addresses inside a made house…",
  "answers a HEAD for the live line…", "won't pin up a note with nothing you
  can see on it", "turns
  down a name nobody can see", "only takes a birthday that's on the
  calendar", "makes only three houses for a visitor who asks for several at
  once".

## What to build next

1. **A, B, F, K, L and N together.** Six bugs, each a quarter of a day, each
   with a skipped test ready to turn back on. That's about a day and a half
   for the top two scores and four small ones.
2. **D, then E.** A made house's first visit, which decides whether its maker
   shares it (Priya). RICE understates D: one wrong clock is the first thing a
   group notices, and its reach is a guess.
3. **H.** The worst live bug, and it hits whoever is most engaged (Meera).
4. **Ask Rithika about C and I.** C is the best idea on the list, but it
   touches how people come back. I is one command on her secret.
5. **G after 9 November.**

## Not scored

- **More than seven friends.** Each size needs a new picture and layout
  (ADR 0021). Nobody has asked.
- **Likes, counts, feeds, profiles, notifications the house sends.** Ruled
  out by the brief, whatever they'd score.
- **Drawings and real-time chat.** Possibilities in `CLAUDE.md`, not
  candidates until someone shows they'd make five people feel closer.
