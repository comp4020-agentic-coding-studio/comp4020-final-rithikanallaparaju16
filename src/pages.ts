import { crownSvg, emoji, EMOJI, iconSvg, patchesSvg, plantSvg, POP } from "./art.ts";
import { art } from "./assets.ts";
import {
  along,
  counter,
  desk,
  dishName,
  dog,
  DOG,
  find,
  FOOD,
  GIFTS,
  hugs,
  kettle,
  KETTLE_ROOM,
  latest,
  MASK_ROOM,
  masked,
  mess,
  MOVIE_LOVER,
  movieNight,
  movies,
  partyHats,
  PLANTS,
  plants,
  resting,
  roomPlace,
  stage,
  thirsty,
  wall,
  wander,
  wishes,
  YOGA_ROOM,
  type Item,
  type Movie,
  type Pose,
  type Waypoint,
} from "./house.ts";
import { esc } from "./html.ts";
import { PEOPLE, personById, type Person } from "./people.ts";
import { DOG_SPOTS, houseSvg, HUG_REACH, isPlace, KENNEL, placeAt, standingSpots, type Doing, type Figure, type Scene, type Spot } from "./scene.ts";
import type { Thing } from "./store.ts";
import { ago, asleep, birthday, birthdayLabel, clock, dayLabel, hello, localInput, phase, ymd, type Phase } from "./time.ts";
import {
  canPlay,
  cardName,
  COLOR_NAME,
  COLORS,
  dealFor,
  gameOf,
  games,
  isWild,
  onTheMat,
  players,
  deadline,
  replay,
  stillIn,
  top,
  whoseTurn,
  type Card,
  type Color,
  type Game,
} from "./uno.ts";

export { esc };

export const MAX_NOTE = 500;
export const MAX_DISH_NOTE = 200;

// `where` is the place each friend was last in, `arrived` when she came into
// it or last walked in it, and `spots` the spot she walked to there, if any.
export type Visit = {
  me: Person;
  things: Thing[];
  seen: Map<string, number>;
  where: Map<string, string>;
  arrived: Map<string, number>;
  spots: Map<string, [number, number]>;
  seenUntil: number;
  now: number;
};

const HOME_NOW = 10 * 60 * 1000;
const WEEK = 7 * 24 * 60 * 60 * 1000;

const nameOf = (id: string): string => personById(id)?.name ?? "someone";

const nameHtml = (p: Person): string =>
  p.breakAfter ? `${esc(p.name.slice(0, p.breakAfter))}<wbr>${esc(p.name.slice(p.breakAfter))}` : esc(p.name);

const names = (list: string[]): string => new Intl.ListFormat("en-AU", { type: "conjunction" }).format(list);

const isNew = (t: Thing, v: Visit): boolean => t.author !== v.me.id && t.createdAt > v.seenUntil;

function homeNow(p: Person, v: Visit): boolean {
  if (p.id === v.me.id) return true;
  const last = v.seen.get(p.id);
  return last !== undefined && v.now - last < HOME_NOW;
}

// Whoever is in the house right now is up, whatever their usual hours.
const sleeping = (p: Person, v: Visit): boolean => asleep(p, clock(p.tz, v.now)) && !homeNow(p, v);

// Asleep in someone's bed, or sat down somewhere, if she still is.
const restOf = (p: Person, v: Visit): Thing | undefined => resting(v.things, v.now, v.where, v.arrived).get(p.id);

// Everyone is wherever she last was, whether or not she's here now: the room
// she last went into, or the bed or seat she's still in. At night, where she
// lives, a friend who isn't here is asleep in her own room. Anyone who's never
// been home is in her own room too.
function placeOf(p: Person, v: Visit): string {
  const own = roomPlace(p.id);
  const rest = restOf(p, v);
  if (rest) return rest.place;
  if (sleeping(p, v)) return own;
  const at = v.where.get(p.id);
  return at && isPlace(at) ? at : own;
}

// The spot she walked to, while she's still standing in that place.
function spotOf(p: Person, v: Visit): [number, number] | undefined {
  if (restOf(p, v) || sleeping(p, v)) return undefined;
  return v.where.get(p.id) === placeOf(p, v) ? v.spots.get(p.id) : undefined;
}

// Shinzo goes wherever the friend who last petted him or fed him goes, for
// half an hour, and stays where she left him. The rest of the time he does
// what he likes, the same for everyone (src/house.ts wander): `at` and `pose`
// are where his own day has him now, and `plan` the next hour of it.
const DOG_PLAN = 60 * 60 * 1000;

type Laddoo = { place: string; with?: Person; until?: number; last?: Thing; plan: Waypoint[]; at: [number, number]; pose: Pose };

function laddooAt(v: Visit): Laddoo {
  const d = dog(v.things, v.now);
  const friend = d.with ? personById(d.with) : undefined;
  const plan = wander(DOG_SPOTS, v.now, v.now + DOG_PLAN);
  const own = along(plan, v.now);
  if (friend) return { place: placeOf(friend, v), with: friend, until: d.until, last: d.last, plan, at: own.at, pose: "stand" };
  return { place: placeAt(own.at) ?? "garden", last: d.last, plan, at: own.at, pose: own.pose };
}

function placeName(place: string, me: Person): string {
  if (place === roomPlace(me.id)) return "in your room";
  const owner = ownerOf(place);
  if (owner) return `in ${owner.name}'s room`;
  return { kitchen: "in the kitchen", living: "in the living room", garden: "in the garden" }[place] ?? "in the house";
}

const ownerOf = (place: string): Person | undefined =>
  place.startsWith("room:") ? personById(place.slice("room:".length)) : undefined;

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

// Where someone's sleeping or sitting, as the visitor would say it.
function restText(r: Thing, p: Person, v: Visit): string {
  const owner = ownerOf(r.place);
  const whose = owner?.id === v.me.id ? "your" : owner?.id === p.id ? "her own" : `${owner?.name}'s`;
  if (r.kind === "nap") return `asleep in ${whose} bed`;
  if (r.item === "sofa") return "on the sofa in the living room";
  if (r.item === "yoga") return `meditating on ${whose} yoga mat`;
  return `on ${p.id === v.me.id ? "your" : "her"} cushion on ${whose} mat`;
}

// Who's asleep or sitting down in this place.
function restingIn(place: string, v: Visit): string {
  const lines = PEOPLE.flatMap((p) => {
    const r = restOf(p, v);
    return r?.place === place ? [`${p.id === v.me.id ? "You're" : `${p.name} is`} ${restText(r, p, v)}.`] : [];
  });
  return lines.length ? `<p class="status resting">${esc(lines.join(" "))}</p>` : "";
}

// A part of the page public/live.js swaps for its new version when a friend
// changes something, by `key`. Something that isn't there right now (Shinzo's
// in another room) leaves an empty placeholder, so it can turn up.
function slot(key: string, html: string): string {
  const at = html.indexOf("<");
  if (!html.trim() || at < 0) return `<div hidden data-live="${key}"></div>`;
  const end = html.slice(at).search(/[\s>]/) + at;
  return `${html.slice(0, end)} data-live="${key}"${html.slice(end)}`;
}

/* ---------- the frame every page shares ---------- */

function shell(title: string, body: string, light: Phase, kind: string): string {
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&display=swap">
<link rel="stylesheet" href="/style.css">
<style>:root { --house: url("${art("house.jpg")}"); }</style>
<script src="/house.js" defer></script>
<script src="/live.js" defer></script>
</head>
<body class="light-${light} ${kind}">
${body}
</body>
</html>`;
}

type Tab = "home" | "updates" | "movies" | "everyone";

const TAB_ICON: Record<Tab, string> = {
  home: `<path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>`,
  updates: `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>`,
  movies: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 5v14M16.5 5v14M3 9.7h4.5M3 14.3h4.5M16.5 9.7H21M16.5 14.3H21"/>`,
  everyone: `<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="9" r="3"/><path d="M2.5 19.5c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5m-1.9-2.6c.9-1.3 2.2-1.9 3.9-1.9 2.5 0 4.7 1.5 5.5 4.5"/>`,
};

function tabs(current: Tab, v: Visit): string {
  // A card played in UNO isn't news on its own.
  const somethingNew = v.things.some((t) => isNew(t, v) && t.kind !== "unomove");
  const tab = (key: Tab, href: string, label: string): string =>
    `<a href="${href}"${key === current ? ` aria-current="page"` : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICON[key]}</svg><span>${label}</span>${key === "updates" && somethingNew ? `<span class="dot" title="Something new since you were last here"></span>` : ""}</a>`;
  return `<nav class="tabs" aria-label="Around the house" data-live="tabs">${tab("home", "/", "Home")}${tab("updates", "/updates", "Updates")}${tab("movies", "/movies", "Movies")}${tab("everyone", "/everyone", "Everyone")}</nav>`;
}

// Your own sticker in the corner: tap it to go back to the door and come in
// as someone else.
const switcher = (me: Person): string =>
  `<form method="post" action="/leave" class="switch"><button title="Go back to the door and pick someone else"><img src="${art(`avatar-${me.id}.png`)}" alt="" width="180" height="242"><span>Not ${esc(me.name)}?</span></button></form>`;

