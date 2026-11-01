# Five Windows: PRFAQ

A press release written as if the house were launching, then the questions
people would ask about it. It describes the app as it is on 1 November 2026,
gaps included. Who it's for is tested in [personas.md](personas.md), and what
to build next is ranked in [rice.md](rice.md).

---

## Five Windows opens: a house for friends who are never awake at the same time

*Drop in for thirty seconds, leave a note on a friend's desk or dinner on the
counter, and go. Whoever comes by next finds it, an hour or a week later.
Anyone can now make one for two to seven friends.*

**Canberra, November 2026.** Rithika Nallaparaju has opened Five Windows, a
little illustrated house shared by five friends who live in Canberra, New
Jersey, Tamil Nadu and Bangalore. Each friend has a bedroom that runs on her
own clock, and they share a living room with a wall of notes, a kitchen, a
garden and a dog called Shinzo. Nobody has to be online at the same time.
Anyone can make a house like it for their own friends at `/make`.

**The problem.** Friends who scatter across time zones fall back on the group
chat, and a group chat is built for people who are awake at the same time.
Someone is always asleep when the joke happens. They wake up to a backlog,
skim it and say nothing, because the moment has passed. Social apps answer
that with notifications, unread counts and likes, which turn keeping in touch
into keeping up.

**The solution.** Five Windows is a place, not a feed. You pick your window at
the door and walk your sticker around the house with the arrow keys or a
thumb stick. You leave something where it belongs: a note and a masala chai
on a friend's desk, a dish on the kitchen counter, a good-luck note on the
wall, a seedling in the garden, a tidy room. It stays there. When you come
back, "While you were away" says who came by and what's new, starting with
what was left for you. Rooms dim by their owner's clock, so you can see that
Neha's room is dark because it's 3 am in New Jersey. If friends happen to be
in at the same time, the house is live: you see each other walk, hug and sit
down on the mat for a game of UNO. Being there together is a bonus, never a
requirement.

> "we are a group of 5 friends who live in different parts of the world. So i
> wanted to make something that is personal to us and make us feel like we
> are together." Rithika Nallaparaju

**How it works.**

1. Open the house and pick your window. Only one person can be each friend at
   a time.
2. Walk somewhere. Whatever you can use lights up: a bed, a desk, the stove,
   the garden, Shinzo.
3. Leave something, or just do something: sleep in a friend's bed, water the
   plants, pet the dog.
4. Go. Everything you left survives a refresh, a restart and a redeploy.
5. Come back whenever. The house shows who was here and what they left, and
   nothing punished you for being away: plants get thirsty but never die,
   rooms get lived-in but never gross, and Shinzo naps but is never sad.

> "By the time I wake up, the joke's over, and I'm not scrolling back for it.
> Now I come in with my coffee and see who was by in the night, and there's
> usually something on my desk." Kavya, Toronto (a persona)

**A house for your own friends.** At `/make`, anyone can describe two to seven
friends: their names, where they live, a few things about them, and what's in
their room, picked from a set of 42 pictures. Add the memories you'd pin on
the wall and, if you like, the inside joke from something you all did
together, which is framed word for word by the living room door. The house
gets its own private address, a picture with a bedroom for each friend, and
everyone's own clock. Walking, hugs, the wall, UNO and Shinzo all come with
it.

> "its challenging to make the website personal for all the users, but worth
> a try" Rithika Nallaparaju

**Come in** at <https://comp4020-final-rithikanallaparaju16.fly.dev>, or make
a house for your friends at
<https://comp4020-final-rithikanallaparaju16.fly.dev/make>.

*Rithika's quotes are word for word from her crit 8 and crit 10 reflections.
Kavya is a made-up persona from [personas.md](personas.md), and her quote is
invented.*

---

## Customer FAQ

**Do we all have to be online at the same time?**
No. Everything waits for whoever comes by next. The one exception is UNO,
where each turn lasts twenty seconds and a player who runs out of time is out
of that game. Rithika asked for timed turns, and moved them from ten seconds
to twenty after her friends tried it: "10 sec was too less".

