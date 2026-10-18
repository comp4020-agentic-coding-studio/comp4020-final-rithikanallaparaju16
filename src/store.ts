import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { house } from "./houses.ts";
import { personById } from "./people.ts";

// On Fly, DATA_DIR is the /data volume: the only place that survives a restart.
const dir = process.env.DATA_DIR ?? "data";
mkdirSync(dir, { recursive: true });

// Each house keeps its own SQLite file (src/houses.ts): Rithika's five in
// house.db, as always, and a made house in houses/<code>.db. Opened on first
// use and kept open.
function open(code: string): DatabaseSync {
  if (code) mkdirSync(join(dir, "houses"), { recursive: true });
  const db = new DatabaseSync(code ? join(dir, "houses", `${code}.db`) : join(dir, "house.db"));
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync): void {
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

  // Added in session 7: when each friend last came into her place or walked
  // somewhere in it (`arrived`), so sleeping in a bed or sitting down lasts
  // only until she gets up; and the spot she walked to (`x`, `y`, in the
  // picture's pixels), so she's still there when she comes back. No spot means
  // the room's own first spot.
  // Added in session 8: the token of whoever is in the house as this friend
  // (ADR 0011), which her `who` cookie has to carry, empty when nobody is; and
  // when she came in at the door (`claimed`), which holds her window shut before
  // her first page load.
  for (const [column, type] of [["arrived", "INTEGER NOT NULL DEFAULT 0"], ["x", "REAL"], ["y", "REAL"], ["token", "TEXT NOT NULL DEFAULT ''"], ["claimed", "INTEGER NOT NULL DEFAULT 0"]]) {
    if (!db.prepare("SELECT 1 FROM pragma_table_info('visits') WHERE name = ?").get(column)) {
      db.exec(`ALTER TABLE visits ADD COLUMN ${column} ${type}`);
    }
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
}

export type Kind =
  | "note" | "desk" | "tidy" | "dish" | "water" | "plant" | "play"
  // Session 4: a face mask in Rithanya's room, kettle Maggi in Amirdhavarshini's,
  // and movies (a suggestion, who's watched it, and a planned movie night).
  | "mask" | "kettle" | "movie" | "watched" | "movienight"
  // Session 7: sleeping in any bed, sitting down somewhere (the item is the
  // seat), and giving Shinzo (then Laddoo) a treat. Then eating a dish off the
  // counter (the place is `dish:<id>`, like `movie:<id>`).
  | "nap" | "sit" | "treat" | "eat"
  // Session 8: a hug (the item is the others in it, as ids joined by commas),
  // a birthday wish (the place is her room), and UNO on Amirdhavarshini's mat:
  // a game dealt (`uno`) and each move in it (`unomove`, placed `uno:<id>`).
  | "hug" | "wish" | "uno" | "unomove"
  // Later in session 8: a sticker on a note on the wall (the place is
  // `note:<id>`, the item the sticker, or "" when she peels hers off).
  | "sticker";

export type Thing = {
  id: number;
  author: string;
  kind: Kind;
  place: string;
  body: string;
  item: string;
  createdAt: number;
};

// Every write tells whoever's listening (src/live.ts passes it on to open
// pages): `changed` when something in the house is different, `moved` when a
// friend walked somewhere.
export type Change = { type: "changed" } | { type: "moved"; person: string; place: string; x: number; y: number };
// `code` is the house it happened in, so only that house's open pages hear.
const listeners: ((c: Change, code: string) => void)[] = [];
export const onChange = (fn: (c: Change, code: string) => void): void => void listeners.push(fn);
export const changed = (c: Change = { type: "changed" }): void => listeners.forEach((fn) => fn(c, house().code));

function statements(db: DatabaseSync) {
  const insertThing = db.prepare(
    "INSERT INTO things (author, kind, place, body, item, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const selectThings = db.prepare(
    "SELECT id, author, kind, place, body, item, created_at FROM things ORDER BY created_at DESC, id DESC",
  );
  const selectVisit = db.prepare("SELECT last_seen, seen_until, place FROM visits WHERE person = ?");
  const selectToken = db.prepare("SELECT token, MAX(last_seen, claimed) AS active FROM visits WHERE person = ?");
  // Signing in before ever loading a page makes the row with no visit in it yet:
  // last_seen 0 still counts as a first visit (recordVisit). Signing in doesn't
  // touch last_seen, which says when your last visit ended.
  const claimToken = db.prepare(`
    INSERT INTO visits (person, last_seen, seen_until, token, claimed) VALUES (?, 0, 0, ?, ?)
    ON CONFLICT (person) DO UPDATE SET token = excluded.token, claimed = excluded.claimed
  `);
  const releaseToken = db.prepare("UPDATE visits SET token = '' WHERE person = ? AND token = ?");
  const selectVisits = db.prepare("SELECT person, last_seen, place, arrived, x, y FROM visits");
  // An empty place (the whole house, Updates) keeps wherever you last were, and
  // staying in the same place keeps when you got there and where you stood.
  // Going into somewhere new puts you on its first spot.
  const upsertVisit = db.prepare(`
    INSERT INTO visits (person, last_seen, seen_until, place, arrived) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (person) DO UPDATE SET last_seen = excluded.last_seen, seen_until = excluded.seen_until,
      arrived = CASE WHEN excluded.place IN ('', visits.place) THEN visits.arrived ELSE excluded.arrived END,
      x = CASE WHEN excluded.place IN ('', visits.place) THEN visits.x ELSE NULL END,
      y = CASE WHEN excluded.place IN ('', visits.place) THEN visits.y ELSE NULL END,
      place = CASE excluded.place WHEN '' THEN visits.place ELSE excluded.place END
  `);
  const updateSpot = db.prepare("UPDATE visits SET x = ?, y = ?, arrived = ? WHERE person = ?");
  return { db, insertThing, selectThings, selectVisit, selectToken, claimToken, releaseToken, selectVisits, upsertVisit, updateSpot };
}

type Statements = ReturnType<typeof statements>;
const opened = new Map<string, Statements>();

// The database of whichever house this request is in.
function q(): Statements {
  const code = house().code;
  let s = opened.get(code);
  if (!s) opened.set(code, (s = statements(open(code))));
  return s;
}

// Rithika's house opens (and migrates) at boot, before the server binds its
// port, as it always has.
q();

// Who did what, for `flyctl logs` (crit 10): one line per thing left, by
// house and by friend, with the kind, where and which item. Never what anyone
// wrote: a note's words stay in the house.
const who = (person: string): string => `${person}:${personById(person)?.name ?? "?"}`;
const where = (): string => house().code || "rithika";
export function log(line: string): void {
  console.log(`[${where()}] ${line}`);
}

export function leave(t: { author: string; kind: Kind; place: string; body?: string; item?: string }): void {
  const r = q().insertThing.run(t.author, t.kind, t.place, t.body ?? "", t.item ?? "", Date.now());
  const item = t.item ? ` item=${t.item}` : "";
  const words = t.body ? ` (${t.body.length} chars written)` : "";
  log(`${who(t.author)} ${t.kind} at ${t.place}${item}${words} #${r.lastInsertRowid}`);
  changed();
}

// Newest first. Five people leave few enough things that the house can be
// rebuilt from the whole log on every page.
export function things(): Thing[] {
  return q().selectThings.all().map((r) => ({
    id: Number(r.id),
    author: String(r.author),
    kind: String(r.kind) as Kind,
    place: String(r.place),
    body: String(r.body),
    item: String(r.item),
    createdAt: Number(r.created_at),
  }));
}

// Only friends who've loaded a page; signing in alone isn't a visit.
export function lastSeen(): Map<string, number> {
  return new Map(q().selectVisits.all().filter((r) => Number(r.last_seen) > 0).map((r) => [String(r.person), Number(r.last_seen)]));
}

// The place each friend was on their last page load, or nothing if they've
// only ever been at the door or looking at the whole house.
export function whereabouts(): Map<string, string> {
  return new Map(q().selectVisits.all().filter((r) => r.place).map((r) => [String(r.person), String(r.place)]));
}

// When each friend came into the place she's in, or last walked in it.
export function arrivals(): Map<string, number> {
  return new Map(q().selectVisits.all().map((r) => [String(r.person), Number(r.arrived)]));
}

// The spot each friend walked to, for those who've walked since going in.
export function spots(): Map<string, [number, number]> {
  return new Map(q().selectVisits.all().filter((r) => r.x !== null && r.y !== null).map((r) => [String(r.person), [Number(r.x), Number(r.y)]]));
}

// `person` walked to (x, y), in `place`. Walking counts as being here, and as
// getting up from wherever she was sitting or asleep.
const lastPlace = new Map<string, string>();

export function walkTo(person: string, place: string, x: number, y: number): void {
  recordVisit(person, place);
  q().updateSpot.run(x, y, Date.now(), person);
  // Walking sends a step a few times a second; only a change of room is news.
  if (place !== lastPlace.get(`${where()}/${person}`)) log(`${who(person)} walked into ${place}`);
  lastPlace.set(`${where()}/${person}`, place);
  changed({ type: "moved", person, place, x, y });
}

// A visit is a run of page loads with no 30-minute gap, so "new" marks survive
// a refresh or leaving something, and reset only when you come back another time.
const VISIT_GAP = 30 * 60 * 1000;
// The same ten minutes as "home now" in src/pages.ts.
const HOME_NOW = 10 * 60 * 1000;

// Records that `person` is here now, in `place` if they're in a room; returns
// the moment before which everything counts as already seen (0 on a first visit).
// Friends only hear about it when it shows: she's come home, or gone somewhere
// else in the house. Another page load in the same place changes nothing they
// can see, which is what keeps live pages fetching themselves from setting
// each other off.
export function recordVisit(person: string, place = ""): number {
  const now = Date.now();
  const prev = q().selectVisit.get(person);
  const seenUntil = !prev
    ? 0
    : now - Number(prev.last_seen) > VISIT_GAP
      ? Number(prev.last_seen)
      : Number(prev.seen_until);
  q().upsertVisit.run(person, now, seenUntil, place, place ? now : 0);
  const cameHome = !prev || now - Number(prev.last_seen) >= HOME_NOW;
  const moved = place !== "" && place !== String(prev?.place ?? "");
  if (cameHome || moved) changed();
  return seenUntil;
}

/* ---------- one of us at a time (ADR 0011) ---------- */

// The token whoever's in the house as `person` carries, and when she last
// came in or loaded a page ("" and 0 if nobody is).
export function holder(person: string): { token: string; active: number } {
  const r = q().selectToken.get(person);
  return { token: String(r?.token ?? ""), active: Number(r?.active ?? 0) };
}

// A browser's session is named by the first 6 characters of its token, which
// tells two browsers apart in the logs without printing the token itself.
const tag = (token: string): string => token.slice(0, 6);

export function claim(person: string, token: string): void {
  q().claimToken.run(person, token, Date.now());
  log(`${who(person)} came in at the door (browser ${tag(token)})`);
  changed();
}

// Only the one holding her can let her go.
export function release(person: string, token: string): void {
  if (Number(q().releaseToken.run(person, token).changes) > 0) {
    log(`${who(person)} left the house (browser ${tag(token)})`);
    changed();
  }
}

export function close(): void {
  for (const s of opened.values()) s.db.close();
}
