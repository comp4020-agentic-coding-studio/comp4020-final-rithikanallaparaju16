# Process

## The problem, and the principle

Four close friends and I live in Canberra, New Jersey, Tamil Nadu and
Bangalore, and we're almost never online at the same time. I didn't want
another chat app. The one principle I gave the agent was that *connection
must not require being online at the same time*: someone comes by for thirty
seconds, leaves something and goes, and someone else finds it days later.
[README.md](README.md) argues what "good" means for this house. This file is
how I got from that to the harness, the stack and the app.

## From a brief to a harness

I started with a long direction prompt. It covered the product, the feeling
(warm, a bit nostalgic, never a feed or a dashboard), a seven-point
definition of good, and how I wanted to work. The agent turned it into
`CLAUDE.md` and built a first slice, notes left on a kitchen table, in
[`0ed431d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0ed431d).


The agent makes the small calls and names every product decision in its
reply, so I can redirect it. Details only I know, like the KitKats, the
hostel kettle Maggi and a dog called Shinzo, come from me. Every prompt,
correction and commit is in [doc/process-log.md](doc/process-log.md). Big
decisions are [ADRs](doc/adr/), and changing one means writing a new record
that supersedes it. When I asked for a walkable avatar, which
[ADR 0007](doc/adr/0007-the-stitch-illustration-with-an-svg-layer-and-a-little-javascript.md)
had turned down, the agent wrote
[ADR 0008](doc/adr/0008-you-walk-yourself-and-nobody-else-moves.md) rather
than editing 0007.

## step by step

The stack is Node 24 running TypeScript directly, `node:sqlite` on the Fly
volume, server-rendered HTML forms, and no runtime dependencies
([ADR 0001](doc/adr/0001-a-zero-dependency-node-server-with-html-forms.md),
[ADR 0002](doc/adr/0002-store-the-house-in-sqlite-on-the-fly-volume.md)).
That's sized to five people, one small machine, and one volume that
survives a redeploy. A JSON file would have held our notes, but SQLite gives
crash-safe writes for free. A markdown library would have rendered
`/readme/`, but a small renderer kept dependencies at zero, at the cost of a
rule that the README stays inside what it supports.

Everything anyone leaves is a row in one append-only table, and the state of
the house (a lived-in room, a thirsty plant, where the dog is) is worked out
from timestamps, not timers
([ADR 0005](doc/adr/0005-one-log-of-things-with-state-derived-from-time.md)).
That's how the house never punishes absence: nothing counts down while
you're away. Where you stopped walking is current state rather than
something you left, so it lives on your `visits` row instead
([ADR 0009](doc/adr/0009-the-house-keeps-where-you-stopped.md),
[`8c0b81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c0b81e)).

The rooms and people are personlized and apply to my close friends. for now player can take the charater of one of us and comtinue.

Used google stich to come up with the avatars and areas,

need to make the app persistent. right now it works on every refreshing.

