# 0013. UNO games are replayed from moves in the log

Status: proposed. Built in session 8; waiting on Rithika's review.

## Context

Rithika asked: "give option of the avatars to play uno wheneber they sit
togther in amirdhas room. make a uno game w 7 cards to each player. max of 5
players can play this game." Amirdhavarshini's mat already has a cushion for
each of the five, and sitting on it is a `sit` row with the item `mat`
(0009). A game of UNO has much more state than anything else in the house:
a shuffled deck, five private hands, a discard pile, whose turn it is, which
way play goes, and whether the player whose turn it is has just drawn.

Two rules held this up. Everything friends must see lives in SQLite (0002).
Things people leave go in the append-only `things` table, and state is
worked out from them, with no timers (0005). And the house never requires
being online at the same time, so a game has to wait for whoever's turn it
is, for as long as she's away.

## Options

- Keep the game as moves in `things`. A `uno` row deals: its item is the
  players in turn order, and its body is the seed for the shuffle. Each
  `unomove`, placed `uno:<game id>`, is a card played, "draw" or "pass",
  with the colour picked for a wild in its body. A small engine in
  `src/uno.ts` deals from the seed and replays the moves to get the table.
- Keep the table in its own table, updated in place after each move. Reading
  is quicker, but it's the first state in the house that isn't worked out
  from the log, and a bug in one update would corrupt a game for good.
- Keep the game in the browser, or in memory. Friends would lose it on a
  refresh or a redeploy, which 0002 rules out.

## Decision

The first option. A seeded shuffle (mulberry32, a few lines, no library)
means the deal never has to be stored, and replaying is deterministic: the
same rows always give the same table, reshuffles of the discards included.
The server checks every move by replaying the game and trying the move
first: whether it's your turn, whether the card is in your hand, whether it
fits. It refuses anything the engine refuses, so the log only ever holds
legal moves. The replay skips any it doesn't accept anyway.

You can deal only while you're sitting on the mat with at least one friend.
The players are everyone sitting there, you first, so there are five at
most. Once dealt, the game doesn't need anyone to stay sitting, or to be
online. Each friend sees her latest game. Dealing a new one puts the old one
away for everyone in it. There are no penalties: nobody is caught for not
calling UNO, and nobody's turn times out.

Updates says who dealt and who won, not every card. The cards played stay
out of the Updates dot too.

## Consequences

A game survives refreshes, restarts and redeploys, and can last days. Every
page that shows UNO replays the game from its first move. A long game with
five players is a few hundred moves, which is nothing next to rebuilding
the house from the whole log on every page already. Pages share one replay
per request. The engine is pure, so a scratch script played 3000 random
games through it, checking that every game ends, that all 108 cards stay
accounted for, and that replaying the stored rows lands on the same table.

The rules are the common ones, simplified where the house prefers kindness.
A Wild Draw Four can always be played. After drawing, you may play only the
card you drew. A Reverse with two players works as a Skip. Card codes and
the two new kinds are stored, so they can't be renamed (0005).

Revisit if the five want house rules, like stacking Draw Twos, or more than
one game going at once.
