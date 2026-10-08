# Process

## The problem, and the principle

Four close friends and I live in Canberra, New Jersey, Tamil Nadu and
Bangalore, and we're almost never online at the same time. I didn't want
another chat app. The one principle I gave the agent was that *connection
must not require being online at the same time*: someone comes by for thirty
seconds, leaves something and goes, and someone else finds it days later.
[README.md](README.md) argues what "good" means for this house. This file is
how I got from that to the harness, the stack and the app.

## From a brief to a harness

I started with a long direction prompt. It covered the product, the feeling
(warm, a bit nostalgic, never a feed or a dashboard), a seven-point
definition of good, and how I wanted to work. The agent turned it into
`CLAUDE.md` and built a first slice, notes left on a kitchen table, in
[`0ed431d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0ed431d).
Twice that session I rejected multi-part environment checks it wanted to
run first, and then I cut "inspect first, wait for confirmation" from my own
brief. The harness has said "build it, and keep pre-build assessments short"
ever since.

The agent makes the small calls and names every product decision in its
reply, so I can redirect it. Details only I know, like the KitKats, the
hostel kettle Maggi and a dog called Shinzo, come from me. Every prompt,
correction and commit is in [doc/process-log.md](doc/process-log.md). Big
decisions are [ADRs](doc/adr/), and changing one means writing a new record
that supersedes it. When I asked for a walkable avatar, which
[ADR 0007](doc/adr/0007-the-stitch-illustration-with-an-svg-layer-and-a-little-javascript.md)
had turned down, the agent wrote
[ADR 0008](doc/adr/0008-you-walk-yourself-and-nobody-else-moves.md) rather
than editing 0007.

## Why this stack

The stack is Node 24 running TypeScript directly, `node:sqlite` on the Fly
volume, server-rendered HTML forms, and no runtime dependencies
([ADR 0001](doc/adr/0001-a-zero-dependency-node-server-with-html-forms.md),
[ADR 0002](doc/adr/0002-store-the-house-in-sqlite-on-the-fly-volume.md)).
That's sized to five people, one small machine, and one volume that
survives a redeploy. A JSON file would have held our notes, but SQLite gives
crash-safe writes for free. A markdown library would have rendered
`/readme/`, but a small renderer kept dependencies at zero, at the cost of a
rule that the README stays inside what it supports.

Everything anyone leaves is a row in one append-only table, and the state of
the house (a lived-in room, a thirsty plant, where the dog is) is worked out
from timestamps, not timers
([ADR 0005](doc/adr/0005-one-log-of-things-with-state-derived-from-time.md)).
That's how the house never punishes absence: nothing counts down while
you're away. Where you stopped walking is current state rather than
something you left, so it lives on your `visits` row instead
([ADR 0009](doc/adr/0009-the-house-keeps-where-you-stopped.md),
[`8c0b81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c0b81e)).

The house is my Google Stitch illustration with an SVG layer on top. A
canvas game was the obvious alternative, and it was turned down because it
needs a client bundle and its pages stop being forms. One small script adds
walking, glowing hotspots and emoji, but every link and form works without
it.

The trade-off I'm still carrying is that the house isn't real-time: a
friend's change shows on your next page load. The brief requires
real-time. My own definition of good says overlapping should make the house
more alive without being needed, and that's the test real-time will have to
pass here.

## Corrections that ended up in the harness

The corrections that mattered changed a rule, not just the code.

- **Cats that were KitKats.** The agent read the boxes in Rithanya's room as
  cats and put them in the README. Since
  [`df979fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df979fe),
  `CLAUDE.md` says details about my friends come from me.
- **A door that let nobody in.** After session 3 went live, tapping a friend
  at the door did nothing. A `pointer-events: none` meant for the SVG's
  `g.people` was written as `.people`, which also matched the door's list.
  The spec posts forms directly, so it missed this. The agent's local check
  used `element.click()`, which skips hit-testing, so that missed it too. The
  same commit,
  [`df979fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df979fe),
  scoped the rule and taught `scripts/shot.ts` to tap for real. It also
  added two rules: tap the door after any CSS change, and scope SVG-only CSS
  to the element.
- **Widths nobody looked at.** The iPad layout broke unnoticed, so an 820px
  touch check became a rule
  ([`3e04bde`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3e04bde)).
  When a phone screenshot looked off-centre, measuring in the page showed the
  screenshot script was at fault, not the code. The script was fixed, and
  the rule now says to measure first
  ([`ccf0229`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/ccf0229)).
- **A migration under a running server.** A new server that failed to bind
  its port had already migrated my local database under the old one.
  `CLAUDE.md` now says to use another port and a copy of the data
  ([`205b1d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/205b1d8)).
- **A test that would pass with nothing saved.** I reported "where i was,
  where the dog was etc, data is not persisting". The first test for the fix
  stood you on the garden's own starting spot, so it would have passed
  either way. It now uses a spot only walking reaches. Browsers were also
  showing a day-old picture, so art addresses now carry a fingerprint
  ([`8c0b81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c0b81e)).

## What was thrown away

Three designs went whole:
- the kitchen table, for the shared house
  ([`205b1d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/205b1d8))
- the agent's own SVG drawing of the house, for my illustration
  ([`d6fc9d0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d6fc9d0))
- avatars wandering their rooms on a loop
  ([`3e04bde`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3e04bde))

That last one was the literal answer to my asking for avatars that move.
Then I asked that "movemet should only be there if the user is there". Now
you walk yourself, and friends stand where they stopped, which is honest
about a house you mostly visit alone.

## How I know it works

`spec/` has one test per promise the house makes, 24 so far beside the two
the course ships, run against the app over HTTP. Tests that write only run
against a throwaway house, so the real one never gets test notes. When the
agent added the check that nobody wanders, it ran the check against the
previous commit and watched it fail before trusting it
([`5739e84`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/5739e84)).

Motion and taps can't be checked by posting forms, so the agent drives
headless Chrome with real key presses, touch drags and taps at 390px, 820px
and desktop width. It looks at each screenshot before calling a change
done. After every deploy it checks the door, `/readme/` and the read-only
spec, and never anything that writes to the real house. That part is left
to the five of us.

## Prompts

Every prompt I gave the agent from 8 October, word for word, with the commit it led to.

- "i want you to use liveview for viewing all the updates live, i should not need to refresh my page everytime to see what is going on. and if one person is logged in as one of us, nobody else can choose that person. so max of 5 users can only use my website. i want the avatars to be able to hug eachother. there can be a group hugs of 1,2,3,4 or evan and at max 5 people. the option should show if im close to any user that is online. i also wanna add birthdays and the avatars should be able to celebrate in the whole birthday month. the whole month there should be some decorations in the birthday girls room and a crown on her head. the dog, shinzo can wander whenever he wants. i want him to get up and wander, rn he wanders while sleeping on the mat.Fanning work out to subagents is encouraged for complex tasks. make sure they work together.make nehas sleeping hours to be 10. and give option of the avatars to play uno wheneber they sit togther in amirdhas room. make a uno game w 7 cards to each player. max of 5 players can play this game. so now i will add the birthdays rithika 16th october neha 2nd june aswathy 8th november rithanya january 12th Amirdha may 19th in process.md add this prompt and its hash. do this for every prompt so i can change it later": [`cd89e32`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/cd89e32) (written up in [`2b110a0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/2b110a0))
- "continue and open the live after", "continue and ship it when done and open it live" and "continue": the same work, shipped as [`cd89e32`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/cd89e32)
- "why is the living room dark": a question, no code change. It's night by my clock, and the shared rooms follow the visitor's clock.
