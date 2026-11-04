# 0034. Saying who you are as you come in

Status: accepted. Built on 5 November 2026. Rithika: "suggest me ways to
login as only rithika, idk why im making the mistake of loggin in as some
other person everytime". The agent offered four changes (A: "This is my
phone, I'm Rithika" at the door puts her window first, remembered per
browser; B: "Come in as" on Everyone asks first; C: a brief "Hi Rithika 👋"
with her face on arrival; D: take "Come in as" off Everyone), suggesting A
and B together. She chose: "i like C". Builds on 0011 (one of us at a
time).

## Context

There are two ways in as someone: a window at the door, and "Come in as
Amirdhavarshini" on each row of Everyone, one tap with no question. After
that, only the small face and "Not ___?" in the bar say whose house you're
in, and it looks the same at a glance. The mistake shows only later, when
the desk or the widget is someone else's.

## Decision

- Coming in as anyone (`POST /me`: a window at the door, "Come in as" on
  Everyone, or picking yourself again) redirects to `/?hi=1`, not `/`.
- Home with `?hi=1` shows a card under the bar: her sticker, "Hi Rithika
  👋", and "Not you? Change", which posts to `/leave` (letting her go, as
  0011's sign-out does) and lands on the door.
- The script fades it after four and a half seconds, or straight away on
  a tap outside "Change", and takes `?hi=1` out of the address so a
  reload or a bookmark doesn't greet again. Under reduced motion it goes
  without fading. Without the script the card stays on that page.
- A live re-fetch (`x-live`) never carries it, so a friend's note
  arriving doesn't bring it back.
- The same in made houses, at `/h/<code>/?hi=1`, with that friend's face.

Nothing is stored: the greeting is the redirect's address and the page
that answers it.

## Consequences

The mistake is caught in the first seconds, when it costs one tap, rather
than after a note's been left as someone else.

The door and Everyone are unchanged, so a wrong tap can still happen; A,
B or D would stop it before it does, at the cost of a step or of the door
looking different on each browser. They're still open if C isn't enough.

Tests that sign in now expect `/?hi=1` from `POST /me`. And because a full
spec run now makes more houses than the live site's thirty an hour, the
cap can be raised with `MAKE_CAP` for a test server (CI uses 100); the
live site doesn't set it.
