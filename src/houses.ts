import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Drawing } from "./drawings.ts";
import type { Gender, Look } from "./people.ts";

// More than one house (prototype, branch llm-any-friends). The original house
// is Rithika's five at `/`; every other house is made from a form by Claude
// (src/maker.ts) and lives under `/h/<code>/`, with its own SQLite file and
// its own five friends in the same five windows of the same picture.
//
// Each request runs inside one house (`inHouse`), so the rest of the code
// keeps reading "the house" (store.ts's database, people.ts's PEOPLE)
// without being passed it.

// A friend in a made house: the same fields as people.ts's Person, written by
// Claude from what the maker said. Ids stay the window numbers 1-5, so the
// stickers, rooms and furniture in the picture line up.
export type Friend = {
  id: string;
  name: string;
  city: string;
  tz: string;
  sleep: [number, number];
  birthday: [number, number];
  color: string;
  paper: string;
  about: string;
  // What's in her room, drawn on her desk and listed on her room page.
  things: string[];
  // Since ADR 0020, the pictures picked for her room on the form, as keys
  // into BELONGINGS (src/belongings.ts); `things` are their labels.
  belongings?: string[];
  // Before that, the first few things drawn by Claude when the house was
  // made (src/drawings.ts, ADR 0018). Houses with neither pin up paper tags.
  drawings?: Drawing[];
  // A few words for who she is, as the maker described her.
  qualities: string;
  // Asked on the form (src/people.ts Gender). Houses made before it was asked
  // have none, and are treated as girls, as they were made.
  gender?: Gender;
  // Her sticker (src/avatars.ts), picked when the house is made.
  look?: Look;
};

// A house someone made: its friends, and the memories they asked for on the
// living room wall.
export type HouseSpec = {
  code: string;
  title: string;
  friends: Friend[];
  memories: string[];
  createdAt: number;
};

// `code` is "" for Rithika's own house; `base` is what every link starts with.
export type House = { code: string; base: string; spec?: HouseSpec };

export const ORIGINAL: House = { code: "", base: "" };

const current = new AsyncLocalStorage<House>();

export const house = (): House => current.getStore() ?? ORIGINAL;

// Whether this request is in a made house. Rithika's five have details only
// they share (KitKats, the hostel kettle, face masks, a yoga mat); a made
// house has its own five, and none of those.
export const made = (): boolean => house().spec !== undefined;

export const inHouse = <T>(h: House, fn: () => T): T => current.run(h, fn);

// A made house's code: short, unguessable enough that a stranger doesn't
// wander into someone else's, and safe in a path and a file name.
export const isCode = (code: string): boolean => /^[a-z0-9]{10}$/.test(code);

/* ---------- the made houses ---------- */

// Every made house's spec, in one small table of its own beside Rithika's
// house.db (each house's own things are in houses/<code>.db, src/store.ts).
// A spec is written once, when the house is made, and only read after.
const dir = process.env.DATA_DIR ?? "data";
mkdirSync(dir, { recursive: true });
const registry = new DatabaseSync(join(dir, "houses.db"));
registry.exec("CREATE TABLE IF NOT EXISTS houses (code TEXT PRIMARY KEY, spec TEXT NOT NULL, created_at INTEGER NOT NULL)");
const insertHouse = registry.prepare("INSERT INTO houses (code, spec, created_at) VALUES (?, ?, ?)");
const selectHouse = registry.prepare("SELECT spec FROM houses WHERE code = ?");

const known = new Map<string, House>();

export function saveHouse(spec: HouseSpec): House {
  insertHouse.run(spec.code, JSON.stringify(spec), spec.createdAt);
  const h: House = { code: spec.code, base: `/h/${spec.code}`, spec };
  known.set(spec.code, h);
  return h;
}

export function findHouse(code: string): House | undefined {
  if (!isCode(code)) return undefined;
  const cached = known.get(code);
  if (cached) return cached;
  const row = selectHouse.get(code);
  if (!row) return undefined;
  const h: House = { code, base: `/h/${code}`, spec: JSON.parse(String(row.spec)) as HouseSpec };
  known.set(code, h);
  return h;
}

export const closeHouses = (): void => registry.close();
