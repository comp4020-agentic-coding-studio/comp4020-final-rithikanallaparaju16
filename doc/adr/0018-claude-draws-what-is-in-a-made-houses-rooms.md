# 0018. Claude draws what's in a made house's rooms

Status: accepted. Built on 20 October 2026 at Rithika's asking. Adds to 0017
(a house for any five friends), which still stands.

## Context

A made house (0017) shows a few of what each friend said is in her room on
little paper tags pinned up in it: "a yoga mat" in handwriting on a scrap of
paper. Rithika: "all you do when i mention what should be there in the room
is, just put a stiky note and write that on top, i want you to use the
picture credits yuou have and actually draw what should be in the room".

The room is the Stitch picture (0007), with small drawings (food, notes,
plants) as SVG shapes on top (`src/art.ts`). The Claude API takes pictures
in but doesn't paint them; it writes text, which can be numbers for shapes.

## Options

**How the drawing is made.**
- Claude draws each thing as a few flat SVG shapes, from a fixed list of
  shape kinds with numbers and hex colours, which the app turns into SVG.
- Claude writes SVG markup, which the app shows. The most freedom, but the
  page would carry markup a model wrote from what a stranger typed.
- A drawing for common things made by hand, and a tag for anything else.
  Safe and on-style, but "a sewing machine" or "a lava lamp" stays a tag.
- An image model. The house has no other image service, and adding one is
  another runtime dependency and another key on Fly.

**When.**
- Once, when the house is made, saved with the house's spec.
- On every page load. Every visit would cost a call and wait on it.

## Decision

Claude draws, once, when the house is made, in shapes the app checks.

- After the house is written (by Claude), one more call per friend, all five
  at once, draws the first three of her things (`src/drawings.ts`). Each is
  up to 24 shapes (`circle`, `ellipse`, `rect`, `polygon`, `line`) in a
  100 × 100 box, with a fill and an outline.
- `tidyDrawings` keeps only those shape kinds, numbers clamped to the box,
  and `#rrggbb` colours, and names each drawing after her own list, so
  nothing Claude writes reaches the page as markup. `spec/drawings.test.ts`
  holds it to that.
- The drawings are saved in the house's spec (`Friend.drawings`), so they
  survive restarts and redeploys like the rest of it.
- They stand in her room where the tags were (`ROOMS[…].pins`), and beside
  each thing in the "In her room" list on her room page.
- A call that fails, is refused, or comes back cut off just leaves that
  friend's tags. The house is made either way. A house made without Claude
  (no key, or `HOUSE_MAKER=fake`, as in the spec) keeps its tags.

## Consequences

The things in a friend's room look like things in the room, in the house's
own outlined, warm style, at about 46 pixels across.

Making a house with Claude now takes five more calls at effort `low`, about
a cent each, run at once: about 23 seconds in all instead of 12. The `/make`
caps (0017) count houses, so they cap these calls too.

Rithika's own five keep their rooms as they are: their things are in the
picture.

Only the first three things are drawn; the rest are listed on the room page.
Revisit if the drawings look out of place in the picture, or if friends want
to change what's drawn after the house is made.
