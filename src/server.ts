import { randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { ART, ART_TYPES, isArt } from "./assets.ts";
import { avatarSvg, parseLook } from "./avatars.ts";
import { counter, desk, DOG, find, FOOD, gifts, KETTLE_ROOM, MASK_ROOM, monthClock, movies, pastMonths, photoOf, PLANTS, recapFor, resting, roomPlace, savedFor, seats, STICKERS, wall } from "./house.ts";
import { closeHouses, findHouse, house, inHouse, made, ORIGINAL } from "./houses.ts";
import * as live from "./live.ts";
import { make } from "./maker.ts";
import { markdown } from "./markdown.ts";
import {
  bedroomPage,
  doorPage,
  everyonePage,
  gardenPage,
  housePage,
  hugFrom,
  kitchenPage,
  livingPage,
  manifest,
  widget,
  MAX_DISH_NOTE,
  MAX_NOTE,
  MAX_ABOUT,
  MAX_TITLE,
  messagePage,
  moviesPage,
  readmePage,
  unoPage,
  updatesPage,
  type Done,
  type Visit,
} from "./pages.ts";
import { PEOPLE, personById, type Person } from "./people.ts";
import { avatarUrl } from "./avatars.ts";
import { MAX_PHOTO, readUpload } from "./photos.ts";
import { layout, matWords } from "./layouts.ts";
import { isPlace, placeAt } from "./scene.ts";
import * as store from "./store.ts";
import { birthday, fromLocal } from "./time.ts";
import { cap, their, them } from "./words.ts";
import { dealFor, gameOf, isWild, play, replay, stillIn } from "./uno.ts";

const MAX_FORM = 8 * 1024;
const YEAR = 365 * 24 * 60 * 60;

const README = new URL("../README.md", import.meta.url);
const STYLE = new URL("../public/style.css", import.meta.url);
const SCRIPT = new URL("../public/house.js", import.meta.url);
const LIVE = new URL("../public/live.js", import.meta.url);
const SCRIPTABLE = new URL("../public/widget/scriptable.js", import.meta.url);

store.onChange(live.broadcast);

type Headers = Record<string, string>;

// In a made house (src/houses.ts), every page's own links, forms and scripts
// start with /h/<code>, so nothing written for Rithika's house at `/` needs to
// know there's more than one. The scripts are files of their own, which this
// never sees: they read the base from the page's `data-base` instead.
function rebase(html: string): string {
  const { base } = house();
  if (!base) return html;
  return html.replace(/\b(href|action|src)="\/(?!\/|h\/|art\/|avatar\/|style\.css|make\b)/g, `$1="${base}/`);
}

function send(res: ServerResponse, status: number, body: string | Buffer, type = "text/html; charset=utf-8"): void {
  res.writeHead(status, { "content-type": type });
  res.end(typeof body === "string" && type.startsWith("text/html") ? rebase(body) : body);
}

function redirect(res: ServerResponse, to: string, headers: Headers = {}): void {
  res.writeHead(303, { location: to.startsWith("/") && !to.startsWith("//") ? `${house().base}${to}` : to, ...headers });
  res.end();
}

function cookie(req: IncomingMessage, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

function whoCookie(req: IncomingMessage, value: string, maxAge: number): string {
  // Fly terminates TLS in front of the app, so https only shows up in this header.
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  // Each house has its own who= cookie, so being Neha in one house says
  // nothing about who you are in another.
  return `who=${value}; Path=${house().base || "/"}; Max-Age=${maxAge}; SameSite=Lax; HttpOnly${secure}`;
}

// Who this browser came in as: `who=<id>.<token>`, and only while the token is
// still the one the house has for her (ADR 0011). Anything else, like an old
// `who=<id>` cookie or someone who's since been let in as her elsewhere, is
// back at the door.
type Session = { me: Person; token: string };

function session(req: IncomingMessage): Session | undefined {
  const [id, token] = (cookie(req, "who") ?? "").split(".");
  const me = personById(id);
  return me && token && store.holder(me.id).token === token ? { me, token } : undefined;
}

// Long enough to go from one page to the next with the script off.
const GRACE = 2 * 60 * 1000;

// Someone's in the house as `person`: she has it open right now, or came in
// or loaded a page in the last couple of minutes.
function held(person: string): boolean {
  const h = store.holder(person);
  return h.token !== "" && (live.connected(person, h.token) || Date.now() - h.active < GRACE);
}

const taken = (): Set<string> => new Set(PEOPLE.filter((p) => held(p.id)).map((p) => p.id));

async function readForm(req: IncomingMessage): Promise<URLSearchParams | undefined> {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_FORM) return undefined;
  }
  return new URLSearchParams(raw);
}

const text = (form: URLSearchParams, name: string): string =>
  (form.get(name) ?? "").replace(/\r\n?/g, "\n").trim();

// What a widget sees (ADR 0025): the house as it is, read without coming
// in. It doesn't count as a visit, so "new" means new since her last real
// visit, and it never holds her window.
function look(me: Person): Visit {
  return {
    me,
    things: store.things(),
    seen: store.lastSeen(),
    where: store.whereabouts(),
    arrived: store.arrivals(),
    spots: store.spots(),
    seenUntil: store.seenSince(me.id),
    now: Date.now(),
  };
}

// This house's address as the browser (or widget) reached it: Fly's proxy
// says it was https.
const origin = (req: IncomingMessage): string =>
  `${req.headers["x-forwarded-proto"] === "https" ? "https" : "http"}://${req.headers.host ?? "localhost"}`;

// Your own widget's link, if you've made one, at this house's address.
function widgetLink(req: IncomingMessage, me: Person): string | undefined {
  const key = store.widgetKey(me.id);
  return key ? `${origin(req)}${house().base}/widget/${me.id}.${key}/` : undefined;
}

// The iPhone widget's script (Scriptable), with her own link written in.
const scriptFor = (link: string): string => readFileSync(SCRIPTABLE, "utf8").replace("__LINK__", link);

// Her widget's link and its script, for the Everyone tab, once she's made one.
function widgetFor(req: IncomingMessage, me: Person): [string?, string?] {
  const link = widgetLink(req, me);
  return link ? [link, scriptFor(link)] : [];
}

// The friend a widget link belongs to, if its key is hers. Compared in
// constant time, and an empty key (no widget made) never matches.
function widgetFriend(id: string, key: string): Person | undefined {
  const p = personById(id);
  const kept = p ? store.widgetKey(p.id) : "";
  if (!p || !kept || kept.length !== key.length) return undefined;
  return timingSafeEqual(Buffer.from(kept), Buffer.from(key)) ? p : undefined;
}

// `place` is the room this page is in; the whole house and the tabs leave you
// wherever you last were.
function visit(me: Person, place = ""): Visit {
  const seenUntil = store.recordVisit(me.id, place);
  const things = store.things();
  const now = Date.now();
  return {
    me,
    things,
    seen: store.lastSeen(),
    where: store.whereabouts(),
    arrived: store.arrivals(),
    spots: store.spots(),
    seenUntil,
    now,
    // A friend's first visit is a welcome, not a recap.
    recap: seenUntil ? recapFor(things, monthClock(), now, store.recapRead(me.id)) : undefined,
    widget: store.widgetKey(me.id) !== "",
  };
}

// Leaving the house (or coming in as someone else) lets her window open
// again, and takes her out of any UNO game she's still in, so nobody waits
// on her turn (ADR 0016).
function leaveHouse(person: string, token: string): void {
  const all = store.things();
  const start = gameOf(all, person);
  if (start && stillIn(replay(start, all, Date.now(), true), person)) {
    store.leave({ author: person, kind: "unomove", place: `uno:${start.id}`, item: "quit" });
  }
  store.release(person, token);
}

// Confirmations after leaving something, with what you did so the house can
// pop its emoji up where you did it. Only these fixed lines are ever shown,
// whatever ?did= says.
function confirmation(did: string | null, owner?: Person, me?: Person): Done | undefined {
  const text = line(did, owner, me);
  return did && text ? { key: did, text } : undefined;
}

function line(did: string | null, owner?: Person, me?: Person): string | undefined {
  switch (did) {
    case "hug":
      return "A big, warm hug. Everyone in it hears it was you.";
    case "wish":
      if (!owner) return undefined;
      return owner.id === me?.id
        ? "Happy birthday to you! Everyone who comes by sees the party."
        : `Happy birthday, ${owner.name}! Your wish is in ${their(owner)} room for ${them(owner)} to find.`;
    case "desk":
      return owner && `Left on ${owner.name}'s desk. It'll be waiting whenever ${owner.name} is next home.`;
    case "reply":
      return "Written back. It's on their desk, waiting for whenever they're next home.";
    case "tidy":
      return owner?.id === "5" && !made() ? "All tidy. The banana stays, though. It's Aswathy's." : "All tidy.";
    case "wall":
      return "Pinned to the wall. Whoever comes by next will see it.";
    case "photo":
      return "Pinned to the memory wall. Whoever comes by next will see what reminded you of them.";
    case "widget":
      return "Your widget's link is ready. Any link you made before has stopped working.";
    case "recap":
      return "In the memory box, with every month before it. Nothing's gone; it's all kept here.";
    case "sticker":
      return "Stuck on. Whoever wrote it will know you read it, and how you felt.";
    case "dish":
      return "Left out on the counter for everyone.";
    case "eat":
      return "Every last bite. The plate's off the counter, and the cook will hear it was you.";
    case "saved":
      return "Covered and saved. It'll wait on the counter for them, however long they're away.";
    case "atesaved":
      return "Every last bite. Whoever saved it for you will hear you found it.";
    case "water":
      return "The garden's had a good drink.";
    case "plant":
      return "Planted. Come back in a few days to see it grow.";
    case "play":
      return `${DOG} loved that. He's coming with you wherever you go, for a while.`;
    case "treat":
      return `Gone in one crunch. ${DOG}'s coming with you wherever you go, for a while.`;
    case "nap":
      return "Tucked in. Anyone who comes by finds you asleep here, until you get up and go somewhere else.";
    case "sit":
      return "Settled in. Anyone who comes by finds you here, until you get up and go somewhere else.";
    case "mask":
      return "Mask on. It comes off by itself in a couple of hours.";
    case "kettle":
      return "Maggi's made. It's out on the mat for everyone, like old times.";
    case "movie":
      return "Suggested. It's on the list for everyone.";
    case "watched":
      return "Marked as watched.";
    case "night":
      return `Movie night's planned. Everyone sees it in ${made() ? "their" : "her"} own time.`;
    case "call":
      return `The call's planned. Everyone sees it in ${made() ? "their" : "her"} own time, on the Everyone tab.`;
    case "uno":
      return "Dealt: seven cards each, and twenty seconds a turn.";
    case "unowon":
      return "You won UNO! Back to the mat for another round whenever you like.";
    default:
      return undefined;
  }
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://house");
  const { pathname } = url;
  const did = url.searchParams.get("did");
  // A HEAD is answered like a GET; node leaves the body off by itself.
  const method = req.method === "HEAD" ? "GET" : req.method;
  const route = `${method} ${pathname}`;
  const mine = session(req);
  const me = mine?.me;

  if (route === "GET /") {
    if (!me) return send(res, 200, doorPage(store.lastSeen(), Date.now(), taken()));
    return send(res, 200, housePage(visit(me)));
  }

  // Coming in as one of the five, if nobody else is in the house as her right
  // now. Coming in as someone else lets go of whoever you were.
  if (route === "POST /me") {
    const who = personById((await readForm(req))?.get("who") ?? undefined);
    if (!who) return send(res, 400, messagePage("Who's that?", "That isn't one of the friends in this house."));
    if (mine?.me.id === who.id) return redirect(res, "/");
    if (held(who.id)) {
      return send(res, 409, messagePage(`${who.name}'s already home`, `Someone's in the house as ${who.name} right now. ${cap(their(who))} window opens again once they leave.`));
    }
    if (mine) leaveHouse(mine.me.id, mine.token);
    const token = randomUUID();
    store.claim(who.id, token);
    return redirect(res, "/", { "set-cookie": whoCookie(req, `${who.id}.${token}`, YEAR) });
  }

  if (route === "POST /leave") {
    if (mine) leaveHouse(mine.me.id, mine.token);
    return redirect(res, "/", { "set-cookie": whoCookie(req, "", 0) });
  }

  // Open pages listen here for what friends do (src/live.ts).
  if (route === "GET /live") return live.subscribe(res, mine && { person: mine.me.id, token: mine.token });

  if (route === "GET /readme") return redirect(res, "/readme/");
  if (route === "GET /readme/") return send(res, 200, readmePage(markdown(readFileSync(README, "utf8"))));
  if (route === "GET /style.css") return send(res, 200, readFileSync(STYLE), "text/css; charset=utf-8");
  if (route === "GET /house.js") return send(res, 200, readFileSync(SCRIPT), "text/javascript; charset=utf-8");
  if (route === "GET /live.js") return send(res, 200, readFileSync(LIVE), "text/javascript; charset=utf-8");
  // For a phone's home screen (Android); an iPhone reads the page's own tags.
  if (route === "GET /manifest.webmanifest") return send(res, 200, manifest(), "application/manifest+json; charset=utf-8");
  // A made friend's sticker, drawn on the server from her look
  // (src/avatars.ts). The same look always draws the same picture.
  const sticker = method === "GET" ? pathname.match(/^\/avatar\/([a-z0-9-]+)\.svg$/) : null;
  if (sticker) {
    const look = parseLook(sticker[1]);
    if (!look) return send(res, 404, messagePage("Nothing here", "There's no picture by that name."));
    res.writeHead(200, { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400" });
    return void res.end(avatarSvg(look));
  }
  const art = method === "GET" && pathname.startsWith("/art/") ? pathname.slice("/art/".length) : undefined;
  if (art !== undefined) {
    if (!isArt(art)) return send(res, 404, messagePage("Nothing here", "There's no picture by that name."));
    res.writeHead(200, { "content-type": ART_TYPES[art.slice(art.lastIndexOf("."))], "cache-control": "public, max-age=86400" });
    return void res.end(readFileSync(new URL(art, ART)));
  }

  // A friend's home-screen widget (ADR 0025): everything under
  // /widget/<id>.<key>/, so the widget app only ever needs the one link.
  // Read-only, and no visit: the house doesn't think she came by.
  const w = method === "GET" ? pathname.match(/^\/widget\/([^/.]+)\.([A-Za-z0-9_-]+)\/(.*)$/) : null;
  if (w) {
    const friend = widgetFriend(w[1], w[2]);
    const json = (status: number, body: unknown): void => {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify(body));
    };
    if (!friend) return json(404, { error: "This widget's link isn't one the house knows. Make a new one on the Everyone tab." });
    const rest = w[3];
    if (rest === "") {
      const data = widget(look(friend));
      // Where tapping it goes: the house, at its own address.
      return json(200, { ...data, open: `${house().base}${data.latest?.open ?? "/"}`, latest: data.latest && { ...data.latest, open: `${house().base}${data.latest.open}` } });
    }
    if (rest === "scriptable.js") {
      const link = `${origin(req)}${house().base}/widget/${friend.id}.${w[2]}/`;
      res.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store", "content-disposition": `inline; filename="${friend.name.replace(/[^A-Za-z0-9 ]/g, "")} - home screen.js"` });
      return void res.end(scriptFor(link));
    }
    const face = rest.match(/^face\/([^/]+)$/);
    if (face) {
      const p = personById(face[1]);
      if (!p) return json(404, { error: "No such friend." });
      // The same picture the house shows, from wherever it's kept. A made
      // house's friends are drawn in SVG, which a widget can't show: it
      // draws her initial instead.
      if (p.look) return json(404, { error: "No picture a widget can show." });
      return redirect(res, avatarUrl(p).replace(/^\//, `${origin(req)}/`));
    }
    const snap = rest.match(/^photo\/(\d+)$/);
    if (snap) {
      const id = Number(snap[1]);
      const pic = wall(store.things()).some((t) => photoOf(t) === id) ? store.photo(id) : undefined;
      if (!pic) return json(404, { error: "That photo isn't on the wall." });
      res.writeHead(200, { "content-type": pic.type, "content-length": pic.data.length, "cache-control": "private, max-age=86400", "x-content-type-options": "nosniff" });
      return void res.end(pic.data);
    }
    return json(404, { error: "Nothing here." });
  }

  // Making your widget's link, or a new one (which turns the old one off).
  if (route === "POST /widget") {
    if (!me) return send(res, 403, messagePage("Knock first", "Pick who you are at the door first."));
    store.setWidgetKey(me.id, randomBytes(18).toString("base64url"));
    return redirect(res, "/everyone?did=widget#widget");
  }

  // A photo on the memory wall (ADR 0024), only for friends who are in this
  // house, and only one that's pinned on its wall. A browser keeps it: a
  // photo never changes once it's pinned.
  const shown = method === "GET" ? pathname.match(/^\/photo\/(\d+)$/) : null;
  if (shown) {
    if (!me) return send(res, 403, messagePage("Knock first", "Pick who you are at the door to see the wall."));
    const id = Number(shown[1]);
    const pinned = wall(store.things()).some((t) => photoOf(t) === id);
    const pic = pinned ? store.photo(id) : undefined;
    if (!pic) return send(res, 404, messagePage("Nothing here", "That photo isn't on the wall."));
    res.writeHead(200, { "content-type": pic.type, "content-length": pic.data.length, "cache-control": "private, max-age=86400", "x-content-type-options": "nosniff" });
    return void res.end(pic.data);
  }

  if (route === "GET /updates" || route === "GET /everyone" || route === "GET /movies" || route === "GET /uno") {
    if (!me) return redirect(res, "/");
    const v = visit(me);
    if (pathname === "/uno") return send(res, 200, unoPage(v, confirmation(did)));
    return send(res, 200, pathname === "/updates" ? updatesPage(v) : pathname === "/everyone" ? everyonePage(v, confirmation(did), ...widgetFor(req, me)) : moviesPage(v, confirmation(did)));
  }

  const roomMatch = pathname.match(/^\/room\/([^/]+)(\/leave|\/tidy|\/mask|\/kettle|\/nap|\/wish|\/reply)?$/);
  const owner = roomMatch ? personById(roomMatch[1]) : undefined;
  if (roomMatch && !owner) return send(res, 404, messagePage("No such room", `There are ${PEOPLE.length} rooms in this house, and that isn't one of them.`));
  // The face mask powder is in Rithanya's room, and the kettle in Amirdhavarshini's.
  // A made house (src/houses.ts) has neither: they're Rithika's five's own.
  if ((roomMatch?.[2] === "/mask" && (owner?.id !== MASK_ROOM || made())) || (roomMatch?.[2] === "/kettle" && (owner?.id !== KETTLE_ROOM || made()))) {
    return send(res, 404, messagePage("Not in this room", "That happens in another room."));
  }

  const pages: Record<string, (v: Visit) => string> = {
    "/living": (v) => livingPage(v, confirmation(did)),
    "/kitchen": (v) => kitchenPage(v, confirmation(did)),
    "/garden": (v) => gardenPage(v, confirmation(did)),
  };
  if (method === "GET" && (pages[pathname] || (owner && !roomMatch?.[2]))) {
    if (!me) return redirect(res, "/");
    // A page fetching itself to keep up (public/live.js) is still the same
    // visit, not going into the room again.
    const place = req.headers["x-live"] ? "" : owner ? roomPlace(owner.id) : pathname.slice(1);
    const v = visit(me, place);
    return send(res, 200, owner ? bedroomPage(owner, v, confirmation(did, owner, me)) : pages[pathname](v));
  }

  if (method !== "POST") return send(res, 404, messagePage("Nothing here", "There's no room by that name in this house."));

  const writes = ["/wall", "/wall/photo", "/kitchen", "/kitchen/eat", "/garden/water", "/garden/plant", "/garden/dog", "/garden/treat", "/sit", "/here", "/movies", "/movies/watched", "/movies/night", "/plan", "/uno", "/uno/move", "/hug", "/wall/sticker", "/wall/recap"];
  if (!writes.includes(pathname) && !roomMatch?.[2]) {
    return send(res, 404, messagePage("Nothing here", "There's no room by that name in this house."));
  }
  if (!me) return send(res, 403, messagePage("Knock first", "Pick who you are at the door before leaving something."));

  // A photo for the memory wall, with a line about it (ADR 0024). It comes
  // as a form with a file in it, so it's read before the ordinary forms.
  if (pathname === "/wall/photo") {
    const up = await readUpload(req);
    const mb = MAX_PHOTO / 1024 / 1024;
    if (up === "too big") return send(res, 413, messagePage("That photo's too big", `Photos fit up to ${mb} MB. A screenshot of it, or a smaller copy, will fit.`, "/living#photo"));
    if (!up?.file) return send(res, 400, messagePage("No photo?", "Pick a photo to pin up first.", "/living#photo"));
    if (!up.file.type) return send(res, 400, messagePage("That isn't a photo we can pin", "Pick a JPEG, PNG or WebP photo.", "/living#photo"));
    const caption = (up.fields.get("body") ?? "").replace(/\r\n?/g, "\n").trim();
    if (caption.length > MAX_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_NOTE} characters.`, "/living#photo"));
    const id = store.keepPhoto(up.file.type, up.file.data);
    store.leave({ author: me.id, kind: "note", place: "wall", body: caption, item: `photo:${id}` });
    return redirect(res, "/living?did=photo#wall");
  }

  const form = await readForm(req);
  if (!form) return send(res, 413, messagePage("Too much", "That's more than fits."));
  const body = text(form, "body");
  const item = text(form, "item");

  // Where you stopped walking (public/house.js sends it), in the picture's
  // pixels, so you're still there when you come back and friends find you
  // there. Nothing to show for it, so no page either.
  if (pathname === "/here") {
    const spot: [number, number] = [Number(form.get("x")), Number(form.get("y"))];
    const place = spot.every(Number.isFinite) ? placeAt(spot) : undefined;
    if (!place) return send(res, 400, messagePage("Not in the house", "That spot isn't anywhere in the house."));
    store.walkTo(me.id, place, Math.round(spot[0]), Math.round(spot[1]));
    res.writeHead(204);
    return void res.end();
  }

  if (owner && roomMatch?.[2] === "/tidy") {
    store.leave({ author: me.id, kind: "tidy", place: roomPlace(owner.id) });
    return redirect(res, `/room/${owner.id}?did=tidy`);
  }

  // Anyone can sleep in anyone's bed. Lying down puts you in that room first,
  // so you stay asleep there until you've been somewhere else.
  if (owner && roomMatch?.[2] === "/nap") {
    store.recordVisit(me.id, roomPlace(owner.id));
    store.leave({ author: me.id, kind: "nap", place: roomPlace(owner.id) });
    return redirect(res, `/room/${owner.id}?did=nap`);
  }

  if (owner && roomMatch?.[2] === "/mask") {
    store.leave({ author: me.id, kind: "mask", place: roomPlace(owner.id) });
    return redirect(res, `/room/${owner.id}?did=mask`);
  }

  // A birthday wish, all through her birthday month (by her own clock).
  if (owner && roomMatch?.[2] === "/wish") {
    if (!birthday(owner, Date.now())) {
      return send(res, 404, messagePage(`It's not ${their(owner)} birthday month`, `${cap(their(owner))} room gets bunting and balloons all through ${their(owner)} birthday month. Come back then.`, `/room/${owner.id}`));
    }
    store.leave({ author: me.id, kind: "wish", place: roomPlace(owner.id) });
    return redirect(res, `/room/${owner.id}?did=wish`);
  }

  if (owner && roomMatch?.[2] === "/kettle") {
    const back = `/room/${owner.id}`;
    if (body.length > MAX_DISH_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_DISH_NOTE} characters.`, back));
    store.leave({ author: me.id, kind: "kettle", place: roomPlace(owner.id), body });
    return redirect(res, `${back}?did=kettle`);
  }

  if (owner && roomMatch?.[2] === "/leave") {
    const back = `/room/${owner.id}`;
    if (owner.id === me.id) return send(res, 400, messagePage("That's your desk", "Leave things on a friend's desk instead.", back));
    if (item && !find(gifts(), item)) return send(res, 400, messagePage("Not in this house", "That isn't something you can leave here.", back));
    if (!body && !item) return send(res, 400, messagePage("Nothing to leave", "Write a note or pick something to leave.", back));
    if (body.length > MAX_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_NOTE} characters.`, back));
    store.leave({ author: me.id, kind: "desk", place: roomPlace(owner.id), body, item });
    return redirect(res, `${back}?did=desk`);
  }

  // Writing back to a note on your own desk: it goes on the desk of whoever
  // wrote it, and only she can read it, like any desk note.
  if (owner && roomMatch?.[2] === "/reply") {
    const mine = `/room/${me.id}`;
    const note = desk(store.things(), me.id).find((t) => String(t.id) === form.get("note"));
    if (!note || note.author !== owner.id) return send(res, 400, messagePage("Which note?", `That isn't a note from ${owner.name} on your desk.`, `${mine}#desk`));
    if (owner.id === me.id) return send(res, 400, messagePage("That's your own note", "Write back to a friend's note instead.", `${mine}#desk`));
    if (!body) return send(res, 400, messagePage("Nothing to say?", "Write something before leaving it on their desk.", `${mine}#desk`));
    if (body.length > MAX_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_NOTE} characters.`, `${mine}#desk`));
    store.leave({ author: me.id, kind: "reply", place: roomPlace(owner.id), body, item: String(note.id) });
    return redirect(res, `${mine}?did=reply#desk-${note.id}`);
  }

  if (pathname === "/wall") {
    if (!body) return send(res, 400, messagePage("An empty note", "Write something before pinning it up.", "/living"));
    if (body.length > MAX_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_NOTE} characters.`, "/living"));
    store.leave({ author: me.id, kind: "note", place: "wall", body, item: form.get("big") === "1" ? "big" : "" });
    return redirect(res, "/living?did=wall");
  }

  // Putting a month's recap away (ADR 0026): it's in the memory box, as it
  // always was; this only says she's read it. Only a month the wall has had.
  if (pathname === "/wall/recap") {
    const month = text(form, "month");
    if (!pastMonths(store.things(), monthClock(), Date.now()).includes(month)) {
      return send(res, 400, messagePage("Which month?", "That month isn't in the memory box.", "/updates"));
    }
    // Never back to an older month than one she's put away already.
    if (month > store.recapRead(me.id)) store.readRecap(me.id, month);
    return redirect(res, "/living?did=recap#memory-box");
  }

  // A sticker on a friend's note: one each, and picking "" peels yours off.
  // Back to the note itself, so the wall doesn't lose your place.
  if (pathname === "/wall/sticker") {
    const note = wall(store.things()).find((t) => String(t.id) === form.get("note"));
    if (!note) return send(res, 400, messagePage("Which note?", "That note isn't on the wall.", "/living#wall"));
    if (note.author === me.id) return send(res, 400, messagePage("That's your own note", "Stickers are for friends' notes.", "/living#wall"));
    const sticker = text(form, "sticker");
    if (sticker && !STICKERS.some((s) => s.key === sticker)) return send(res, 400, messagePage("Not a sticker we have", "Pick one of the stickers on the note.", "/living#wall"));
    store.leave({ author: me.id, kind: "sticker", place: `note:${note.id}`, item: sticker });
    return redirect(res, `/living?did=sticker#note-${note.id}`);
  }

  // Cooking for everyone, or saving a plate for one friend who's away (ADR
  // 0022): the dish's item carries who it's for, as "<food>:for:<id>".
  if (pathname === "/kitchen") {
    if (!find(FOOD, item)) return send(res, 400, messagePage("What are you making?", "Pick something to cook first.", "/kitchen"));
    if (body.length > MAX_DISH_NOTE) return send(res, 400, messagePage("Too long", `Kitchen notes fit up to ${MAX_DISH_NOTE} characters.`, "/kitchen"));
    const forWho = text(form, "for");
    const friend = forWho ? personById(forWho) : undefined;
    if (forWho && !friend) return send(res, 400, messagePage("Save it for who?", "That isn't one of the friends in this house.", "/kitchen"));
    if (friend?.id === me.id) return send(res, 400, messagePage("That's you", "Save a plate for a friend instead, or leave it out for everyone.", "/kitchen"));
    store.leave({ author: me.id, kind: "dish", place: "kitchen", body, item: friend ? `${item}:for:${friend.id}` : item });
    return redirect(res, `/kitchen?did=${friend ? "saved" : "dish"}`);
  }

  // Anyone can eat what's out for everyone, which takes it off the counter. A
  // plate saved for a friend is only hers to eat.
  if (pathname === "/kitchen/eat") {
    const dish = counter(store.things(), Date.now()).find((t) => String(t.id) === form.get("dish"));
    if (!dish) return send(res, 400, messagePage("All gone", "Someone's already eaten that, or it was out too long.", "/kitchen"));
    const forWho = savedFor(dish);
    if (forWho && forWho !== me.id) {
      const friend = personById(forWho);
      return send(res, 400, messagePage("That plate's saved", `It's covered and kept for ${friend?.name ?? "a friend"}. Cook something of your own, or save ${them(friend)} another.`, "/kitchen"));
    }
    store.leave({ author: me.id, kind: "eat", place: `dish:${dish.id}` });
    return redirect(res, `/kitchen?did=${forWho ? "atesaved" : "eat"}`);
  }

  // UNO on Amirdhavarshini's mat: deal for everyone sitting on it, as long as
  // you're one of them and not alone.
  if (pathname === "/uno") {
    const who = dealFor(me.id, resting(store.things(), Date.now(), store.whereabouts(), store.arrivals()));
    const mat = matWords();
    if (!who) return send(res, 400, messagePage("Not yet", `${mat.sit} with a friend first, then deal.`, mat.href));
    store.leave({ author: me.id, kind: "uno", place: layout().mat.place, item: who.join(","), body: String(randomInt(1, 2 ** 31)) });
    return redirect(res, "/uno?did=uno");
  }

  // A move in your own latest game, which the engine checks first: your turn,
  // in your hand, and it fits. A wild comes as "W:r", with its colour.
  if (pathname === "/uno/move") {
    const all = store.things();
    const start = gameOf(all, me.id);
    if (!start || String(start.id) !== form.get("game")) return send(res, 400, messagePage("Which game?", "That game's been put away. Your latest one is on the mat.", "/uno"));
    const [card, color = ""] = text(form, "card").split(":");
    const game = replay(start, all, Date.now(), true);
    const why = play(game, { author: me.id, item: card, body: color });
    if (why) return send(res, 400, messagePage("Not that one", why, "/uno"));
    store.leave({ author: me.id, kind: "unomove", place: `uno:${start.id}`, item: card, body: isWild(card) ? color : "" });
    return redirect(res, game.winner === me.id ? "/uno?did=unowon" : "/uno#hand");
  }

  if (pathname === "/movies") {
    const title = text(form, "title").replace(/\s+/g, " ");
    const why = text(form, "why");
    if (!title) return send(res, 400, messagePage("Which movie?", "Write the movie's name first.", "/movies"));
    if (title.length > MAX_TITLE || why.length > MAX_DISH_NOTE) return send(res, 400, messagePage("Too long", "That's more than fits on the list.", "/movies"));
    store.leave({ author: me.id, kind: "movie", place: "movies", body: why ? `${title}\n${why}` : title });
    return redirect(res, "/movies?did=movie");
  }

  // A time for all of you (pages.ts planner()): a video call, or movie night
  // with one of the suggestions. Planned from the Everyone tab or Movies, and
  // back to whichever it was.
  if (pathname === "/plan") {
    const back = form.get("from") === "movies" ? "/movies" : "/everyone";
    const at = fromLocal(form.get("when") ?? "", me.tz);
    if (at === undefined) return send(res, 400, messagePage("When?", "Pick a day and a time.", `${back}#plan`));
    if (at < Date.now() - 5 * 60 * 1000) return send(res, 400, messagePage("That's already gone", "Pick a time that hasn't happened yet.", `${back}#plan`));
    if (form.get("what") === "movie") {
      const movie = movies(store.things()).find((m) => String(m.thing.id) === form.get("movie"));
      if (!movie) return send(res, 400, messagePage("Which movie?", "That isn't on the list.", `${back}#plan`));
      store.leave({ author: me.id, kind: "movienight", place: `movie:${movie.thing.id}`, body: String(at) });
      return redirect(res, `${back}?did=night`);
    }
    if (form.get("what") !== "call") return send(res, 400, messagePage("What for?", "Pick a video call or a movie night.", `${back}#plan`));
    const about = text(form, "about");
    if (about.length > MAX_ABOUT) return send(res, 400, messagePage("Too long", `Say what it's about in up to ${MAX_ABOUT} characters.`, `${back}#plan`));
    store.leave({ author: me.id, kind: "call", place: "calls", item: String(at), body: about });
    return redirect(res, `${back}?did=call`);
  }

  if (pathname === "/movies/watched" || pathname === "/movies/night") {
    const movie = movies(store.things()).find((m) => String(m.thing.id) === form.get("movie"));
    if (!movie) return send(res, 400, messagePage("Which movie?", "That isn't on the list.", "/movies"));
    if (pathname === "/movies/watched") {
      store.leave({ author: me.id, kind: "watched", place: `movie:${movie.thing.id}` });
      return redirect(res, "/movies?did=watched");
    }
    const at = fromLocal(form.get("when") ?? "", me.tz);
    if (at === undefined) return send(res, 400, messagePage("When?", "Pick a day and a time for movie night.", "/movies"));
    if (at < Date.now() - 5 * 60 * 1000) return send(res, 400, messagePage("That's already gone", "Pick a time that hasn't happened yet.", "/movies"));
    store.leave({ author: me.id, kind: "movienight", place: `movie:${movie.thing.id}`, body: String(at) });
    return redirect(res, "/movies?did=night");
  }

  if (pathname === "/garden/plant") {
    if (!find(PLANTS, item)) return send(res, 400, messagePage("Plant what?", "Pick something to plant first.", "/garden"));
    store.leave({ author: me.id, kind: "plant", place: "garden", item });
    return redirect(res, "/garden?did=plant");
  }

  if (pathname === "/garden/water") {
    store.leave({ author: me.id, kind: "water", place: "garden" });
    return redirect(res, "/garden?did=water");
  }

  const pageOf = (place: string): string => (place.startsWith("room:") ? `/room/${place.slice("room:".length)}` : `/${place}`);

  // A hug for whoever you asked for (`with`, ids joined by commas; everyone
  // close when it's missing) who's here now, standing, and within reach.
  // public/house.js sends where you're standing (`x`, `y`), so that counts
  // first. If you were sitting or lying down, you get up for it.
  if (pathname === "/hug") {
    const spot: [number, number] = [Number(form.get("x")), Number(form.get("y"))];
    const walked = form.has("x") && spot.every(Number.isFinite) ? placeAt(spot) : undefined;
    if (walked) store.walkTo(me.id, walked, Math.round(spot[0]), Math.round(spot[1]));
    const from = hugFrom(visit(me));
    const asked = form.has("with") ? text(form, "with").split(",") : undefined;
    const group = from.near.filter((p) => !asked || asked.includes(p.id));
    if (!group.length) {
      return send(res, 400, messagePage("Nobody's close enough to hug", `Walk up to a friend who's here right now, then hug ${made() ? "them" : "her"}.`, pageOf(from.place)));
    }
    if (from.resting && from.spot) store.walkTo(me.id, from.place, Math.round(from.spot[0]), Math.round(from.spot[1]));
    store.leave({ author: me.id, kind: "hug", place: from.place, item: group.map((p) => p.id).sort().join(",") });
    return redirect(res, `${pageOf(from.place)}?did=hug`);
  }

  // Sitting down, like lying down, puts you in that room first.
  if (pathname === "/sit") {
    const seat = seats().find((s) => s.key === text(form, "seat"));
    if (!seat) return send(res, 400, messagePage("Sit where?", "There's no seat like that in this house."));
    store.recordVisit(me.id, seat.place);
    store.leave({ author: me.id, kind: "sit", place: seat.place, item: seat.key });
    return redirect(res, `${pageOf(seat.place)}?did=sit`);
  }

  // Petting Shinzo or giving him a treat happens wherever he is, and you stay
  // in that room. The row keeps the garden as its place, as petting always has.
  const at = text(form, "at");
  const back = isPlace(at) ? pageOf(at) : "/garden";
  const kind = pathname === "/garden/treat" ? "treat" : "play";
  store.leave({ author: me.id, kind, place: "garden" });
  return redirect(res, `${back}?did=${kind}`);
}

// /h/<code>/... is a made house (src/houses.ts): the rest of the path is
// handled exactly as in Rithika's house at `/`, inside that house. /make is
// where a house gets made (src/maker.ts), in no house at all.
function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = (req.url ?? "/").split("?")[0];
  if (path === "/make" || path.startsWith("/make/")) return make(req, res);
  const m = (req.url ?? "/").match(/^\/h\/([^/?]+)(\/[^?]*)?(\?.*)?$/);
  if (!m) return inHouse(ORIGINAL, () => (watchRefusals(req, res), handle(req, res)));
  const h = findHouse(m[1]);
  if (!h) return inHouse(ORIGINAL, async () => send(res, 404, messagePage("No house here", "There's no house at that address. Check the link, or make your own.", "/make")));
  // /h/<code> on its own is the house's door.
  if (!m[2]) return inHouse(h, async () => redirect(res, "/"));
  req.url = `${m[2]}${m[3] ?? ""}`;
  return inHouse(h, () => (watchRefusals(req, res), handle(req, res)));
}

// Anything the house turns down is logged too, by who tried it (crit 10): a
// write that answers 4xx, like a stranger posting or someone acting as a
// friend whose window isn't theirs.
function watchRefusals(req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== "POST") return;
  // Who's asking is worked out now, inside the house; the line is written once
  // the answer has gone, by which time the request has left it.
  const h = house();
  const mine = session(req);
  const by = mine ? `${mine.me.id}:${mine.me.name}` : "someone not signed in";
  res.on("finish", () => {
    if (res.statusCode < 400 || res.statusCode >= 500) return;
    inHouse(h, () => store.log(`${by} was refused ${req.method} ${(req.url ?? "").split("?")[0]} (${res.statusCode})`));
  });
}

const server = createServer((req, res) => {
  route(req, res).catch((err: unknown) => {
    console.error(err);
    if (!res.headersSent) send(res, 500, messagePage("Something broke", "The house stumbled. Try again in a moment."));
    else res.end();
  });
});

const port = Number(process.env.PORT ?? 8080);
server.listen(port, "0.0.0.0", () => console.log(`Five Windows is open on http://localhost:${port}`));

// Fly stops the machine when idle; node as PID 1 ignores signals unless handled,
// and would otherwise be killed only after Fly's timeout.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close();
    store.close();
    closeHouses();
    process.exit(0);
  });
}
