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
];

export const PLANTS: Item[] = [
  { key: "sunflower", label: "sunflowers", short: "sunflowers" },
  { key: "jasmine", label: "jasmine", short: "jasmine" },
  { key: "hibiscus", label: "a hibiscus", short: "hibiscus" },
  { key: "tomato", label: "tomatoes", short: "tomatoes" },
  { key: "tulsi", label: "tulsi", short: "tulsi" },
  { key: "marigold", label: "marigolds", short: "marigolds" },
];

export const DOG = "Laddoo";

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

// Food stays out on the counter for three days.
export const counter = (things: Thing[], now: number): Thing[] =>
  things.filter((t) => t.kind === "dish" && now - t.createdAt < 3 * DAY);

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

// Laddoo follows whoever last played with him, and naps at the foot of their
// bed for half a day before wandering back to his kennel.
export function dog(things: Thing[], now: number): { with?: string; awake: boolean; last?: Thing } {
  const played = latest(things, "play");
  if (!played) return { awake: false };
  const since = now - played.createdAt;
  return { with: since < 12 * HOUR ? played.author : undefined, awake: since < 3 * HOUR, last: played };
}
