import { house, made } from "./houses.ts";
import { layout } from "./layouts.ts";
import { PEOPLE } from "./people.ts";
import type { Thing } from "./store.ts";
import { ymd } from "./time.ts";

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
// and picture keep the old `laddoo` name. A made house names its own on the
// form (RICE O); one made before it was asked has Shinzo.
export const DOG = "Shinzo";
export const dogName = (): string => house().spec?.dog || DOG;

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

// What this house can leave on a desk, and sit on. A made house
// (src/houses.ts) has no KitKat box and no yoga mat: they're Rithanya's and
// Aswathy's. GIFTS and SEATS stay whole for reading back anything stored.
// In a made house's own picture (src/layouts.ts), the cushions are round the
// living room's coffee table.
export const gifts = (): Item[] => (made() ? GIFTS.filter((g) => g.key !== "kitkat") : GIFTS);
export const seats = (): Seat[] => (made() ? [{ key: "mat", place: layout().mat.place }, { key: "sofa", place: "living" }] : SEATS);

export const roomPlace = (id: string): string => `room:${id}`;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// `things` is always newest first, so the first match is the latest.
export const latest = (things: Thing[], kind: Thing["kind"], place?: string): Thing | undefined =>
  things.find((t) => t.kind === kind && (place === undefined || t.place === place));

// What's on a friend's desk: things left for her, and notes written back to
// her, newest first.
export const desk = (things: Thing[], id: string): Thing[] =>
  things.filter((t) => (t.kind === "desk" || t.kind === "reply") && t.place === roomPlace(id));

// The note a reply answers, if it's still there.
export const answers = (things: Thing[], reply: Thing): Thing | undefined =>
  reply.kind === "reply" ? things.find((t) => String(t.id) === reply.item && (t.kind === "desk" || t.kind === "reply")) : undefined;

// Whether you've written back to a note on your desk already.
export const answered = (things: Thing[], note: Thing, by: string): boolean =>
  things.some((t) => t.kind === "reply" && t.item === String(note.id) && t.author === by);

export const wall = (things: Thing[]): Thing[] => things.filter((t) => t.kind === "note" && t.place === "wall");

/* ---------- the wall's months (ADR 0026) ---------- */

// The wall starts fresh on the 1st of each month. Nothing is taken away: last
// month's notes and photos go into that month's envelope in the memory box,
// and a friend who comes back after the 1st finds a recap of the month she
// was away for. Big news stays pinned whatever the month.
//
// A month is a key like "2026-10". It turns over by one clock for the whole
// house, so everyone sees the same wall: the first friend's (in Rithika's
// house, her Canberra, which reaches the 1st before the others).
export type Month = string;

// The house's one clock for months: the first friend's.
export const monthClock = (): string => PEOPLE[0]?.tz ?? "Australia/Sydney";

export const monthOf = (tz: string, at: number): Month => {
  const [year, month] = ymd(tz, at);
  return `${year}-${String(month).padStart(2, "0")}`;
};

// "October 2026", or just "October" when `now` is in the same year.
export const monthLabel = (m: Month, now?: number): string => {
  const [year, month] = m.split("-").map(Number);
  const thisYear = now !== undefined && new Date(now).getUTCFullYear() === year;
  return new Intl.DateTimeFormat("en-AU", { month: "long", ...(thisYear ? {} : { year: "numeric" }), timeZone: "UTC" }).format(Date.UTC(year, month - 1, 15));
};

// The month before `m`.
export const monthBefore = (m: Month): Month => {
  const [year, month] = m.split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
};

// The wall's notes in one month, newest first; big news isn't in any month.
export const wallIn = (things: Thing[], tz: string, m: Month): Thing[] =>
  wall(things).filter((t) => t.item !== "big" && monthOf(tz, t.createdAt) === m).sort((a, b) => b.createdAt - a.createdAt);

// Every month the wall has had, newest first, except `now`'s.
export const pastMonths = (things: Thing[], tz: string, now: number): Month[] => {
  const current = monthOf(tz, now);
  const seen = new Set<Month>();
  for (const t of wall(things)) if (t.item !== "big") seen.add(monthOf(tz, t.createdAt));
  seen.delete(current);
  return [...seen].sort().reverse();
};

// The month a friend is shown a recap of, if any: the last month the wall
// had anything in before this one, unless she's put its recap away already
// (`read`). It waits for her however long she's away. Only the latest month;
// anything older is in the memory box.
export const recapFor = (things: Thing[], tz: string, now: number, read: Month): Month | undefined => {
  const last = pastMonths(things, tz, now)[0];
  return last && last > read ? last : undefined;
};

