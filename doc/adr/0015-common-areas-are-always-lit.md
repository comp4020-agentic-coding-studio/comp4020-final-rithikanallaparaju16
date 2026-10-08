# 0015. Common areas are always lit

Status: proposed. Built in session 8; waiting on Rithika's review. Supersedes
0014, and the part of 0006 where shared rooms and the garden follow the
visitor's clock. Bedrooms keeping their owners' clocks (the rest of 0006)
stands.

## Context

0014 kept only the living room out of the visitor's night. An hour later
Rithika said: "no common area should be dim, let it always have light, only
rooms dim up in that particular persons timezone."

## Options

- No shade outside bedrooms at all: the living room, kitchen, garden and the
  halls between are always in daylight, and each bedroom dims by its owner's
  clock.
- Lamps in each common room at night over a lighter shade. The house would
  still look like evening outside the bedrooms, which is what she asked not
  to have.

## Decision

The first. The visitor's shade over everything but the bedrooms is gone, and
so is the mask it needed (`not-bedrooms`) and 0014's lamp glow. Bedrooms keep
their own night, dusk and dawn, and a lamp at night when their owner's
awake. After dark by the visitor's clock the fireplace still glows, which
only makes the living room brighter. The page's own sky (the bar, the door's
windows) still follows each person's clock.

## Consequences

Coming home at any hour finds the shared rooms bright, and the only dark
rooms are friends' bedrooms where it's night for them, which makes the
clocks easier to read. The garden at midnight looks like the garden at noon.
The spec checks that the light layer only ever shades bedrooms, on the house
and on the living room, kitchen and garden pages.

Revisit if the five miss evenings in the shared rooms.
