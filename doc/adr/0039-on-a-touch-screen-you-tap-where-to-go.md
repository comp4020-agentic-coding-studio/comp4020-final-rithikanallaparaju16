# 0039. On a touch screen, you tap where to go

Status: accepted. Built on 9 November 2026 from Rithika: "i dont like how
the toggle is moving everywhere if i drag it across the screen, also is it
possible to move my character by touch? will that make the display better?
like i can j touch my character and move them around?" Asked to choose, she
picked "Tap where to go" over dragging only, or keeping a fixed stick.
Supersedes the walking corners on touch screens (session 7, and ADR 0032's
corners on the screen's own corners). Keys on a laptop are unchanged.

## Context

On a touch screen you walked by holding a bottom corner: a stick came up
under the thumb, and sliding past its edge brought the stick along, so a
thumb could never run off it. Dragged across the screen, the stick chased
the thumb everywhere, which is what Rithika didn't like. The corners also
took up both bottom corners of every page with the house, and their circles
and "Hold a corner to walk" sat over the cards below a room's picture on an
upright phone.

## Options

- Keep the stick, fixed where the thumb first lands. The smallest change;
  the corners still cover the house.
- Drag your own sticker. Direct, but your sticker is small on a phone, and
  getting across the house is many drags.
- Tap where to go, and drag yourself too. The house is the control.

## Decision

The third, in `public/house.js`:

- A tap on the floor of the room you're in (anywhere on the house on Home)
  walks you there, through the same walking as the keys, at the same pace,
  so friends see you walk.
- A finger on your own sticker drags you: you walk after it. While a finger
  is dragging you, an upright phone's house holds still under it instead of
  panning to follow you, or the floor would slide out from under the finger.
- A tap on another room walks you in, as before. A swipe still scrolls the
  page or pans a phone's house; only a short, still tap walks.
- Only a finger or a pen (the event's own `pointerType`); a mouse clicks as
  it always did, so a laptop, or an iPad with a trackpad, is unchanged.
- The corners and stick are gone on a touch screen, and the hint says "Tap
  where to go, or drag yourself".

`scripts/walk-check.ts` checks it in headless Chrome with real touches,
upright and on its side, and that a laptop's click doesn't walk and its keys
do. The spec checks the stylesheet hides the corners on touch and the served
script carries the tap.

## Consequences

The house is clear on a phone: no circles in the corners. Tapping the floor
of the room you're standing in on Home walks you there instead of going in;
Go in does that, and tapping another room still walks you in. Walking is in
a straight line, through walls, as the keys always were (the walls are gaps
between room outlines, ADR 0008).
