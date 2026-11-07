# 0037. Drawings and voice notes, and not chat

Status: accepted. Built on 8 November 2026 from Rithika pointing at the
"Not scored" line in `doc/rice.md` ("Drawings, voice notes and real-time
chat") with "wait can we do this? do it if its possible". Asked about chat,
she answered "Skip chat for now". Adds to 0024 (photos on the wall).

## Context

`CLAUDE.md` names photos, drawings, prompts and real-time as possibilities,
not a backlog. Photos came first (ADR 0024). A drawing and a voice note are
both things you make for someone when they're not there, which is the house's
one principle: connection without being online together. A desk note already
says "I thought of you"; a drawing says it in your own hand, and a voice note
in your own voice, which five friends who know each other's voices will hear
differently from any text.

Chat is different. Sending lines back and forth is the thing the house
deliberately isn't ("a feed or a chat app with a skin"), and it only works
when both are in. Rithika chose to skip it.

## Options

- Drawings and voice notes as new kinds of thing, with their own tables and
  pages.
- Drawings and voice notes as two more things to leave somewhere the house
  already has: a friend's desk (private, like a note) and the wall (shared,
  like a photo).
- Leave both out.

## Decision

The second.

- **A drawing for a friend's desk, or for the wall.** A sheet of paper and
  seven pens, a rubber, Undo and Clear, in `public/live.js`; finger, pen or
  mouse. Leaving it puts the drawing in the form's own file field as a PNG
  and sends the form as it is, so the house takes it exactly as it takes a
  picked file. A desk drawing is a `desk` row with item `drawing:<id>`; a
  wall drawing is a `note` with item `drawing:<id>`, which the wall shows
  like a photo (whole, not cropped), with stickers and a line under it like
  any photo. The picture is kept in the `photos` table.
- **A voice note for a friend's desk.** Record in the page (MediaRecorder,
  up to a minute), listen back, record again, leave it. Kept in a new
  `sounds` table (3 MB at most); the desk row's item is `voice:<id>`. No
  microphone, or no script, and the same field picks a recording the phone
  made.
- **As private as a desk note.** Only the friend whose desk it's on and
  whoever left it can see the drawing or hear the voice note
  (`GET /drawing/:id`, `GET /voice/:id`, 404 for anyone else); anyone who
  walks in sees "A folded drawing for Neha" or "A voice note for Neha". The
  widget names it ("Rithika left you a drawing") but never carries it.
- **The house knows a file by its first bytes**, not by what it says it is:
  a PNG for a drawing, WebM, Ogg or MP4 for a voice note.
- Writing back works on both, as on a note.

Without the script, each is a plain file field: a drawing made in another
app, or a recording, goes the same way.

## Consequences

Two new kinds of item (`drawing:`, `voice:`) and one new table (`sounds`).
No new runtime dependency. The desk and the wall each take one more card,
folded shut until opened, so the room page doesn't grow for anyone who
doesn't want them. Chat stays out; a new record can bring it in if Rithika
asks again.
