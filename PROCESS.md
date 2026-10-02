# Process

## Why this project

Four close friends and I, five people in all, live away from each other and are
rarely online at the same time. I didn't want another messaging app. The
problem I wrote down for the agent was: *we want to feel connected even when
we're not online at the same time.* One of us might open the app for 30 seconds,
leave something behind and disappear. Another might come back hours or days
later and find it. So the app should feel like a shared little world that
remembers the people who live in it, and keeps existing when nobody's there.

## How I'm working with the agent

I wrote a long direction prompt covering the product, the feeling I'm after,
what to avoid, a seven-point definition of good, architecture preferences,
testing and deployment philosophy, and how I want to work. I gave it to Claude
Code in this repo. `CLAUDE.md` is the harness. It holds the rules future
sessions need, condensed from that prompt and from what happens in sessions. It
doesn't restate the course brief.

## Decisions so far

These were made in session 1. Unless noted, the agent made the call and I can
still redirect it.

- **The metaphor is a house with five windows and a kitchen table.** Five
  windows make the five-person constraint visible. A window is lit if that
  friend came by in the last day, so the house remembers people even when they
  left nothing. The table is a shared surface rather than a feed.
- **The first "something" is a short note (up to 500 characters).** It's the
  smallest thing that carries a piece of someone. Photos, drawings and prompts
  wait until the loop is proven.
- **Identity is "pick your window".** A cookie remembers it for a year, and
  there are no passwords. Anyone with the link can pick any window. That's
  deliberate for now, since strangers at the crit need to walk in. A shared
  front-door key is the likely next step.
- **Discovery is "new since your last visit".** A visit ends after a 30-minute
  gap, and the greeting names who left things. The agent chose the gap up front:
  if every page load counted as a visit, the *new* marks would vanish the moment
  you left a note (leaving one redirects you back to the house).
- **The stack is as small as the problem.** Node 24 runs the TypeScript
  directly, with `node:http`, `node:sqlite` on the Fly `/data` volume,
  server-rendered HTML forms, no client-side JavaScript and no runtime
  dependencies. It fits the 256 MB machine, there's nothing to build, and the
  data sits in the one place that survives a redeploy. The agent considered a
  JSON file, which would be fine for five people, but SQLite gives crash-safe
  writes for free. It also considered `marked` for rendering the README at
  `/readme/`, but wrote a small renderer for the subset the README uses, to stay
  at zero runtime dependencies. The cost is that the README has to stay within
  that subset, which is now a rule in `CLAUDE.md`.
- **Spec checks that write only run against a throwaway house** (localhost or
  CI's container). Running the spec against the live URL never leaves test
  notes in the real house.

## What went wrong, and what we found

- The agent's shell didn't have node on its PATH, because mise wasn't active.
  `mise install` fixed it, and commands now run through `mise exec --`.
- The first phone-width screenshot was misleading: headless Chrome won't render
  a window narrower than about 500px. Framing the pages in a 390px iframe gave a
  true phone view. That view showed the roof overhanging the screen (a 4px
  horizontal scroll), the windows wrapping 4+1, and "Friend 2 (you)" wrapping
  and knocking its window out of line. All three were fixed: the roof stays
  inside the gutter, phones get a 3+2 grid like two floors, and your own window
  says "you're here". The iframe trick is now a rule in `CLAUDE.md`.
- There's no Docker on my machine, so Fly's remote builder was the first thing
  to build the image.

## Deliberately left out

Photos, drawings, prompts, rooms, real-time presence, notifications, editing or
deleting notes, and real authentication. None of them is needed to prove leave →
persist → return → discover, and each has to show it makes five people feel
closer before it goes in.

## How the harness has evolved

- **Session 1:** replaced the template `CLAUDE.md` with project rules. These are
  the principle, the definition of good, the feel and the avoid-list, the
  feature test, the architecture rules (erasable TypeScript, zero runtime deps,
  all state in SQLite on `/data`, escape everything, never change person ids),
  the README renderer's limits, the throwaway gate for writing tests, the
  phone-width check, the post-deploy check, never reading `mise.local.toml`, and
  keeping this log. The "build when asked, keep assessments short" rule came
  from my two interruptions (log entries 1 and 2).

## Project log

One entry per prompt: what I asked, what the agent did, what I corrected, and
the commits.

### 1. Direction prompt (2 Oct 2026)

**Asked:** inspect the repo, give an A–I assessment, and wait for confirmation
before building.

**Agent:** read the README, PROCESS.md, CLAUDE.md, `spec/`, the Dockerfile,
`fly.toml`, the CI workflow, `package.json`, `tsconfig.json`, the pre-commit
hook and the evidence script. It then ran a multi-part shell command checking
the reflections folder, the ignore files, whether `mise.local.toml` existed,
tool versions and `flyctl`.

**Correction:** I rejected that command.

No commit.

### 2. "give me a working version"

**Agent:** read `.dockerignore`, `.gitignore` and `pnpm-workspace.yaml`, then
tried another multi-part environment check (node, pnpm, Docker, git remote).

**Correction:** I rejected it too.

No commit.

### 3. The brief again, edited

**What I changed in the brief:** "4 closest friends and me". I removed the
inspect-first, wait-for-confirmation and "how I want you to work with me"
sections, and asked for this project log.

**Agent:** gave a short A–I assessment, then built the first slice: the door,
the house, the table, cookie identity, SQLite storage, the README renderer, and
six spec checks for the core loop. It replaced the placeholder Dockerfile.
`pnpm check` passed 8/8. It checked the pages at phone width and fixed three
layout problems. It confirmed locally that notes survive a server restart: after
the restart, a first-time visitor was greeted with "Rithika left 3 notes on the
table for you." It wrote README.md, CLAUDE.md and this file.
