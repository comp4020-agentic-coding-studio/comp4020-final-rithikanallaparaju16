import type { Thing } from "./store.ts";

export type Item = { key: string; label: string; short: string };

export const FOOD: Item[] = [
  { key: "chai", label: "a cup of masala chai", short: "masala chai" },
  { key: "coffee", label: "a filter coffee", short: "filter coffee" },
  { key: "dosa", label: "a plate of dosa", short: "dosa" },
  { key: "biryani", label: "a bowl of biryani", short: "biryani" },
  { key: "maggi", label: "a bowl of Maggi", short: "Maggi" },
  { key: "cake", label: "a slice of cake", short: "cake" },
  { key: "mango", label: "a ripe mango", short: "a mango" },
];

export const GIFTS: Item[] = [
  ...FOOD,
  { key: "flower", label: "a flower from the garden", short: "a flower" },
  { key: "chocolate", label: "a bar of chocolate", short: "chocolate" },
  { key: "kitkat", label: "a KitKat from Rithanya's box", short: "a KitKat" },
];

export const PLANTS: Item[] = [
  { key: "sunflower", label: "sunflowers", short: "sunflowers" },
  { key: "jasmine", label: "jasmine", short: "jasmine" },
  { key: "hibiscus", label: "a hibiscus", short: "hibiscus" },
  { key: "tomato", label: "tomatoes", short: "tomatoes" },
  { key: "tulsi", label: "tulsi", short: "tulsi" },
  { key: "marigold", label: "marigolds", short: "marigolds" },
];

// Everyone's dog. He was Laddoo until session 7, when Rithika named him
// Shinzo; his stored "play" and "treat" rows don't name him, and his code
// and picture keep the old `laddoo` name.
export const DOG = "Shinzo";

// Rithanya keeps face mask powder for everyone, and the hostel kettle lives in
// Amirdhavarshini's room. Their rooms, by id.
export const MASK_ROOM = "4";
export const KETTLE_ROOM = "3";
// Rithanya loves movies; her suggestions are marked as her picks.
export const MOVIE_LOVER = "4";
// Aswathy meditates on the yoga mat in her room.
export const YOGA_ROOM = "5";

// Somewhere to sit down, by the `item` a "sit" keeps: the cushions on
// Amirdhavarshini's mat, the living room sofas and Aswathy's yoga mat.
export type Seat = { key: string; place: string };
export const SEATS: Seat[] = [
  { key: "mat", place: `room:${KETTLE_ROOM}` },
  { key: "sofa", place: "living" },
  { key: "yoga", place: `room:${YOGA_ROOM}` },
];

export const find = (list: Item[], key: string): Item | undefined => list.find((i) => i.key === key);

export const roomPlace = (id: string): string => `room:${id}`;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// `things` is always newest first, so the first match is the latest.
export const latest = (things: Thing[], kind: Thing["kind"], place?: string): Thing | undefined =>
  things.find((t) => t.kind === kind && (place === undefined || t.place === place));

export const desk = (things: Thing[], id: string): Thing[] =>
  things.filter((t) => t.kind === "desk" && t.place === roomPlace(id));

export const wall = (things: Thing[]): Thing[] => things.filter((t) => t.kind === "note" && t.place === "wall");

// A room gets lived-in on its own: a couple of things on the floor after two
// days, more after five. Anyone can tidy it. A room nobody has tidied yet
// starts a little lived-in, so there's something to do on the first visit.
export function mess(things: Thing[], id: string, now: number): 0 | 1 | 2 {
  const tidied = latest(things, "tidy", roomPlace(id));
  if (!tidied) return 1;
  const days = (now - tidied.createdAt) / DAY;
  return days < 2 ? 0 : days < 5 ? 1 : 2;
}

// Food stays out on the counter for three days, or until someone eats it.
export function counter(things: Thing[], now: number): Thing[] {
  const eaten = new Set(things.filter((t) => t.kind === "eat").map((t) => t.place));
  return things.filter((t) => t.kind === "dish" && now - t.createdAt < 3 * DAY && !eaten.has(`dish:${t.id}`));
}

