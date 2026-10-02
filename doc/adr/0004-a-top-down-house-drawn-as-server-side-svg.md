# 0004. A top-down house, drawn as SVG on the server

Status: proposed. Built in session 2; waiting on Rithika's review.

## Context

Rithika asked for the whole screen to be the house, seen from above "like when
you play games", with a garden, a living room, a kitchen and five bedrooms you
can move between, at any screen size. Each bedroom is personal: Neha's pink
tablecloth and board games, Rithanya's box of cats and UPSC books, Aswathy's
yoga mat and rotting banana, Amirdhavarshini's big room with a mat for
everyone. Five avatars should be recognisable by their hair. ADR 0001 rules
out a build step and runtime dependencies, and the house has no client
JavaScript.

## Options

- Inline SVG built as strings on the server, with each room a link. No
  JavaScript, scales cleanly with a viewBox, and state (night, asleep, mess,
  what's on the desk) is just different markup. The art is hand-written path
  data, and nothing moves.
- A canvas or game engine with a walkable avatar. Feels the most like a game,
  but needs a client bundle, invites real-time, is hard to make accessible, and
  breaks "pages are forms that post and redirect".
- Illustrated images with clickable hotspots. The art could be prettier, but
  every state needs its own layered image and there's no illustrator.
- Rooms as an HTML/CSS grid. Accessible and easy, but hard to make feel like a
  place seen from above.

## Decision

`src/art.ts` builds the SVG. Each room is drawn once in its own coordinates.
The floor plan (a 1000 × 1024 viewBox) places rooms with a translate, and each
room page shows the same drawing with its own viewBox. Rooms are SVG links. The
house page repeats everyone's clock and status as an HTML list, for small
screens and screen readers.

## Consequences

Changing an avatar or a piece of furniture means editing coordinates, and
`src/art.ts` is the biggest file in the repo. Labels on the plan are small on a
phone (about 10px), which is why the HTML list exists. A new room needs space
on the plan, and probably a bigger viewBox. Walking around or animating would
need client JavaScript and a record superseding this one.

Revisit if the five want to walk an avatar around, or the art comes from an
illustrator.
