# 0032. A phone on its side, and asking each browser about the widget

Status: accepted. Built on 5 November 2026 from two of Rithika's messages:
a photo of her phone sideways ("right now we cant even see the toggle, i
want you to force only landscpae for phone because you can see the house
only then, and make the toggle visibile no matter where i am. The toggle
should be there on the bottom corners of my screen not the page"), and
"amirdha tried from her laptop and her phone, she uses windows and android
she says she didnt get the pop up thingee i got for downloading the
widget". Changes how 0027 decides when Home asks.

## Context

A phone held sideways is about 930 × 430: wide enough for the laptop's
layout, so it got one. The house was a card under a tall bar, most of it
below the screen, and the walking corners were on the picture, not the
screen, so they were out of sight.

A web page can't lock a phone's rotation: iPhone Safari has no way to,
and Android only allows it full-screen or from the home screen.

Home stopped asking about the widget for good once a friend's widget had
looked in, anywhere. On 4 November Amirdhavarshini's widget was set up on
Rithika's iPhone, so her own Windows laptop and Android phone were never
asked.

## Decision

- A phone on its side (`pointer: coarse`, landscape, at most 500px tall)
  gets a slim bar with the tabs, and the house or a room filling the rest
  of the screen; what was beside it is a scroll below. The walking corners
  are fixed to the screen's own bottom corners on every page with the
  house and never step aside; the buttons sit between them at the bottom.
- Held upright, the house's pages (Home, rooms, Updates, Movies, Everyone,
  UNO) are covered by "Turn your phone sideways". The door, the make form,
  the README and the widget's steps stay readable upright.
- From the home screen, the manifest asks for landscape (Android keeps to
  it; iOS doesn't read it).
- Home asks on every browser until that browser answers: Yes is kept a
  year in the browser, Not now a fortnight. A widget working elsewhere
  only changes the words ("Put Five Windows on this screen too?"). On a
  phone on its side the question is one slim line above the house.
- A Windows browser's steps say the widget lives on a phone, and open
  Android's first.

## Consequences

Anyone who'd already set a widget up is asked once more on the browser
they set it up from; one Yes or Not now there stops it.

A phone with rotation lock on only sees "Turn your phone sideways" until
it's turned off; the notice says so.
