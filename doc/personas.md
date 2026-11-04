# Five Windows: personas

Five made-up people who might use the house, each with a background, a reason
to use it and a quote. Each one is walked through the app as it is on
4 November 2026, to test who the house is for and whether it works for them.
Where it falls short, the gap points at a row in [rice.md](rice.md).

None of them is one of Rithika's five. Details about the real friends come
only from Rithika, so all five personas live in houses made at `/make`.
Kavya, Arjun and Meera share one house, so their visits overlap.

They're the same five people as on 1 November, walked through again. Since
then the house gained photos on the wall, a home-screen widget, a monthly
wall with a recap, saved plates, writing back, a planner with a time strip,
walking from a phone's corners and a house's name at its door, so most
verdicts changed.

| Persona | Where | Comes by | On | House | Works for them? | Biggest gap (RICE) | Was (1 Nov) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kavya | Toronto | daily, 5 minutes | laptop, iPhone | five friends | yes | Updates stops at 40 (M) | nothing brings her back (C) |
| Arjun | Thrissur, Kerala | weekly | Android phone | five friends | mostly | the widget costs him money (AF) | Home says nobody came by (A) |
| Meera | Bangalore | most evenings, live | laptop and phone | five friends | mostly | UNO deals to someone who left (H) | the same |
| Priya | Melbourne | makes the house | laptop | six friends | first visit falls short | three wrong clocks (D) | wrong clocks, no house name |
| Lea | Berlin | most days | iPhone | two | yes, but not private | anyone can read her notes and photos (G) | the same |

---

## 1. Kavya Raman, the one who's always asleep

**Background.** Kavya is 27, a UX researcher at a bank in Toronto. She did
engineering at a college in Chennai with four friends who lived on her
hostel corridor. Now Arjun is in Thrissur, Meera in Bangalore, and the other
two are in Singapore and Pune. India's working day is her night, so the
group chat runs while she sleeps. She wakes up to a couple of hundred
messages, skims them and replies to none, because everyone's moved on. She
has an iPhone and a work laptop. She goes by she/her.

**Why she'd use it.** To arrive to something left for her, not a backlog,
and to leave something they'll find over dinner.

> "By the time I wake up, the joke's over, and I'm not scrolling back for
> it."

**A visit.** 7:20 am in Toronto. Before she's out of bed her home screen shows
Meera's photo from the night before, a chai stall in the rain, with Meera's
words under it. She taps it and the house opens at the living room wall. Later,
with coffee, on her laptop: "While you were away" starts with what's for her.
Arjun left a note and a filter coffee on her desk, and she writes back. Meera
saved her a plate of dosa, still covered on the counter, and she eats it, so
Meera hears she found it. Arjun's and Meera's rooms are in evening light, the
Singapore room is dark, and the room clocks show why. She drags the time strip
to find a Sunday hour when four of them are awake, plans a call, and goes.

**What works.** The core loop is built for her, and the widget answers the
risk the first version named: something reaching her without the house
pinging her. Writing back and saved plates turn a note into a small exchange
across a whole day, without anyone being awake together. The time strip makes
the five clocks something she can touch.

**What doesn't.** After a busy week away, Updates lists the first 40 things,
and its "more" link leads back to the same page (M). The widget took her
three apps' worth of steps (App Store, copy, Scriptable, Edit Widget) and
she nearly gave up at the "pick the script" step; the page telling her "It's
working" is what kept her going. She'd like to know Arjun found her note
without it being a read receipt (AD).

**Verdict.** She's who the house is for, and it now reaches her. Fix M for
her busy weeks.

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

**A visit.** Sunday, on his phone. The house fills the screen and he walks by
holding the bottom corner with his thumb, the view sliding ahead of him into
the kitchen. He eats the dosa Meera saved him, waters the garden, tidies
Kavya's room, pets the dog and leaves. He hasn't written a word, Meera and
Kavya will each hear what he did, and everyone's "While you were away" will
say he came by. Home asks if he wants the house on his home screen. He says
yes, reads that Android needs KWGT and a paid key, and goes back to Not now.

