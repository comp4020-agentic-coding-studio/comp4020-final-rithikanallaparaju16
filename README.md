# Five Windows

A little house shared by five friends who live far apart: Rithika in Canberra, Neha in New Jersey, Amirdhavarshini in Tamil Nadu, and Rithanya and Aswathy in Bangalore. Everyone has a room, and everyone shares the living room, the kitchen, the garden and Shinzo the dog.

The main idea of this house is to feel loved no matter where you are. You dont need to wait for anybody to come online. You can go back to the house, read the notes your besties left for you, write them back, leave voice notes, and see your memory wall. This app never disturbs you: it quietly sits as a widget on your wallpaper, so you can just click and go to your virtual house whenever you feel like it.

## How to get in

Pick a window at the door: each one is one of us. To try it as two people, open an incognito window and pick a different friend. There's no password for now, so markers can log in on two devices as two people.

## What "good" means here

The main "good" is that the website makes you and your besties feel close even when you are miles away: sumn you come back to when you miss them, or when you wanna show them some love when they're going through something tough.

1. **Works asynchronously.** Come by, leave something and go, without waiting for anyone.
2. **Remembers people.** What you leave survives a refresh, a restart or a redeploy.
3. **Makes coming back worth it.** The house tells you who has been by and what's new.
4. **Feels like a place, not a feed.** No likes, counts, notifications or infinite scroll.
5. **Is built for exactly five.** It assumes you already know each other.
6. **Keeps interactions few and meaningful.**
7. **Gets more alive when friends overlap,** but never requires it.

The house never punishes absence: plants get thirsty but never die.

## Each room is someone's own

Rithanya's has the face masks we used to share and her KitKats. Neha's has her board games and checked blue blanket. Amirdhavarshini's is the biggest, with the mat where we make kettle Maggi and play UNO like we did in our hostel. Aswathy's has the yoga mat where she got me into meditating. Every room keeps its owner's time, and is decorated all through her birthday month.

## What you can do

Leave a note, a drawing or a voice note on a friend's desk, which only she can read. Pin a photo on the memory wall, cook or save a friend a plate, pet Shinzo, hug whoever's home, and plan a time that works across our time zones. Anyone can make a house for up to seven friends at `/make`.

## What's checked, and what's judged

The checks in `spec/` run on every push before it deploys: desk notes stay private, everything survives a restart, coming back lists what's new, changes show on a friend's open page without a reload, and every page meets an accessibility floor.

Whether it makes us feel closer is judged by my friends using it: UNO's turns went from ten seconds to twenty because they asked.

## How it's built

One Node process, one SQLite file on the Fly volume, pages drawn on the server, and server-sent events for live updates. Decisions are in `doc/adr/`; how I built it is in `PROCESS.md`.
