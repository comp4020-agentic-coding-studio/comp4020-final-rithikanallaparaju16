import { iconSvg, patchesSvg, plantSvg } from "./art.ts";
import {
  counter,
  desk,
  dog,
  DOG,
  find,
  FOOD,
  GIFTS,
  latest,
  mess,
  PLANTS,
  plants,
  roomPlace,
  stage,
  thirsty,
  wall,
  type Item,
} from "./house.ts";
import { esc } from "./html.ts";
import { PEOPLE, personById, type Person } from "./people.ts";
import { houseSvg, isPlace, type Scene, type Spot } from "./scene.ts";
import type { Thing } from "./store.ts";
import { ago, asleep, clock, hello, phase, type Phase } from "./time.ts";

export { esc };

export const MAX_NOTE = 500;
export const MAX_DISH_NOTE = 200;

// `where` is the place each friend was on their last page load.
export type Visit = {
  me: Person;
  things: Thing[];
  seen: Map<string, number>;
  where: Map<string, string>;
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

// Friends who are home now are wherever they last went; everyone else is in
// their own room, living on their own clock.
function placeOf(p: Person, v: Visit): string {
  const own = roomPlace(p.id);
  if (!homeNow(p, v)) return own;
  const at = v.where.get(p.id);
  return at && isPlace(at) ? at : own;
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
<script src="/house.js" defer></script>
</head>
<body class="light-${light} ${kind}">
${body}
</body>
</html>`;
}

type Tab = "home" | "updates" | "everyone";

const TAB_ICON: Record<Tab, string> = {
  home: `<path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>`,
  updates: `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>`,
  everyone: `<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="9" r="3"/><path d="M2.5 19.5c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5m-1.9-2.6c.9-1.3 2.2-1.9 3.9-1.9 2.5 0 4.7 1.5 5.5 4.5"/>`,
};

function tabs(current: Tab, v: Visit): string {
  const somethingNew = v.things.some((t) => isNew(t, v));
  const tab = (key: Tab, href: string, label: string): string =>
    `<a href="${href}"${key === current ? ` aria-current="page"` : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICON[key]}</svg><span>${label}</span>${key === "updates" && somethingNew ? `<span class="dot" title="Something new since you were last here"></span>` : ""}</a>`;
  return `<nav class="tabs" aria-label="Around the house">${tab("home", "/", "Home")}${tab("updates", "/updates", "Updates")}${tab("everyone", "/everyone", "Everyone")}</nav>`;
}

function bar(v: Visit, current: Tab): string {
  const c = clock(v.me.tz, v.now);
  return `<header class="bar">
  <a class="brand" href="/">Five Windows</a>
  <p class="greeting">${esc(`${hello(c)}, ${v.me.name}.`)} <span class="when">It's ${esc(c.weekday)}, <span class="clock" data-tz="${esc(v.me.tz)}">${esc(c.label)}</span> in ${esc(v.me.city)}.</span></p>
  ${tabs(current, v)}
</header>`;
}

const footer = (me: Person): string => `
<footer class="foot">
  <form method="post" action="/leave"><button class="link">Not ${esc(me.name)}?</button></form>
  <span aria-hidden="true">·</span>
  <a href="/readme/">About this place</a>
</footer>`;

const done = (text: string | undefined): string => (text ? `<p class="done" role="status">${esc(text)}</p>` : "");

const pane = (p: Person, light: Phase, asleepNow: boolean): string =>
  `<span class="pane light-${light}${asleepNow ? " asleep" : ""}"><img src="/art/avatar-${esc(p.id)}.png" alt="" width="180" height="242"></span>`;

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
    else if (t.kind === "dish") out.add("kitchen");
    else if (t.kind === "water" || t.kind === "plant" || t.kind === "play") out.add("garden");
    else if (t.place === roomPlace(v.me.id)) out.add(t.place);
  }
  return out;
}

function scene(v: Visit, focus?: string): Scene {
  const d = dog(v.things, v.now);
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
      };
    }),
    figures: PEOPLE.map((p) => ({
      person: p,
      place: placeOf(p, v),
      asleep: sleeping(p, v),
      here: homeNow(p, v),
      me: p.id === v.me.id,
    })),
    dishes: counter(v.things, v.now).map((t) => ({ key: t.item, fresh: isNew(t, v) })),
    dog: { place: d.with ? roomPlace(d.with) : "garden", awake: d.awake },
    fresh: freshPlaces(v),
    focus,
  };
}

/* ---------- the door ---------- */

export function doorPage(seen: Map<string, number>, now: number): string {
  const people = PEOPLE.map((p) => {
    const c = clock(p.tz, now);
    const last = seen.get(p.id);
    const recent = last !== undefined && now - last < HOME_NOW;
    const zz = asleep(p, c) && !recent;
    const when = last === undefined ? "hasn't been home yet" : recent ? "home now" : `home ${ago(last, now)}`;
    return `<li><button class="person" name="who" value="${esc(p.id)}" style="--accent:${p.color}">
      ${pane(p, phase(c), zz)}
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
    <ul class="people">
${people}
    </ul>
  </form>
  <p class="hint">Each window shows the sky where that friend is right now. <a href="/readme/">What is this place?</a></p>
</main>`, "dusk", "page-door");
}

/* ---------- what's happened ---------- */

type Happening = { text: string; href: string; forYou: boolean; at: number };

function happening(t: Thing, me: Person): Happening | undefined {
  const mine = t.author === me.id;
  const by = mine ? "You" : nameOf(t.author);
  const at = t.createdAt;
  switch (t.kind) {
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
    case "water":
      return { text: `${by} watered the garden`, href: "/garden", forYou: false, at };
    case "plant":
      return { text: `${by} planted ${find(PLANTS, t.item)?.label ?? "something"} in the garden`, href: "/garden", forYou: false, at };
    case "play":
      return { text: `${by} played with ${DOG}`, href: "/garden", forYou: false, at };
  }
}

// Each line once, newest first, what was left for you before the rest.
function happenings(list: Thing[], me: Person): Happening[] {
  const seenText = new Set<string>();
  const out: Happening[] = [];
  for (const t of list) {
    const h = happening(t, me);
    if (!h || seenText.has(h.text)) continue;
    seenText.add(h.text);
    out.push(h);
  }
  return [...out.filter((h) => h.forYou), ...out.filter((h) => !h.forYou)];
}

const newSince = (v: Visit): Happening[] => happenings(v.things.filter((t) => isNew(t, v)), v.me);

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

  return `<section class="away" aria-labelledby="away-heading">
    <h2 id="away-heading">${firstVisit ? "Make yourself at home" : "While you were away"}</h2>
    <p>${esc(intro)}</p>
    ${list.length ? `<ul class="happenings">\n${list.slice(0, limit).map((h) => happeningItem(h, v)).join("\n")}\n</ul>${more}` : ""}
  </section>`;
}

// What happened before your last visit, so Updates is never empty.
function earlier(v: Visit): string {
  const list = happenings(v.things.filter((t) => !isNew(t, v)), v.me).sort((a, b) => b.at - a.at).slice(0, 10);
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
  return `<a class="news" href="/updates"><svg viewBox="-11 -11 22 22" aria-hidden="true"><path d="M0 -10L2.6 -2.6L10 0L2.6 2.6L0 10L-2.6 2.6L-10 0L-2.6 -2.6Z"/></svg><span>${esc(text)}</span></a>`;
}

/* ---------- everyone ---------- */

function status(p: Person, v: Visit): string {
  const at = placeOf(p, v);
  if (p.id === v.me.id) return `you're here, ${placeName(at, v.me)}`;
  if (homeNow(p, v)) return `home now, ${at === roomPlace(p.id) ? "in her room" : placeName(at, v.me)}`;
  if (sleeping(p, v)) return "asleep";
  const last = v.seen.get(p.id);
  return last === undefined ? "hasn't been home yet" : `home ${ago(last, v.now)}`;
}

function everyone(v: Visit, full: boolean): string {
  const rows = PEOPLE.map((p) => {
    const c = clock(p.tz, v.now);
    return `<li style="--accent:${p.color}"><a href="/room/${esc(p.id)}">
      ${pane(p, phase(c), sleeping(p, v))}
      <span class="who"><span class="name">${nameHtml(p)}</span><span class="where">${esc(c.weekday)}, <span class="clock" data-tz="${esc(p.tz)}">${esc(c.label)}</span> in ${esc(p.city)}</span><span class="status">${esc(status(p, v))}</span>${full ? `<span class="about">${esc(p.about)}</span>` : ""}</span>
    </a></li>`;
  }).join("\n");
  return `<section class="clocks${full ? " full" : ""}" aria-labelledby="clocks-heading">
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
  ${earlier(v)}
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

function roomPage(v: Visit, place: string, title: string, side: string): string {
  return shell(`${title} · Five Windows`, `
${bar(v, "home")}
<main class="room">
  <div class="room-grid">
    <section class="map zoom" aria-label="${esc(title)}">${houseSvg(scene(v, place))}</section>
    <div class="room-side">
      <a class="back" href="/">‹ The whole house</a>
      ${side}
    </div>
  </div>
</main>`, phase(clock(v.me.tz, v.now)), "page-room");
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

export function bedroomPage(owner: Person, v: Visit, did?: string): string {
  const mine = owner.id === v.me.id;
  const c = clock(owner.tz, v.now);
  const state = mine
    ? "You're home."
    : sleeping(owner, v) ? `${owner.name} is fast asleep.`
    : homeNow(owner, v) ? `${owner.name} is home right now, ${placeName(placeOf(owner, v), v.me)}.`
    : `${owner.name} is awake somewhere in ${owner.city}.`;
  const line = `It's ${esc(c.weekday)}, <span class="clock" data-tz="${esc(owner.tz)}">${esc(c.label)}</span> in ${esc(owner.city)}. ${esc(state)}`;

  const level = mess(v.things, owner.id, v.now);
  const tidied = latest(v.things, "tidy", roomPlace(owner.id));
  const messLine = ["It's tidy in here.", "It's a little lived-in.", "It's getting messy in here."][level];
  const tidyLine = tidied ? `Last tidied by ${by(tidied, v)}, ${ago(tidied.createdAt, v.now)}.` : "Nobody has tidied up in here yet.";
  const d = dog(v.things, v.now);
  const dogLine = d.with === owner.id ? (d.awake ? `${DOG} is here, wide awake.` : `${DOG} is napping in here.`) : "";

  const left = desk(v.things, owner.id);
  const shown = left.slice(0, DESK_SHOWN).map((t) => deskThing(t, owner, v)).join("\n");
  const drawer = left.length > DESK_SHOWN
    ? `<details class="drawer"><summary>Older things, kept in the drawer</summary><ul class="desk-list">${left.slice(DESK_SHOWN).map((t) => deskThing(t, owner, v)).join("\n")}</ul></details>`
    : "";

  const leaveForm = mine ? "" : `
  <form method="post" action="/room/${esc(owner.id)}/leave" class="card compose">
    <h2>Leave something for ${esc(owner.name)}</h2>
    <label for="body">A note, if you like</label>
    <textarea id="body" name="body" rows="3" maxlength="${MAX_NOTE}" placeholder="good luck today, I saw this and thought of you…"></textarea>
    ${picker("item", "And something with it", GIFTS, iconSvg, "Just the note")}
    <p class="small">Only ${esc(owner.name)} can read the note. Anyone who walks in can see something's been left.</p>
    <button>Leave it on ${esc(owner.name)}'s desk</button>
  </form>`;

  const title = mine ? "Your room" : `${owner.name}'s room`;
  return roomPage(v, roomPlace(owner.id), title, `
  ${roomHead(title, line, owner.about, owner.color)}
  ${done(did)}
  <p class="status">${esc(messLine)} ${esc(tidyLine)} ${esc(dogLine)}</p>
  <form method="post" action="/room/${esc(owner.id)}/tidy" class="inline"><button class="soft">${mine ? "Tidy your room" : `Tidy up ${esc(owner.name)}'s room`}</button></form>
  <section class="card" aria-labelledby="desk-heading">
    <h2 id="desk-heading">${mine ? "On your desk" : `On ${esc(owner.name)}'s desk`}</h2>
    ${left.length ? `<ul class="desk-list">\n${shown}\n</ul>${drawer}` : `<p class="empty">${mine ? "Nothing yet. When a friend leaves you something, it'll be here." : "Nothing yet."}</p>`}
  </section>
  ${leaveForm}`);
}

/* ---------- the living room ---------- */

const WALL_SHOWN = 24;

function wallNote(t: Thing, v: Visit): string {
  const cls = ["note", t.item === "big" ? "big" : "", isNew(t, v) ? "new" : "", t.author === v.me.id ? "mine" : ""].filter(Boolean).join(" ");
  const paper = personById(t.author)?.paper ?? "#fff8e6";
  return `<li class="${cls}" style="--paper:${paper}">${isNew(t, v) ? `<span class="tag">new</span>` : ""}<p class="body hand">${esc(t.body)}</p><p class="by">${esc(by(t, v))}, ${esc(ago(t.createdAt, v.now))}</p></li>`;
}

export function livingPage(v: Visit, did?: string): string {
  const notes = wall(v.things);
  const big = notes.filter((t) => t.item === "big");
  const everyday = notes.filter((t) => t.item !== "big");

  return roomPage(v, "living", "The living room", `
  ${roomHead("The living room", "Everyone's room. The wall is for all five of you: something funny from today, a good-luck wish, big news.", undefined, "#8a5a3c")}
  ${done(did)}
  <form method="post" action="/wall" class="card compose">
    <label for="body">Write on the wall</label>
    <textarea id="body" name="body" rows="3" maxlength="${MAX_NOTE}" required placeholder="the funniest thing happened today…"></textarea>
    <label class="check"><input type="checkbox" name="big" value="1"> This is big news. Keep it pinned at the top.</label>
    <button>Pin it to the wall</button>
  </form>
  <section class="wall" aria-labelledby="wall-heading">
    <h2 id="wall-heading">The wall</h2>
    ${big.length ? `<h3 class="pinned">Big news</h3><ul class="notes">\n${big.map((t) => wallNote(t, v)).join("\n")}\n</ul>` : ""}
    ${everyday.length ? `<ul class="notes">\n${everyday.slice(0, WALL_SHOWN).map((t) => wallNote(t, v)).join("\n")}\n</ul>` : big.length ? "" : `<p class="empty">The wall is bare. Be the first to pin something up.</p>`}
    ${everyday.length > WALL_SHOWN ? `<details class="drawer"><summary>The memory box: older notes, taken down but kept</summary><ul class="notes">${everyday.slice(WALL_SHOWN).map((t) => wallNote(t, v)).join("\n")}</ul></details>` : ""}
  </section>`);
}

/* ---------- the kitchen ---------- */

export function kitchenPage(v: Visit, did?: string): string {
  const dishes = counter(v.things, v.now);
  const list = dishes.map((t) => {
    const dish = find(FOOD, t.item);
    const cls = ["dish", isNew(t, v) ? "new" : "", t.author === v.me.id ? "mine" : ""].filter(Boolean).join(" ");
    return `<li class="${cls}">${isNew(t, v) ? `<span class="tag">new</span>` : ""}<span class="icons">${iconSvg(t.item)}</span><div><p class="body">${esc(`${cap(by(t, v))} made ${dish?.short ?? "something"}`)}</p>${t.body ? `<p class="body hand">${esc(t.body)}</p>` : ""}<p class="by">${esc(ago(t.createdAt, v.now))}</p></div></li>`;
  }).join("\n");

  return roomPage(v, "kitchen", "The kitchen", `
  ${roomHead("The kitchen", "Cook something and leave it out for everyone. Food stays on the counter for three days.", undefined, "#c4553c")}
  ${done(did)}
  <section class="card" aria-labelledby="counter-heading">
    <h2 id="counter-heading">On the counter</h2>
    ${dishes.length ? `<ul class="desk-list">\n${list}\n</ul>` : `<p class="empty">The counter's clean. Nobody has cooked in the last few days.</p>`}
  </section>
  <form method="post" action="/kitchen" class="card compose">
    <h2>Cook something</h2>
    ${picker("item", "What are you making?", FOOD, iconSvg)}
    <label for="body">A note to go with it, if you like</label>
    <textarea id="body" name="body" rows="2" maxlength="${MAX_DISH_NOTE}" placeholder="made too much, help yourselves"></textarea>
    <button>Leave it out for everyone</button>
  </form>`);
}

/* ---------- the garden ---------- */

const STAGES = ["", "just sprouted", "growing", "in bloom"];

export function gardenPage(v: Visit, did?: string): string {
  const dry = thirsty(v.things, v.now);
  const watered = latest(v.things, "water");
  const planted = plants(v.things);
  const d = dog(v.things, v.now);

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

  const dogWith = d.with ? personById(d.with) : undefined;
  const dogLine = dogWith
    ? `${DOG} followed ${dogWith.id === v.me.id ? "you" : dogWith.name} to ${dogWith.id === v.me.id ? "your" : `${dogWith.name}'s`} room.`
    : d.awake ? `${DOG} is on his blanket under the tree, tail going.` : `${DOG} is napping on his blanket under the tree.`;
  const playedLine = d.last ? ` Last played with by ${by(d.last, v)}, ${ago(d.last.createdAt, v.now)}.` : "";

  return roomPage(v, "garden", "The garden", `
  ${roomHead("The garden", "Everyone has a patch. Anyone can water the lot, and the plants grow whether or not you're here.", undefined, "#4f8f3e")}
  ${done(did)}
  <p class="status">${esc(waterLine)}</p>
  <form method="post" action="/garden/water" class="inline"><button class="soft">Water the garden</button></form>
  <section class="card" aria-labelledby="patches-heading">
    <h2 id="patches-heading">The patches</h2>
    <figure class="close">${patchesSvg(plots, dry)}</figure>
    <ul class="patches">\n${patches}\n</ul>
  </section>
  <form method="post" action="/garden/plant" class="card compose">
    <h2>Plant something in your patch</h2>
    ${picker("item", "What would you like to grow?", PLANTS, plantSvg)}
    ${replaces ? `<p class="small">This replaces your ${esc(replaces.label)}.</p>` : ""}
    <button>Plant it</button>
  </form>
  <section class="card" aria-labelledby="dog-heading">
    <h2 id="dog-heading">${DOG}</h2>
    <p>Everyone's dog. ${esc(dogLine + playedLine)}</p>
    <form method="post" action="/garden/dog" class="inline"><button class="soft">Play with ${DOG}</button></form>
  </section>`);
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
