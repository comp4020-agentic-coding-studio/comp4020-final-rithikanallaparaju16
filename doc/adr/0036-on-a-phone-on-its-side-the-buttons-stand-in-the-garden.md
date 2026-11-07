# 0036. On a phone on its side, the buttons stand in the garden either side

Status: accepted. Built on 8 November 2026 from Rithika's screenshot of her
iPhone on its side and "the screen is blocked by the buttons like 'leave sumn
on rithanyas desk' leave light on for rithanya / maybe we can use the green
space on either side for these button only on phones". Adds to 0032.

## Context

A phone on its side (ADR 0032) shows the whole house at the screen's height.
The house is about 1.8 times as wide as it is tall, and a phone's screen
about 2.2 times, so there's garden green either side of it: about 150 px a
side on an iPhone at 844 × 390. The buttons for what you can do (`.moves`,
built by `public/house.js`) stood centred at the bottom, over the middle of
the house, which is where you are and what you're looking at. Standing by a
desk, "Leave something on Rithanya's desk" and "Leave the light on for
Rithanya" covered Rithanya's room.

## Options

- Shrink the buttons in the middle. The house is still covered, less.
- Emoji-only buttons in the green. Small, but "🌙" alone doesn't say
  "Leave the light on for Rithanya", and the label is the point.
- The buttons, with their words, in the green: on the right above its
  walking corner (where a thumb already is), and what doesn't fit there on
  the left above the other corner.

## Decision

The third. `public/house.js` measures the green beside the picture (it
knows where the picture is drawn), and where it's at least 120 px it marks
the pad `.sides` with `--side-w`. The buttons stack in the right-hand
green, Go in at the bottom, nearest the thumb; any that would rise above
the top of the house move into a second column in the left-hand green.
Labels wrap to two lines in a smaller type. It's measured, not set by
screen size, so any phone's shape works, and a screen too narrow for it
keeps the buttons where they were.

Only on a sideways phone's Home: a room on its side fills the screen with
no green, an upright phone has none, and an iPad or laptop doesn't match
the sideways query.

## Consequences

The house on a sideways phone is clear wherever you stand. With many
things lit at once (the kitchen with three dishes out), the two columns
don't line up, which reads fine. The walking corners stay only for
walking; the columns sit above them.