function bar(v: Visit, current: Tab): string {
  const c = clock(v.me.tz, v.now);
  return `<header class="bar">
  <div class="hello">
    <a class="brand" href="/">Five Windows</a>
    <p class="greeting">${esc(`${hello(c)}, ${v.me.name}.`)} <span class="when">It's ${esc(c.weekday)}, <span class="clock" data-tz="${esc(v.me.tz)}">${esc(c.label)}</span> in ${esc(v.me.city)}.</span></p>
  </div>
  ${tabs(current, v)}
  ${switcher(v.me)}
</header>`;
}

const footer = (me: Person): string => `
<footer class="foot">
  <form method="post" action="/leave"><button class="link">Not ${esc(me.name)}?</button></form>
  <span aria-hidden="true">·</span>
  <a href="/readme/">About this place</a>
</footer>`;

// What you just did (`key`, a `did` from src/server.ts) and the line that
// says it's done. The line starts with what popped up in the house.
export type Done = { key: string; text: string };

const done = (d: Done | undefined): string =>
  d ? `<p class="done" role="status"><span class="emoji" aria-hidden="true">${POP[d.key]?.[0] ?? "✨"}</span> ${esc(d.text)}</p>` : "";

// In her birthday month, she wears her crown in her window too.
const pane = (p: Person, light: Phase, asleepNow: boolean, now: number): string =>
  `<span class="pane light-${light}${asleepNow ? " asleep" : ""}"><img src="${art(`avatar-${p.id}.png`)}" alt="" width="180" height="242">${birthday(p, now) ? crownSvg() : ""}</span>`;

/* ---------- the house, as the scene draws it ---------- */

function deskSpots(owner: Person, v: Visit): Spot[] {
  const out: Spot[] = [];
  for (const t of desk(v.things, owner.id)) {
    if (v.now - t.createdAt > WEEK) break;
    const fresh = owner.id === v.me.id && isNew(t, v);
    if (t.body) out.push({ key: "note", color: personById(t.author)?.color, fresh });
    if (t.item) out.push({ key: t.item, fresh });
  }
  return out;
}

// The places with something new for you: your own room, the wall, the
// kitchen and the garden. Other friends' desks stay their business.
function freshPlaces(v: Visit): Set<string> {
  const out = new Set<string>();
  for (const t of v.things) {
    if (!isNew(t, v)) continue;
    if (t.kind === "note") out.add("living");
    else if (t.kind === "dish" || t.kind === "eat") out.add("kitchen");
    else if (t.kind === "water" || t.kind === "plant" || t.kind === "play" || t.kind === "treat") out.add("garden");
    else if (t.kind === "kettle" || t.kind === "mask" || t.kind === "uno" || t.kind === "wish") out.add(t.place);
    else if (t.kind === "unomove") continue;
    else if (t.place === roomPlace(v.me.id)) out.add(t.place);
  }
  return out;
}

function scene(v: Visit, focus?: string, did?: string): Scene {
  const d = laddooAt(v);
  const masks = masked(v.things, v.now);
  const hats = partyHats(v.things, v.now);
  const rests = resting(v.things, v.now, v.where, v.arrived);
  return {
    light: phase(clock(v.me.tz, v.now)),
    me: v.me,
    bedrooms: PEOPLE.map((owner) => {
      const c = clock(owner.tz, v.now);
      const zz = sleeping(owner, v);
      return {
        owner,
        phase: phase(c),
        clock: c.label,
        status: zz ? "asleep" : owner.id !== v.me.id && homeNow(owner, v) ? "home now" : "",
        mess: mess(v.things, owner.id, v.now),
        desk: deskSpots(owner, v),
        lamp: !zz,
        birthday: birthday(owner, v.now),
      };
    }),
    figures: PEOPLE.map((p): Figure => {
      const r = rests.get(p.id);
      return {
        person: p,
        place: placeOf(p, v),
        asleep: sleeping(p, v),
        here: homeNow(p, v),
        me: p.id === v.me.id,
        masked: masks.has(p.id),
        rest: r && { kind: r.kind === "nap" ? "nap" : "sit", place: r.place, seat: r.item },
        spot: spotOf(p, v),
        crown: birthday(p, v.now) > 0,
        hat: hats.has(p.id),
      };
    }),
    hugs: hugs(v.things, v.now, v.arrived).map((h) => ({ by: h.by, people: h.people })),
    dishes: counter(v.things, v.now).map((t) => ({
      key: t.item,
      fresh: isNew(t, v),
      id: t.id,
      label: `Eat ${t.author === v.me.id ? "your" : `${nameOf(t.author)}'s`} ${dishName(t)}`,
    })),
    kettle: kettle(v.things, v.now) !== undefined,
    dog: { place: d.place, with: d.with?.id, until: d.until, plan: d.plan, now: v.now },
    fresh: freshPlaces(v),
    focus,
    did,
    uno: unoDoings(v, rests),
  };
}

// Sitting on the mat with friends, you can deal UNO; in a game, it's a step
// away from the mat.
function unoDoings(v: Visit, rests: Map<string, Thing>): { seated: Doing[]; mat: Doing[] } {
  const mine = gameOf(v.things, v.me.id);
  const playing = mine !== undefined && stillIn(replay(mine, v.things, v.now), v.me.id);
  const yours: Doing = { label: "Your UNO game", emoji: EMOJI.uno, href: "/uno" };
  const deal: Doing[] = dealFor(v.me.id, rests) ? [{ label: playing ? "Deal a new UNO game" : "Play UNO", emoji: EMOJI.uno, post: "/uno" }] : [];
  const sitting = onTheMat(rests).includes(v.me.id);
  return { seated: sitting ? [...(playing ? [yours] : []), ...deal] : [], mat: playing ? [yours] : [] };
}

/* ---------- hugs ---------- */

// Who you can hug from where you're drawn: friends who are here now,
// standing (not asleep, not sat down), within reach. `place` and `spot` are
// where you are, so a hug can say where it happened and get you up first.
export function hugFrom(v: Visit): { near: Person[]; place: string; spot?: [number, number]; resting: boolean } {
  const spots = standingSpots(scene(v));
  const mine = spots.get(v.me.id);
  const near = !mine ? [] : PEOPLE.filter((p) => {
    if (p.id === v.me.id || !homeNow(p, v) || sleeping(p, v) || restOf(p, v)) return false;
    const at = spots.get(p.id);
    return at !== undefined && Math.hypot(at[0] - mine[0], at[1] - mine[1]) <= HUG_REACH;
  });
  return { near, place: placeOf(v.me, v), spot: mine, resting: restOf(v.me, v) !== undefined };
}

// "Hug Neha", or "Group hug with Neha and Aswathy".
export const hugLabel = (people: Person[]): string =>
  people.length === 1 ? `Hug ${people[0].name}` : `Group hug with ${names(people.map((p) => p.name))}`;

// The same hugs, as buttons on the page of the room you're in.
function hugButtons(v: Visit): string {
  const near = hugFrom(v).near;
  if (!near.length) return "";
  const button = (people: Person[]): string =>
    `<form method="post" action="/hug" class="inline"><input type="hidden" name="with" value="${esc(people.map((p) => p.id).join(","))}"><button class="soft">${emoji("hug")} ${esc(hugLabel(people))}</button></form>`;
  const all = near.length > 1 ? [button(near)] : [];
  return `<div class="doings hugs">${[...all, ...near.map((p) => button([p]))].join("")}</div>`;
}

const pageOf = (place: string): string => (place.startsWith("room:") ? `/room/${place.slice("room:".length)}` : `/${place}`);

/* ---------- the door ---------- */

// `taken` is who's in the house right now (src/server.ts): only one of us can
// be each friend at a time, so her window can't be picked until she leaves.
export function doorPage(seen: Map<string, number>, now: number, taken: Set<string> = new Set()): string {
  const people = PEOPLE.map((p) => {
    const c = clock(p.tz, now);
    const last = seen.get(p.id);
    const held = taken.has(p.id);
    const recent = held || (last !== undefined && now - last < HOME_NOW);
    const zz = asleep(p, c) && !recent;
    const when = held ? "in the house right now" : last === undefined ? "hasn't been home yet" : recent ? "home now" : `home ${ago(last, now)}`;
    const lock = held ? ` disabled title="${esc(p.name)} is in the house right now"` : "";
    return `<li><button class="person${held ? " taken" : ""}" name="who" value="${esc(p.id)}" style="--accent:${p.color}"${lock}>
      ${pane(p, phase(c), zz, now)}
      <span class="name">${nameHtml(p)}</span>
      <span class="where">${esc(p.city)}</span>
      <span class="where"><span class="clock" data-tz="${esc(p.tz)}">${esc(c.label)}</span>${zz ? ", asleep" : ""}</span>
      <span class="when">${esc(when)}</span>
    </button></li>`;
  }).join("\n");

  return shell("Five Windows", `
<main class="door">
  <header class="top">
    <h1>Five Windows</h1>
    <p class="greeting">A little house for five friends who live far apart. Come in whenever you like, leave something for someone, and see what the others left while you were away.</p>
  </header>
  <form method="post" action="/me">
    <h2 class="ask">Who's coming home?</h2>
    <ul class="people" data-live="door">
${people}
    </ul>
  </form>
  <p class="hint">Each window shows the sky where that friend is right now. <a href="/readme/">What is this place?</a></p>
</main>`, "dusk", "page-door");
}

