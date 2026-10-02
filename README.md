# Five Windows

A little house for five friends who live far apart. Each of us has a window. When you come by, your window lights up. You can leave something on the kitchen table, and whoever comes by next finds it waiting, whether that's an hour later or a week later.

This is deliberately not a chat app. Nobody has to be online at the same time, nothing pings you, and there's nothing to like or count. It's a place that remembers who has been home.

## What "good" means here

A good version of this house:

1. **Works asynchronously.** One person can come by, leave something and go, without waiting for anyone.
2. **Remembers people.** What you leave is still there tomorrow, after a refresh, a restart or a redeploy.
3. **Makes coming back worth it.** When you return, the house tells you who has been by and what's new since your last visit.
4. **Feels like a place, not a feed.** It has windows and a table, not a timeline. There are no likes, follower counts, notifications or infinite scroll.
5. **Is built for exactly five.** The five windows are the whole cast, and the interface assumes you already know each other.
6. **Keeps interactions few and meaningful.** If something doesn't make five people feel closer, it doesn't go in.
7. **Gets more alive when friends overlap.** Being there at the same time should eventually feel special, but it should never be required.

## How it works right now

- **Come in.** Pick your window at the door. The house remembers you on that device. There are no passwords, because there are five of us.
- **Leave something.** Write a short note (up to 500 characters) and leave it on the table.
- **Come back.** Notes your friends left since your last visit are marked *new*, and the greeting tells you who has been by. A window is lit if that friend was here in the last day.

A visit is a stretch of page loads with no 30-minute gap. So the *new* marks survive a refresh or leaving a note, and reset the next time you come back.

## What isn't here yet, on purpose

Photos, drawings, prompts, rooms, real-time presence and notifications are ideas, not commitments. Each one has to earn its place by making five people feel more connected, and the core loop (leave, persist, return, discover) has to work first.

Anyone with the link can pick any window. That's fine for a prototype that strangers at a crit need to walk into. A shared front-door key is the likely next step before the real five move in.

## How it's built

It's kept as small as the problem: one Node process, no framework, no runtime dependencies and no client-side JavaScript.

- `src/server.ts` holds the routes. Everything is a plain HTML form that posts and redirects.
- `src/store.ts` keeps the house in SQLite (Node's built-in `node:sqlite`), in a file on the Fly volume at `/data`, which is the only storage that survives a redeploy.
- `src/pages.ts` renders the door, the house and the table on the server.
- `src/people.ts` lists the five.
- `public/style.css` is the house itself.

Run it locally with `pnpm start` (it keeps its data in `./data`), then run `pnpm check` in another terminal to check it against the spec.

## What's been checked

`spec/house.test.ts` checks the core promise against the running app:

- the door offers five windows
- picking one is remembered
- a note one friend leaves is there, marked new, when another friend comes by
- your own notes are marked as yours
- a note shows exactly as written, even when it looks like HTML
- only the five can leave things

The checks that write only run against a throwaway house, never the deployed one. `PROCESS.md` in the repo records what was verified on the deployed app and how.
