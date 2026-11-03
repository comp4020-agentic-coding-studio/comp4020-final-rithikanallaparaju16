# 0023. A video call is planned like movie night, from a planner open at any time

Status: accepted. Built on 3 November 2026 at Rithika's asking ("let the
planner be there from anytime, because sometimes we wanna video call as
well, its easier to check times"). Adds a kind; changes nothing in 0005
(state from timestamps) or 0010 (live).

## Context

The planner from 0022's session sat only on the Movies page, only once a
movie had been suggested, and started two hours ahead. Rithika wants it
whenever, from now, and for video calls too: most often just to see what
time it'll be for everyone.

## Options

- A planner on its own tab. The bar is full on a phone (Home, Updates,
  Movies, Everyone), and a fifth tab for one form isn't worth it.
- The planner on the Everyone tab, which already shows everyone's clock
  right now, and also on Movies. One form, two places.
- A call as a `movienight` with no movie. Its place is `movie:<id>`, and the
  rows would read as broken movie nights.

## Decision

- `planner()` in `src/pages.ts` is one form, `POST /plan`, on the Everyone
  tab (a call, picked first) and on Movies (movie night first, once there's
  a movie). It starts at the next quarter of an hour, has no lower limit, and
  only refuses to plan a time that's gone. "Back to now" resets it.
- A call is a new kind, `call`: the place is `calls`, the item is the moment
  in milliseconds, and the body is what it's about, if anyone said. The
  latest plan stands until two hours after it starts (`nextCall()`), shown
  in everyone's own time on the Everyone tab, and Updates tells each friend.
- `/movies/night` still works for any old form or link.

## Consequences

The house still sends nobody anything: a planned call is only found by
coming by. The call itself happens on whatever app the five already use.

A call, like movie night, is replaced by the next one planned.
