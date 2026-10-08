# 0014. The living room's lights are always on

Status: superseded by 0015 the same day, when every common area became
always lit. It was proposed, built in session 8, and it superseded
the part of 0006 that has the living room follow the visitor's clock; the
rest of 0006 stands.

## Context

In 0006, shared rooms, the garden and the page's sky follow the visitor's
own clock. After 8 pm the visitor's night shade covered the living room,
with only the fireplace glowing. Rithika came by at 9:38 pm in Canberra and
asked "why is the living room dark", then said "the living room cant be
dark, make it have light everything". The living room is where everyone
ends up: the sofas, the wall of notes and movie night are all there.

## Options

- Keep the living room out of the visitor's night, the way bedrooms already
  are (they have their owners' light instead). After dark, its lamps add a
  warm glow over the sofas.
- Turn the night shade down everywhere. The house stays brighter, but every
  room loses some of its time of day, and the living room is still dimmer
  than in the day.
- Drop the visitor's clock from every shared room. The kitchen and garden
  would be bright at midnight too, and the garden at night is part of the
  house feeling like a place.

## Decision

The first. The living room's outline joins the bedrooms in the mask that
keeps the visitor's shade out (`not-bedrooms` in `src/scene.ts`), so it never
gets the night, dusk or dawn tint. When it's dusk or night by the visitor's
clock, a warm tint and a lamp glow over the sofas show its lights are on,
beside the fireplace's glow. The kitchen and garden still follow the
visitor's clock, and bedrooms their owners'.

## Consequences

Whatever the time, coming home finds the living room lit, which suits the
room everyone shares. At night there's a visible edge where the lit living
room meets the darker kitchen and garden, like the edges between bedrooms
on different clocks. The spec checks that the living room's outline is in
the mask on the house and on the living room's own page.

Revisit if Rithika wants the kitchen, or the whole house, lit the same way.
