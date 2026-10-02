# 0005. One log of things, with the house's state worked out from time

Status: proposed. Built in session 2; waiting on Rithika's review.

## Context

The house now has several ways to leave something: a note on the living room
wall (or big news pinned at the top), a note or gift on a friend's desk,
tidying a room, cooking for everyone, planting, watering, and playing with
Laddoo the dog. Some of the house's state changes on its own with time: rooms
get lived-in, plants grow and get thirsty, food goes off the counter, and
Laddoo wanders back to his kennel. Coming back has to show what happened while
you were away. Fly stops the machine when nobody's there, so a background job
can't be relied on. The first house kept notes in a `notes` table.

## Options

- One append-only `things` table (author, kind, place, body, item, time), with
  everything else worked out when a page is read. No timers and no mutable
  state. The whole log is read on every page.
- A table per feature with mutable state (a room's mess level, the garden's
  water level, where the dog is), updated by actions and by a scheduler.
  Cheap reads, but the scheduler doesn't run while the machine sleeps, and
  "while you were away" would need its own log anyway.
- An event log plus stored snapshots. Fast at any size, and two
  representations to keep in step, for a house of five.

## Decision

One `things` table. `src/house.ts` works out the state: a room is lived-in two
days after its last tidy and messy after five, and starts lived-in until
someone tidies it. Food stays on the counter for three days. Plants sprout,
grow and bloom over three days whatever happens, and look thirsty after two
days without water but never die. Laddoo follows whoever last played with him
for twelve hours. Existing notes move onto the wall at boot, and the old table
is dropped, in one transaction.

## Consequences

Nothing needs a timer: the house changes whenever someone looks. Nothing is
ever deleted, so older notes go to a "memory box" and older desk things to a
drawer, rather than pages of history. Reading the whole log on every page is
fine for five people over years (thousands of rows), and would be the first
thing to change at scale. Changing a rule, such as thirst after three days
instead of two, changes how the past looks too, which is fine here. The `kind`
and `item` strings are stored, so they're a contract: add new ones, never
rename one. Rules that never punish (no dying plants, no sad dog) keep the
house from becoming a chore to come back to.

Revisit if the log passes about 100,000 rows, or people need to edit or delete
what they left.
