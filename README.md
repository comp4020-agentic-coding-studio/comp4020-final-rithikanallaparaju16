# Five Windows

A little house shared by five friends who live far apart: Rithika in Canberra, Neha in New Jersey, Amirdhavarshini in Tamil Nadu, and Rithanya and Aswathy in Bangalore. Everyone has a room, and everyone shares the living room, the kitchen, the garden and Laddoo the dog.

You come in whenever you're free, leave something for someone, and go. Whoever comes by next finds it, an hour or a week later. Nobody has to be online at the same time, nothing pings you, and there's nothing to like or count. When you come back, the house tells you what happened while you were away.

## What "good" means here

A good version of this house:

1. **Works asynchronously.** One person can come by, leave something and go, without waiting for anyone.
2. **Remembers people.** What you leave is still there tomorrow, after a refresh, a restart or a redeploy.
3. **Makes coming back worth it.** When you return, the house tells you who has been by and what's new since your last visit.
4. **Feels like a place, not a feed.** It has rooms, a wall and a kitchen table, not a timeline. There are no likes, follower counts, notifications or infinite scroll.
5. **Is built for exactly five.** The five of us are the whole cast, and the house assumes you already know each other.
6. **Keeps interactions few and meaningful.** If something doesn't make five people feel closer, it doesn't go in.
7. **Gets more alive when friends overlap.** Being there at the same time should feel special, but it's never required.

## The house

The house is drawn from above, like a game. The garden is out the back, five bedrooms open onto the hallway, and the living room, kitchen and Amirdhavarshini's room are along the front. Amirdhavarshini's is the biggest room, with the biggest bed and a mat on the floor, because that's where everyone hangs out. Tap any room to go in.

Each bedroom is someone's own:

- **Neha's** has a pink tablecloth, a blue checked blanket and the board games. Neha sleeps the longest in the house.
- **Rithanya's** has a box of cats on the study table and UPSC books everywhere. She sleeps in too.
- **Aswathy's** has a yoga mat, a quiet corner with two cushions for meditating together, and a banana that should have been thrown out a while ago. Tidying doesn't touch the banana.
- **Rithika's** has fairy lights, a plant and a desk by the window.
- **Amirdhavarshini's** has the hangout mat, with a cushion for each of us around it.

Everyone has a laptop.

## Every room keeps its owner's time

A bedroom runs on its owner's clock. If it's late afternoon in Canberra and 3 am in New Jersey, Rithika's room is in evening light and Neha's is dark, with Neha asleep in bed, whoever is looking. Each room's window shows the sky where that friend is. The living room, kitchen and garden follow your own clock.

Characters sleep at night where they live: Neha from 11:30 pm to 10:30 am, Rithanya from 11:30 pm to 9:30 am, and everyone else from 11 pm to 7 am. Anyone who's been in the house in the last ten minutes is shown awake and "home now", so being there at the same time shows.

## What you can do

- **Leave something on a friend's desk.** Write a note, add something with it (masala chai, filter coffee, dosa, biryani, Maggi, cake, a mango, a flower or chocolate), and it waits on their desk. Only they can read the note; anyone who walks in sees that something's been left.
- **Write on the living room wall.** Something funny from today, a good-luck wish, anything. Tick "big news" and it stays pinned at the top. Older notes go into a memory box rather than disappearing.
- **Cook for everyone.** Leave a dish out on the kitchen counter. It stays out for three days.
- **Tidy someone's room.** Rooms get a little lived-in after a couple of days, and messier after five. Anyone can tidy any room, and the owner finds out who did.
- **Look after the garden.** Everyone has a patch to plant in. Plants sprout, grow and bloom over three days. They look thirsty after two days without water, but they never die, and anyone can water the lot.
- **Play with Laddoo.** He follows whoever played with him back to their room and naps at the foot of their bed for half a day.

When you come home, **While you were away** lists what's new since your last visit, starting with what was left for you: who tidied your room, what's on your desk, who wrote on the wall, what's in the kitchen. A visit is a stretch of page loads with no 30-minute gap, so the *new* marks survive a refresh and reset the next time you come back.

## What isn't here yet, on purpose

Photos, drawings, real-time presence, notifications, and editing or deleting things you left. Each one has to show it makes five people feel closer first. The avatars are a first pass; they'll get closer to who's who.

Anyone with the link can pick anyone at the door. That's fine for a prototype that strangers at a crit need to walk into, but it means a private desk note is a courtesy, not a lock. A shared front-door key is the likely next step before the real five move in.

## How it's built

It's kept as small as the problem: one Node process, no framework, no runtime dependencies and no client-side JavaScript. Every page is drawn on the server, and every action is a plain HTML form.

- `src/server.ts` holds the routes.
- `src/store.ts` keeps everything people leave in one SQLite table (Node's built-in `node:sqlite`), in a file on the Fly volume at `/data`, the only storage that survives a redeploy.
- `src/house.ts` works out what the house looks like from that log: how messy a room is, how thirsty the plants are, where Laddoo is, and what's on the counter.
- `src/time.ts` turns each friend's time zone into a clock and a time of day.
- `src/art.ts` draws the house, the rooms, the five of us and Laddoo as SVG.
- `src/pages.ts` puts the pages together, and `public/style.css` styles them.
- `src/people.ts` lists the five, with their cities, time zones and sleep hours.

The big decisions (the stack, the storage, who counts as a person, the drawn house, the log of things, and the clocks) are written up as decision records in `doc/adr/` in the repository.

Run it locally with `pnpm start` (it keeps its data in `./data`), then run `pnpm check` in another terminal to check it against the spec.

## What's been checked

`spec/house.test.ts` checks the house's promises against the running app:

- the door offers the five of us
- each friend's clock shows the time where they live
- choosing who you are is remembered
- a note on the wall is there, marked new and named in "while you were away", when another friend comes by
- your own notes are marked as yours
- a note shows exactly as written, even when it looks like HTML
- only the five can leave things
- a note left on a friend's desk reaches that friend, and others only see that it's there
- food from the kitchen is on the counter for everyone
- a friend finds out who tidied their room
- the garden remembers who planted what and who watered it
- Laddoo follows whoever played with him
- the house only takes things it has

The checks that write only run against a throwaway house, never the deployed one. `PROCESS.md` in the repo records what was verified on the deployed app and how.