**Will it notify me when something's left for me?**
No, on purpose. There are no notifications, unread counts, likes or
followers. The house tells you what's new when you come in. Until a nudge
exists (see [rice.md](rice.md)), the group chat you already have is how
anyone knows to come by.

**Who can read what I leave?**
A desk note is shown only to the friend it's for; everyone else sees that
something's been left. The wall, the kitchen and the garden are for everyone.
There are no passwords, though. Anyone with the address can pick a window
that's free, so a private desk note is a courtesy, not a lock. A shared front
door key is the likely next step.

**What if I don't come by for a month?**
Nothing dies and nothing scolds you. Your plants look thirsty until someone
waters them, your room looks lived-in until someone tidies it, and "While you
were away" lists what happened. Long absences have one known gap: Updates
shows the first 40 things and can't show the rest.

**Does it work on my phone?**
Yes. On a phone the house fills the screen and you walk with a thumb stick,
with Home, Updates, Movies and Everyone tabs at the bottom. Tapping a room
walks you there and takes you in. Every action also works as a plain link or
form without JavaScript.

**Can I delete or edit something I left?**
Not yet, on purpose. Editing, deleting, photos and drawings each have to
show they'd make friends feel closer first.

**How many friends can share a house?**
Rithika's house is for exactly five. A made house holds two to seven, each
size with its own picture. More than seven needs new art.

**What does making a house cost me?**
Nothing. Making houses is capped at three an hour for each visitor and thirty
an hour in all.

**What does Claude see when I make a house?**
When Claude can be reached, it gets the house name, each friend's name,
pronouns, city, the few things you wrote about them and the things picked for
their room, plus the wall memories. It never sees birthdays or the inside
joke, so the joke is framed exactly as you typed it. When Claude can't be
reached, the house is built from your own words instead.

**Can I change my house after making it?**
Not yet. A typo or a wrong city means making it again.

---

## Internal FAQ

**Who is it for?**
Rithika's four friends and herself, first. The rules assume familiarity:
five fixed people, no profiles, no strangers. Made houses test whether the
same idea works for other groups of two to seven. [personas.md](personas.md)
tests both.

**What's the biggest risk?**
That nobody comes back. Without notifications, a return depends on habit and
on someone mentioning the house in the group chat. That's the deliberate
trade, and it's still the weakest link in the loop. [rice.md](rice.md) scores
two ways to soften it: a nudge you send yourself, and an email you ask for.

**How will we know it works, with no metrics?**
The house counts nothing, by design. Two signals need no dashboard. The logs
record who came in and what kind of thing they left (never what anyone
wrote), which shows whether friends come back at different times. And the
five can be asked, as Rithika did with UNO: "i asked my friends to try it and
10 sec was too less so i chnaged it to 20sec."

**Why doesn't the live house maker use Claude?**
Rithika's course key is a Fly secret, but it goes through the course's proxy,
which only answers the ANU network. So every live house tries Claude, waits
for it to fail (up to about 40 seconds, ADR 0019), and is then built from the
form's words. Either the key comes off Fly and the wait disappears, or a key
that calls Anthropic directly makes Claude work live, paid from Rithika's own
account.

**What does it run on?**
One small Fly machine (shared CPU, 256 MB) that stops when nobody's using
it, Node 24 with no build step, SQLite on the Fly volume, and one runtime
dependency, the Anthropic SDK, for making houses. Every write is a row in an
append-only table, and the house's state (mess, thirst, Shinzo's day, UNO
hands) is worked out from timestamps, so no timer runs while you're away.

**What's known to be broken?**
On 21 October, a test sweep left 21 tests that fail because of bugs (a few
bugs fail more than one). Each is skipped by its title until the bug is
fixed, so CI can deploy. They're scored alongside new ideas
in [rice.md](rice.md). The two that matter most: on a phone, Home's top line
can say nobody came by when someone did, and in a made house, a friend's
city can be matched to the wrong clock ("Indiana" contains "india").

**What is it deliberately not?**
A chat app, a feed, a forum or a dashboard. It has no likes, counts,
algorithmic ordering, public profiles, infinite scroll or unrequested
notifications. Photos, drawings and prompts are possibilities, not a backlog.
