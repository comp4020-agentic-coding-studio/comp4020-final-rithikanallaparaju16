# 0012. Shinzo wanders on his own

Status: proposed. Built in session 8; waiting on Rithika's review. Supersedes
the part of 0009 where Shinzo stays with whoever last petted him or fed him
for half a day, and the napping by the visitor's own clock in `src/pages.ts`;
the rest of 0009 stands.

## Context

Until now Shinzo only moved because of someone: he went with whoever last
petted him or gave him a treat for twelve hours, and otherwise lay on his
blanket in the garden, asleep at night by the visitor's clock. His only
picture (`public/art/laddoo.png`, cut from the Stitch illustration) is him
curled up on that blanket, so whenever he followed someone the sleeping
picture slid along behind her. Rithika asked: "the dog, shinzo can wander
whenever he wants. i want him to get up and wander, rn he wanders while
sleeping on the mat."

Three rules held this up. Nothing friends must see lives in memory or the
browser (0002). State is worked out from timestamps, with no timers (0005).
And `CLAUDE.md` says not to bring back automatic wandering, which was about
the five friends: nobody walks around on her own (0008). A dog doing what he
likes is a different thing; that rule stands for the five.

## Options

- Work out his day from the clock alone. Time runs in ten-minute slots, and
  each slot draws from numbers seeded by its own index: a nap or a wander,
  where he stops, how long he sniffs, how fast he walks. Where a slot starts
  is where the one before it ends, which is that slot's own first draws, so
  finding him never replays the day.
- Store his moves, with a timer or on each page load writing where he went.
  That needs a timer (0005 says no), or it makes him depend on who happens to
  be visiting, and the house would show different dogs to different people
  between writes.
- Animate him in the browser only. Each friend would see a different dog,
  and with no script he'd never move.

## Decision

The first option. `src/house.ts` has the plan (`wander`, `along`, `rejoin`),
and `src/scene.ts` lists where he goes (`DOG_SPOTS`): his blanket and the
room dog spots to nap on, mostly the blanket, and a stop or two in every room.
About seven slots in ten he wanders, with one to three stops, a sniff or a
sit at each, walking 60 to 90 picture pixels a second. The other slots he
walks somewhere and naps there. The plan is the same for everyone, whatever
their clock, so the dog you see is the dog your friend sees.

He still goes with whoever last petted him or gave him a treat, awake, but
for half an hour rather than half a day. Then he walks back into his own day
from wherever he was beside her.

He gets up. When he's awake he's drawn standing (`DOG_STANDING` in
`src/art.ts`), side on, in the picture's golden fur and dark outline, with
legs, tail and head that `public/style.css` walks when he's walking. Only
napping is he his curled-up picture. His blanket is drawn in SVG under the
tree while he's up, since `house.jpg` has it painted out. Napping in a
bedroom, he has his blanket with him, as his picture shows.

The server draws him where the plan has him now, which is right with no
script. The page also carries the next hour of the plan (`data-path`) and the
server's clock (`data-now`), so `public/house.js` can walk him along it.

## Consequences

A house you visit alone has someone else in it: you might find him by his
bowls, or on the kitchen floor, or asleep under the tree, and a friend
looking at the same moment finds him in the same place. Coming back is never
behind: he's just somewhere else.

His day is fixed by the clock, so nothing anyone does changes it except
petting him or feeding him, and then only for half an hour. He walks straight
through walls between rooms, like everyone. Two pictures of him (standing
SVG, curled-up Stitch art) don't match exactly. The standing one is simpler
and flatter than the illustration.

Revisit if the five want him to choose where to go (towards whoever's home,
say), or want a picture of him up and about from Stitch.