// On this day (ADR 0031): something from the wall on today's date in an
// earlier month or year, by `tz`'s calendar; if nothing then, within a few
// days of it, a month or more ago. The longest ago first ("a year ago
// today" over "a month ago"). Only from the memory box: never this month.
// `ok` says what may be shown (a widget only shows what its writer shared).
export function onThisDay(things: Thing[], tz: string, now: number, ok: (t: Thing) => boolean = () => true): { note: Thing; ago: string } | undefined {
  const [y, m, d] = ymd(tz, now);
  const thisMonth = monthOf(tz, now);
  const old = wall(things).filter((t) => t.item !== "big" && monthOf(tz, t.createdAt) !== thisMonth && ok(t));
  const at = (t: Thing): { months: number; off: number } => {
    const [ty, tm, td] = ymd(tz, t.createdAt);
    const months = (y - ty) * 12 + (m - tm);
    // How many days from today's date in that month, so 3 Oct is 0 for 3 Nov.
    const off = Math.abs(Date.UTC(ty, tm - 1, d) - Date.UTC(ty, tm - 1, td)) / (24 * 60 * 60 * 1000);
    return { months, off };
  };
  const pick = (within: number) => old
    .map((t) => ({ t, ...at(t) }))
    .filter((x) => x.months >= 1 && x.off <= within)
    .sort((a, b) => b.months - a.months || a.off - b.off || a.t.createdAt - b.t.createdAt)[0];
  const best = pick(0) ?? pick(3);
  if (!best) return undefined;
  const years = Math.floor(best.months / 12);
  const span = best.months % 12 === 0 && years ? (years === 1 ? "a year" : `${years} years`) : best.months === 1 ? "a month" : `${best.months} months`;
  return { note: best.t, ago: best.off === 0 ? `${span} ago today` : `about ${span} ago` };
}

// A note on the wall with a photo pinned to it (ADR 0024): its item is
// `photo:<id>`, the photo's row in the house's own `photos` table. Big news
// keeps item "big", so a photo is never big news.
// A drawing (ADR 0037) is kept the same way, as a PNG in that table, with
// item `drawing:<id>`: on the wall it's a photo in everything but its words,
// and on a desk it's a private note in pictures.
export const photoOf = (t: Thing): number | undefined => {
  const m = /^(?:photo|drawing):(\d+)$/.exec(t.item);
  return m ? Number(m[1]) : undefined;
};

export const drawingOf = (t: Thing): number | undefined => {
  const m = /^drawing:(\d+)$/.exec(t.item);
  return m ? Number(m[1]) : undefined;
};

// A voice note left on a friend's desk (ADR 0037): item `voice:<id>`, the
// recording a row in the house's own `sounds` table.
export const voiceOf = (t: Thing): number | undefined => {
  const m = /^voice:(\d+)$/.exec(t.item);
  return m ? Number(m[1]) : undefined;
};

// Whether a note or photo on the wall may show on friends' home-screen
// widgets (ADR 0029). The wall is for everyone in the house, but a home
// screen is out in the world, so it's the writer's say: her newest word on
// it, and no until she says yes. Nobody else's word counts.
export function onWidget(things: Thing[], note: Thing): boolean {
  const place = `note:${note.id}`;
  // Things come newest first, so the first word of hers is her latest.
  const said = things.find((t) => t.kind === "onwidget" && t.place === place && t.author === note.author);
  return said?.item === "yes";
}

// Lines under a photo on the wall (RICE AB, ADR 0031), like writing on the
// back of a print: one each, a friend's newest is hers, and "" takes it
// back. Oldest first, as they'd be written down the back. Never a thread.
export const MAX_CAPTION = 120;
export function captionsOn(things: Thing[], note: Thing): { author: string; body: string; at: number }[] {
  const place = `note:${note.id}`;
  const seen = new Set<string>();
  const out: { author: string; body: string; at: number; id: number }[] = [];
  for (const t of things) {
    if (t.kind !== "caption" || t.place !== place || seen.has(t.author)) continue;
    seen.add(t.author);
    if (t.body) out.push({ author: t.author, body: t.body, at: t.createdAt, id: t.id });
  }
  return out.sort((a, b) => a.at - b.at || a.id - b.id);
}