/* ---------- what's happened ---------- */

type Happening = { text: string; href: string; forYou: boolean; at: number };

function happening(t: Thing, me: Person, all: Thing[]): Happening | undefined {
  const mine = t.author === me.id;
  const by = mine ? "You" : nameOf(t.author);
  const at = t.createdAt;
  const title = (): string => movies(all).find((m) => `movie:${m.thing.id}` === t.place)?.title ?? "a movie";
  switch (t.kind) {
    case "mask": {
      const href = `/room/${MASK_ROOM}`;
      if (t.author === MASK_ROOM) return { text: `${by} did a face mask`, href, forYou: false, at };
      if (me.id === MASK_ROOM) return { text: `${by} used your face mask powder`, href, forYou: true, at };
      return { text: `${by} did a face mask with ${nameOf(MASK_ROOM)}'s powder`, href, forYou: false, at };
    }
    case "kettle": {
      const href = `/room/${KETTLE_ROOM}`;
      if (t.author === KETTLE_ROOM) return { text: `${by} made kettle Maggi in ${mine ? "your" : "her"} room`, href, forYou: false, at };
      if (me.id === KETTLE_ROOM) return { text: `${by} made kettle Maggi in your room`, href, forYou: true, at };
      return { text: `${by} made kettle Maggi in ${nameOf(KETTLE_ROOM)}'s room`, href, forYou: false, at };
    }
    case "movie":
      return { text: `${by} suggested “${t.body.split("\n")[0]}”`, href: "/movies", forYou: false, at };
    case "watched":
      return { text: `${by} watched “${title()}”`, href: "/movies", forYou: false, at };
    case "movienight":
      return { text: `${by} planned movie night: “${title()}”, ${dayLabel(me.tz, Number(t.body))}`, href: "/movies", forYou: false, at };
    // A game of UNO says who dealt it and who won it, not every card.
    case "uno": {
      const others = players(t).filter((p) => p !== t.author);
      const who = [...others.filter((p) => p === me.id).map(() => "you"), ...others.filter((p) => p !== me.id).map(nameOf)];
      return { text: `${by} started UNO with ${names(who)}`, href: "/uno", forYou: !mine && others.includes(me.id), at };
    }
    case "unomove": {
      const start = all.find((g) => g.kind === "uno" && `uno:${g.id}` === t.place);
      if (!start || replay(start, all, Date.now()).won?.id !== t.id) return undefined;
      return { text: `${by} won UNO`, href: "/uno", forYou: !mine && players(start).includes(me.id), at };
    }
    case "note":
      return { text: t.item === "big" ? `${by} pinned big news on the wall` : `${by} wrote on the wall`, href: "/living", forYou: false, at };
    case "desk": {
      const owner = ownerOf(t.place);
      if (!owner) return undefined;
      const href = `/room/${owner.id}`;
      if (owner.id !== me.id) return { text: `${by} left something on ${owner.name}'s desk`, href, forYou: false, at };
      const gift = find(GIFTS, t.item)?.label;
      const what = t.body && gift ? `a note and ${gift}` : t.body ? "a note" : (gift ?? "something");
      return { text: `${by} left ${what} on your desk`, href, forYou: true, at };
    }
    case "tidy": {
      const owner = ownerOf(t.place);
      if (!owner) return undefined;
      const href = `/room/${owner.id}`;
      if (owner.id === me.id) return { text: mine ? "You tidied your room" : `${by} tidied your room`, href, forYou: !mine, at };
      if (owner.id === t.author) return { text: `${by} tidied up her own room`, href, forYou: false, at };
      return { text: `${by} tidied ${owner.name}'s room`, href, forYou: false, at };
    }
    case "dish":
      return { text: `${by} made ${find(FOOD, t.item)?.short ?? "something"} for everyone`, href: "/kitchen", forYou: false, at };
    case "eat": {
      // The cook hears who ate what she made.
      const dish = all.find((d) => `dish:${d.id}` === t.place);
      if (!dish) return undefined;
      if (dish.author === t.author) return { text: `${by} finished ${mine ? "your" : "her"} own ${dishName(dish)}`, href: "/kitchen", forYou: false, at };
      if (dish.author === me.id) return { text: `${by} ate your ${dishName(dish)}`, href: "/kitchen", forYou: true, at };
      return { text: `${by} ate ${nameOf(dish.author)}'s ${dishName(dish)}`, href: "/kitchen", forYou: false, at };
    }
    case "water":
      return { text: `${by} watered the garden`, href: "/garden", forYou: false, at };
    case "plant":
      return { text: `${by} planted ${find(PLANTS, t.item)?.label ?? "something"} in the garden`, href: "/garden", forYou: false, at };
    case "play":
      return { text: `${by} petted ${DOG}`, href: "/garden", forYou: false, at };
    case "treat":
      return { text: `${by} gave ${DOG} a treat`, href: "/garden", forYou: false, at };
    case "hug": {
      const others = t.item.split(",").filter(Boolean);
      const href = pageOf(t.place);
      const one = others.length === 1;
      if (others.includes(me.id)) {
        const rest = others.filter((o) => o !== me.id).map(nameOf);
        return { text: one ? `${by} hugged you` : `${by} pulled ${names(["you", ...rest])} into a group hug`, href, forYou: true, at };
      }
      const who = names(others.map(nameOf));
      return { text: one ? `${by} hugged ${who}` : `${by} pulled ${who} into a group hug`, href, forYou: false, at };
    }
    case "wish": {
      const owner = ownerOf(t.place);
      if (!owner) return undefined;
      const href = `/room/${owner.id}`;
      if (owner.id === t.author) return { text: `${by} celebrated ${mine ? "your" : "her"} birthday`, href, forYou: false, at };
      if (owner.id === me.id) return { text: `${by} wished you a happy birthday`, href, forYou: true, at };
      return { text: `${by} wished ${owner.name} a happy birthday`, href, forYou: false, at };
    }
    case "nap": {
      const owner = ownerOf(t.place);
      if (!owner) return undefined;
      const href = `/room/${owner.id}`;
      if (owner.id === t.author) return { text: `${by} had a nap in ${mine ? "your" : "her"} own bed`, href, forYou: false, at };
      if (owner.id === me.id) return { text: `${by} slept in your bed`, href, forYou: true, at };
      return { text: `${by} slept in ${owner.name}'s bed`, href, forYou: false, at };
    }
    case "sit": {
      if (t.item === "sofa") return { text: `${by} sat on the sofa in the living room`, href: "/living", forYou: false, at };
      const owner = ownerOf(t.place);
      if (!owner) return undefined;
      const href = `/room/${owner.id}`;
      const what = t.item === "yoga" ? "meditated on" : "sat on";
      const mat = t.item === "yoga" ? "yoga mat" : "mat";
      if (owner.id === t.author) return { text: `${by} ${what} ${mine ? "your" : "her"} ${mat}`, href, forYou: false, at };
      if (owner.id === me.id) return { text: `${by} ${what} your ${mat}`, href, forYou: true, at };
      return { text: `${by} ${what} ${owner.name}'s ${mat}`, href, forYou: false, at };
    }
  }
}

// Each line once, newest first, what was left for you before the rest.
function happenings(list: Thing[], me: Person, all: Thing[]): Happening[] {
  const seenText = new Set<string>();
  const out: Happening[] = [];
  for (const t of list) {
    const h = happening(t, me, all);
    if (!h || seenText.has(h.text)) continue;
    seenText.add(h.text);
    out.push(h);
  }
  return [...out.filter((h) => h.forYou), ...out.filter((h) => !h.forYou)];
}

const newSince = (v: Visit): Happening[] => happenings(v.things.filter((t) => isNew(t, v)), v.me, v.things);

const happeningItem = (h: Happening, v: Visit): string =>
  `<li class="${h.forYou ? "for-you" : "around"}"><a href="${esc(h.href)}">${esc(h.text)}</a> <span class="ago">${esc(ago(h.at, v.now))}</span></li>`;

