import { randomInt, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { ART, ART_TYPES, isArt } from "./assets.ts";
import { counter, DOG, find, FOOD, GIFTS, KETTLE_ROOM, MASK_ROOM, movies, PLANTS, resting, roomPlace, SEATS } from "./house.ts";
import * as live from "./live.ts";
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
  MAX_DISH_NOTE,
  MAX_NOTE,
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
import { isPlace, placeAt } from "./scene.ts";
import * as store from "./store.ts";
import { birthday, fromLocal } from "./time.ts";
import { dealFor, gameOf, isWild, play, replay, stillIn } from "./uno.ts";

const MAX_FORM = 8 * 1024;
const YEAR = 365 * 24 * 60 * 60;

const README = new URL("../README.md", import.meta.url);
const STYLE = new URL("../public/style.css", import.meta.url);
const SCRIPT = new URL("../public/house.js", import.meta.url);
const LIVE = new URL("../public/live.js", import.meta.url);

store.onChange(live.broadcast);

type Headers = Record<string, string>;

function send(res: ServerResponse, status: number, body: string | Buffer, type = "text/html; charset=utf-8"): void {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

function redirect(res: ServerResponse, to: string, headers: Headers = {}): void {
  res.writeHead(303, { location: to, ...headers });
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
  return `who=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly${secure}`;
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

// `place` is the room this page is in; the whole house and the tabs leave you
// wherever you last were.
function visit(me: Person, place = ""): Visit {
  const seenUntil = store.recordVisit(me.id, place);
  return {
    me,
    things: store.things(),
    seen: store.lastSeen(),
    where: store.whereabouts(),
    arrived: store.arrivals(),
    spots: store.spots(),
    seenUntil,
    now: Date.now(),
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
        : `Happy birthday, ${owner.name}! Your wish is in her room for her to find.`;
    case "desk":
      return owner && `Left on ${owner.name}'s desk. It'll be waiting whenever ${owner.name} is next home.`;
    case "tidy":
      return owner?.id === "5" ? "All tidy. The banana stays, though. It's Aswathy's." : "All tidy.";
    case "wall":
      return "Pinned to the wall. Whoever comes by next will see it.";
    case "dish":
      return "Left out on the counter for everyone.";
    case "eat":
      return "Every last bite. The plate's off the counter, and the cook will hear it was you.";
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
      return "Movie night's planned. Everyone sees it in her own time.";
    case "uno":
      return "Dealt: seven cards each. The game waits for whoever's turn it is, however long she's away.";
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
    if (!who) return send(res, 400, messagePage("Who's that?", "That isn't one of the five of us."));
    if (mine?.me.id === who.id) return redirect(res, "/");
    if (held(who.id)) {
      return send(res, 409, messagePage(`${who.name}'s already home`, `Someone's in the house as ${who.name} right now. Her window opens again once they leave.`));
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
  const art = method === "GET" && pathname.startsWith("/art/") ? pathname.slice("/art/".length) : undefined;
  if (art !== undefined) {
    if (!isArt(art)) return send(res, 404, messagePage("Nothing here", "There's no picture by that name."));
    res.writeHead(200, { "content-type": ART_TYPES[art.slice(art.lastIndexOf("."))], "cache-control": "public, max-age=86400" });
    return void res.end(readFileSync(new URL(art, ART)));
  }

  if (route === "GET /updates" || route === "GET /everyone" || route === "GET /movies" || route === "GET /uno") {
    if (!me) return redirect(res, "/");
    const v = visit(me);
    if (pathname === "/uno") return send(res, 200, unoPage(v, confirmation(did)));
    return send(res, 200, pathname === "/updates" ? updatesPage(v) : pathname === "/everyone" ? everyonePage(v) : moviesPage(v, confirmation(did)));
  }

  const roomMatch = pathname.match(/^\/room\/([^/]+)(\/leave|\/tidy|\/mask|\/kettle|\/nap|\/wish)?$/);
  const owner = roomMatch ? personById(roomMatch[1]) : undefined;
  if (roomMatch && !owner) return send(res, 404, messagePage("No such room", "There are five rooms in this house, and that isn't one of them."));
  // The face mask powder is in Rithanya's room, and the kettle in Amirdhavarshini's.
  if ((roomMatch?.[2] === "/mask" && owner?.id !== MASK_ROOM) || (roomMatch?.[2] === "/kettle" && owner?.id !== KETTLE_ROOM)) {
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

  const writes = ["/wall", "/kitchen", "/kitchen/eat", "/garden/water", "/garden/plant", "/garden/dog", "/garden/treat", "/sit", "/here", "/movies", "/movies/watched", "/movies/night", "/uno", "/uno/move", "/hug"];
  if (!writes.includes(pathname) && !roomMatch?.[2]) {
    return send(res, 404, messagePage("Nothing here", "There's no room by that name in this house."));
  }
  if (!me) return send(res, 403, messagePage("Knock first", "Pick who you are at the door before leaving something."));
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
      return send(res, 404, messagePage("It's not her birthday month", "Her room gets bunting and balloons all through her birthday month. Come back then.", `/room/${owner.id}`));
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
    if (item && !find(GIFTS, item)) return send(res, 400, messagePage("Not in this house", "That isn't something you can leave here.", back));
    if (!body && !item) return send(res, 400, messagePage("Nothing to leave", "Write a note or pick something to leave.", back));
    if (body.length > MAX_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_NOTE} characters.`, back));
    store.leave({ author: me.id, kind: "desk", place: roomPlace(owner.id), body, item });
    return redirect(res, `${back}?did=desk`);
  }

  if (pathname === "/wall") {
    if (!body) return send(res, 400, messagePage("An empty note", "Write something before pinning it up.", "/living"));
    if (body.length > MAX_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_NOTE} characters.`, "/living"));
    store.leave({ author: me.id, kind: "note", place: "wall", body, item: form.get("big") === "1" ? "big" : "" });
    return redirect(res, "/living?did=wall");
  }

  if (pathname === "/kitchen") {
    if (!find(FOOD, item)) return send(res, 400, messagePage("What are you making?", "Pick something to cook first.", "/kitchen"));
    if (body.length > MAX_DISH_NOTE) return send(res, 400, messagePage("Too long", `Kitchen notes fit up to ${MAX_DISH_NOTE} characters.`, "/kitchen"));
    store.leave({ author: me.id, kind: "dish", place: "kitchen", body, item });
    return redirect(res, "/kitchen?did=dish");
  }

  // Anyone can eat what's on the counter, which takes it off for everyone.
  if (pathname === "/kitchen/eat") {
    const dish = counter(store.things(), Date.now()).find((t) => String(t.id) === form.get("dish"));
    if (!dish) return send(res, 400, messagePage("All gone", "Someone's already eaten that, or it was out too long.", "/kitchen"));
    store.leave({ author: me.id, kind: "eat", place: `dish:${dish.id}` });
    return redirect(res, "/kitchen?did=eat");
  }

  // UNO on Amirdhavarshini's mat: deal for everyone sitting on it, as long as
  // you're one of them and not alone.
  if (pathname === "/uno") {
    const who = dealFor(me.id, resting(store.things(), Date.now(), store.whereabouts(), store.arrivals()));
    if (!who) return send(res, 400, messagePage("Not yet", "Sit on Amirdhavarshini's mat with a friend first, then deal.", `/room/${KETTLE_ROOM}`));
    store.leave({ author: me.id, kind: "uno", place: roomPlace(KETTLE_ROOM), item: who.join(","), body: String(randomInt(1, 2 ** 31)) });
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
      return send(res, 400, messagePage("Nobody's close enough to hug", "Walk up to a friend who's here right now, then hug her.", pageOf(from.place)));
    }
    if (from.resting && from.spot) store.walkTo(me.id, from.place, Math.round(from.spot[0]), Math.round(from.spot[1]));
    store.leave({ author: me.id, kind: "hug", place: from.place, item: group.map((p) => p.id).sort().join(",") });
    return redirect(res, `${pageOf(from.place)}?did=hug`);
  }

  // Sitting down, like lying down, puts you in that room first.
  if (pathname === "/sit") {
    const seat = SEATS.find((s) => s.key === text(form, "seat"));
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

const server = createServer((req, res) => {
  handle(req, res).catch((err: unknown) => {
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
    process.exit(0);
  });
}
