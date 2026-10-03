import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

// On Fly, DATA_DIR is the /data volume: the only place that survives a restart.
const dir = process.env.DATA_DIR ?? "data";
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(join(dir, "house.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS things (
    id INTEGER PRIMARY KEY,
    author TEXT NOT NULL,
    kind TEXT NOT NULL,
    place TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    item TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS visits (
    person TEXT PRIMARY KEY,
    last_seen INTEGER NOT NULL,
    seen_until INTEGER NOT NULL
  );
`);

// Where in the house each friend last was ("room:2", "kitchen"), so the house
// can show them there while they're home. Added in session 3.
if (!db.prepare("SELECT 1 FROM pragma_table_info('visits') WHERE name = 'place'").get()) {
  db.exec("ALTER TABLE visits ADD COLUMN place TEXT NOT NULL DEFAULT ''");
}

// The first house kept notes in their own table; they move onto the living
// room wall, where they'd have been.
if (db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'notes'").get()) {
  db.exec(`
    BEGIN;
    INSERT INTO things (author, kind, place, body, created_at)
      SELECT author, 'note', 'wall', body, created_at FROM notes ORDER BY id;
    DROP TABLE notes;
    COMMIT;
  `);
}

export type Kind = "note" | "desk" | "tidy" | "dish" | "water" | "plant" | "play";

export type Thing = {
  id: number;
  author: string;
  kind: Kind;
  place: string;
  body: string;
  item: string;
  createdAt: number;
};

const insertThing = db.prepare(
  "INSERT INTO things (author, kind, place, body, item, created_at) VALUES (?, ?, ?, ?, ?, ?)",
);
const selectThings = db.prepare(
  "SELECT id, author, kind, place, body, item, created_at FROM things ORDER BY created_at DESC, id DESC",
);
const selectVisit = db.prepare("SELECT last_seen, seen_until FROM visits WHERE person = ?");
const selectVisits = db.prepare("SELECT person, last_seen, place FROM visits");
// An empty place (the whole house, Updates) keeps wherever you last were.
const upsertVisit = db.prepare(`
  INSERT INTO visits (person, last_seen, seen_until, place) VALUES (?, ?, ?, ?)
  ON CONFLICT (person) DO UPDATE SET last_seen = excluded.last_seen, seen_until = excluded.seen_until,
    place = CASE excluded.place WHEN '' THEN visits.place ELSE excluded.place END
`);

export function leave(t: { author: string; kind: Kind; place: string; body?: string; item?: string }): void {
  insertThing.run(t.author, t.kind, t.place, t.body ?? "", t.item ?? "", Date.now());
}

// Newest first. Five people leave few enough things that the house can be
// rebuilt from the whole log on every page.
export function things(): Thing[] {
  return selectThings.all().map((r) => ({
    id: Number(r.id),
    author: String(r.author),
    kind: String(r.kind) as Kind,
    place: String(r.place),
    body: String(r.body),
    item: String(r.item),
    createdAt: Number(r.created_at),
  }));
}

export function lastSeen(): Map<string, number> {
  return new Map(selectVisits.all().map((r) => [String(r.person), Number(r.last_seen)]));
}

// The place each friend was on their last page load, or nothing if they've
// only ever been at the door or looking at the whole house.
export function whereabouts(): Map<string, string> {
  return new Map(selectVisits.all().filter((r) => r.place).map((r) => [String(r.person), String(r.place)]));
}

// A visit is a run of page loads with no 30-minute gap, so "new" marks survive
// a refresh or leaving something, and reset only when you come back another time.
const VISIT_GAP = 30 * 60 * 1000;

// Records that `person` is here now, in `place` if they're in a room; returns
// the moment before which everything counts as already seen (0 on a first visit).
export function recordVisit(person: string, place = ""): number {
  const now = Date.now();
  const prev = selectVisit.get(person);
  const seenUntil = !prev
    ? 0
    : now - Number(prev.last_seen) > VISIT_GAP
      ? Number(prev.last_seen)
      : Number(prev.seen_until);
  upsertVisit.run(person, now, seenUntil, place);
  return seenUntil;
}

export function close(): void {
  db.close();
}
