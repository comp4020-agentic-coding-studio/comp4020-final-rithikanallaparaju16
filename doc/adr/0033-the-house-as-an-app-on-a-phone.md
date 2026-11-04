# 0033. The house as an app on a phone

Status: accepted. Built on 5 November 2026. Rithika asked for a TestFlight
app and an Android one, then called it off ("nvm, lets j do website for
now"), then: "buid a webapp of this that renders like a mobile app in
phone,so even distribution becaomes easy / same applies for make your owb
house as well". Builds on 0032 (a phone on its side) and the manifest from
session 71.

## Context

The house could already go on a home screen (a manifest, Apple's tags),
but nothing handed it out: you had to know to look in the browser's menu.
Chrome, Edge and Android only offer "Install" to a site with a service
worker. There was no page for "here's the app", no way to get it from a
laptop to a phone, and a phone offline got the browser's error page.

A store app would need paid Apple and Google developer accounts, Xcode and
a review, for something the website already is.

## Decision

- **`/app`**, for each house (`/h/<code>/app` for a made one), open to
  anyone with the address: the house's icon, name and who it's for; an
  Install button, shown only when the browser offers one; Share (the
  phone's sheet) and Copy; a QR code of the house's address for a phone to
  scan off a laptop; and the steps for iPhone, iPad, Android, Windows and
  Mac, the one you're on first. Linked from the door ("Get the app") and
  every page's footer.
- **The QR code** is drawn by `src/qr.ts`, written here (byte mode, level
  M, versions 1 to 10), so the house keeps one runtime dependency. Its
  codes were read back by OpenCV, from the smallest to version 9.
- **A service worker** (`public/sw.js`) at each house's own address, so
  its scope is that house: never kept (`no-cache`) so a new one is found;
  keeps the art and fonts on the phone (their addresses never change);
  never keeps a page, since a page from yesterday would show yesterday's
  house; offline, it shows `/offline` ("The house is just out of reach"),
  which reloads by itself when the phone's back online.
- **The manifest** gains an `id`, shortcuts (Updates, Movies, Everyone)
  for a long press on the icon, and keeps landscape (0032).
- **Opened from the home screen**, the bar reaches under the notch, and
  there's no long-press menu on buttons or bounce when pulling down.
- **A made house's ready page** sends the address: Share, Copy, a QR code
  and a link to its own app page.

## Consequences

On an iPhone there's no Install button: Safari only adds to the home
screen by hand, so the page says how. Everywhere else the browser offers
it.

The house still needs to be online to show anything new; offline it says
so kindly instead of failing.
