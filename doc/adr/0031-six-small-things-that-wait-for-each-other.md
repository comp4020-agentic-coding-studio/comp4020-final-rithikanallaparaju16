# 0031. Six small things that wait for each other

Status: accepted. Built on 5 November 2026. Rithika asked for "more
features", picked six from the agent's list ("nono ask again, i loved the
ideas"), then said "push it live". Each works in Rithika's house and in
made houses.

## Decision

- **Leave the light on** (RICE AC). In a friend's room, or at her desk in
  the house, "Leave the light on for Neha". A `lamp` row, placed in her
  room. Her window glows in the picture, day or night, until the visit she
  comes home to is over: it's lit while it was left after her "new" began
  (`store.newSince()`, the same moment "While you were away" counts from).
  Her room and Updates tell her who; the room tells anyone who's there;
  nobody else is told. Not in your own window. A hug that doesn't need you
  both online.
- **On this day.** Home's side column and Updates show a note or photo from
  the memory box from today's date in an earlier month or year, by your own
  clock; failing that, within three days of it, a month or more ago. The
  longest ago first. Never this month's wall. The widget shows it too, but
  only what its writer let onto widgets (ADR 0029). Nothing new is stored.
- **The next call on the widget.** The sooner of a planned video call or
  movie night, still to come, in her own time: "Sunday 8 November, 8:00 pm
  your time". A new plan shows first.
- **A line under a photo** (RICE AB). On a friend's photo on the wall,
  "Write a line under it": a `caption` row, placed `note:<id>`. One each; a
  newer one replaces hers, so it never becomes a thread. The photo's writer
  hears it in Updates. Not on your own photo.
- **A made house names its dog and tells its own story** (RICE O, E). The
  make form asks "What's the house dog called?" (blank is Shinzo, and so is
  every house made before it). A made house's "What is this place?" is its
  own page, from its spec, never Rithika's README.
- **Tell them you were here** (RICE C). Once you've done something this
  visit, Home and Updates offer a message to send your group chat yourself:
  "I came by the house: left Neha something on her desk, watered the garden
  🏠", newest first, with the house's address. It says what you did, never
  what you wrote. Share opens the phone's own sheet; Copy copies; without
  the script the words are there to select. The house still sends nothing.

## Consequences

The light left on is worked out from timestamps like everything else (ADR
0005): no timer turns it off.

"On this day" shows only in the side column on a laptop or iPad; on a phone
it's in Updates.

Updates' list now wraps a long word rather than widening the page (a test's
long ids showed a phone's Updates could scroll sideways).
