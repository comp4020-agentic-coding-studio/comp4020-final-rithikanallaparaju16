import {
  avatar,
  bedroomSvg,
  floorPlan,
  gardenSvg,
  iconSvg,
  kitchenSvg,
  livingSvg,
  patchesSvg,
  plantSvg,
  type BedroomScene,
  type GardenScene,
  type HouseScene,
  type Spot,
} from "./art.ts";
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
  stage,
  thirsty,
  wall,
  type Item,
} from "./house.ts";
import { esc } from "./html.ts";
import { PEOPLE, personById, type Person } from "./people.ts";
import type { Thing } from "./store.ts";
import { ago, asleep, clock, hello, phase, type Phase } from "./time.ts";

export { esc };

export const MAX_NOTE = 500;
export const MAX_DISH_NOTE = 200;

export type Visit = { me: Person; things: Thing[]; seen: Map<string, number>; seenUntil: number; now: number };

const HOME_NOW = 10 * 60 * 1000;

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

const ownerOf = (place: string): Person | undefined => personById(place.replace(/^room:/, ""));

function shell(title: string, body: string, light: Phase = "day"): string {
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600&display=swap">
<link rel="stylesheet" href="/style.css">
</head>
<body class="light-${light}">
${body}
</body>
</html>`;
}

const footer = (me: Person): string => `
<footer>
  <form method="post" action="/leave"><button class="link">Not ${esc(me.name)}?</button></form>
  <span aria-hidden="true">·</span>
  <a href="/readme/">About this place</a>
</footer>`;

const back = `<nav class="crumbs"><a href="/">Back to the house</a></nav>`;

const done = (text: string | undefined): string => (text ? `<p class="done" role="status">${esc(text)}</p>` : "");

/* ---------- scenes for the drawings ---------- */

function spots(left: Thing[]): Spot[] {
  const out: Spot[] = [];
  for (const t of left) {
    if (t.body) out.push({ key: "note", color: personById(t.author)?.color });
    if (t.item) out.push({ key: t.item });
  }
  return out;
}

function bedroomScene(owner: Person, v: Visit): BedroomScene {
  const c = clock(owner.tz, v.now);
  const d = dog(v.things, v.now);
  const home = homeNow(owner, v);
  return {
    owner,
    phase: phase(c),
    clock: c.label,
    // Whoever is in the house right now is up, whatever their usual hours.
    asleep: asleep(owner, c) && !home,
    here: home,
    mess: mess(v.things, owner.id, v.now),
    desk: spots(desk(v.things, owner.id)),
    dog: d.with === owner.id ? { awake: d.awake } : null,
  };
}

function gardenScene(v: Visit, light: Phase): GardenScene {
  const planted = plants(v.things);
  const d = dog(v.things, v.now);
  return {
    phase: light,
    plots: PEOPLE.map((owner) => {
      const p = planted.get(owner.id);
      return { owner, plant: p?.item, stage: p ? stage(p, v.now) : 0 };
    }),
    thirsty: thirsty(v.things, v.now),
    dog: d.with ? null : { awake: d.awake },
  };
}

function houseScene(v: Visit): HouseScene {
  const light = phase(clock(v.me.tz, v.now));
  const notes = wall(v.things);
  return {
    phase: light,
    bedrooms: PEOPLE.map((p) => bedroomScene(p, v)),
    living: {
      phase: light,
      notes: notes.map((t) => personById(t.author)?.paper ?? "#fff3b0"),
      big: notes.some((t) => t.item === "big"),
    },
    kitchen: { phase: light, dishes: counter(v.things, v.now).map((t) => t.item) },
    garden: gardenScene(v, light),
  };
}

/* ---------- the door ---------- */

export function doorPage(seen: Map<string, number>, now: number): string {
  const people = PEOPLE.map((p) => {
    const c = clock(p.tz, now);
    const last = seen.get(p.id);
    const recent = last !== undefined && now - last < HOME_NOW;
    const sleeping = asleep(p, c) && !recent;
    const when = last === undefined ? "hasn't been home yet" : recent ? "home now" : `home ${ago(last, now)}`;
    return `<li><button class="person" name="who" value="${esc(p.id)}" style="--accent:${p.color}">
      <span class="pane light-${phase(c)}">${avatar(p, sleeping)}</span>
      <span class="name">${nameHtml(p)}</span>
      <span class="where">${esc(p.city)}</span>
      <span class="where"><span class="clock" data-tz="${esc(p.tz)}">${esc(c.label)}</span>${sleeping ? ", asleep" : ""}</span>
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
</main>`, "dusk");
}

/* ---------- the house ---------- */

type Happening = { text: string; href: string; forYou: boolean };

function happening(t: Thing, me: Person): Happening | undefined {
  const by = nameOf(t.author);
  switch (t.kind) {
    case "note":
      return { text: t.item === "big" ? `${by} pinned big news on the wall` : `${by} wrote on the wall`, href: "/living", forYou: false };
    case "desk": {
      const owner = ownerOf(t.place);
      if (!owner) return undefined;
      const href = `/room/${owner.id}`;
      if (owner.id !== me.id) return { text: `${by} left something on ${owner.name}'s desk`, href, forYou: false };
      const gift = find(GIFTS, t.item)?.label;
      const what = t.body && gift ? `a note and ${gift}` : t.body ? "a note" : (gift ?? "something");
      return { text: `${by} left ${what} on your desk`, href, forYou: true };
    }
    case "tidy": {
      const owner = ownerOf(t.place);
      if (!owner) return undefined;
      const href = `/room/${owner.id}`;
      if (owner.id === me.id) return { text: `${by} tidied your room`, href, forYou: true };
      if (owner.id === t.author) return { text: `${by} tidied up her own room`, href, forYou: false };
      return { text: `${by} tidied ${owner.name}'s room`, href, forYou: false };
    }
    case "dish":
      return { text: `${by} made ${find(FOOD, t.item)?.short ?? "something"} for everyone`, href: "/kitchen", forYou: false };
    case "water":
      return { text: `${by} watered the garden`, href: "/garden", forYou: false };
    case "plant":
      return { text: `${by} planted ${find(PLANTS, t.item)?.label ?? "something"} in the garden`, href: "/garden", forYou: false };
    case "play":
      return { text: `${by} played with ${DOG}`, href: "/garden", forYou: false };
  }
}

