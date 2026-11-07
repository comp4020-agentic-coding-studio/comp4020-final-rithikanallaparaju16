# 0035. An upright phone still gets the house

Status: accepted. Built on 7 November 2026, after a review against the final
project's marking found the problem and Rithika said "yes do all that".
Supersedes one line of 0032: the cover over the house's pages on an upright
phone. The rest of 0032 (the layout for a phone on its side, the walking
corners on the screen's own corners, asking each browser about the widget)
stands.

## Context

ADR 0032 answered "force only landscpae for phone because you can see the
house only then". A page can't lock rotation on an iPhone, so it covered
Home, rooms, Updates, Everyone, Movies and UNO with "Turn your phone
sideways" on any touch screen held upright at 600 px or narrower.

That is exactly the final project's phone viewport: Chrome's iPhone preset,
390 × 844, which emulates touch. A screenshot there showed nothing but the
notice, in white on the pale sky. The marker checks multi-user and real-time
with one session at each viewport, so one of the two would have been a wall.
And every friend arrives upright: from a link in a chat, the widget, or the
home screen on an iPhone (which ignores the manifest's landscape).

Under the cover, the upright phone layout from session 3 onwards still
worked: the house fills the screen, it pans, the walking corners and the
tabs are there.

## Options

- Keep the cover. What Rithika asked for, but it hides the house from the
  marking viewport and from anyone who can't or won't turn.
- Take the cover off and say nothing. The upright house works, but loses
  the reason for 0032: the house is only all there sideways.
- Take the cover off, and on Home and rooms say in one slim line under the
  bar that it's all there sideways.

## Decision

The third. Upright touch screens at 600 px or narrower get the upright house
with "📱 Turn your phone sideways for the whole house." under the bar on Home
and in rooms. It's a plain line, not an alert. Sideways, on an iPad and on a
laptop it isn't shown. The manifest still asks Android for landscape from
the home screen, since that's the installed app, not a page in a browser.

The spec now promises the house either way up: nothing in an upright
phone's stylesheet covers the whole page, no page carries the old cover,
and the hint is there.

## Consequences

An upright phone sees about half the house at once and pans for the rest,
as it did before 5 November; turning it shows the whole house. Rithika can
put the cover back with a new record, knowing what it costs at the marking
viewport.
