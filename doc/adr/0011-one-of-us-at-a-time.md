# 0011. One of us at a time

Status: proposed. Built in session 8; waiting on Rithika's review. Builds on
0003 (a person is one of five fixed ids), which it doesn't change.

## Context

Picking a window at the door set a `who=<id>` cookie, and anyone could pick
anyone. Rithika asked: "if one person is logged in as one of us, nobody else
can choose that person. so max of 5 users can only use my website." There
are no passwords and nobody wants them; the door is how five friends come
home. With live updates (0010) the house can tell whether someone actually
has it open.

## Options

- A token per sign-in. Picking a window makes a random token, stored on
  that friend's `visits` row and carried in the cookie as `who=<id>.<token>`.
  A request is her only while the two match. Picking a friend someone else
  holds is refused.
- Passwords or emailed links. They prove who someone is, which isn't what
  was asked, and they add a step every time someone comes home.
- Remember picks in memory only. It forgets everyone on every restart or
  redeploy, and 0002 keeps what friends must see in SQLite.

## Decision

A token per sign-in. `visits` gains `token` and `claimed` (when she came in
at the door), added in place on boot like `place` was. Someone holds a
friend while her token is set and either a page with that token has `/live`
open, or she came in or loaded a page in the last two minutes. Two minutes
covers going from page to page with the script off. Picking someone held
answers 409 with "Someone's in the house as Neha right now. Her window opens
again once they leave." The door draws her window lit, says she's in the
house right now, and disables the button. Picking yourself again changes
nothing, and picking someone else lets go of who you were. "Not Neha?" and
the Everyone tab go through the same door.

Once the holder has closed every page and two minutes have passed, anyone
can pick that window. That replaces the token, so the browser that had her
is back at the door next time, not quietly still in. An old `who=<id>`
cookie from before this change counts as no session, so everyone picks
their window once more.

The same friend on a second device is someone else as far as the house can
tell, so she waits too, or presses "Not Neha?" on the first. That's what
"nobody else can choose that person" means in practice.

## Consequences

At most five people are in the house at once, one per window, and the door
shows who's in. Leaving is pressing "Not Neha?", or closing the house and
waiting two minutes. Nothing needs a password, and the tokens are random
and never shown.

The spec signs each friend in once per run and leaves at the end, so the
next run can come in. A run that crashes holds its friends for two minutes.
`scripts/shot.ts` signs in through the door the same way and leaves when
it's done. A screenshot as Rithika on the real house is refused while
Rithika is in it, which is the point.

Revisit if someone needs to be in on two devices at once, or if a window
that stays shut for two minutes after a crash gets in anyone's way.