const AROUND_LIMIT = 10;

function away(v: Visit): string {
  const firstVisit = v.seenUntil === 0;
  const seenText = new Set<string>();
  const list: Happening[] = [];
  for (const t of v.things) {
    if (!isNew(t, v)) continue;
    const h = happening(t, v.me);
    if (!h || seenText.has(h.text)) continue;
    seenText.add(h.text);
    list.push(h);
  }
  const forYou = list.filter((h) => h.forYou);
  const around = list.filter((h) => !h.forYou);

  const authors = new Set(v.things.filter((t) => isNew(t, v)).map((t) => t.author));
  const visitors = PEOPLE.filter((p) => p.id !== v.me.id && ((v.seen.get(p.id) ?? 0) > v.seenUntil || authors.has(p.id))).map((p) => p.name);
  const intro = firstVisit
    ? "Welcome home. Your room has your name outside the door; everyone else's is just down the hall."
    : visitors.length
      ? `${names(visitors)} came by while you were away.`
      : "Nobody's been by since you were last here. The house kept your place.";

  const item = (h: Happening, cls: string): string => `<li class="${cls}"><a href="${esc(h.href)}">${esc(h.text)}</a></li>`;
  const items = [
    ...forYou.map((h) => item(h, "for-you")),
    ...around.slice(0, AROUND_LIMIT).map((h) => item(h, "around")),
  ];
  const more = around.length > AROUND_LIMIT ? `<p class="more">There's more around the house if you wander.</p>` : "";

  return `<section class="away" aria-labelledby="away-heading">
    <h2 id="away-heading">${firstVisit ? "Make yourself at home" : "While you were away"}</h2>
    <p>${esc(intro)}</p>
    ${items.length ? `<ul class="happenings">\n${items.join("\n")}\n</ul>${more}` : ""}
  </section>`;
}

