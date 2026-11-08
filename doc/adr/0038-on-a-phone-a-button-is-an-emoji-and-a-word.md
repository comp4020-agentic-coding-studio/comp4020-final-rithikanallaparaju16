# 0038. On a phone, a button is an emoji and a word

Status: accepted. Built on 8 November 2026 from Rithika's screenshot of her
iPhone in Chrome, on its side, with three wide buttons over the middle of
the house: "the buttons are still covering the entire screen.use the green
spcaes on either side, maybe make the messages smaller on hpone, could me j
an emoji or a single word". Supersedes ADR 0036's width threshold and button
size; its columns in the green stand.

## Context

ADR 0036 put the buttons in the green either side of the house where that
green was at least 120 px wide. Measured at 844 × 390, it was about 150.
Rithika's iPhone in Chrome keeps its address bar on its side, so the page is
about 844 × 346, the house is drawn smaller, and the green is about 115 px a
side. The threshold missed it, and the buttons stood over the house as
before. A sentence like "Go into Amirdhavarshini's room" needs most of
that width even wrapped.

## Decision

- Every action in the house (`Doing` in `src/scene.ts`) gets a `short`:
  one word ("Sleep", "Light", "Leave", "Tidy", "Maggi", "Water"). A dish on
  the counter is its own name ("Biryani"), so three plates out aren't three
  "Eat"s. Go in is a door and the room ("🚪 Neha's", "🚪 Kitchen",
  "🚪 Yours"). Hugs are "Hug" and "Group".
- On a touch phone, either way up, a button shows its emoji and that word.
  The sentence is still its name for a screen reader (the label is hidden
  from sight, not removed) and its `title`. An iPad or a laptop keeps the
  sentence.
- The columns in the green need only fit a short button: 72 px, at most
  132 wide.

## Consequences

The house is clear at the iPhone's real shape in Chrome and Safari. Upright,
the buttons are a narrow column at the side rather than pills across the
middle. A new action needs a `short` as well as its emoji; without one, the
whole label shows, which is long but never wrong.
