# 0008. You walk yourself, and nobody else moves

Status: proposed. Built in session 5; waiting on Rithika's review. Supersedes
the part of 0007 about how avatars move; the rest of 0007 stands.

## Context

In ADR 0007 every sticker wandered around its room on a loop of CSS
animations, whether or not that friend was anywhere near the house, and your
own avatar only moved when you tapped a room. Rithika asked: "dont make the
avatars move if the user is not using it, movemet should only be there if
the user is there. then make the movement easy, for laptop, we can use the
keyboard to move, for phone and ipad like online games-pubg etc". ADR 0007
had turned down a canvas game with a walkable avatar, because of the client
bundle, real-time temptations, and pages that stop being forms. ADR 0001
rules out a build step and runtime dependencies.

## Options

- Keep the SVG layer and add the controls to `public/house.js`. The server
  draws everyone standing still. The script moves only your own sticker: the
  arrow keys or WASD on a keyboard, and a thumb stick on a touch screen, with
  a Go in button for the room you're standing in. Going in is still the
  room's link, so nothing new is posted.
- A canvas game (turned down in 0007). Smoother, but the same objections
  still hold, and none of them is needed for one avatar walking.
- Keep tap-to-walk only. It's simple, but it doesn't give the free movement
  that was asked for.

## Decision

The first option. Nobody moves on their own. Friends stand where they last
were (or sleep in bed), and only someone who's here right now so much as
bobs. Your own sticker moves only when you move it. You can walk anywhere
inside the house, straight through the walls between rooms, so there's
never a door to hunt for. The script knows where you can stand from the room
outlines already in the page. Where you are inside a room isn't saved; going
in is what records where you are, the same as tapping the room. The stick
appears on touch screens (`pointer: coarse`, or after the first touch), and
the keyboard always works unless you're typing in a form. Walking follows a
phone's view sideways. Everything still works without the script.

Added in session 6, also at Rithika's asking: going into a room zooms the
drawing in on it before the room's page opens. Walking out of the room
you're in zooms back out, and the whole house picks up where you stepped
out. Only that page load needs the spot, so it goes in `sessionStorage`
(nothing a friend needs to see). Laddoo, once you've petted him, trots
after you as you walk.

## Consequences

A house you visit while your friends are away is now still, which is
honest: the only movement is yours. A friend who's here at the same time
breathes and glows under her feet, but she doesn't walk around on your
screen, because that would need her moves in real time. Walking takes more
client code than before (about 300 lines, no libraries), and it can only be
checked in a browser, so `scripts/shot.ts` emulates touch at phone widths,
and a scratch script drives the keys and the stick. Walking through walls
is a deliberate simplification; doors would be a later refinement if the
five want one.

Revisit if the five want to see each other walk in real time, or want doors.