function away(v: Visit, limit: number): string {
  const firstVisit = v.seenUntil === 0;
  const list = newSince(v);
  const authors = new Set(v.things.filter((t) => isNew(t, v)).map((t) => t.author));
  const visitors = PEOPLE.filter((p) => p.id !== v.me.id && ((v.seen.get(p.id) ?? 0) > v.seenUntil || authors.has(p.id))).map((p) => p.name);
  const intro = firstVisit
    ? "Welcome home. Your room has your name on it; everyone else's is just down the hall."
    : visitors.length
      ? `${names(visitors)} came by while you were away.`
      : "Nobody's been by since you were last here. The house kept your place.";
  const more = list.length > limit ? `<p class="more"><a href="/updates">There's more since you were last here.</a></p>` : "";

  return `<section class="away" aria-labelledby="away-heading" data-live="away">
    <h2 id="away-heading">${firstVisit ? "Make yourself at home" : "While you were away"}</h2>
    <p>${esc(intro)}</p>
    ${list.length ? `<ul class="happenings">\n${list.slice(0, limit).map((h) => happeningItem(h, v)).join("\n")}\n</ul>${more}` : ""}
  </section>`;
}

// What happened before your last visit, so Updates is never empty.
function earlier(v: Visit): string {
  const list = happenings(v.things.filter((t) => !isNew(t, v)), v.me, v.things).sort((a, b) => b.at - a.at).slice(0, 10);
  if (!list.length) return "";
  return `<section class="card earlier" aria-labelledby="earlier-heading">
    <h2 id="earlier-heading">Lately in the house</h2>
    <ul class="happenings">\n${list.map((h) => happeningItem({ ...h, forYou: false }, v)).join("\n")}\n</ul>
  </section>`;
}

function news(v: Visit): string {
  const list = newSince(v);
  const text = v.seenUntil === 0
    ? "Welcome home. Tap a room to go in."
    : list.length
      ? `${list[0].text}${list.length > 1 ? ", and more" : ""}`
      : "Nobody's been by since you were last here. Tap a room to go in.";
  return `<a class="news" href="/updates" data-live="news"><svg viewBox="-11 -11 22 22" aria-hidden="true"><path d="M0 -10L2.6 -2.6L10 0L2.6 2.6L0 10L-2.6 2.6L-10 0L-2.6 -2.6Z"/></svg><span>${esc(text)}</span></a>`;
}

/* ---------- everyone ---------- */

function status(p: Person, v: Visit): string {
  const at = placeOf(p, v);
  const mask = masked(v.things, v.now).has(p.id) ? ", in a face mask" : "";
  const rest = restOf(p, v);
  const there = rest && restText(rest, p, v);
  if (p.id === v.me.id) return `you're here, ${there ?? placeName(at, v.me)}${mask}`;
  if (homeNow(p, v)) return `home now, ${there ?? (at === roomPlace(p.id) ? "in her room" : placeName(at, v.me))}${mask}`;
  if (there) return `${there}${mask}`;
  if (sleeping(p, v)) return "asleep";
  const last = v.seen.get(p.id);
  return last === undefined ? "hasn't been home yet" : `home ${ago(last, v.now)}`;
}

// On the Everyone tab, each friend can be stepped into, the same as picking
// her at the door.
function everyone(v: Visit, full: boolean): string {
  const rows = PEOPLE.map((p) => {
    const c = clock(p.tz, v.now);
    const be = full && p.id !== v.me.id
      ? `<form method="post" action="/me" class="be"><button class="soft" name="who" value="${esc(p.id)}">Come in as ${esc(p.name)}</button></form>`
      : "";
    return `<li style="--accent:${p.color}"><a href="/room/${esc(p.id)}">
      ${pane(p, phase(c), sleeping(p, v), v.now)}
      <span class="who"><span class="name">${nameHtml(p)}</span><span class="where">${esc(c.weekday)}, <span class="clock" data-tz="${esc(p.tz)}">${esc(c.label)}</span> in ${esc(p.city)}</span><span class="status">${esc(status(p, v))}</span>${full ? `<span class="about">${esc(p.about)}</span>` : ""}</span>
    </a>${be}</li>`;
  }).join("\n");
  return `<section class="clocks${full ? " full" : ""}" aria-labelledby="clocks-heading" data-live="clocks">
    <h2 id="clocks-heading">Everyone, right now</h2>
    <ul>\n${rows}\n</ul>
  </section>`;
}

/* ---------- the tabs ---------- */

export function housePage(v: Visit): string {
  const light = phase(clock(v.me.tz, v.now));
  return shell("Five Windows", `
${bar(v, "home")}
<main class="home">
  ${news(v)}
  <div class="home-grid">
    <section class="map" aria-label="The house">${houseSvg(scene(v))}</section>
    <aside class="side">
      ${away(v, 6)}
      ${everyone(v, false)}
      ${footer(v.me)}
    </aside>
  </div>
</main>`, light, "page-home");
}

export function updatesPage(v: Visit): string {
  return shell("Updates · Five Windows", `
${bar(v, "updates")}
<main class="list">
  ${away(v, 40)}
  ${slot("earlier", earlier(v))}
</main>`, phase(clock(v.me.tz, v.now)), "page-list");
}

export function everyonePage(v: Visit): string {
  return shell("Everyone · Five Windows", `
${bar(v, "everyone")}
<main class="list">
  ${everyone(v, true)}
  ${footer(v.me)}
</main>`, phase(clock(v.me.tz, v.now)), "page-list");
}

/* ---------- rooms ---------- */

function roomPage(v: Visit, place: string, title: string, side: string, d?: Done): string {
  return shell(`${title} · Five Windows`, `
${bar(v, "home")}
<main class="room">
  <div class="room-grid">
    <section class="map zoom" aria-label="${esc(title)}">${houseSvg(scene(v, place, d?.key))}</section>
    <div class="room-side">
      <a class="back" href="/">‹ The whole house</a>
      ${side}
    </div>
  </div>
</main>`, phase(clock(v.me.tz, v.now)), "page-room");
}

// What he's up to on his own: "wandering round the kitchen", "having a nap
// on his blanket under the tree". Napping somewhere else, he's taken his
// blanket with him, as his picture shows.
function upTo(d: Laddoo, v: Visit): string {
  const round = placeName(d.place, v.me).replace(/^in /, "round ");
  if (d.pose === "walk") return `wandering ${round}`;
  if (d.pose === "stand") return `having a sniff ${round}`;
  if (d.at[0] === KENNEL[0] && d.at[1] === KENNEL[1]) return "having a nap on his blanket under the tree";
  return `curled up on his blanket for a nap ${placeName(d.place, v.me)}`;
}

// Shinzo on the page of whichever room he's in, so you can pet him or give
// him a treat there and he comes with you. The garden always says where he's
// gone.
function laddooCard(place: string, v: Visit): string {
  const d = laddooAt(v);
  const here = d.place === place;
  if (!here && place !== "garden") return "";
  const f = d.with;
  const mine = f?.id === v.me.id;
  const line = !f
    ? here ? `He's ${upTo(d, v)}.` : `He's off on his own, ${upTo(d, v)}.`
    : !here ? `He went off with ${mine ? "you" : f.name}, and he's ${placeName(d.place, v.me)}.`
    : mine ? "He's at your heels for a while, and goes wherever you go."
    : homeNow(f, v) ? `He's with ${f.name}, and goes wherever she goes.`
    : sleeping(f, v) ? `He's keeping watch at the foot of ${f.name}'s bed.`
    : `He's waiting right where ${f.name} left him.`;
  const petted = d.last ? ` ${d.last.kind === "treat" ? "Last treat from" : "Last petted by"} ${by(d.last, v)}, ${ago(d.last.createdAt, v.now)}.` : "";
  const button = (action: string, key: string, label: string): string =>
    `<form method="post" action="${action}" class="inline"><input type="hidden" name="at" value="${esc(place)}"><button class="soft">${emoji(key)} ${label}</button></form>`;
  const pet = here ? `<div class="doings">${button("/garden/dog", "play", `Pet ${DOG}`)}${button("/garden/treat", "treat", `Give ${DOG} a treat`)}</div>` : "";
  return `<section class="card laddoo-card" aria-labelledby="dog-heading">
    <h2 id="dog-heading">${DOG}</h2>
    <p>${place === "garden" ? "Everyone's dog. " : ""}${esc(line + petted)}</p>
    ${pet}
  </section>`;
}

function picker(name: string, legend: string, items: Item[], art: (key: string) => string, none?: string): string {
  const opts = items.map((i) =>
    `<label><input type="radio" name="${name}" value="${esc(i.key)}"${none ? "" : " required"}>${art(i.key)}<span>${esc(i.short)}</span></label>`);
  if (none) opts.unshift(`<label><input type="radio" name="${name}" value="" checked>${iconSvg("note")}<span>${esc(none)}</span></label>`);
  return `<fieldset class="picker"><legend>${esc(legend)}</legend>${opts.join("")}</fieldset>`;
}

function roomHead(title: string, line: string, about: string | undefined, accent: string): string {
  return `<header class="room-head" style="--accent:${accent}">
    <h1>${esc(title)}</h1>
    <p class="local">${line}</p>
    ${about ? `<p class="about">${esc(about)}</p>` : ""}
  </header>`;
}

const by = (t: Thing, v: Visit): string => (t.author === v.me.id ? "you" : nameOf(t.author));

