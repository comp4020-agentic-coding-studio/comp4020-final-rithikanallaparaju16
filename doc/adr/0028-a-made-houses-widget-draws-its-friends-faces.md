# 0028. A made house's widget draws its friends' faces

Status: accepted. Built on 4 November 2026 at Rithika's asking: "make sure
all these chnaged are done to "make your own house" as well. even new users
using this app, need to get the same experience". Supersedes one line of
0025: "its drawn faces are SVG, which Scriptable can't show, so it draws a
friend's initial in her colour". The rest of 0025 and 0027 stands.

## Context

Rithika's five are her Stitch stickers, which are PNGs. A made house's
friends are drawn by the house as SVG (`look`), and Scriptable's `Image`
can't open an SVG. So a made house's widget showed an initial in a circle
where Rithika's showed a face, and its room card had nobody standing in the
room. A new house's widget looked unfinished next to hers.

## Options

- Draw every made friend as a PNG on the server. Takes an image library, a
  second runtime dependency (CLAUDE.md asks for a reason in PROCESS.md), or
  a rasteriser written by hand.
- Keep the initials. The widget works, but a new house gets less than ours.
- Let the widget draw it: Scriptable's `WebView` is a browser, which can
  draw an SVG onto a canvas and hand back a PNG, without being shown. Do it
  once per friend and keep the PNG like any other picture.

## Decision

The widget draws it. `/widget/<id>.<key>/face/<n>` sends every friend's
picture, SVG included. When `Image.fromData` can't open what came back and
it says it's SVG, `picture()` in `public/widget/widget.js` draws it in a
hidden web view at twice its size, keeps the PNG, and never asks again (the
address carries the drawing's fingerprint). A made friend's room card has
her standing in it, as Rithika's five do.

## Consequences

The first draw after a made house's widget is added is a little slower, once
for each friend. If a phone's web view won't draw it, the widget falls back
to her initial, as before, and tries again next time.