// What a dish is called after "ate your": "dosa", "mango".
export const dishName = (t: Thing): string => (find(FOOD, t.item)?.short ?? "food").replace(/^a /, "");

export function plants(things: Thing[]): Map<string, Thing> {
  const mine = new Map<string, Thing>();
  for (const t of things) if (t.kind === "plant" && !mine.has(t.author)) mine.set(t.author, t);
  return mine;
}

// Plants grow with time alone: a sprout on the first day, growing until day
// three, then in bloom. Watering keeps them perky but never decides whether
// they live.
export function stage(plant: Thing, now: number): 1 | 2 | 3 {
  const age = now - plant.createdAt;
  return age < DAY ? 1 : age < 3 * DAY ? 2 : 3;
}

// A fresh plant comes watered; after two dry days the garden looks thirsty.
export function thirsty(things: Thing[], now: number): boolean {
  const growing = [...plants(things).values()];
  if (growing.length === 0) return false;
  const watered = latest(things, "water")?.createdAt ?? Math.min(...growing.map((p) => p.createdAt));
  return now - watered > 2 * DAY;
}

// A face mask stays on for a couple of hours, long enough for a friend who
// comes by to catch you in it.
export function masked(things: Thing[], now: number): Set<string> {
  return new Set(things.filter((t) => t.kind === "mask" && now - t.createdAt < 2 * HOUR).map((t) => t.author));
}

// Kettle Maggi stays out on the mat for the night: twelve hours.
export const kettle = (things: Thing[], now: number): Thing | undefined => {
  const made = latest(things, "kettle");
  return made && now - made.createdAt < 12 * HOUR ? made : undefined;
};

// A suggestion's title is the first line of its body, and why is the rest.
export type Movie = { thing: Thing; title: string; why: string; watched: string[] };

export function movies(things: Thing[]): Movie[] {
  return things.filter((t) => t.kind === "movie").map((thing) => {
    const [title, ...why] = thing.body.split("\n");
    const watched = things
      .filter((t) => t.kind === "watched" && t.place === `movie:${thing.id}`)
      .map((t) => t.author)
      .filter((a, i, all) => all.indexOf(a) === i);
    return { thing, title, why: why.join("\n"), watched };
  });
}

// The latest plan wins, until three hours after it starts. Its body is the
// moment, in milliseconds.
export function movieNight(things: Thing[], now: number): { plan: Thing; at: number; movie: Movie } | undefined {
  const plan = latest(things, "movienight");
  const at = Number(plan?.body);
  const movie = plan && movies(things).find((m) => `movie:${m.thing.id}` === plan.place);
  return plan && movie && at > now - 3 * HOUR ? { plan, at, movie } : undefined;
}

// Sleeping in a bed (a "nap", in any bed) or sitting down (a "sit") lasts
// until you've been somewhere else in the house, or for two hours. `where` and
// `arrived` are each friend's place and when she came into it, from visits.
export function resting(things: Thing[], now: number, where: Map<string, string>, arrived: Map<string, number>): Map<string, Thing> {
  const out = new Map<string, Thing>();
  const seen = new Set<string>();
  for (const t of things) {
    // Only each friend's latest counts.
    if ((t.kind !== "nap" && t.kind !== "sit") || seen.has(t.author)) continue;
    seen.add(t.author);
    const stillThere = where.get(t.author) === t.place && t.createdAt >= (arrived.get(t.author) ?? 0);
    if (stillThere && now - t.createdAt < 2 * HOUR) out.set(t.author, t);
  }
  return out;
}

// A hug's people: whoever gave it first, then the others in it.
export const hugPeople = (t: Thing): string[] => [t.author, ...t.item.split(",").filter(Boolean)];

// Hugs still going on: each friend is in her latest hug for five minutes,
// or until she walks off (`arrived` is when she came into her place or last
// walked, from visits). A hug with fewer than two people left in it is over.
export type Hug = { thing: Thing; by: string; people: string[] };

