# 0017. A house for any five friends

Status: proposed. A prototype for crit 10's week, built on the branch
`llm-any-friends` on 18 October 2026 so it can be thrown away; waiting on
Rithika's review. It relaxes 0003 (a person is one of five fixed ids) and
0001 (no runtime dependencies), and leaves both standing for Rithika's own
house.

## Context

The house was made for exactly five people: Rithika, Neha, Amirdhavarshini,
Rithanya and Aswathy, fixed in `src/people.ts`. Rithika asked to make it for
everybody: "the user is asked to list how many friends and a few qualities of
them, and also what specific things should be in their room, what things they
want as memories in living room etc", using an LLM, and "for now lets stick
to 5 friends for the prototype".

Everything in the house assumes one set of five:
- the five stickers and rooms in the Stitch picture (ADR 0007)
- one SQLite file (0002)
- the `who=` cookie at `/`
- about a hundred places that loop over `PEOPLE`

## Options

**Where a made house's things live.**
- One SQLite file per house: `houses/<code>.db`, beside Rithika's
  `house.db`, plus a small `houses.db` registry of each house's spec.
- A `house` column on every row of `things` and `visits`. That means one
  file, but every query and every test has to remember the column. And a
  missed `WHERE` would show one group's private desk notes to another.

The first was chosen. A house can't see another's rows, because they aren't
in its file.

**How the code knows which house it's in.**
- Thread a house argument through `store.ts`, `pages.ts`, `scene.ts` and
  `house.ts`. It's explicit, but it touches most functions in the app for
  a prototype that may be thrown away.
- Run each request inside its house with Node's `AsyncLocalStorage`
  (`inHouse` in `src/houses.ts`). `store.ts` picks that house's database.
  `PEOPLE` reads that house's five. A made house's pages are rebased onto
  `/h/<code>/` on the way out, so links, forms, redirects and scripts written
  for `/` stay in the house. The `who=` cookie's path is the house.

The second was chosen. Rithika's house is untouched: the 41 existing spec
tests pass unchanged, and it costs one hidden dependency on request context.

**What the house looks like.**
- The same picture, with five fixed windows. Each made friend takes window
  1 to 5: its sticker, its room and its furniture.
- A new house drawn for each group. That needs image generation and
  coordinates for every room, which is a different project.

The first was chosen, for now.

**Who writes the house.**
- Claude, with structured output.
- A form only, with no LLM. That gives no time zones from "Bangalore", no
  rooms described from "loves movies, sleeps in", and memories left as
  typed.

Claude was chosen, with the form-only maker kept as the fallback (below).

## Decision

`GET /make` is a form for five friends: a name, where she lives, a few
qualities, what's in her room and an optional birthday each, and the
memories for the living room wall.

`POST /make` checks it: five names, length caps, at most 4 KB a field and
32 KB a form. Then it asks Claude (`claude-opus-5-5`, effort `low`) to write
the house:
- The SDK's `messages.parse` is called with a JSON schema, so the answer
  comes back as the house's shape.
- The system prompt says the answers are the user's data, never
  instructions, and not to invent facts about these real people beyond what
  was given.
- Per friend, Claude writes:
  - an IANA zone for her city
  - plausible sleep hours
  - a colour and a pale note-paper colour
  - one sentence for her room
  - 3 to 6 things in it, kept close to the user's words
  - a short phrase for who she is
- It also tidies the memories into 3 to 8 wall notes.

Whatever comes back is checked again on the server before it's saved:
- exactly five friends, in the order and with the names given
- zones that `Intl` accepts, else UTC
- `#rrggbb` colours, distinct, else the old five's palette
- text clipped to fit

Birthdays come straight from the form. `[0, 0]` means none, which
`birthday()` already reads as never her month.

A house gets a random ten-character code. The maker answers with its address
to share and a way in. Anyone with the address can come in, like Rithika's
house; one-of-us-at-a-time (0011) works per house.

**Without a key.** The app reads `ANTHROPIC_API_KEY`. Without one, or with
`HOUSE_MAKER=fake`, a local maker builds the same shape from the answers:
- zones for a few known places, else UTC
- the old five's colours
- the room sentence made from her things and qualities

The deployed app has no key unless Rithika sets one as a Fly secret, so this
is how houses are normally made. The page presents it that way ("Every room
is built from exactly what you wrote about her"), not as a fallback. CI's
container, the spec and the screenshots use it too. A refusal, a cut-off
answer, an answer that won't parse, a rate limit or an unreachable API each
get a friendly line on the form, with the answers kept, never a stack trace.

**Logs** (crit 10): one line per house made, `made house <code> for 5
friends (claude|offline) in <ms>ms`, or why it failed, with no names or
answers in them.

**The runtime dependency.** `@anthropic-ai/sdk`, pinned to 0.131.0, is the
house's first. It's Anthropic's official client, and it supplies:
- the structured-output parsing (`jsonSchemaOutputFormat`, `parsed_output`)
- the typed errors for rate limits, auth and connection failures
- the retries

Writing those by hand over `fetch` would be the same code, less tested. The
Dockerfile now installs production dependencies from the lockfile with pnpm
11.9.0 through corepack (`--prod --frozen-lockfile`). The spec's dev tools
stay out of the image.

## Consequences

Anyone can make a house for their own five friends in a minute. Each one
lives under `/h/<code>/`, with:
- its own walls, desks, garden and Shinzo
- its own clocks, live updates and logins

Rithika's house at `/` is unchanged.

Each house made with Claude costs one call, a few thousand tokens at
effort `low`: about a cent. Nothing is charged per visit afterwards.

`/make` is public, so making houses is capped. Each visitor (by Fly's
`fly-client-ip`, else the socket address) can make 3 an hour, and the app 30
an hour in all. Over the cap it answers 429 with "Lots of houses are being
made right now. Try again in a little while.", and logs `make refused: over
the cap` with no address. The count is in memory, so a restart resets it,
which is fine for a prototype; a real launch would keep it in SQLite. The
spec sends its own `fly-client-ip` so runs back to back stay under the cap.
On Fly the proxy sets that header from the connection; a visitor who could
set it themselves could dodge the per-visitor cap, but not the 30 an hour.

Two costs remain:
- Every made house borrows the same five stickers and the same picture. A
  room's own furniture and Rithika's friends' details (KitKats, the hostel
  kettle, the yoga mat) are drawn into made houses unless the rooms work on
  this branch replaces them.
- The `AsyncLocalStorage` context is invisible in function signatures. Code
  that runs outside a request (timers, the live line's heartbeat) has to
  enter the right house itself, as `src/live.ts` does.

More than five friends means more rooms, and more rooms means new art: a
bigger picture, or a house drawn from pieces. That's the next step, not this
one.

Revisit if more than five friends is wanted, if made houses need their own
pictures, or if the prototype is thrown away. In that last case `/make`,
`src/maker.ts`, `src/houses.ts`, the dependency and this record go with it.
