# Process

## The problem, and the principle

Four close friends and I live in Canberra, New Jersey, Tamil Nadu and
Bangalore, and we're almost never online at the same time. I didn't want
another chat app. The one principle I gave the agent was that *connection
must not require being online at the same time*: someone comes by for thirty
seconds, leaves something and goes, and someone else finds it days later.
[README.md](README.md) argues what "good" means for this house. This file is
how I got from that to the harness, the stack and the app.

The main idea of this house is to feel loved no matter where you are. You dont need to wait for anybody to come online and talk to you. You can go back to the house, read the notes your besties left for you, write them back, leave voice notes, update your friends w something that reminded you of them, see all of your memory wall etc. Best part is, this app never disturbs you, it quietly sits as a widget on your wallpaper, just click and go to your virtual house whenevr you feel like it. The small widget is the size you choose and keeps showing small updates to make you feel loved even though y'all are miles away.

Made this same idea, work for other friends as well as suggested by my tutor. So now, any body can make a group of maximum of 7 friends, give their timezones,name,gender,birthday and what they need in their room to generate an entire house for you. The made house works similar to the main one but the things that you wanted in their room will not be placed well.

## From a brief to a harness

I started with a long direction prompt. It covered the product, the feeling
(warm, a bit nostalgic, never a feed or a dashboard), a seven-point
definition of good, and how I wanted to work. The agent turned it into
`CLAUDE.md` and built a first slice, notes left on a kitchen table, in
[`0ed431d`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0ed431d).


The agent makes the small calls and names every product decision in its
reply, so I can redirect it. This app is very personal. To give the reader a gist
Rithanya: She always had face masks in her room where we all used to go and spend time using them, she loves kitkats. You can see these in her room
Neha:She is a big fan of board games and has a large time difference with me. I also tried to recreate her checked blue blanket.
Amirdha: We loved hanging out in her room and in our hostel we werent allowed to cook so we used to sneak in a kettle to make instant noodles(maggie), so i made her room the biggest and made a place where all of us can sit and make maggie. We can also play UNO there like we used to in our hostel.
Aswathy: She is the person who got me into meditation. This helped me in a lot of ways, i used to go to her room every morning to meditate on the yoga mat which you can see there
Added birthdays as well, on that whole month the room will be decorated.
There is a shared memory board, a place on each of our desk where you can leave personal notes etc
These are just a small part of a large amount of detail. 
 Every prompt, correction and commit is in [doc/process-log.md](doc/process-log.md). Big
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

The rooms and people are personlized and apply to my close friends. for now player can take the character of one of us and continue.

I will add passwords on login once the marker checks my crit, i didnt want extra load for the marker when they try to login on 2 devices as 2 people.

Used google stich to come up with the avatars and areas. it was easier to re iterate and get the layout of the house and how my avatars should look using stitch

![The house from Google Stitch](stitch_virtual_shared_house/expansive_panoramic_top_down_cutaway_architectural_dollhouse_isometric/screen.png)

![The five of us as Stitch stickers](stitch_virtual_shared_house/a_character_lineup_of_5_ultra_cute_chibi_avatar_stickers_displayed_side_by_side/screen.png)

need to make the app persistent. right now it works on every refreshing.

The following shows the corrections i had to make. This website is very personalised and was very difficult to tell claude. The funniest one would be when
asked claude to personalise my friends room by placing a kitkat box, instead claude added cats, A BOX OF CATS.
  [`df979fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df979fe),
  

## Overview of the website

A tour of the house, with screenshots at laptop, phone and iPad widths, is in [doc/website-tour.md](doc/website-tour.md).

## Prompts

Every prompt I gave the agent from 8 October, with the commit it led to, is in [doc/prompts.md](doc/prompts.md).