export function hugs(things: Thing[], now: number, arrived: Map<string, number>): Hug[] {
  const latestOf = new Map<string, Thing>();
  for (const t of things) {
    if (t.kind !== "hug") continue;
    for (const p of hugPeople(t)) if (!latestOf.has(p)) latestOf.set(p, t);
  }
  const out: Hug[] = [];
  for (const t of new Set(latestOf.values())) {
    if (now - t.createdAt >= 5 * 60 * 1000) continue;
    const people = hugPeople(t).filter((p) => latestOf.get(p) === t && (arrived.get(p) ?? 0) <= t.createdAt);
    if (people.length >= 2) out.push({ thing: t, by: t.author, people });
  }
  return out;
}

// Anyone who wished someone a happy birthday in the last two hours is still
// in a party hat.
export function partyHats(things: Thing[], now: number): Set<string> {
  return new Set(things.filter((t) => t.kind === "wish" && now - t.createdAt < 2 * HOUR).map((t) => t.author));
}

// Birthday wishes left in a friend's room, newest first.
export const wishes = (things: Thing[], id: string): Thing[] =>
  things.filter((t) => t.kind === "wish" && t.place === roomPlace(id));

// Shinzo goes with whoever last petted him (a "play") or gave him a treat,
// awake, for half an hour: wherever she goes, and wherever she last stood
// once she's gone, or the foot of her bed while she's asleep. Then he goes
// off on his own again (`wander`). Where she is comes from visits, so
// src/pages.ts works out the room. `until` is when he leaves her.
export const FOLLOW = 30 * 60 * 1000;

export function dog(things: Thing[], now: number): { with?: string; until?: number; last?: Thing } {
  const played = things.find((t) => t.kind === "play" || t.kind === "treat");
  if (!played) return {};
  const until = played.createdAt + FOLLOW;
  return now < until ? { with: played.author, until, last: played } : { last: played };
}

/* ---------- Shinzo's own day ---------- */

// The rest of the time he does what he likes, the same for everyone looking,
// worked out from the clock alone (ADR 0012). Time runs in ten-minute slots.
// In each, he either wanders (a few stops round the house, a sniff or a sit
// at each) or has a nap, on his blanket or at the foot of a bed. Each slot
// draws from its own seeded numbers, so where he is never needs a log, and
// where a slot starts is just where the one before it ends.

// [when, x, y, pose]: from `when` he's at (x, y) doing `pose` until the next
// waypoint; "walk" heads for the next waypoint's spot, arriving on time.
export type Pose = "walk" | "stand" | "nap";
export type Waypoint = [number, number, number, Pose];
// Somewhere he goes, in the picture's pixels (src/scene.ts DOG_SPOTS). `nap`
// is how much he likes napping there; a spot without it is just for stopping.
export type DogSpot = { at: [number, number]; nap?: number };

const SLOT = 10 * 60 * 1000;
const NAP_ODDS = 0.3;

// mulberry32: small, quick, and the same numbers on every machine.
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(spots: DogSpot[], weight: (s: DogSpot) => number, r: number): DogSpot {
  const total = spots.reduce((sum, s) => sum + weight(s), 0);
  let left = r * total;
  for (const s of spots) {
    left -= weight(s);
    if (left < 0) return s;
  }
  return spots[spots.length - 1];
}

// Whether slot `k` is a nap, and where it ends: its first two draws, so the
// next slot can find where he starts without replaying the day.
function slotEnd(k: number, spots: DogSpot[]): { nap: boolean; at: [number, number]; r: () => number } {
  const r = seeded(Math.imul(k, 2654435761) ^ 0x5eed);
  const nap = r() < NAP_ODDS;
  const at = pick(spots, (s) => (nap ? s.nap ?? 0 : 1), r()).at;
  return { nap, at, r };
}

const same = (a: [number, number], b: [number, number]): boolean => a[0] === b[0] && a[1] === b[1];

