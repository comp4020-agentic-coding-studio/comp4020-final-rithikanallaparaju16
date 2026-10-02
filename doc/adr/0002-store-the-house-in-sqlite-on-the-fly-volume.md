# 0002. Store the house in SQLite on the Fly volume

Status: accepted

Made in session 1 and recorded here in session 2, after the fact.

## Context

What friends leave has to survive a refresh, a restart and a redeploy. On Fly
that means the volume mounted at `/data`, as `fly.toml` fixes. There's one
machine, five people, and a handful of writes a day.

## Options

- SQLite through Node's built-in `node:sqlite`, in a file on the volume.
  Writes are crash-safe, there's no dependency, and a backup is a file copy.
  Only one machine can write to it.
- A JSON file on the volume. That's enough for five people, but a crash halfway
  through a write can corrupt it, and two requests writing at once can lose
  data.
- Hosted Postgres. It survives scaling out, but it's a second service to run,
  pay for and connect to, for a house of five.

## Decision

SQLite at `$DATA_DIR/house.db` (`/data` on Fly, `./data` locally), opened when
`src/store.ts` loads. Schema changes run at boot, before the server listens.

## Consequences

The app can't run on a second machine without moving its data. Migrations run
whenever `store.ts` loads, even in a process that then fails to bind its port,
so two servers pointed at one data directory can migrate it under each other.
That happened locally in session 2.

Revisit if the house ever needs more than one machine.
