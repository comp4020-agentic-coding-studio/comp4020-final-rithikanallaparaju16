# Five Windows: personas

Five made-up people who might use the house, each with a background, a reason
to use it and a quote. Each one is walked through the app as it is on
1 November 2026, to test who the house is for and whether it works for them.
Where it falls short, the gap points at a row in [rice.md](rice.md).

None of them is one of Rithika's five. Details about the real friends come
only from Rithika, so all five personas live in houses made at `/make`.
Kavya, Arjun and Meera share one house, so their visits overlap.

| Persona | Where | Comes by | On | House | Works for them? | Biggest gap (RICE) |
| --- | --- | --- | --- | --- | --- | --- |
| Kavya | Toronto | daily, 5 minutes | laptop | five friends | yes | nothing brings her back (C) |
| Arjun | Thrissur, Kerala | weekly | phone | five friends | yes | Home says nobody came by (A) |
| Meera | Bangalore | most evenings, live | laptop and phone | five friends | mostly | UNO deals to someone who left (H) |
| Priya | Melbourne | makes the house | laptop | six friends | first visit falls short | three wrong clocks (D), no house name (B) |
| Lea | Berlin | most days | phone | two | yes, but not private | anyone can read her notes (G) |

---

## 1. Kavya Raman, the one who's always asleep

**Background.** Kavya is 27, a UX researcher at a bank in Toronto. She did
engineering at a college in Chennai with four friends who lived on her
hostel corridor. Now Arjun is in Thrissur, Meera in Bangalore, and the other
two are in Singapore and Pune. India's working day is her night, so the
group chat runs while she sleeps. She wakes up to a couple of hundred
messages, skims them and replies to none, because everyone's moved on. She
goes by she/her.

**Why she'd use it.** To arrive to something left for her, not a backlog,
and to leave something they'll find over dinner.

> "By the time I wake up, the joke's over, and I'm not scrolling back for
> it."

**A visit.** 7:30 am in Toronto, coffee, laptop. "While you were away" says
Arjun and Meera came by and starts with what's for her: Meera left a note and
a filter coffee on her desk. Arjun's and Meera's rooms are in evening light
(6 pm in India), the Singapore room is dark, and the room clocks show why. She
writes on the wall, leaves a note on Arjun's desk and goes. Toronto is a
city the maker knows, so her room keeps her time.

**What works.** The core loop is built for her. What was left for her comes
first in "While you were away", desk notes reach only her, rooms dim by their
owner's clock, and nothing she missed has died.

**What doesn't.** Nothing brings her back on a busy week. With no
notifications, coming back depends on habit or someone mentioning the house in
the chat. After a week away from a busy house, Updates shows the first 40
things and its "more" link leads back to the same page (M).

**Verdict.** She's who the house is for, and it works for her. The risk is
that she forgets to come. RICE row C, a nudge she can send herself, is
aimed at her.

---

## 2. Arjun Nair, the quiet one on a phone

**Background.** Arjun is 24 and back home in Thrissur after engineering,
studying for public-sector exams. He has a mid-range Android phone, patchy
mobile data, and no laptop at home. He reads everything in the group chat and
says almost nothing, because he doesn't feel he has news. He comes by on
Sundays. He goes by he/him.

**Why he'd use it.** To show he's still around without having to say
anything.

> "I read everything in the group and reply to nothing. I don't have news,
> I'm just studying."

**A visit.** Sunday, on his phone. The house fills the screen and he walks
with the thumb stick. He waters the garden (the plants look thirsty but
never die), eats the dish Meera left on the counter (she hears he ate it),
tidies Kavya's room (she hears he did it), pets the dog and leaves. He
hasn't written a word, Meera and Kavya will each hear what he did, and
everyone's "While you were away" will say he came by. His room
keeps India's time only because Meera typed "Thrissur, Kerala" and the
maker knows "Kerala"; "Thrissur" on its own would have put him on UTC (D).