// Stickers for a note on the wall: how a friend felt about it, and that she
// read it. Each friend has one sticker on a note at most; picking another
// swaps it, and peeling it off leaves none. Never counted, always named.
export type Sticker = { key: string; emoji: string; label: string };
export const STICKERS: Sticker[] = [
  { key: "love", emoji: "❤️", label: "love it" },
  { key: "haha", emoji: "😂", label: "haha" },
  { key: "aww", emoji: "🥹", label: "aww" },
  { key: "yay", emoji: "🎉", label: "yay" },
  { key: "hug", emoji: "🤗", label: "a hug" },
  { key: "wow", emoji: "😮", label: "wow" },
  { key: "proud", emoji: "🙏", label: "so proud" },
  { key: "seen", emoji: "👀", label: "read it" },
];

// Who's stuck what on a note, in the order they stuck it.
export function stickersOn(things: Thing[], note: Thing): { author: string; sticker: Sticker; at: number }[] {
  const place = `note:${note.id}`;
  const seen = new Set<string>();
  const out: { author: string; sticker: Sticker; at: number; id: number }[] = [];
  for (const t of things) {
    if (t.kind !== "sticker" || t.place !== place || seen.has(t.author)) continue;
    seen.add(t.author);
    const sticker = STICKERS.find((s) => s.key === t.item);
    if (sticker) out.push({ author: t.author, sticker, at: t.createdAt, id: t.id });
  }
  // Two stuck in the same millisecond go in the order they were stored.
  return out.sort((a, b) => a.at - b.at || a.id - b.id);
}

// A room gets lived-in on its own: a couple of things on the floor after two
// days, more after five. Anyone can tidy it. A room nobody has tidied yet
// starts a little lived-in, so there's something to do on the first visit.
export function mess(things: Thing[], id: string, now: number): 0 | 1 | 2 {
  const tidied = latest(things, "tidy", roomPlace(id));
  if (!tidied) return 1;
  const days = (now - tidied.createdAt) / DAY;
  return days < 2 ? 0 : days < 5 ? 1 : 2;
}

// Food stays out on the counter for three days, or until someone eats it. A
// plate saved for a friend (a dish whose item is "<food>:for:<id>", ADR 0022)
// waits, covered, until she eats it, however long she's away: being away
// never means missing out.
export function counter(things: Thing[], now: number): Thing[] {
  const eaten = new Set(things.filter((t) => t.kind === "eat").map((t) => t.place));
  return things.filter((t) => t.kind === "dish" && (savedFor(t) !== undefined || now - t.createdAt < 3 * DAY) && !eaten.has(`dish:${t.id}`));
}

// Who a dish was saved for, if anyone, and what the food itself is.
export const savedFor = (t: Thing): string | undefined => t.item.split(":for:")[1] || undefined;
export const food = (t: Thing): string => t.item.split(":for:")[0];

// What a dish is called after "ate your": "dosa", "mango".
export const dishName = (t: Thing): string => (find(FOOD, food(t))?.short ?? "food").replace(/^a /, "");

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
  // Planting waters a seedling in: a plant is thirsty two days after the
  // later of its planting and the last watering, so one planted a moment
  // ago never is, however long ago anyone watered (RICE N).
  const lastWater = latest(things, "water")?.createdAt ?? 0;
  const newest = Math.max(...growing.map((p) => p.createdAt));
  return now - Math.max(lastWater, newest) > 2 * DAY;
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

// Every batch still out tonight, newest first, so a note left with the first
// isn't lost when someone makes more (RICE L).
export const kettleBatches = (things: Thing[], now: number): Thing[] =>
  things.filter((t) => t.kind === "kettle" && now - t.createdAt < 12 * HOUR).sort((a, b) => b.createdAt - a.createdAt);

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

// The next video call: the latest plan, until two hours after it starts, as
// movie night. The item is the moment, in milliseconds.
export function nextCall(things: Thing[], now: number): { plan: Thing; at: number } | undefined {
  const plan = latest(things, "call");
  const at = Number(plan?.item);
  return plan && at > now - 2 * HOUR ? { plan, at } : undefined;
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

// Birthday cards for her (ADR 0030), newest first. Each opens on the day in
// its item, by her own calendar; `today` is hers. Sealed ones are waiting.
export const cardsFor = (things: Thing[], id: string): Thing[] =>
  things.filter((t) => t.kind === "card" && t.place === roomPlace(id));
export const isOpen = (card: Thing, today: string): boolean => card.item <= today;

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
