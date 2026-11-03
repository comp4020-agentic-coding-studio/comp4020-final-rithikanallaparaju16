# 0026. The wall starts fresh each month, and a recap waits for whoever was away

Status: accepted. Built on 3 November 2026 at Rithika's asking ("okay manybe
we can refresh the wall every month and give a recap whenever the user comes
after the refresh, making sure nobody misses anything"). Adds to 0005 (one
log of things) and 0024 (photos on the wall); changes neither.

## Context

The wall showed every note ever pinned, newest first, with anything past the
first `WALL_SHOWN` in a memory box drawer. With photos (ADR 0024) the wall
grows fast, and a wall that only grows stops feeling like a place you look
at and starts feeling like a feed you scroll. Rithika asked for it to start
fresh each month, with a recap for anyone coming back after it does, so a
fresh start never means missing something.

The house never punishes absence (CLAUDE.md), so a friend away for the
whole of October must still find October when she comes back in December.

## Options

When a month turns over:

- Each friend's own clock. Then on the 1st in Canberra, Rithika sees an empty
  wall while Neha, still on the 31st, sees October's: the one shared wall
  would differ by who's looking.
- UTC. The same for everyone, but it belongs to none of the five, and turns
  over mid-morning in Canberra.
- One friend's clock, the same for the whole house.

What "refresh" does:

- Take notes down for good. Against "nothing is lost" and the append-only log.
- Hide them by their age (a rolling 30 days). Never a clean start, and never
  a moment to recap.
- Show this month's notes on the wall, and keep each month before as an
  envelope in the memory box. Nothing's deleted; only where it's shown
  changes.

How long a recap stays:

- For one visit. Gone after a quick look on a phone.
- A week. Gone for someone away longer, which is when it matters most.
- Until she puts it away. A per-friend marker, like the widget key.

## Decision

- The month turns over by the first friend's clock (`monthClock()` in
  `src/house.ts`): Rithika's Canberra in her house, the first friend named in
  a made one. Canberra reaches the 1st before the others, so it's the house
  starting the month together.
- The wall shows this month's notes, under the month's name. Big news stays
  pinned whatever the month, like a made house's memories. Every month
  before is an envelope in the memory box, newest first, with everything
  that was on the wall that month, stickers and all. The board in the
  picture shows this month's photos. A photo from any month is still served
  (`GET /photo/<id>` checks the whole wall).
- A friend coming back after the 1st (not on her first visit ever) gets a
  recap of the last month the wall had anything in: on Updates in full
  (every note and photo, named, with what's new to her marked), on a
  laptop's Home as a card with the month's photos, and in Home's news line.
  It stays until she presses "Put October in the memory box", which posts
  to `/wall/recap` and sets `visits.recap` to that month. That's the only
  thing it writes; the notes were in the memory box already. Only a month
  the wall has had is accepted, and the marker never goes back.
- Only the latest past month is recapped. Anyone away longer finds the
  months before it in the memory box, each in its own envelope.

## Consequences

On the 1st, the wall in the living room is empty until someone pins
something, with a line saying it started fresh. That's the point, but it
means the wall looks quiet for a while each month.

A note pinned at 11 pm on the 31st in New Jersey is already the 1st in
Canberra, so it starts the new month's wall. Everyone sees it in the same
place.

A friend who puts away October but then wants it back finds it in the
memory box. The recap doesn't come back on its own.

`visits` gains a `recap` column (`''` until she's put one away). No `kind`
or `item` values change, and older rows read as they did.
