# 0024. Photos on the memory wall are kept in the house's own database

Status: accepted. Built on 3 November 2026 at Rithika's asking ("on memory
wall, give the user an option to upload an image, so if sumn reminds them of
the group, they can send an image saying, this reminds me of you guys").
Adds to 0002 (SQLite on the Fly volume) and 0005 (one log of things);
changes neither.

## Context

Until now everything anyone left was a few hundred characters of text. A
photo is tens or hundreds of kilobytes, comes from a phone's camera at
several megabytes, and must survive a redeploy like everything else (only
`/data` does, ADR 0002). The machine has 256 MB of memory, and the house has
one runtime dependency, for the maker (ADR 0017).

## Options

Where the picture lives:

- Files under `/data/photos/`. Simple to serve, but then a house is a
  database plus a folder, and a made house's photos need a folder of their
  own that has to be kept in step with its `houses/<code>.db`.
- A column on `things`. Every page reads the whole log (`store.things()`),
  so every page load would read every photo.
- A `photos` table in the house's own SQLite file, read only when a photo
  is asked for. The note on the wall stays an ordinary `things` row.

How it's read:

- A multipart library. A second runtime dependency, for one form.
- Node's own `Request.formData()`. It works, but it hides the size limit
  until the whole body is read.
- A small reader of our own (`src/photos.ts`) that stops at the limit.

## Decision

- A photo on the wall is a `note` on `wall`, like any other, with item
  `photo:<id>` and its caption as the body (optional; the form suggests
  "this reminds me of you guys"). `photoOf()` in `src/house.ts` reads it.
  Big news keeps item `big`, so a photo is never big news.
- The picture is a row in a new `photos` table (type, bytes, when) in the
  same database as the house's things, so a made house's photos are in its
  own file, and both survive a redeploy.
- `POST /wall/photo` takes a form with a file in it, up to 6 MB, read by
  `src/photos.ts`, which stops at the limit. What it is comes from its
  first bytes, never its name: only JPEG, PNG and WebP are kept.
- `GET /photo/<id>` serves it, only to someone signed into that house, only
  if it's pinned on its wall, with the type it was kept as and `nosniff`.
  A browser keeps it a year (`private, immutable`): a pinned photo never
  changes.
- The page script (`public/live.js`) redraws a phone's photo at most 1600 px
  across as a JPEG before sending, usually a few hundred KB, and shows it
  as a polaroid while you write. Without the script the photo goes as it
  is, up to the 6 MB limit.

## Consequences

The database grows by every photo. At a few hundred KB each, the five
could pin a photo a day for years inside the 1 GB volume. There's no way
to take a photo down yet; that's the same as notes, which are only ever
added.

A photo is as private as the door: anyone signed in as a friend can see the
wall (ADR 0011, and RICE row G). It isn't in Updates' words or the logs,
which say only that a photo was pinned.

`kind` and `item` values are only added. Older rows read as they did.