function slot(k: number, spots: DogSpot[]): Waypoint[] {
  const start = k * SLOT;
  const prev = slotEnd(k - 1, spots);
  const { nap, at: end, r } = slotEnd(k, spots);
  // Two naps in a row in the same place: he doesn't get up in between.
  if (nap && prev.nap && same(prev.at, end)) return [[start, end[0], end[1], "nap"]];
  const stops = nap ? [] : Array.from({ length: 1 + Math.floor(r() * 3) }, () => spots[Math.floor(r() * spots.length)].at);
  stops.push(end);
  // About 60 to 90 pixels a second, a little different each time.
  let from = prev.at;
  const walks = stops.map((to) => {
    const ms = (Math.hypot(to[0] - from[0], to[1] - from[1]) / (60 + r() * 30)) * 1000;
    from = to;
    return ms;
  });
  // The rest of the slot is spent stopped: a while longer where he was
  // (asleep still, if he was napping), a sniff or a sit at each stop, then a
  // rest where he ends up. A nap slot just walks there and lies down.
  const still = Math.max(0, SLOT - walks.reduce((a, b) => a + b, 0));
  let pauses: number[];
  if (nap) {
    pauses = [Math.min(still, 5000 + r() * 30000)];
  } else {
    const shares = stops.map(() => 0.3 + r());
    const total = shares.reduce((a, b) => a + b, 0) + 0.3 + r();
    pauses = shares.map((w) => (still * w) / total);
  }
  const out: Waypoint[] = [];
  let t = start;
  let here = prev.at;
  stops.forEach((to, i) => {
    out.push([Math.round(t), here[0], here[1], i === 0 && prev.nap ? "nap" : "stand"]);
    t += pauses[i];
    out.push([Math.round(t), here[0], here[1], "walk"]);
    t += walks[i];
    here = to;
  });
  out.push([Math.round(t), here[0], here[1], nap ? "nap" : "stand"]);
  return out;
}

// Where he is at `at` along `path`, what he's doing, and which way he faces:
// 1 is the way he's drawn (left), -1 the other way, after his last walk.
export function along(path: Waypoint[], at: number): { at: [number, number]; pose: Pose; facing: 1 | -1 } {
  let i = 0;
  while (i + 1 < path.length && path[i + 1][0] <= at) i++;
  let facing: 1 | -1 = 1;
  for (let j = i; j >= 0; j--) {
    const next = path[j + 1];
    if (path[j][3] === "walk" && next && next[1] !== path[j][1]) {
      facing = next[1] < path[j][1] ? 1 : -1;
      break;
    }
  }
  const [t0, x0, y0, pose] = path[i];
  const next = path[i + 1];
  if (pose !== "walk" || !next) return { at: [x0, y0], pose: pose === "walk" ? "stand" : pose, facing };
  const k = Math.max(0, Math.min(1, (at - t0) / (next[0] - t0)));
  return { at: [Math.round(x0 + (next[1] - x0) * k), Math.round(y0 + (next[2] - y0) * k)], pose, facing };
}

// His plan from `from` to `to` (an hour, say): where he is at `from`, then
// every waypoint after it, up to and including the first past `to`.
export function wander(spots: DogSpot[], from: number, to: number): Waypoint[] {
  const all: Waypoint[] = [];
  for (let k = Math.floor(from / SLOT) - 1; k <= Math.floor(to / SLOT) + 1; k++) all.push(...slot(k, spots));
  const now = along(all, from);
  const path: Waypoint[] = [[from, now.at[0], now.at[1], now.pose]];
  for (const w of all) {
    if (w[0] <= from) continue;
    const last = path[path.length - 1];
    // Standing on where he's already standing adds nothing.
    if (w[3] === last[3] && w[1] === last[1] && w[2] === last[2] && last[3] !== "walk") continue;
    path.push(w);
    if (w[0] > to) break;
  }
  return path;
}

// Leaving a friend at `at`, from `from`, to pick his own day back up: he walks
// to the first stop in `plan` he can reach in time, and carries on from there.
export function rejoin(from: [number, number], at: number, plan: Waypoint[]): Waypoint[] {
  for (let i = 0; i < plan.length; i++) {
    const [t, x, y, pose] = plan[i];
    if (pose === "walk" || t < at) continue;
    const arrive = Math.round(at + (Math.hypot(x - from[0], y - from[1]) / 75) * 1000);
    if (arrive > t && plan[i + 1] && arrive > plan[i + 1][0]) continue;
    return [[at, from[0], from[1], "walk"], [arrive, x, y, pose], ...plan.slice(i + 1)];
  }
  return [[at, from[0], from[1], "stand"]];
}