**What works.** The wordless actions (water, tidy, eat, pet, sleep in a
friend's bed) are made for him, and the owner hears who did each one. The
house never makes him feel behind for staying away a week.

**What doesn't.** On a phone, the line at the top of Home is all he sees of
"While you were away", because the card that names who came by is hidden
below 700 px. That line counts only things left, so when Kavya came by and
left nothing, it says "Nobody's been by since you were last here" (A). The
Updates tab has it right, if he looks. A dish is out for three days, so food
left early in the week is gone by Sunday, which is by design. The house
picture is about 360 KB, kept for a day, which his data can take.

**Verdict.** It works, and he's the person the few, wordless interactions
serve best. Fixing the phone's Home line (A) matters most to him.

---

## 3. Meera Iyer, the one who wants everyone there

**Background.** Meera is 23, doing a master's in Bangalore. She's online a
lot, on her laptop at the library and her phone on the bus. In the hostel
she ran the UNO nights, and she made this house at `/make` for the five of
them. She goes by she/her.

**Why she'd use it.** For the moments when two or three of them are in at
once.

> "If two of us are in at the same time, I want to see it, not find out
> tomorrow."

**A visit.** Evening in Bangalore. Arjun glows on the map because he's home
now. She walks over and hugs him, and he hears about it. Kavya comes in at
her morning, the three sit down on the mat and Meera deals UNO, twenty seconds a
turn. Everything shows without a refresh.

**What works.** Live walking, hugs, things appearing as they're left, and
UNO moves arriving live. The multiuser test sweep on 21 October found those
held up.

**What doesn't.** Most of the live bugs land on her:

- If a friend left the house, she still counts as sitting on the mat, so the
  next deal includes her and everyone waits out her twenty seconds (H).
- A card played in the first half second of a turn, just after the turn
  before ran out, is accepted and then silently dropped (U).
- A film a friend suggests while she has Movies open doesn't show in the
  movie-night planner until she reloads (T).
- The Everyone tab offers "Come in as Arjun" while Arjun is home, and
  pressing it is a dead end (K).
- As the maker: the name she gave the house only shows on the page after
  it's made, and the door says "Five Windows" (B). "What is this place?"
  describes Rithika's five, not hers (E).

**Verdict.** It mostly works. She also tests a principle: she wants more
real time, and the house should welcome her without needing everyone there
at once. Fix H and U for her, and resist turning her overlap into a chat.

---

## 4. Priya Reddy, the one who makes the house

**Background.** Priya is 31, a primary school teacher in Melbourne. Her
group of six from school in Hyderabad, herself included, is now in
Hyderabad, Melbourne, Bloomington (she types "Bloomington, Indiana"; one of
them is doing a PhD there), Perth (she types "Western Australia"), London
and Dubai. She plans every reunion and keeps the shared album. A friend at ANU
sent her the link. She goes by she/her.

**Why she'd use it.** To give her group somewhere that's theirs, with the
memories on the wall and the joke from the Goa trip by the door.

> "Every reunion I plan falls apart over time zones. I want somewhere
> that's ours even when we can't all get on a call."

**A visit.** She opens `/make`, picks six, and fills in each friend's name,
city and a few things about them. She picks up to six things for each room
from the 42 pictures, adds memories, then writes "the Goa trip" and the
joke. She presses the button and waits: the live site has a Claude key it
can't reach, so it tries for up to about 40 seconds before building the
house from her words (I). She gets the private address and sends it to the
group.

**What works.** The form is personal: the picture set, the memories, and the
inside joke framed word for word. The six-friend picture has a room each.
Walking, hugs, the wall and UNO at the coffee table work the same.

**What doesn't.** Her first visit has the most bugs of anyone's:

- Three of six clocks are wrong (D). "Indiana" contains "india", so that room
  runs on India time. "Western Australia" matches Australia before Perth, so
  it gets Sydney's time. Dubai isn't a city the maker knows, so it gets UTC.
  Those friends sleep and dim at the wrong hours, which is the house's main
  idea.
- The name she gave the house ("The Hyderabad Six") isn't on its door (B).
- "What is this place?" at her door shows Rithika's README, with Rithika's
  friends' names and birthdays (E). That README is public on GitHub anyway,
  but in her house it's confusing.
- The dog is Shinzo, Rithika's dog's name (O).
- She can't fix a city after making the house; she has to make a new one at
  a new address and send it again (W).

**Verdict.** She'll love the maker, then find the wrong clocks and a door
that isn't named for her group. Made houses spread only if her first house
is right, so D, B, I and E matter more than their reach suggests.

---

## 5. Lea Hoffmann, a house for two

**Background.** Lea is 29, a nurse on rotating shifts in Berlin. Her partner
Sam took a two-year contract in Auckland, exactly twelve hours ahead in
November. Their video calls are at 8 am and 8 pm, and her shifts keep
breaking them. She goes by she/her.

**Why she'd use it.** For the ordinary traces of each other's days that a
weekly call misses.

> "We're good at the big calls. It's the ordinary days that go missing."

**A visit.** Coming off a night shift, on her phone. She leaves a note on
Sam's desk and naps in his bed in the house, and he'll hear she did. She plans
a movie night on the sofas, picked in her clock and shown in his. She waters
the two garden patches and goes.

**What works.** The two-friend picture, desk notes, sleeping in his bed,
the kitchen and movie night in each person's clock all suit two people.
Berlin and Auckland are cities the maker knows, so both rooms keep the right
time.

**What doesn't.** A couple's desk notes are the most private things in any
house, and anyone with the address can go in as Sam and read them. A note is
a courtesy, not a lock (G). Hugs and UNO need both of them there at once,
which twelve hours and shifts make rare. That's by design, but half of what
makes the house feel alive is mostly out of their reach.

**Verdict.** It works as a quiet place for two, but the house was built for
a group, and a couple won't trust it with private notes until there's a front
door key (G).

---

## Who it isn't for

- **Groups of more than seven.** Each size needs its own picture.
- **People who want a chat.** There's no thread to reply in, by design.
- **People who want to be pinged.** Nothing notifies anyone.
- **Strangers.** There are no profiles and no way to find a house; you need
  its address from someone in it.

## What the five personas say together

- The core loop works for the people it was built for: Kavya, who's never
  awake with the others, and Arjun, who comes rarely and says little.
- The biggest risk isn't a bug: nothing brings anyone back (C).
- Made houses work, but a maker's first impression has the most bugs
  (D, B, I, E), and makers decide whether a house gets shared.
- Privacy is fine for old friends and not enough for a couple (G).
- Live play is the least polished part, and the bugs land on the most
  engaged friend (H, U, T).
