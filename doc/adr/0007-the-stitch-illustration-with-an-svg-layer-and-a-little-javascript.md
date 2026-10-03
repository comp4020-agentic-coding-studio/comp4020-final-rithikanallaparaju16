# 0007. The Stitch illustration, with an SVG layer and a little JavaScript

Status: proposed. Built in session 3; waiting on Rithika's review. Supersedes
0004. How avatars move is superseded by 0008.

## Context

Rithika made the house and the five avatars in Google Stitch and asked for
them to be used: "use the google stitch i uploaded and do the modifications,
the avatars should be able to move around". On a laptop the house should
have the updates beside it; on a phone the house should fill the screen,
with tabs for updates "and other stuff". The Stitch exports are flat images:
a 1376 × 768 cutaway of the house (with a dog called Milo on a blanket in the
garden) and a lineup of five chibi stickers with names written under them.
ADR 0004 drew everything as hand-written SVG and said walking or animating
would need client JavaScript and a record superseding it. ADR 0001 rules out
a build step and runtime dependencies, and every change is a form that posts
and redirects.

## Options

- The illustration as a background image, with an SVG layer in the same
  pixel coordinates on top: room outlines as links, light for the time of
  day as tinted polygons, what people left as small icons, and the stickers
  as `<image>` elements. Avatars wander with CSS animations generated on the
  server. A small script (`public/house.js`) walks your avatar to a room
  before the room opens, and starts a phone's view with you in it. The house
  still works with the script off.
- Keep drawing in SVG (ADR 0004) and only borrow the Stitch layout. Nothing
  new to learn, but it throws away the art Rithika chose.
- A canvas game with a walkable avatar. The most game-like, but a client
  bundle, real-time temptations, and pages that stop being forms.

## Decision

The first option. `scripts/cut-art.py` (Pillow, run by hand, never in the
image) turns the Stitch exports into `public/art/`: `house.jpg` with Milo
and his blanket lifted out and the lawn filled back in, `laddoo.png` (Milo
becomes Laddoo, so he can move to whoever played with him), and one
`avatar-<id>.png` per person, cut from the lineup. `src/scene.ts` holds each
room's outline, name tag, walking spots, pillow, desk, clutter and dog spots
in image pixels, and builds the SVG layer. A room's page is the same drawing
with a viewBox around that room. Where each friend last was is a `place`
column on `visits`. Friends home in the last ten minutes are drawn there;
others are in their own room, asleep in bed during their sleep hours. The
home page has the house with "while you were away" and everyone's clocks
beside it at 1000px and up. Below that the house fills the screen, pans
sideways, and a bar at the bottom has Home, Updates and Everyone.

## Consequences

The art is far warmer than the hand-drawn SVG, and `src/art.ts` shrinks to
icons, clutter and plants. Moving or adding furniture now means a new Stitch
export and new coordinates in `src/scene.ts`, checked by eye over the image.
The house's first client script exists, but only as enhancement: rooms are
still links, actions are still forms, and the spec doesn't need it. Avatars
animate with CSS only, and stop for people who ask for reduced motion. The
JPEG is about 370 KB, which a phone downloads once a day (it's cached).
Showing where friends are is close to presence, but it's only ever where
someone last was, and only for ten minutes, so it never asks anyone to be
online. The stickers' faces are fixed: a sleeping friend is shown as her
sticker's head on her pillow, eyes open.

Revisit if the five want to rearrange rooms, or want to see each other move
in real time.
