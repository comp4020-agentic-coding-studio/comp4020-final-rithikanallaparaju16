# 0025. A home-screen widget reads one private link per friend

Status: accepted. Built on 3 November 2026 at Rithika's asking ("can you make
this into sumn i can view on the homescreen, like locket?"), for iPhone and
Android, showing the newest thing a friend left you and everyone's faces and
clocks (her picks when asked). Adds to 0011 (one of us at a time); changes
nothing in it.

## Context

Locket puts friends' photos on your home screen. A home-screen widget is
native code: an iPhone widget is a WidgetKit extension inside an App Store
app, an Android one an AppWidget inside a Play Store app. A web page added
to the home screen (the manifest and apple tags since November) is an icon
that opens the house, not a widget. The only thing the web can put on that
icon is a number badge, which would be a count, against the house's
no-counts rule.

What can draw a widget without an app of our own is a widget app that reads
a web address: Scriptable on iPhone (free), KWGT on Android (its Pro key,
a few dollars, lets a widget read a link). Neither can sign in at the door:
they don't keep cookies the way a browser does, and a widget can't take a
session without holding a friend's window (ADR 0011).

## Options

- Build a native app per platform. Two codebases, two stores, accounts and
  review, for a course prototype.
- Let the widget sign in like a browser. It would hold her window shut
  whenever it refreshed, and its cookie would let it write too.
- A read-only link per friend with a key in it, made on her Everyone tab,
  that a widget app reads.

## Decision

- Each friend can make a widget key (`visits.widget`, random, 18 bytes) on
  her Everyone tab (`POST /widget`). Making a new one turns the old one off.
  It's not her session: it can only read.
- Everything a widget needs is under `/widget/<id>.<key>/`: the house as
  JSON (`widget()` in `src/pages.ts`: the newest thing a friend left her,
  a photo on the wall first unless the words are a day newer, then everyone's
  face, clock, whether she's home now and whether she's asleep), and the
  photo and faces it names, relatively, so the widget never signs in.
  Reading it isn't a visit and doesn't hold her window (`look()` and
  `seenSince()`).
- The key is compared in constant time; a wrong key, another friend's id or
  an old key is a 404. The key is logged by its first six characters only.
- `/widget/<id>.<key>/scriptable.js` is a Scriptable script with her link
  filled in (`public/widget/scriptable.js`), and the Everyone tab says how to
  add it. Android gets KWGT's steps with the same link. A made house's
  widget is at its own address, for its own friends; its drawn faces are SVG,
  which Scriptable can't show, so it draws a friend's initial in her colour.

## Consequences

Anyone with a friend's widget link can read what's on her widget: what
friends left her, her friends' clocks and the wall's newest photo, but
nothing she could do in the house. That's the same trust as the door (ADR
0011, RICE row G), and she can turn a link off by making a new one.

A widget refreshes when the phone lets it (about every 15 minutes asked
for), not live. Nothing is pushed: no notifications, which the house never
sends unasked.

It isn't Locket's own app, and on Android it costs KWGT's Pro key. A native
widget would need its own app in each store.
