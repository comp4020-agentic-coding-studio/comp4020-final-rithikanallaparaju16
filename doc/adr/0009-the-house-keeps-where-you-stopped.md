# 0009. The house keeps where you stopped

Status: proposed. Built in session 7; waiting on Rithika's review. Supersedes
the part of 0008 that says where you are inside a room isn't saved; the rest
of 0008 stands.

## Context

In 0008 the only thing the server knew about where you were was the place
you last went into (`visits.place`). Where you walked inside it lived in the
page, and only the step out of a room survived one page load, in
`sessionStorage`. So on a reload, or on coming back the next day, you were
back on the room's first spot, and Shinzo (who was Laddoo then) was back
wherever the server last put him. Rithika reported: "the persistence still
doesnt work", and then, asked what she meant, "where i was, where the dog
was etc, data is not persisting". The same session added sleeping in any bed
and sitting down, which raises the same question: how long are you still
sitting there?

Two rules held this up. Everything friends must see lives in SQLite
(0002), not in the browser. Things people leave go in the append-only
`things` table, and state is worked out from timestamps, with no timers
(0005).

## Options

- Save your spot on the server whenever you stop walking. Add `x`, `y` and
  `arrived` to your `visits` row. `public/house.js` sends the spot with
  `navigator.sendBeacon` to a new `POST /here` when you stop, and when the
  page goes away. The server checks that the spot is inside the house and
  works out which place it's in from `ROOMS`.
- Save it in `localStorage`. That's simpler, but it stays on one device and
  friends never see where you are, which is what the report was about.
- Log each stop as a `things` row. That keeps a full history, but it turns
  walking into hundreds of rows nobody will ever read, and "where is she"
  becomes a search for the latest one.

## Decision

The first option. Where you are is current state, not something you left,
so it goes on your `visits` row next to `place`. Columns are added in place
on boot, like `place` was. Going into a new place clears the spot (you're on
its first spot) and sets `arrived`. Loading a page that doesn't say where
you are, like Updates, keeps both. Walking sets the spot and `arrived` to
now. With no script there's no walking, so a spot is never needed: the
room's first spot is still the default.

This goes for friends who aren't here, too. Until now, only someone seen
in the last ten minutes was drawn in the place she'd gone to. Everyone
else was back in her own room, which looked like the house forgetting.
Now everyone stays where she stopped, except during her sleep hours, when
she's in her own bed.

Shinzo needs no column of his own. As before, for half a day he's with
whoever last petted him or gave him a treat (a `play` or `treat` row), and
he's drawn beside where that friend now stands. Her spot is saved, so his
is too.

Sleeping in a bed or sitting down is something you did, so it's a row in
`things` (`nap`, or `sit` with the seat as `item`), which also lets
"while you were away" say it. You're still lying or sitting there while
your latest such row is in the place you're in, came after `arrived`, and
is under two hours old. Walking sets `arrived`, so walking is getting up.
Nothing has to be undone and nothing runs on a timer.

## Consequences

A reload, or coming back days later, puts you where you stopped, with
Shinzo beside whoever he's with. Friends find you standing there too,
until your sleeping hours come round and you're drawn asleep in your own
bed.
`/here` is the house's first write
that isn't a form and has nothing to show, so it answers 204. It's the one
write that needs the script, which is fine because only the script walks.
The spec posts it directly. Only your latest spot is kept, so the house
can't say where you've been, only where you are. Two tabs open at once
end up wherever you stopped last.

Revisit if the five want a trail of where someone went, or if sitting and
sleeping need to last longer than two hours.
