import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

// On Fly, DATA_DIR is the /data volume: the only place that survives a restart.
const dir = process.env.DATA_DIR ?? "data";
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(join(dir, "house.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS visits (
    person TEXT PRIMARY KEY,
    last_seen INTEGER NOT NULL,
    seen_until INTEGER NOT NULL
  );
`);

export type Note = { id: number; author: string; body: string; createdAt: number };

const insertNote = db.prepare("INSERT INTO notes (author, body, created_at) VALUES (?, ?, ?)");
const selectNotes = db.prepare(
  "SELECT id, author, body, created_at FROM notes ORDER BY created_at DESC, id DESC",
);
const selectVisit = db.prepare("SELECT last_seen, seen_until FROM visits WHERE person = ?");
const selectVisits = db.prepare("SELECT person, last_seen FROM visits");
const upsertVisit = db.prepare(`
  INSERT INTO visits (person, last_seen, seen_until) VALUES (?, ?, ?)
  ON CONFLICT (person) DO UPDATE SET last_seen = excluded.last_seen, seen_until = excluded.seen_until
`);

export function leaveNote(author: string, body: string): void {
  insertNote.run(author, body, Date.now());
}

export function notes(): Note[] {
  return selectNotes.all().map((r) => ({
    id: Number(r.id),
    author: String(r.author),
    body: String(r.body),
    createdAt: Number(r.created_at),
  }));
}

export function lastSeen(): Map<string, number> {
  return new Map(selectVisits.all().map((r) => [String(r.person), Number(r.last_seen)]));
}

// A visit is a run of page loads with no 30-minute gap, so "new" marks survive
// a refresh or leaving a note, and reset only when you come back another time.
const VISIT_GAP = 30 * 60 * 1000;

// Records that `person` is here now; returns the moment before which
// everything counts as already seen (0 on a first visit).
export function recordVisit(person: string): number {
  const now = Date.now();
  const prev = selectVisit.get(person);
  const seenUntil = !prev
    ? 0
    : now - Number(prev.last_seen) > VISIT_GAP
      ? Number(prev.last_seen)
      : Number(prev.seen_until);
  upsertVisit.run(person, now, seenUntil);
  return seenUntil;
}

export function close(): void {
  db.close();
}