const sitButton = (seat: string, label: string): string =>
  `<form method="post" action="/sit" class="inline"><input type="hidden" name="seat" value="${esc(seat)}"><button class="soft">${emoji(seat === "yoga" ? "yoga" : "sit")} ${esc(label)}</button></form>`;

/* ---------- a bedroom ---------- */

const DESK_SHOWN = 12;

function deskThing(t: Thing, owner: Person, v: Visit): string {
  const canRead = v.me.id === owner.id || v.me.id === t.author;
  const gift = find(GIFTS, t.item);
  const icons = [t.body ? iconSvg("note") : "", gift ? iconSvg(gift.key) : ""].join("");
  const from = `from ${by(t, v)}, ${ago(t.createdAt, v.now)}`;
  let text: string;
  if (!t.body) text = `<p class="body">${esc(cap(gift?.label ?? "something"))}</p>`;
  else if (canRead) text = `<p class="body hand">${esc(t.body)}</p>${gift ? `<p class="with">with ${esc(gift.label)}</p>` : ""}`;
  else text = `<p class="body">A folded note for ${esc(owner.name)}${gift ? `, and ${esc(gift.label)}` : ""}.</p>`;
  const cls = ["desk-thing", isNew(t, v) ? "new" : "", t.author === v.me.id ? "mine" : ""].filter(Boolean).join(" ");
  const paper = personById(t.author)?.paper ?? "#fff";
  return `<li class="${cls}" style="--paper:${paper}">${isNew(t, v) ? `<span class="tag">new</span>` : ""}<span class="icons">${icons}</span><div>${text}<p class="by">${esc(from)}</p></div></li>`;
}

// Rithanya always has face mask powder for everyone, by her mirror.
function maskCard(owner: Person, v: Visit): string {
  const mine = owner.id === v.me.id;
  const on = masked(v.things, v.now);
  const wearing = PEOPLE.filter((p) => on.has(p.id) && p.id !== v.me.id).map((p) => p.name);
  const lately = v.things.filter((t) => t.kind === "mask").slice(0, 5)
    .map((t) => `<li>${esc(cap(by(t, v)))}, ${esc(ago(t.createdAt, v.now))}</li>`).join("");
  return `<section class="card" aria-labelledby="mask-heading">
    <h2 id="mask-heading">Face masks</h2>
    <p>${mine ? "Your face mask powder, by the mirror. There's always enough for everyone." : `${esc(owner.name)} always has face mask powder for everyone. It's by the mirror.`}</p>
    ${wearing.length ? `<p class="small">${esc(names(wearing))} ${wearing.length === 1 ? "is" : "are"} in a face mask right now.</p>` : ""}
    ${on.has(v.me.id)
      ? `<p class="mask-on">Your mask is on. It comes off by itself in a couple of hours.</p>`
      : `<form method="post" action="/room/${esc(owner.id)}/mask" class="inline"><button class="soft">${emoji("mask")} Put on a face mask</button></form>`}
    ${lately ? `<h3 class="small-head">Lately</h3><ul class="plain-list">${lately}</ul>` : ""}
  </section>`;
}

// Hostel nights: Maggi made in the kettle and eaten on Amirdhavarshini's mat.
function kettleCard(owner: Person, v: Visit): string {
  const made = kettle(v.things, v.now);
  const mine = owner.id === v.me.id;
  const out = made
    ? `<p class="kettle-out">${esc(`${cap(by(made, v))} made kettle Maggi ${ago(made.createdAt, v.now)}. There's some left on the mat.`)}</p>${made.body ? `<p class="body hand">${esc(made.body)}</p>` : ""}`
    : `<p class="empty">The kettle's cold. Nobody's made Maggi tonight.</p>`;
  return `<form method="post" action="/room/${esc(owner.id)}/kettle" class="card compose">
    <h2>Kettle Maggi</h2>
    <p class="small">Like in the hostel: Maggi made in the kettle and eaten on ${mine ? "your" : `${esc(owner.name)}'s`} mat.</p>
    ${out}
    <label for="kettle-note">A note for whoever finds it, if you like</label>
    <textarea id="kettle-note" name="body" rows="2" maxlength="${MAX_DISH_NOTE}" placeholder="made extra, come sit"></textarea>
    <button>${emoji("kettle")} Make Maggi in the kettle</button>
  </form>`;
}

/* ---------- UNO on the mat ---------- */

const whoName = (id: string, v: Visit): string => (id === v.me.id ? "you" : nameOf(id));

const turnLine = (g: Game, v: Visit): string =>
  g.winner ? `${cap(whoName(g.winner, v))} won!` : whoseTurn(g) === v.me.id ? "It's your turn." : `It's ${nameOf(whoseTurn(g))}'s turn.`;

// Why you're no longer in a game that's still going.
const outLine = (g: Game, v: Visit): string =>
  g.left.find((l) => l.who === v.me.id)?.why === "time"
    ? "Your ten seconds ran out, so the others played on without you."
    : "You left the house, so you're out of this game.";

// Sitting on the mat with a friend, anyone can deal. A game, once dealt, waits
// for whoever's turn it is, however long she's away.
function unoCard(v: Visit): string {
  const rests = resting(v.things, v.now, v.where, v.arrived);
  const dealt = dealFor(v.me.id, rests);
  const mine = gameOf(v.things, v.me.id);
  const g = mine && replay(mine, v.things, v.now);
  const playing = g && stillIn(g, v.me.id);
  const mat = onTheMat(rests);
  const others = (ids: string[]): string => names(ids.filter((p) => p !== v.me.id).map(nameOf));
  const game = !g ? ""
    : playing ? `<p class="uno-now${whoseTurn(g) === v.me.id ? " yours" : ""}"><a href="/uno">Your game with ${esc(others(g.players))}</a>. ${esc(turnLine(g, v))}</p>`
    : g.winner ? `<p class="small">Last game: ${esc(turnLine(g, v))} <a href="/uno">See how it ended</a>.</p>`
    : `<p class="small">${esc(outLine(g, v))} <a href="/uno">See how it's going</a>.</p>`;
  const deal = dealt
    ? `<form method="post" action="/uno" class="inline"><button class="soft">${emoji("uno")} ${playing ? "Deal a new game" : "Deal UNO"} for you and ${esc(others(dealt))}</button></form>
    <p class="small">Seven cards each, and ten seconds a turn. Whoever lets her time run out, or leaves the house, is out, and the rest play on.</p>`
    : playing ? "" : `<p class="empty">Sit on the mat with a friend to play.${mat.length ? ` ${esc(cap(names(mat.map((p) => whoName(p, v)))))} ${mat.length === 1 && mat[0] !== v.me.id ? "is" : "are"} on the mat right now.` : ""}</p>`;
  return `<section class="card uno-card-room" aria-labelledby="uno-heading">
    <h2 id="uno-heading">UNO on the mat</h2>
    ${game}
    ${deal}
  </section>`;
}

const UNO_MARK: Record<string, string> = { S: "⊘", R: "⇄", D: "+2", W: "", W4: "+4" };

// A card as it looks on the table: its colour, a tilted white oval with the
// number or symbol, and the same small in two corners. Wilds are black, with
// the four colours in the oval.
function unoFace(c: Card, big = false): string {
  const v = isWild(c) ? c : c.slice(1);
  const mark = UNO_MARK[v] ?? v;
  const colour = isWild(c) ? "w" : c[0];
  // A 6 and a 9 are underlined, so upside down neither reads as the other.
  const turnable = v === "6" || v === "9" ? " turnable" : "";
  return `<span class="uno-card c-${colour}${big ? " big" : ""}${turnable}" aria-hidden="true"><span class="corner">${mark}</span><span class="oval"><span class="mark">${mark}</span></span><span class="corner end">${mark}</span></span>`;
}

const back = `<span class="uno-back" aria-hidden="true"><span class="oval"><span class="mark">UNO</span></span></span>`;

// The hand in colour order, wilds last.
const ORDER = "rygbW";
const RANK = "0123456789SRD4";
const sorted = (hand: Card[]): Card[] =>
  [...hand].sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]) || RANK.indexOf(a.slice(-1)) - RANK.indexOf(b.slice(-1)) || a.length - b.length);

function lastLine(g: Game, v: Visit): string {
  if (!g.last) return `${cap(whoName(g.start.author, v))} dealt. ${g.players[0] === v.me.id ? "You go" : `${nameOf(g.players[0])} goes`} first.`;
  const who = cap(whoName(g.last.by, v));
  const you = g.last.by === v.me.id;
  if (g.last.move === "draw") return `${who} drew a card.`;
  if (g.last.move === "pass") return `${who} kept the card and passed.`;
  if (g.last.move === "time") return `${you ? "Your" : `${who}'s`} ten seconds ran out, so ${you ? "you're" : "she's"} out${g.winner ? "" : " and play moved on"}.`;
  if (g.last.move === "quit") return `${who} left the house, so ${you ? "you're" : "she's"} out of the game.`;
  return `${who} played ${isWild(g.last.move) ? "a" : "the"} ${cardName(g.last.move)}${g.last.color ? ` and picked ${COLOR_NAME[g.last.color]}` : ""}.`;
}

