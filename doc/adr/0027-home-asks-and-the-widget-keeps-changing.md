# 0027. Home asks about the widget, and the widget keeps changing

Status: accepted. Built on 4 November 2026 at Rithika's asking: "when i
enter the home through laptop,phone or ipad, there should be an option
asking if i want the widget on my homescreen, if i say yes, it has to
work", "the widget can show memory board, their room, show food or the
note preview if somebody left food for them, … pictures of all the
avatars / anything wholesome, it can keep chnaging. it can show the
birthday persons avatar on their birday, prev day aslo", and "widget can
rotatae every time the user uses their phone, i dont want a lot of
battery to be consumed". Her five have iPhones and Androids, and she tests
on an iPhone and a Mac. Adds to 0025 (one private link per friend);
changes none of it.

## Context

The widget from 0025 sat behind a link on the Everyone tab, showed one
thing (the newest thing a friend left), and its script had to be pasted
again for any fix to reach a phone. Its first version would never have
run on a real iPhone (it used the browser's `URL`), and nobody would have
known: the house couldn't tell whether a widget had ever read it.

A website can't put a widget on a home screen by itself. On an iPhone or
iPad it takes a widget app that runs a script (Scriptable, free); a Mac
from macOS Sonoma on shows the iPhone's widgets on its desktop. Chrome on
Android doesn't support a web app's widgets (only Edge on Windows does),
so Android still takes KWGT. iOS decides when a widget redraws (about
every quarter of an hour, more often for one that's looked at) and doesn't
tell a widget when the phone is unlocked.

## Options

Where the question goes:

- A banner on every page. Nags, against the house's no-unrequested-prompts
  feel.
- On Home, with a yes and a not now, kept per browser. Each phone and
  laptop is asked once; not now stops it there.
- In the house's data, per friend. One "not now" on a laptop would stop
  her phone ever asking, which is where the widget goes.

How it changes:

- A new card on a timer. iOS doesn't run timers in widgets.
- A new card each time the phone draws it, counted on the phone.

How a fix reaches a phone:

- Paste again. Nobody would.
- The pasted lines fetch the widget from the house and keep a copy; the
  house's JSON says which version is current, and an older copy fetches
  the new one once.

## Decision

- Home asks, on a phone (a slim band under the news), an iPad or a laptop
  (a card above the house): "Put Five Windows on your home screen?" with
  **Yes** and **Not now**. Not now is a cookie in that browser
  (`widget-ask=later`, a fortnight), so it doesn't stop her other
  devices; after it Home shows the quiet "Put the house on your home
  screen ›" link instead. Once her widget has read the house, nothing
  asks anywhere.
- Yes (`POST /widget/yes`) makes her link if she has none (one she has
  keeps working) and opens `/home-screen`: the steps for the device she's
  on first (iPhone, iPad, Mac, Android, read from the browser; an iPad
  that says it's a Mac is put right by `public/live.js`), and a line that
  says "It's working" as soon as her widget first reads the house
  (`visits.widget_seen`), live.
- The widget's JSON gains `cards`, which it shows in turn, the next one
  each time the phone draws it: a friend's birthday (that day and the day
  before, by her clock, her picture large), the newest note or gift on her
  desk with its words, a plate saved for her, the memory wall's photos this
  month, her room cut from the house's picture with her sticker in it
  (dimmed at night where she lives, as the house dims it), everyone's
  faces and clocks, and Shinzo where his day has him. Only cards with
  something in them; everyone, her room and Shinzo are always there.
- Battery: the house is asked at most once every four minutes (a draw in
  between uses the kept answer), and every picture is fetched once and
  kept, since each address names one picture for good (photos never
  change; faces and art carry a fingerprint). A drawn room is kept until
  something in it changes. Old pictures go after six weeks. The widget
  asks iOS for a redraw in 15 minutes; iOS decides.
- What's pasted is a few lines (`public/widget/scriptable.js`) that run
  the kept copy of `public/widget/widget.js`, fetched from
  `/widget/<id>.<key>/widget.js`. The JSON's `code` is that file's
  fingerprint; a phone with an older copy fetches the new one for its next
  draw.

## Consequences

The widget runs code the house sends it, inside Scriptable, under the same
key as its data: whoever controls the house's server controls the widget.
That's the same trust as the page itself.

"Every time you use your phone" is as close as iOS allows: a new card on
each redraw, which iOS makes more often for a widget you look at.

The not now is per browser, so a friend who clears her cookies is asked
again. Asking is per device on purpose.

On the 1st of a month the wall card is missing until someone pins
something (ADR 0026); the other cards carry on.
