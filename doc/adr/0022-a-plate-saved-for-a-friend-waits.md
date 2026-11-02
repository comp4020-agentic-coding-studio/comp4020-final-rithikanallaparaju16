# 0022. A plate saved for a friend waits for her, and notes can be written back to

Status: accepted. Built on 3 November 2026 at Rithika's asking ("i agree w
save the plate.lets do that", "i like the writnf back part aslo"). Adds to
0005 (state from timestamps); changes nothing in it.

## Context

Food on the counter goes after three days (`counter()` in `src/house.ts`),
so a friend away for longer finds nothing left for her. That is fine for
food left out for everyone, but it means nobody can cook *for* someone
who's away, which is when it matters most. And a note on a friend's desk
could only be answered by leaving a new note on the writer's desk, with
nothing saying what it answered.

## Options

For a saved plate:

- A new kind, such as `saved`. Then eating, the counter, the drawing and
  Updates would each need a second case.
- A `dish` whose `item` carries who it's for: `"<food>:for:<id>"`. Old rows
  have no `:for:`, so they read as before, and `food()` gives the food back.
- A column on `things`. Every other "for whom" lives in `place` or `item`
  already, and a migration for one field isn't worth it.

For writing back:

- A desk note on the writer's desk with `item` pointing at the note. But a
  desk note's `item` is the gift it came with (`kitkat`, `chai`), so the two
  would clash.
- A new kind, `reply`, whose `place` is the writer's room and whose `item`
  is the answered note's id.

## Decision

- A saved plate is a `dish` with `item` `"<food>:for:<id>"` (`savedFor()`,
  `food()` in `src/house.ts`). It stays on the counter until that friend
  eats it, however long she's away: the three days apply only to food out
  for everyone. Only she can eat it (`POST /kitchen/eat` answers 400 to
  anyone else), and you can't save one for yourself. It's drawn covered,
  with a tag in her colour.
- Writing back is a `reply` row: `place` is the room of whoever wrote the
  note, `item` is the note's id. `desk()` includes replies, so it's kept and
  hidden from everyone else exactly as a desk note is. You can write back to
  a note on your own desk from the friend who wrote it, and the writer hears
  "wrote back to your note" in Updates.

## Consequences

A plate saved for someone never goes off, which is the point: rules in the
house never punish absence (`CLAUDE.md`). If a friend never comes back,
her plate stays covered on the counter. With five friends that's at most a
few plates, and nobody has asked for a way to take one back.

Desk notes and replies are private only as far as the door is: anyone at
the address can come in as any friend whose window is free (ADR 0011).
That's deliberate until the course is marked; see RICE row G.

`kind` and `item` values are only ever added. Older rows read as they did.
