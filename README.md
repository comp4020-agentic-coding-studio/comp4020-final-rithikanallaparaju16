# Five Windows

Four close friends and I live in Canberra, New Jersey, Tamil Nadu and Bangalore, and we're almost never online at the same time. I didn't want another chat app. Five Windows is a little house we share instead. The main idea is to feel loved no matter where you are: you don't need to wait for anybody to come online. You come back to the house, read the notes your besties left you, write back, leave a voice note, pin something that reminded you of them on the memory wall, and go.

## How to get in

Open the house and pick a window: each one is one of us. Only one person can be each friend at a time, so to try it as two people, open an incognito window and pick a different friend. There's no password for now, so markers can log in on two devices as two people. Walk with the arrow keys on a laptop, or tap where to go on a phone.

## What "good" means here

The one principle: connection must not require being online at the same time. Someone comes by for thirty seconds, leaves something and goes, and someone else finds it days later. A good version of this house:

1. **Works asynchronously.** One person alone gets something out of a visit.
2. **Remembers people.** What you leave survives a refresh, a restart and a redeploy.
3. **Makes coming back worth it.** Coming back quietly shows what your friends did while you were away.
4. **Feels like a place, not a feed.** Rooms, a wall and a kitchen table, never a timeline.
5. **Is built for exactly five.** It's very personal, and assumes we already know each other.
6. **Has few interactions,** each one making us feel closer.
7. **Gets more alive when friends overlap,** without ever requiring it.

The house never punishes absence: plants get thirsty but never die, and Shinzo the dog naps but is never sad.

## It's ours

Rithanya always had face masks in her room, and loves KitKats. Neha loves board games, has her checked blue blanket, and is the furthest from me in time. In our hostel we weren't allowed to cook, so we snuck a kettle into Amirdha's room for Maggi; her room is the biggest, with a mat where we sit, make Maggi and play UNO like we used to. Aswathy got me into meditation, so her room has the yoga mat. All through a friend's birthday month, her room is decorated.

## What I chose not to build

No notifications to disturb anybody: instead the house quietly sits as a widget on your home screen and shows small updates. No likes, counts, feeds or streaks. No chat, which is the one thing the house is meant not to be. Anyone can also make a house for up to seven of their own friends at `/make`.

## What's checked, and what's judged

Enforced by the checks in `spec/`, run on every push before it deploys: a note on a desk is private to its owner and writer, everything left survives a restart, coming back lists what's new, a change appears on a friend's open page without a reload, two friends acting at once don't break it, and every page meets an accessibility floor. Walking, taps and zooming are checked in a real browser by `scripts/walk-check.ts`.

Judged by my friends using it: whether it feels like a place and makes us feel closer. UNO's turns went from ten seconds to twenty because they asked.

## How it's built

Node with no build step, one SQLite file on the Fly volume, server-rendered forms, and server-sent events for live updates. Everything anyone leaves is a row in an append-only table, and the state of the house is worked out from timestamps, so nothing counts down while you're away. Decisions are in `doc/adr/`; how I got here is in `PROCESS.md`.