The corrections that mattered changed a rule, not just the code.

  asked claude to personalise my friends room by placing a kitkat box, instead claude added cats, A BOX OF CATS.
  [`df979fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df979fe),
  
- **Widths nobody looked at.** fixed the layouts on phone and ipad screens as well
  ([`3e04bde`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3e04bde)).

  ([`ccf0229`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/ccf0229)).
- **A migration under a running server.** A new server that failed to bind
  its port had already migrated my local database under the old one.
  `CLAUDE.md` now says to use another port and a copy of the data
  ([`205b1d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/205b1d8)).
 data was not persistent, i tried to fix that.
  ([`8c0b81e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c0b81e)).

## Prompts

Every prompt I gave the agent from 8 October, word for word, with the commit it led to.

- "i want you to use liveview for viewing all the updates live, i should not need to refresh my page everytime to see what is going on. and if one person is logged in as one of us, nobody else can choose that person. so max of 5 users can only use my website. i want the avatars to be able to hug eachother. there can be a group hugs of 1,2,3,4 or evan and at max 5 people. the option should show if im close to any user that is online. i also wanna add birthdays and the avatars should be able to celebrate in the whole birthday month. the whole month there should be some decorations in the birthday girls room and a crown on her head. the dog, shinzo can wander whenever he wants. i want him to get up and wander, rn he wanders while sleeping on the mat.Fanning work out to subagents is encouraged for complex tasks. make sure they work together.make nehas sleeping hours to be 10. and give option of the avatars to play uno wheneber they sit togther in amirdhas room. make a uno game w 7 cards to each player. max of 5 players can play this game. so now i will add the birthdays rithika 16th october neha 2nd june aswathy 8th november rithanya january 12th Amirdha may 19th in process.md add this prompt and its hash. do this for every prompt so i can change it later": [`cd89e32`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/cd89e32) (written up in [`2b110a0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/2b110a0))
- "continue and open the live after", "continue and ship it when done and open it live" and "continue": the same work, shipped as [`cd89e32`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/cd89e32)
- "why is the living room dark": a question, no code change. It's night by my clock, and the shared rooms follow the visitor's clock.
- "the living room cant be dark, make it have light everything": [`e81ef0d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/e81ef0d)
- "the uno game is lagging, pls fix it": [`fdd9f94`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/fdd9f94)
- "no common area should be dim, let it always have light, only rooms dim up in that particular persons timezone. and if somebody leaves the house, they quit from the game, dont make the others wait for their turn. and best way to check if someone is away is by a 10 sec timer. every player gets 10 sec for their turn": [`d0bcf63`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d0bcf63)
- "make it 20 seconds and push. i added reflections as well": [`0095db4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0095db4), and my reflection in [`8c66048`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8c66048)

  so for the new update in the game-uno, i asked my friends to try it and 10 sec was too less so i chnaged it to 20sec ([`0095db4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0095db4)).

- "so for the new update in the game-uno, i asked my friends to try it and 10 sec was too less so i chnaged it to 20sec. add this with the commit hash of prev prompt": [`e1c6183`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/e1c6183)
- "push and ship it": shipped with my reflection's update in [`75b1794`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/75b1794)
- "in the big memory wall, make it in a way that we can react to the news posted on it, like the person should know that we read it and how i feel so give everybody options of stickers to put on each news on memory board": [`eecb5f6`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/eecb5f6)
- "can we ship it now": everything was already shipped and tagged `crit-9` at [`ce99177`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/ce99177). I first chose to leave my draft of the rest of this file out of the snapshot, then changed my mind (below).




- "push it now after adding the commit hash for so for the new update in the game-uno, i asked my friends to try it and 10 sec was too less so i chnaged it to 20sec.": that note was already here with its commit, [`0095db4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0095db4), so it went up with the log.
- "no push everything": my draft of this file went into the crit 9 snapshot, [`3627ef5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3627ef5)
- "is this the final process.md? cuz i want the ending to have commit hash": brought this list up to date, so it ends on a commit, [`3627ef5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3627ef5)
- "hi queen , lets start crit 10, first lets talk ab this idea. i wanna add an LLM where this website becomes for everybody …": we talked it through first and made the branch `llm-any-friends`.
- "but rooms should increase if its more friends, for now lets stick to 5 friends for the prototype, try your best to make this work, you can fan out subagents and make them talk and intereact w eachother queen, goodluck": the house can hold more than one house, [`0997905`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0997905); the maker agent built `/make`, [`083033e`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/083033e); the rooms agent gave made houses their own rooms, [`71209b0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/71209b0)
- "continue and open the live site when youre donw", "live site, because i want to it be in process.md" and "continue and ship it when done, then open the live4 site": the who-did-what logs for crit 10, [`d669cbc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/d669cbc), and everything merged and shipped, [`09269ed`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/09269ed)
