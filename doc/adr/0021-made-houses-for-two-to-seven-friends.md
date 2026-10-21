# 0021. Made houses for two to seven friends

Status: accepted. Built on 21 October 2026 at Rithika's asking. Supersedes
the "five windows only" part of 0017 (a house for any five friends). The
rest of 0017 stands, and Rithika's own house at `/` is unchanged.

## Context

0017 made houses for exactly five friends, because more or fewer friends
means more or fewer bedrooms, and the house is a picture. Rithika asked for
"house layouts for diffeernt number of people. 2,3,4,6,7 should be enpugh",
with images from the course's image budget, to be shown to her before
building on them. She approved the pictures with "yes perfect rooms,
continue".

## Options

- Draw the house as shapes for any number. It would look nothing like the
  Stitch house the rest of the place is built around.
- Make one picture per size with the course's image endpoint, once, and
  measure each one's rooms by hand, as `ROOMS` was measured for house.jpg.
- Keep five rooms and leave some empty. A house for three with two empty
  bedrooms feels like someone moved out.

## Decision

One picture per size, made once and committed, each with its own measured
layout.

- `layouts/<n>-friends.png` and `layouts/garden.png` came from the course's
  image endpoint (Flux), about $3.80 including the tries that didn't work.
  `scripts/make-layouts.py` (dev-only, needs Pillow) lifts each off its
  background and sets it on a lawn with the garden down the right, as in
  house.jpg, at the same 1376 × 768. It writes `public/art/house-<n>.jpg`.
- `src/layouts.ts` holds every coordinate the drawing and the script read.
  This is what `ROOMS` and the other constants in `src/scene.ts` were, one
  `Layout` per size: rooms, Shinzo's kennel and stops, the counter, the
  fireplace, the sofas, the wall, the stove, the garden patches, and the
  mat. `layout()` picks one by the number of friends in the house. Five is
  `STITCH`, Rithika's house.jpg with her coordinates moved over unchanged.
- In the new pictures, bedrooms are too small for a mat, so UNO, the mat
  and its cushions are at the living room's coffee table (`mat.place` is
  `"living"`). Stored `sit` rows still say `item: "mat"`; only the place
  differs. UNO takes up to seven players.
- `/make` asks "How many of you?" (two to seven) before the form. The
  friend count is in the spec, so a house's size never changes once made.

## Consequences

Made houses can be for two to seven friends. Each size has its own picture
in a plainer line-art style than Rithika's Stitch house; five keeps hers.

Every coordinate was checked by drawing it over its picture
(`/tmp`-only tooling, not committed). Changing a picture means measuring its
rooms again.

Sizes beyond seven need a new picture and a new layout. The door's windows
wrap three to a row on a phone.
