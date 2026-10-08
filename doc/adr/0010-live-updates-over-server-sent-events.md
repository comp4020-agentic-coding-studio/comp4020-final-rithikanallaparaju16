# 0010. Live updates over server-sent events

Status: proposed. Built in session 8; waiting on Rithika's review.
Supersedes the part of 0008 that says a friend who's here at the same time
doesn't walk around on your screen; the rest of 0008 stands.

## Context

Until now a friend's change showed on your next page load. Rithika asked:
"i want you to use liveview for viewing all the updates live, i should not
need to refresh my page everytime to see what is going on." The same
message asks for hugs between friends who are close and online, and for a
friend's window at the door to be closed while someone is in the house as
her. Both only make sense if open pages hear about each other.

Three rules held this up. There's no build step and no runtime dependency
(0001). Everything friends must see lives in SQLite (0002), and state comes
from the log and timestamps, with no timers (0005). The README's "Deliberately
left out" listed real-time presence, which had to show it made five people
feel closer first. "Liveview" is also the name of a Phoenix (Elixir)
library. Taking that literally would mean a new stack, so it's read as
"live view": the pages update themselves.

## Options

- Server-sent events. Every open page keeps `GET /live` open, a plain HTTP
  response that never ends. When anything is written, the server sends
  `changed`; the page fetches itself again and swaps in the parts that
  changed. When a friend walks, it sends `moved` with where she is, so she
  walks on your screen. Node's own `http` does all of it, and pages stay
  server-rendered.
- WebSockets. Two-way, but the only thing a page sends is where you walked,
  which `POST /here` already does. Node has no WebSocket server built in, so
  it's a hand-written protocol or a dependency.
- Polling every few seconds. Simplest, but it's late by the poll interval,
  wakes the Fly machine for nothing, and still can't show someone walking.

## Decision

Server-sent events. `src/live.ts` keeps the open connections. Each write in
`src/store.ts` tells it what happened: `leave()` is `changed`, walking is
`moved`, and a page load is `changed` only when it shows (a friend came
home or went into another room). That last rule keeps a page fetching itself
from setting every other page off again. `moved` only goes to signed-in
pages. The door hears `changed`, for windows opening and closing.

`public/live.js` does the page's side. On `changed` it fetches the page it's
on, without `?did=` so nothing pops twice, and replaces each part marked
`data-live` (the news line, "while you were away", Everyone, the tabs, and
each card and list beside a room) with its new version. It skips a part
you're typing in. The house drawing belongs to `public/house.js`, which
gets the new page as a `house:fresh` event and a friend's steps as
`house:moved`. While you walk, it tells the house where you are a few times a
second rather than only when you stop.

An open connection is how the house knows you're here. A page with the
house open keeps your visit going, so you stay "home now" while you're
looking, even without clicking anything. When the last page closes, friends
hear about it a few seconds later. Moving between pages reconnects before
then, so it doesn't count as leaving.

## Consequences

Notes, food, naps, masks and everything else turn up on everyone's screen
as they happen, and friends who are in at the same time see each other walk.
That makes overlapping more alive without making it necessary. Nothing new
is stored: a page that misses an event is only as stale as pages were
before. Without the script, every page still works and shows the latest on
the next load. `/live` and `/live.js` are the house's first routes that
aren't pages or forms.

An open connection keeps the Fly machine awake while someone has the house
open. It still stops when nobody does, so the cost is the time five people
spend looking, not a server running all day. A heartbeat every 25 seconds
keeps Fly's proxy from closing a quiet connection. Each change costs every
open page one fetch of itself, which is fine for five people and wouldn't be
for five hundred.

Added later in session 8, when Rithika said "the uno game is lagging": the
UNO page had no `data-live` part, so a friend's move only showed after a
reload, and every card played was a whole page load as well. The game is now
one live part, and the hand is a `data-quick` form: `public/live.js` posts it
with `fetch` and swaps the answer in, the same way it swaps in a friend's
change. The form still posts and redirects without the script, and a
refused move posts again the ordinary way to show why. A button you've just
pressed no longer counts as being busy with that part; only typing does.

Revisit if the five want to see what each other are typing, or if a page
fetching itself starts to feel slow.