function unoHand(g: Game, v: Visit): string {
  const hand = g.hands.get(v.me.id) ?? [];
  const myTurn = !g.winner && whoseTurn(g) === v.me.id;
  const cards = sorted(hand).map((c, i, all) => {
    // Only the first of two the same is marked as just drawn.
    const drawn = g.drawn === c && all.indexOf(c) === i;
    const ok = myTurn && canPlay(g, v.me.id, c);
    const tag = drawn ? `<span class="tag">just drawn</span>` : "";
    if (!isWild(c)) {
      return `<li class="in-hand${drawn ? " drawn" : ""}">${tag}<button class="uno-play" name="card" value="${c}" aria-label="Play the ${esc(cardName(c))}"${ok ? "" : " disabled"}>${unoFace(c)}</button></li>`;
    }
    const swatches = COLORS.map((k: Color) => `<button class="swatch s-${k}" name="card" value="${c}:${k}" aria-label="Play the ${esc(cardName(c))} as ${COLOR_NAME[k]}" title="${COLOR_NAME[k]}"${ok ? "" : " disabled"}></button>`).join("");
    return `<li class="in-hand wild${drawn ? " drawn" : ""}${ok ? "" : " off"}">${tag}${unoFace(c)}<span class="swatches">${swatches}</span></li>`;
  }).join("\n");
  const turn = myTurn
    ? g.drawn !== undefined
      ? `<button class="soft" name="card" value="pass">Keep it and pass</button>`
      : `<button class="soft" name="card" value="draw">${emoji("uno")} Draw a card</button>`
    : "";
  const help = g.winner ? "" : myTurn
    ? g.drawn !== undefined ? "You can play the card you drew, or keep it and pass."
    : isWild(top(g)) ? `Play a ${COLOR_NAME[g.color]} card or a wild, or draw one.`
    : `Play a ${COLOR_NAME[g.color]} card, ${/^8/.test(top(g).slice(1)) ? "an" : "a"} ${cardName(top(g)).replace(/^\w+ /, "")}, or a wild. Or draw one.`
    : `Your cards wait here until it's your turn.`;
  return `<form method="post" action="/uno/move" class="card uno-hand-card" id="hand" data-quick>
    <input type="hidden" name="game" value="${g.start.id}">
    <h2>Your hand${hand.length === 1 && !g.winner ? ` <span class="uno-call">UNO!</span>` : ""}</h2>
    <p class="small">${esc(help)}</p>
    <ul class="uno-hand${myTurn ? "" : " waiting"}">
${cards}
    </ul>
    ${turn ? `<div class="doings">${turn}</div>` : ""}
  </form>`;
}

// The discard pile, the colour in play and whose turn it is, above your hand.
function unoTable(g: Game, v: Visit): string {
  return `<section class="card uno-table" aria-labelledby="table-heading">
    <h2 id="table-heading">On the mat</h2>
    <div class="uno-piles">
      <div class="uno-pile" title="The draw pile">${back}<span class="count">${g.pile.length} to draw</span></div>
      <div class="uno-discard">${unoFace(top(g), true)}<span class="in-play c-${g.color}">${esc(cap(COLOR_NAME[g.color]))}</span></div>
    </div>
    <p class="uno-turn${!g.winner && whoseTurn(g) === v.me.id ? " yours" : ""}"${g.winner ? "" : ` data-deadline="${deadline(g)}" data-now="${v.now}"`}>${esc(turnLine(g, v))}${g.winner ? " 🎉" : ` <span class="countdown" title="Ten seconds a turn">${Math.max(0, Math.ceil((deadline(g) - v.now) / 1000))}s</span>`}</p>
    <p class="small">${esc(lastLine(g, v))}</p>
  </section>`;
}

// Everyone's hand, face down, in the order play goes.
function unoPlayers(g: Game, v: Visit): string {
  const order = g.dir === 1 ? g.players : [...g.players].reverse();
  const rows = g.players.map((p) => {
    const n = g.hands.get(p)?.length ?? 0;
    const you = p === v.me.id;
    const cls = ["uno-player", !g.winner && whoseTurn(g) === p ? "turn" : "", g.winner === p ? "winner" : "", you ? "me" : ""].filter(Boolean).join(" ");
    const backs = you ? "" : `<span class="backs" data-count="${n}">${back.repeat(n)}</span>`;
    return `<li class="${cls}" data-person="${esc(p)}" style="--accent:${personById(p)?.color ?? "#8a5a3c"}"><span class="name">${you ? "You" : esc(nameOf(p))}</span>${backs}<span class="count">${n === 1 ? "1 card" : `${n} cards`}${n === 1 && !g.winner ? ` <span class="uno-call">UNO!</span>` : ""}</span></li>`;
  }).join("\n");
  // Whoever's gone, after everyone still playing.
  const gone = g.left.map(({ who, why }) =>
    `<li class="uno-player left" data-person="${esc(who)}" style="--accent:${personById(who)?.color ?? "#8a5a3c"}"><span class="name">${who === v.me.id ? "You" : esc(nameOf(who))}</span><span class="count">${why === "time" ? "out of time" : "left the house"}</span></li>`).join("\n");
  return `<section class="card uno-around" aria-labelledby="around-heading">
    <h2 id="around-heading">Around the mat</h2>
    <ol class="uno-players">
${rows}
${gone}
    </ol>
    <p class="small">Ten seconds a turn. Play goes ${esc(order.map((p) => (p === v.me.id ? "you" : nameOf(p))).join(" → "))}, and round again.</p>
  </section>`;
}