**What works.** The wordless actions (water, tidy, eat, pet, sleep in a
friend's bed) are made for him, and a saved plate means food left on Monday
is still his on Sunday. Walking from the corners suits one thumb on the bus.
The monthly recap means a month of exams doesn't leave him lost.

**What doesn't.**

- **Home's line on a phone (A).** The top of Home is all he sees of "While you
  were away", because the card that names who came by is hidden below 700 px.
  That line counts only things left, so when Kavya came by and left nothing,
  it says "Nobody's been by since you were last here". The Updates tab has it
  right, if he looks.
- **The widget costs him.** On Android it takes KWGT and its Pro key. That's a
  few dollars he won't spend, and building the widget in KWGT by hand from
  JSON paths is beyond what he'd do (AF). On an iPhone it's free and
  pre-built. Of the five personas, he's the one the widget leaves out, and
  he's the one it would help most.
- **The picture's weight.** The house picture is about 360 KB, now kept for a
  year by its fingerprint, which his data can take.

**Verdict.** It works, and he's the person the wordless interactions serve
best. Fix A for him, and find a free way onto an Android home screen (AF).

---

## 3. Meera Iyer, the one who wants everyone there

**Background.** Meera is 23, doing a master's in Bangalore. She's online a
lot, on her laptop at the library and her phone on the bus. In the hostel
she ran the UNO nights, and she made this house at `/make` for the five of
them. She takes photos of everything. She goes by she/her.

**Why she'd use it.** For the moments when two or three of them are in at
once, and to share what she sees.

> "If two of us are in at the same time, I want to see it, not find out
> tomorrow."

**A visit.** Evening in Bangalore. She pins a photo of the chai stall on the
memory wall with a line under it, and it's on the cork board in the picture.
Arjun glows on the map because he's home now. She walks over and hugs him,
and he hears about it. Kavya comes in at her morning, the three sit down on
the mat and Meera deals UNO, twenty seconds a turn. Everything shows without a
refresh.

**What works.** Photos are what she wanted most, and they stay a wall, not a
feed: the newest on the cork board, older ones in the memory box, each month
in its own envelope. Live walking, hugs and UNO held up in the multiuser test
sweep, and the movie planner now keeps up live (T, fixed 3 November).

**What doesn't.** Most of the remaining live bugs land on her:

- If a friend left the house, she still counts as sitting on the mat, so the
  next deal includes her and everyone waits out her twenty seconds (H).
- A card played in the first half second of a turn, just after the turn
  before ran out, is accepted and then silently dropped (U).
- The Everyone tab offers "Come in as Arjun" while Arjun is home, and
  pressing it is a dead end (K).
- She can't say anything about a friend's photo except a sticker; she'd
  write a line under it if she could (AB).

**Verdict.** It mostly works, and photos made it hers. Fix H and U for her,
and resist turning her overlap or her photos into a chat or a feed.

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
house from her words (I). The door says "The Hyderabad Six", the name she
gave it, with the joke framed under it. She sends the address to the group,
then opens the planner to find a call time for all six.

**What works.** The form is personal: the picture set, the memories, the
inside joke framed word for word, and now the house's name on its door and
in every page's title (B, fixed 1 November). The six-friend picture has a
room each. The time strip is the thing she's wanted for every reunion.

**What doesn't.** Her first visit still has the most bugs of anyone's:

- **Three of six clocks are wrong (D).**
  - "Indiana" contains "india", so that room runs on India time.
  - "Western Australia" matches Australia before Perth, so it gets Sydney's
    time.
  - Dubai isn't a city the maker knows, so it gets UTC.

  Those friends sleep and dim at the wrong hours, and now the time strip
  shows their wrong days too, in the one feature she came for.
- **"What is this place?"** at her door shows Rithika's README, with Rithika's
  friends' names and birthdays (E).
- **The dog** is Shinzo, Rithika's dog's name (O).
- **No fixing a city.** She can't change one after making the house; she has
  to make a new one at a new address and send it again (W).

**Verdict.** She'll love the maker and the planner, then find the wrong
clocks right where she was planning. D is now the most damaging bug in the
app for made houses: it breaks the time strip and the planner as well as the
rooms.

---

## 5. Lea Hoffmann, a house for two

**Background.** Lea is 29, a nurse on rotating shifts in Berlin. Her partner
Sam took a two-year contract in Auckland, exactly twelve hours ahead in
November. Their video calls are at 8 am and 8 pm, and her shifts keep
breaking them. She has an iPhone. She goes by she/her.

**Why she'd use it.** For the ordinary traces of each other's days that a
weekly call misses.

> "We're good at the big calls. It's the ordinary days that go missing."

**A visit.** Coming off a night shift, on her phone. Sam's photo of his
breakfast is on her widget. She leaves a note on Sam's desk, naps in his bed in
the house (he'll hear she did), and saves him a plate. She drags the time
strip to the one hour this week when neither of them is asleep or working and
plans a call. She waters the two garden patches and goes.

**What works.** The two-friend picture, desk notes and writing back, sleeping
in his bed, saved plates, the widget, and the planner in each person's clock
all suit two people. Berlin and Auckland are cities the maker knows, so both
rooms keep the right time.

**What doesn't.** A couple's desk notes and photos are the most private things
in any house, and anyone with the address can go in as Sam and read them. A
note is a courtesy, not a lock (G). Her widget's link is private, but the
house's front door isn't. Hugs and UNO need both of them there at once, which
twelve hours and shifts make rare.

**Verdict.** It works as a quiet place for two, and the widget suits a couple
best of all. But a couple won't trust it with private notes and photos until
there's a front door key (G), and photos raised the stakes.

---

## Who it isn't for

- **Groups of more than seven.** Each size needs its own picture.
- **People who want a chat.** There's no thread to reply in, by design.
  Writing back is one note to one note.
- **People who want to be pinged.** Nothing notifies anyone; the widget shows,
  it doesn't buzz.
- **Strangers.** There are no profiles and no way to find a house; you need
  its address from someone in it.

## What the five personas say together

- The core loop works for the people it was built for: Kavya, who's never
  awake with the others, and Arjun, who comes rarely and says little.
- The biggest risk changed. "Nothing brings anyone back" is mostly answered by
  the widget, for iPhones. Now the risks are that the widget is fiddly to set
  up, mostly unseen on real phones (AE; its first card worked on Rithika's
  iPhone), and costs Android users money (AF).
- Made houses work, and B is fixed, but a maker's first visit still has the
  most bugs (D, E, I). D got worse: the planner and time strip show the wrong
  clocks too.
- Privacy is fine for old friends and not enough for a couple (G); photos make
  it matter more.
- Live play is the least polished part, and the bugs land on the most engaged
  friend (H, U, K).