function clocks(v: Visit): string {
  const rows = PEOPLE.map((p) => {
    const c = clock(p.tz, v.now);
    const home = homeNow(p, v);
    const sleeping = asleep(p, c) && !home;
    const last = v.seen.get(p.id);
    const status =
      p.id === v.me.id ? "you're here"
      : home ? "home now"
      : sleeping ? "asleep"
      : last === undefined ? "hasn't been home yet"
      : `home ${ago(last, v.now)}`;
    return `<li style="--accent:${p.color}"><a href="/room/${esc(p.id)}">
      <span class="pane light-${phase(c)}">${avatar(p, sleeping)}</span>
      <span class="who"><span class="name">${nameHtml(p)}</span><span class="where">${esc(c.weekday)}, <span class="clock" data-tz="${esc(p.tz)}">${esc(c.label)}</span> in ${esc(p.city)}</span><span class="status">${esc(status)}</span></span>
    </a></li>`;
  }).join("\n");
  return `<section class="clocks" aria-labelledby="clocks-heading">
    <h2 id="clocks-heading">Everyone's rooms, right now</h2>
    <ul>\n${rows}\n</ul>
  </section>`;
}

export function housePage(v: Visit): string {
  const c = clock(v.me.tz, v.now);
  return shell("Five Windows", `
<main class="home">
  <header class="top">
    <h1>Five Windows</h1>
    <p class="greeting">${esc(`${hello(c)}, ${v.me.name}. It's ${c.weekday}, ${c.label} in ${v.me.city}.`)}</p>
  </header>
  <div class="home-grid">
    <section class="plan" aria-label="The house">
      ${floorPlan(houseScene(v))}
      <p class="plan-hint">Tap a room to go in.</p>
    </section>
    <div class="side">
      ${away(v)}
      ${clocks(v)}
    </div>
  </div>
  ${footer(v.me)}
</main>`, phase(c));
}

/* ---------- shared bits of room pages ---------- */

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

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function bedroomPage(owner: Person, v: Visit, did?: string): string {
  const mine = owner.id === v.me.id;
  const scene = bedroomScene(owner, v);
  const c = clock(owner.tz, v.now);
  const state = mine
    ? "You're home."
    : scene.asleep ? `${owner.name} is fast asleep.`
    : scene.here ? `${owner.name} is home right now.`
    : `${owner.name} is awake somewhere in ${owner.city}.`;
  const line = `It's ${esc(c.weekday)}, <span class="clock" data-tz="${esc(owner.tz)}">${esc(c.label)}</span> in ${esc(owner.city)}. ${esc(state)}`;

  const tidied = latest(v.things, "tidy", `room:${owner.id}`);
  const messLine = ["It's tidy in here.", "It's a little lived-in.", "It's getting messy in here."][scene.mess];
  const tidyLine = tidied ? `Last tidied by ${by(tidied, v)}, ${ago(tidied.createdAt, v.now)}.` : "Nobody has tidied up in here yet.";
  const dogLine = scene.dog ? (scene.dog.awake ? `${DOG} is here, wide awake.` : `${DOG} is napping at the foot of the bed.`) : "";

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

  return shell(mine ? "Your room" : `${owner.name}'s room`, `
<main class="room">
  ${back}
  ${roomHead(mine ? "Your room" : `${owner.name}'s room`, line, owner.about, owner.color)}
  ${done(did)}
  <figure class="scene">${bedroomSvg(scene)}</figure>
  <p class="status">${esc(messLine)} ${esc(tidyLine)} ${esc(dogLine)}</p>
  <form method="post" action="/room/${esc(owner.id)}/tidy" class="inline"><button class="soft">${mine ? "Tidy your room" : `Tidy up ${esc(owner.name)}'s room`}</button></form>
  <section class="card" aria-labelledby="desk-heading">
    <h2 id="desk-heading">${mine ? "On your desk" : `On ${esc(owner.name)}'s desk`}</h2>
    ${left.length ? `<ul class="desk-list">\n${shown}\n</ul>${drawer}` : `<p class="empty">${mine ? "Nothing yet. When a friend leaves you something, it'll be here." : "Nothing yet."}</p>`}
  </section>
  ${leaveForm}
  ${footer(v.me)}
</main>`, scene.phase);
}

/* ---------- the living room ---------- */

const WALL_SHOWN = 24;

function wallNote(t: Thing, v: Visit): string {
  const cls = ["note", t.item === "big" ? "big" : "", isNew(t, v) ? "new" : "", t.author === v.me.id ? "mine" : ""].filter(Boolean).join(" ");
  const paper = personById(t.author)?.paper ?? "#fff8e6";
  return `<li class="${cls}" style="--paper:${paper}">${isNew(t, v) ? `<span class="tag">new</span>` : ""}<p class="body hand">${esc(t.body)}</p><p class="by">${esc(by(t, v))}, ${esc(ago(t.createdAt, v.now))}</p></li>`;
}

export function livingPage(v: Visit, did?: string): string {
  const light = phase(clock(v.me.tz, v.now));
  const notes = wall(v.things);
  const big = notes.filter((t) => t.item === "big");
  const everyday = notes.filter((t) => t.item !== "big");
  const scene = houseScene(v).living;

  return shell("The living room", `
<main class="room">
  ${back}
  ${roomHead("The living room", "Everyone's room. The wall is for all five of you: something funny from today, a good-luck wish, big news.", undefined, "#8a5a3c")}
  ${done(did)}
  <figure class="scene">${livingSvg(scene)}</figure>
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
  </section>
  ${footer(v.me)}
</main>`, light);
}

/* ---------- the kitchen ---------- */

export function kitchenPage(v: Visit, did?: string): string {
  const light = phase(clock(v.me.tz, v.now));
  const dishes = counter(v.things, v.now);
  const list = dishes.map((t) => {
    const dish = find(FOOD, t.item);
    const cls = ["dish", isNew(t, v) ? "new" : "", t.author === v.me.id ? "mine" : ""].filter(Boolean).join(" ");
    return `<li class="${cls}">${isNew(t, v) ? `<span class="tag">new</span>` : ""}<span class="icons">${iconSvg(t.item)}</span><div><p class="body">${esc(`${cap(by(t, v))} made ${dish?.short ?? "something"}`)}</p>${t.body ? `<p class="body hand">${esc(t.body)}</p>` : ""}<p class="by">${esc(ago(t.createdAt, v.now))}</p></div></li>`;
  }).join("\n");

  return shell("The kitchen", `
<main class="room">
  ${back}
  ${roomHead("The kitchen", "Cook something and leave it out for everyone. Food stays on the counter for three days.", undefined, "#c4553c")}
  ${done(did)}
  <figure class="scene">${kitchenSvg(houseScene(v).kitchen)}</figure>
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
  </form>
  ${footer(v.me)}
</main>`, light);
}

/* ---------- the garden ---------- */

const STAGES = ["", "just sprouted", "growing", "in bloom"];

export function gardenPage(v: Visit, did?: string): string {
  const light = phase(clock(v.me.tz, v.now));
  const scene = gardenScene(v, light);
  const watered = latest(v.things, "water");
  const planted = plants(v.things);
  const d = dog(v.things, v.now);

  const waterLine = `${scene.thirsty ? "The plants look a bit thirsty." : "The plants look happy."} ${watered ? `Last watered by ${by(watered, v)}, ${ago(watered.createdAt, v.now)}.` : "Nobody has watered the garden yet."}`;
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
    : d.awake ? `${DOG} is by his kennel, tail going.` : `${DOG} is napping in his kennel.`;
  const playedLine = d.last ? ` Last played with by ${by(d.last, v)}, ${ago(d.last.createdAt, v.now)}.` : "";

  return shell("The garden", `
<main class="room">
  ${back}
  ${roomHead("The garden", "Everyone has a patch. Anyone can water the lot, and the plants grow whether or not you're here.", undefined, "#4f8f3e")}
  ${done(did)}
  <figure class="scene wide">${gardenSvg(scene)}</figure>
  <p class="status">${esc(waterLine)}</p>
  <form method="post" action="/garden/water" class="inline"><button class="soft">Water the garden</button></form>
  <section class="card" aria-labelledby="patches-heading">
    <h2 id="patches-heading">The patches</h2>
    <figure class="scene close">${patchesSvg(scene)}</figure>
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
  </section>
  ${footer(v.me)}
</main>`, light);
}

/* ---------- plain pages ---------- */

export function readmePage(html: string): string {
  return shell("About Five Windows", `
<main class="room">
  ${back}
  <article class="paper readme">
${html}
  </article>
</main>`);
}

export function messagePage(title: string, text: string, href = "/"): string {
  return shell(title, `
<main class="room">
  <article class="paper message">
    <h1>${esc(title)}</h1>
    <p>${esc(text)}</p>
    <p><a href="${esc(href)}">Go back</a></p>
  </article>
</main>`);
}
