# 0006. Each bedroom keeps its owner's clock

Status: proposed. Built in session 2; waiting on Rithika's review.

## Context

Rithika: "my room is basically my world... even if Neha enters and for her it's
night, in my room it has to be morning." The five live in Canberra, New Jersey,
Tamil Nadu and Bangalore (two of them). Canberra and New Jersey both have
daylight saving, on different dates. Neha's character should sleep the longest,
and Rithanya's nearly as long. The house has no client JavaScript (ADR 0001).

## Options

- The server works out each person's local time with `Intl.DateTimeFormat` and
  an IANA zone, when it renders the page. Daylight saving comes from Node's
  time-zone data. Clocks show the time the page loaded.
- Clocks in client JavaScript that tick. Always current, but it's the house's
  first client script, and the server still needs the time for lighting.
- Fixed UTC offsets per person. Simple, but wrong for half the year in Canberra
  and New Jersey.

## Decision

Each person in `src/people.ts` has a city, an IANA zone (`Australia/Sydney`
for Canberra, `America/New_York`, `Asia/Kolkata`) and sleep hours: Neha 11:30
pm to 10:30 am, Rithanya 11:30 pm to 9:30 am, everyone else 11 pm to 7 am.
`src/time.ts` turns a zone into a clock label and a part of the day. Night is
8 pm to 5 am, dawn 5 to 7, day 7 to 5 pm and dusk 5 to 8 pm. The part of the
day sets the room's light and the sky in its window. A character in their
sleep hours is drawn asleep in bed, unless that friend has been in the house
in the last ten minutes. Shared rooms, the garden and the page's sky follow
the visitor's own clock.

## Consequences

A friend who moves needs one line changed. "Asleep" is a character's habit, not
a fact about the real person, so the house will sometimes say Neha's asleep
when she isn't. Being in the house overrides it, so it never contradicts
someone who's actually there. Clocks don't tick until the page reloads. The
spec checks each friend's clock on the door against the zone that friend should
be in.

Revisit if someone moves, or the friends want clocks that tick.
