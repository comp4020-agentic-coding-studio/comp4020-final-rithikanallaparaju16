# 0020. A made house's rooms are picked from a set of pictures

Status: accepted. Built on 21 October 2026 at Rithika's asking. Supersedes
0018 (Claude draws what's in a made house's rooms) for new houses; houses
made under 0018 keep their drawings.

## Context

Under 0018, Claude drew the things typed for each room as flat shapes when
the house was made. On the live site that never happened: the course key
goes through the course's proxy, which only answers the ANU network, so Fly
can't use it (0019), and every live house got paper tags.

The course key can also make images, through the same proxy: $0.10 each,
from a $30 budget for the whole course that never resets, at URLs that
expire. Rithika asked for "a set of images that people will generally use,
and when the user is making 5 rooms for thier friends, give these opetions
only".

## Options

- Make pictures per house, as people type. The live site can't reach the
  proxy, and fifteen pictures a house is $1.50, about twenty houses.
- Make a set once, on Rithika's machine, commit it, and let people pick from
  it. Works live, costs once, and every room matches.
- Keep free text, and show a picture when what was typed matches one. Typed
  things without a match still get tags.

## Decision

A set of 42 common bedroom things, made once and committed.

- `src/belongings.ts` lists them: a key, the words a room page shows, and the
  prompt the picture was made from. Keys are stored in saved houses, so
  never rename one.
- `scripts/make-belongings.py` (dev-only, needs the VPN) makes each with
  `flux-1.1-pro`, downloads it straight away, cuts away its white background,
  and saves it as `public/art/thing-<key>.png`, 160 px. It makes only those
  missing, or the keys named. Flux suited the house better than Recraft,
  which added backgrounds. The 42, with four remade, cost $4.60.
- The maker's form shows them as a grid of ticks for each friend, up to six,
  with the first eight showing and the rest behind "Show all 42". Nothing
  else is accepted: an unknown key is dropped.
- A friend's `things` are the words for the pictures ticked, so the room
  page, Claude's room sentence and older houses all read them as before.
  The keys go in a new `belongings` field, and the first three pictures
  stand in her room where the tags were.
- Claude no longer writes or draws the things. It still writes each room's
  sentence and the rest of the house when it can be reached.

## Consequences

Every made house, live or local, has pictures in its rooms, in one style.

Friends can only have what's in the set. Anything else (a box of KitKats, a
sewing kit) can't be added unless a picture is made for it: add a line to
`BELONGINGS`, run the script on the VPN, and commit the picture.

The set's 42 pictures are 464 KB; the form loads the first eight per friend,
and the rest only when shown.

Revisit if people keep wanting things the set doesn't have.