export function unoPage(v: Visit, did?: Done): string {
  const mine = gameOf(v.things, v.me.id);
  const start = mine ?? games(v.things)[0];
  const g = start && replay(start, v.things, v.now);
  const playing = g?.players.includes(v.me.id);
  const gone = g?.left.some((l) => l.who === v.me.id);
  const owner = personById(KETTLE_ROOM)!;
  const body = !g
    ? `<section class="card"><p class="empty">Nobody's dealt a game yet. Sit on ${esc(owner.name)}'s mat with a friend, and deal.</p><p><a href="/room/${KETTLE_ROOM}">Go to the mat ›</a></p></section>`
    : `${unoTable(g, v)}
  ${g.winner ? `<p class="uno-again"><a href="/room/${KETTLE_ROOM}">Back to the mat for another round ›</a></p>` : ""}
  ${playing ? unoHand(g, v) : gone ? `<p class="small">${esc(outLine(g, v))} Sit on the mat with a friend to deal another.</p>` : `<p class="small">You're not in this game. Sit on the mat with a friend to deal one of your own.</p>`}
  ${unoPlayers(g, v)}`;
  return shell("UNO · Five Windows", `
${bar(v, "home")}
<main class="list uno">
  <header class="room-head" style="--accent:${owner.color}">
    <h1>UNO on the mat</h1>
    <p class="local">On ${esc(owner.name)}'s mat, like old times. Seven cards each, and ten seconds a turn: whoever's away is out, and the rest play on.</p>
  </header>
  ${done(did)}
  <div class="uno-game" data-live="uno-game">
  ${body}
  </div>
</main>`, phase(clock(v.me.tz, v.now)), "page-list");
}

// All through her birthday month, her room says so, says when the day is in
// her own calendar, and keeps who's wished her this month.
function birthdayCard(owner: Person, v: Visit): string {
  const when = birthday(owner, v.now);
  if (!when) return "";
  const mine = owner.id === v.me.id;
  const [year, month] = ymd(owner.tz, v.now);
  const wishers = wishes(v.things, owner.id)
    .filter((t) => t.author !== owner.id)
    .filter((t) => {
      const [y, m] = ymd(owner.tz, t.createdAt);
      return y === year && m === month;
    })
    .map((t) => t.author)
    .filter((a, i, all) => all.indexOf(a) === i)
    .map((a) => (a === v.me.id ? "you" : nameOf(a)));
  const day = birthdayLabel(owner, v.now);
  const head = when === 2
    ? (mine ? "Happy birthday!" : `It's ${owner.name}'s birthday today!`)
    : (mine ? "It's your birthday month" : `It's ${owner.name}'s birthday month`);
  const line = when === 2
    ? (mine ? "Today's the day. Everyone who comes by finds the cake on your desk." : `Today's the day in ${owner.city}. There's cake on her desk.`)
    : (mine ? `Your birthday is ${day}. The bunting stays up all month.` : `Her birthday is ${day}, in ${owner.city}. The bunting stays up all month.`);
  const wished = wishers.length
    ? `Wished ${mine ? "you" : "her"} a happy birthday this month: ${names(wishers)}.`
    : mine ? "Your friends' wishes will show up here." : "Be the first to wish her a happy birthday.";
  const label = mine ? "Celebrate your birthday" : `Wish ${owner.name} a happy birthday`;
  return `<section class="card birthday-card" aria-labelledby="birthday-heading" style="--accent:${owner.color}">
    <h2 id="birthday-heading">${emoji("wish")} ${esc(head)}</h2>
    <p>${esc(line)}</p>
    <p class="small">${esc(wished)}</p>
    <form method="post" action="/room/${esc(owner.id)}/wish" class="inline"><button class="soft">${emoji("wish")} ${esc(label)}</button></form>
  </section>`;
}

export function bedroomPage(owner: Person, v: Visit, did?: Done): string {
  const mine = owner.id === v.me.id;
  const c = clock(owner.tz, v.now);
  const state = mine
    ? "You're home."
    : sleeping(owner, v) ? `${owner.name} is fast asleep.`
    : homeNow(owner, v) ? `${owner.name} is home right now, ${placeOf(owner, v) === roomPlace(owner.id) ? "in here" : placeName(placeOf(owner, v), v.me)}.`
    : `${owner.name} is awake somewhere in ${owner.city}.`;
  const line = `It's ${esc(c.weekday)}, <span class="clock" data-tz="${esc(owner.tz)}">${esc(c.label)}</span> in ${esc(owner.city)}. ${esc(state)}`;

  const level = mess(v.things, owner.id, v.now);
  const tidied = latest(v.things, "tidy", roomPlace(owner.id));
  const messLine = ["It's tidy in here.", "It's a little lived-in.", "It's getting messy in here."][level];
  const tidyLine = tidied ? `Last tidied by ${by(tidied, v)}, ${ago(tidied.createdAt, v.now)}.` : "Nobody has tidied up in here yet.";

  const left = desk(v.things, owner.id);
  const shown = left.slice(0, DESK_SHOWN).map((t) => deskThing(t, owner, v)).join("\n");
  const drawer = left.length > DESK_SHOWN
    ? `<details class="drawer"><summary>Older things, kept in the drawer</summary><ul class="desk-list">${left.slice(DESK_SHOWN).map((t) => deskThing(t, owner, v)).join("\n")}</ul></details>`
    : "";

  const leaveForm = mine ? "" : `
  <form method="post" action="/room/${esc(owner.id)}/leave" class="card compose" id="leave-something">
    <h2>Leave something for ${esc(owner.name)}</h2>
    <label for="body">A note, if you like</label>
    <textarea id="body" name="body" rows="3" maxlength="${MAX_NOTE}" placeholder="good luck today, I saw this and thought of you…"></textarea>
    ${picker("item", "And something with it", GIFTS, iconSvg, "Just the note")}
    <p class="small">Only ${esc(owner.name)} can read the note. Anyone who walks in can see something's been left.</p>
    <button>${emoji("desk")} Leave it on ${esc(owner.name)}'s desk</button>
  </form>`;

  // Anyone can sleep in anyone's bed, and sit down on the seats.
  const seat = owner.id === KETTLE_ROOM ? sitButton("mat", "Sit on your cushion on the mat")
    : owner.id === YOGA_ROOM ? sitButton("yoga", "Meditate on the yoga mat")
    : "";

  const title = mine ? "Your room" : `${owner.name}'s room`;
  return roomPage(v, roomPlace(owner.id), title, `
  ${slot("head", roomHead(title, line, owner.about, owner.color))}
  ${done(did)}
  ${slot("birthday", birthdayCard(owner, v))}
  <p class="status" data-live="mess">${esc(messLine)} ${esc(tidyLine)}</p>
  ${slot("resting", restingIn(roomPlace(owner.id), v))}
  ${slot("hugs", hugButtons(v))}
  <div class="doings">
    <form method="post" action="/room/${esc(owner.id)}/tidy" class="inline"><button class="soft">${emoji("tidy")} ${mine ? "Tidy your room" : `Tidy up ${esc(owner.name)}'s room`}</button></form>
    <form method="post" action="/room/${esc(owner.id)}/nap" class="inline"><button class="soft">${emoji("nap")} Sleep in ${mine ? "your" : `${esc(owner.name)}'s`} bed</button></form>
    ${seat}
  </div>
  ${slot("dog", laddooCard(roomPlace(owner.id), v))}
  ${owner.id === MASK_ROOM ? slot("mask", maskCard(owner, v)) : ""}
  ${owner.id === KETTLE_ROOM ? slot("kettle", kettleCard(owner, v)) : ""}
  ${owner.id === KETTLE_ROOM ? slot("uno", unoCard(v)) : ""}
  <section class="card" id="desk" aria-labelledby="desk-heading" data-live="desk">

    <h2 id="desk-heading">${mine ? "On your desk" : `On ${esc(owner.name)}'s desk`}</h2>
    ${left.length ? `<ul class="desk-list">\n${shown}\n</ul>${drawer}` : `<p class="empty">${mine ? "Nothing yet. When a friend leaves you something, it'll be here." : "Nothing yet."}</p>`}
  </section>
  ${leaveForm}`, did);
}

/* ---------- the living room ---------- */

const WALL_SHOWN = 24;

function wallNote(t: Thing, v: Visit): string {
  const cls = ["note", t.item === "big" ? "big" : "", isNew(t, v) ? "new" : "", t.author === v.me.id ? "mine" : ""].filter(Boolean).join(" ");
  const paper = personById(t.author)?.paper ?? "#fff8e6";
  return `<li class="${cls}" style="--paper:${paper}">${isNew(t, v) ? `<span class="tag">new</span>` : ""}<p class="body hand">${esc(t.body)}</p><p class="by">${esc(by(t, v))}, ${esc(ago(t.createdAt, v.now))}</p></li>`;
}

export function livingPage(v: Visit, did?: Done): string {
  const night = movieNight(v.things, v.now);
  const notes = wall(v.things);
  const big = notes.filter((t) => t.item === "big");
  const everyday = notes.filter((t) => t.item !== "big");

  return roomPage(v, "living", "The living room", `
  ${roomHead("The living room", "Everyone's room. The wall is for all five of you: something funny from today, a good-luck wish, big news.", undefined, "#8a5a3c")}
  ${done(did)}
  <p class="sofa" data-live="sofa"><a href="/movies">${night ? esc(`Movie night on these sofas: “${night.movie.title}”, ${dayLabel(v.me.tz, night.at)}`) : "Movie night happens on these sofas"} ›</a></p>
  ${slot("resting", restingIn("living", v))}
  ${slot("hugs", hugButtons(v))}
  <div class="doings">${sitButton("sofa", "Sit on the sofa")}</div>
  ${slot("dog", laddooCard("living", v))}
  <form method="post" action="/wall" class="card compose" id="write">
    <label for="body">Write on the wall</label>
    <textarea id="body" name="body" rows="3" maxlength="${MAX_NOTE}" required placeholder="the funniest thing happened today…"></textarea>
    <label class="check"><input type="checkbox" name="big" value="1"> This is big news. Keep it pinned at the top.</label>
    <button>${emoji("wall")} Pin it to the wall</button>
  </form>
  <section class="wall" id="wall" aria-labelledby="wall-heading" data-live="wall">
    <h2 id="wall-heading">The wall</h2>
    ${big.length ? `<h3 class="pinned">Big news</h3><ul class="notes">\n${big.map((t) => wallNote(t, v)).join("\n")}\n</ul>` : ""}
    ${everyday.length ? `<ul class="notes">\n${everyday.slice(0, WALL_SHOWN).map((t) => wallNote(t, v)).join("\n")}\n</ul>` : big.length ? "" : `<p class="empty">The wall is bare. Be the first to pin something up.</p>`}
    ${everyday.length > WALL_SHOWN ? `<details class="drawer"><summary>The memory box: older notes, taken down but kept</summary><ul class="notes">${everyday.slice(WALL_SHOWN).map((t) => wallNote(t, v)).join("\n")}</ul></details>` : ""}
  </section>`, did);
}

/* ---------- the kitchen ---------- */

export function kitchenPage(v: Visit, did?: Done): string {
  const dishes = counter(v.things, v.now);
  const list = dishes.map((t) => {
    const dish = find(FOOD, t.item);
    const cls = ["dish", isNew(t, v) ? "new" : "", t.author === v.me.id ? "mine" : ""].filter(Boolean).join(" ");
    const eat = `<form method="post" action="/kitchen/eat" class="inline"><button class="soft" name="dish" value="${t.id}">${emoji("eat")} Eat it</button></form>`;
    return `<li class="${cls}" data-id="${t.id}">${isNew(t, v) ? `<span class="tag">new</span>` : ""}<span class="icons">${iconSvg(t.item)}</span><div><p class="body">${esc(`${cap(by(t, v))} made ${dish?.short ?? "something"}`)}</p>${t.body ? `<p class="body hand">${esc(t.body)}</p>` : ""}<p class="by">${esc(ago(t.createdAt, v.now))}</p>${eat}</div></li>`;
  }).join("\n");

  return roomPage(v, "kitchen", "The kitchen", `
  ${roomHead("The kitchen", "Cook something and leave it out for everyone. Food stays on the counter for three days, or until someone eats it.", undefined, "#c4553c")}
  ${done(did)}
  ${slot("hugs", hugButtons(v))}
  ${slot("dog", laddooCard("kitchen", v))}
  <section class="card" aria-labelledby="counter-heading" data-live="counter">
    <h2 id="counter-heading">On the counter</h2>
    ${dishes.length ? `<ul class="desk-list">\n${list}\n</ul>` : `<p class="empty">The counter's clean. Nobody has cooked in the last few days.</p>`}
  </section>
  <form method="post" action="/kitchen" class="card compose" id="cook">
    <h2>Cook something</h2>
    ${picker("item", "What are you making?", FOOD, iconSvg)}
    <label for="body">A note to go with it, if you like</label>
    <textarea id="body" name="body" rows="2" maxlength="${MAX_DISH_NOTE}" placeholder="made too much, help yourselves"></textarea>
    <button>${emoji("dish")} Leave it out for everyone</button>
  </form>`, did);
}

/* ---------- the garden ---------- */

const STAGES = ["", "just sprouted", "growing", "in bloom"];

export function gardenPage(v: Visit, did?: Done): string {
  const dry = thirsty(v.things, v.now);
  const watered = latest(v.things, "water");
  const planted = plants(v.things);

  const waterLine = `${dry ? "The plants look a bit thirsty." : "The plants look happy."} ${watered ? `Last watered by ${by(watered, v)}, ${ago(watered.createdAt, v.now)}.` : "Nobody has watered the garden yet."}`;
  const plots = PEOPLE.map((owner) => {
    const p = planted.get(owner.id);
    return { owner, plant: p?.item, stage: p ? stage(p, v.now) : 0 };
  });
  const patches = PEOPLE.map((p) => {
    const t = planted.get(p.id);
    const plant = t ? find(PLANTS, t.item) : undefined;
    const what = t && plant ? `${cap(plant.label)}, ${STAGES[stage(t, v.now)]}. Planted ${ago(t.createdAt, v.now)}.` : "Nothing planted yet.";
    return `<li style="--accent:${p.color}"><span class="name">${p.id === v.me.id ? "Your patch" : `${esc(p.name)}'s patch`}</span> <span>${esc(what)}</span></li>`;
  }).join("\n");
  const myPlant = planted.get(v.me.id);
  const replaces = myPlant ? find(PLANTS, myPlant.item) : undefined;


  return roomPage(v, "garden", "The garden", `
  ${roomHead("The garden", "Everyone has a patch. Anyone can water the lot, and the plants grow whether or not you're here.", undefined, "#4f8f3e")}
  ${done(did)}
  ${slot("hugs", hugButtons(v))}
  <p class="status" data-live="water">${esc(waterLine)}</p>
  <form method="post" action="/garden/water" class="inline"><button class="soft">${emoji("water")} Water the garden</button></form>
  <section class="card" aria-labelledby="patches-heading" data-live="patches">
    <h2 id="patches-heading">The patches</h2>
    <figure class="close">${patchesSvg(plots, dry, did?.key, v.me.id)}</figure>
    <ul class="patches">\n${patches}\n</ul>
  </section>
  <form method="post" action="/garden/plant" class="card compose" id="plant">
    <h2>Plant something in your patch</h2>
    ${picker("item", "What would you like to grow?", PLANTS, plantSvg)}
    ${replaces ? `<p class="small">This replaces your ${esc(replaces.label)}.</p>` : ""}
    <button>${emoji("plant")} Plant it</button>
  </form>
  ${slot("dog", laddooCard("garden", v))}`, did);
}

/* ---------- movies ---------- */

export const MAX_TITLE = 80;

// Movie night in each friend's own time, and whether that's in her sleep.
function nightCard(v: Visit): string {
  const night = movieNight(v.things, v.now);
  if (!night) return `<section class="card night" aria-labelledby="night-heading" data-live="night"><h2 id="night-heading">Movie night</h2><p class="empty">No movie night planned yet.</p></section>`;
  const rows = PEOPLE.map((p) => {
    const c = clock(p.tz, night.at);
    const you = p.id === v.me.id;
    const late = asleep(p, c) ? (you ? " You're usually asleep then." : " She's usually asleep then.") : "";
    return `<li data-person="${esc(p.id)}" style="--accent:${p.color}"><span class="name">${you ? "You" : esc(p.name)}</span> <span>${esc(dayLabel(p.tz, night.at))}, <span class="clock">${esc(c.label)}</span> in ${esc(p.city)}.${esc(late)}</span></li>`;
  }).join("\n");
  const pick = night.movie.thing.author === MOVIE_LOVER ? ` <span class="pick">${esc(nameOf(MOVIE_LOVER))}'s pick</span>` : "";
  return `<section class="card night" aria-labelledby="night-heading" data-live="night">
    <h2 id="night-heading">Movie night: “${esc(night.movie.title)}”${pick}</h2>
    <p class="small">Planned by ${esc(by(night.plan, v))}, ${esc(ago(night.plan.createdAt, v.now))}. Here's when it is for each of you:</p>
    <ul class="times">\n${rows}\n</ul>
  </section>`;
}

function movieItem(m: Movie, v: Visit): string {
  const seen = m.watched.includes(v.me.id);
  const who = m.watched.map((id) => (id === v.me.id ? "you" : nameOf(id)));
  const pick = m.thing.author === MOVIE_LOVER ? `<span class="pick">${esc(nameOf(MOVIE_LOVER))}'s pick</span>` : "";
  const cls = ["movie", isNew(m.thing, v) ? "new" : ""].filter(Boolean).join(" ");
  return `<li class="${cls}" data-id="${m.thing.id}">${isNew(m.thing, v) ? `<span class="tag">new</span>` : ""}
    <p class="title">${esc(m.title)} ${pick}</p>
    ${m.why ? `<p class="body hand">${esc(m.why)}</p>` : ""}
    <p class="by">Suggested by ${esc(by(m.thing, v))}, ${esc(ago(m.thing.createdAt, v.now))}</p>
    <p class="watched">${who.length ? `Watched by ${esc(names(who))}.` : "Nobody's watched it yet."}</p>
    ${seen ? "" : `<form method="post" action="/movies/watched" class="inline"><button class="soft" name="movie" value="${m.thing.id}">${emoji("watched")} I've watched it</button></form>`}
  </li>`;
}

export function moviesPage(v: Visit, did?: Done): string {
  const list = movies(v.things);
  const choices = list.map((m) => `<option value="${m.thing.id}">${esc(m.title)}</option>`).join("");
  const plan = list.length ? `
  <form method="post" action="/movies/night" class="card compose">
    <h2>Plan a movie night</h2>
    <label for="night-movie">Which movie?</label>
    <select id="night-movie" name="movie" required>${choices}</select>
    <label for="night-when">When, in your own time (${esc(v.me.city)})</label>
    <input id="night-when" type="datetime-local" name="when" required min="${localInput(v.me.tz, v.now)}">
    <p class="small">Everyone sees it in her own time. A new plan replaces the old one.</p>
    <button>${emoji("night")} Plan it</button>
  </form>` : "";

  return shell("Movies · Five Windows", `
${bar(v, "movies")}
<main class="list movies">
  <header class="room-head" style="--accent:${personById(MOVIE_LOVER)?.color ?? "#8e7cc3"}">
    <h1>Movie time</h1>
    <p class="local">${esc(nameOf(MOVIE_LOVER))} loves movies. Suggest one for everyone, say when you've watched one, or plan a movie night on the living room sofas.</p>
  </header>
  ${done(did)}
  ${nightCard(v)}
  <form method="post" action="/movies" class="card compose">
    <h2>Suggest a movie</h2>
    <label for="movie-title">The movie</label>
    <input id="movie-title" name="title" maxlength="${MAX_TITLE}" required placeholder="96, Kumbalangi Nights, Before Sunrise…">
    <label for="movie-why">Why, if you like</label>
    <textarea id="movie-why" name="why" rows="2" maxlength="${MAX_DISH_NOTE}" placeholder="for a crying-on-the-sofa kind of night"></textarea>
    <button>${emoji("movie")} Suggest it</button>
  </form>
  <section class="card" aria-labelledby="list-heading" data-live="movies">
    <h2 id="list-heading">Suggestions</h2>
    ${list.length ? `<ul class="movie-list">\n${list.map((m) => movieItem(m, v)).join("\n")}\n</ul>` : `<p class="empty">Nothing yet. ${esc(nameOf(MOVIE_LOVER))} will have opinions.</p>`}
  </section>
  ${plan}
</main>`, phase(clock(v.me.tz, v.now)), "page-list");
}

/* ---------- plain pages ---------- */

export function readmePage(html: string): string {
  return shell("About Five Windows", `
<main class="plain">
  <nav class="crumbs"><a href="/">‹ Back to the house</a></nav>
  <article class="paper readme">
${html}
  </article>
</main>`, "day", "page-plain");
}

export function messagePage(title: string, text: string, href = "/"): string {
  return shell(title, `
<main class="plain">
  <article class="paper message">
    <h1>${esc(title)}</h1>
    <p>${esc(text)}</p>
    <p><a href="${esc(href)}">Go back</a></p>
  </article>
</main>`, "day", "page-plain");
}
