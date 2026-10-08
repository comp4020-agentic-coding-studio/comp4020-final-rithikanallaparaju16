# 0016. UNO turns last ten seconds

Status: proposed. Built in session 8; waiting on Rithika's review. Supersedes
the part of 0013 where a game waits for whoever's turn it is, however long
she's away; the rest of 0013 stands.

## Context

In 0013 a dealt game waited for each player's turn for as long as it took.
Rithika asked: "if somebody leaves the house, they quit from the game, dont
make the others wait for their turn. and best way to check if someone is
away is by a 10 sec timer. every player gets 10 sec for their turn".

This goes against a rule in `CLAUDE.md`: the house never punishes absence.
Rithika is asking for it for this one game, so this record names it as a
deliberate exception, not a change to the rule.

0005 says state comes from timestamps, with no timers.

## Options

- **Work the timeouts out from timestamps, as everything else is.** A turn
  starts at the deal or the move before it. Replaying a game at a moment
  plays out every turn that had run out by then. Leaving the house writes a
  `quit` move. Open pages count the turn down, and when it runs out they ask
  for the page again.
- **A timer on the server that writes a "timed out" row.** It needs
  something running per game, and a restart loses it. 0005 rules this out.
- **Use whether her page is open (the live connection) to say she's away.**
  It's quicker, but Rithika asked for the ten-second timer, and someone with
  the page open who isn't playing still holds everyone up.

## Decision

The first.
- **The rule, in `src/uno.ts`:** each turn has ten seconds (`TURN`). Whoever
  lets hers run out is out of the game. Her cards go under the draw pile,
  and the next player in the direction of play takes the turn, with a fresh
  ten seconds. Someone who'd just drawn a card was there, so for her running
  out only passes.
- **Leaving the house:** pressing "Not Neha?", or coming in as someone
  else, writes `unomove` "quit" for any game she's still in. She's out
  straight away, even if it isn't her turn.
- **The last one left wins.**
- **Replay:** it plays out the timeouts between stored moves and up to now.
  The server does the same before checking a move, so a move after your
  time is up is refused. A stored move gets half a second of grace, because
  the server checks it a moment before storing it.
- **The page:** it shows the seconds left (`data-deadline`, by the house's
  clock via `data-now`). When a turn runs out, `public/live.js` fetches the
  page again, because nothing is written when time runs out, so no live
  update would bring it.

## Consequences

Nobody waits on a friend who's wandered off. The game only works with
everyone there at once, which is a change for this house; it's the one
place that needs you present, and that was asked for.

Ten seconds is short for someone deciding, or on a slow connection, and a
single missed turn takes you out. Nothing stores the timeouts, so changing
`TURN` later would replay old games differently. That's harmless, because
only the latest game is shown.

The spec waits out a real ten-second turn, which adds about eleven seconds
to a run.

Revisit if ten seconds feels too short, or if the five want a missed turn to
pass instead of putting them out.
