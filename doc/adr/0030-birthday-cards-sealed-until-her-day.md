# 0030. Birthday cards, sealed until her day

Status: accepted. Built on 5 November 2026 from RICE row AA, at Rithika's
asking ("do all of these and push the live site", then "make all these
work for "make your own houses" as well"). Aswathy's birthday is 8
November.

## Context

A birthday wish (`wish`) is a row with no words: friends can say happy
birthday during her birthday month, but nobody can write her anything,
and nothing can be written ahead. Being apart means the day often lands
while friends are asleep or busy. RICE scored a sealed card highest of the
new ideas (144): written whenever you think of it, opened on her day by
her own clock.

RICE left two calls for Rithika: does she see who wrote before it opens,
and can friends read each other's cards. She asked for it built without
answering them, so the agent made both, named here and in the reply.

## Decision

- A new kind, `card`: the place is her room, the body the words, the item
  the day it opens, "YYYY-MM-DD", in her own calendar (her next birthday
  by her own clock when it's written, `nextBirthday()` in `src/time.ts`).
  A 29 February birthday opens on 28 February in other years.
- Anyone can write one any time of year in a friend's room
  (`POST /room/<id>/card`), not in their own, and not blank. A friend
  whose birthday the house doesn't know has no card to write.
- Before the day she sees who's written, never the words: "2 cards from
  Neha and Rithanya, waiting for your birthday (Sunday 8 November)". On
  the day, they open in her room. After it, they stay hers to read, in
  "Cards from birthdays before".
- Nobody else reads a card, ever, like a desk note: its writer sees the
  ones she sealed, and other friends see nothing of it.
- Updates tells her "Neha left you a birthday card, sealed until your
  birthday"; nobody else hears, so a surprise stays one.
- Her widget has a card for them: who's written, never what, and "Your
  birthday cards are open" on the day. New ones show first (ADR 0029).
- The same in a made house, which takes birthdays on its form.

## Consequences

A card is a courtesy, not a lock, like a desk note (RICE G): anyone who
comes in as her can open her room. Its words are never logged.

A card written on her birthday opens straight away: the next birthday by
her clock is today. Friends who forgot can still write her one on the day.
