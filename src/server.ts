import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { find, FOOD, GIFTS, PLANTS, roomPlace } from "./house.ts";
import { markdown } from "./markdown.ts";
import {
  bedroomPage,
  doorPage,
  gardenPage,
  housePage,
  kitchenPage,
  livingPage,
  MAX_DISH_NOTE,
  MAX_NOTE,
  messagePage,
  readmePage,
  type Visit,
} from "./pages.ts";
import { personById, type Person } from "./people.ts";
import * as store from "./store.ts";

const MAX_FORM = 8 * 1024;
const YEAR = 365 * 24 * 60 * 60;

const README = new URL("../README.md", import.meta.url);
const STYLE = new URL("../public/style.css", import.meta.url);

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

function whoCookie(req: IncomingMessage, id: string, maxAge: number): string {
  // Fly terminates TLS in front of the app, so https only shows up in this header.
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  return `who=${id}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly${secure}`;
}

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

function visit(me: Person): Visit {
  const seenUntil = store.recordVisit(me.id);
  return { me, things: store.things(), seen: store.lastSeen(), seenUntil, now: Date.now() };
}

// Confirmations after leaving something. Only these fixed lines are ever shown,
// whatever ?did= says.
function confirmation(did: string | null, owner?: Person): string | undefined {
  switch (did) {
    case "desk":
      return owner && `Left on ${owner.name}'s desk. It'll be waiting whenever ${owner.name} is next home.`;
    case "tidy":
      return owner?.id === "5" ? "All tidy. The banana stays, though. It's Aswathy's." : "All tidy.";
    case "wall":
      return "Pinned to the wall. Whoever comes by next will see it.";
    case "dish":
      return "Left out on the counter for everyone.";
    case "water":
      return "The garden's had a good drink.";
    case "plant":
      return "Planted. Come back in a few days to see it grow.";
    case "play":
      return "Laddoo had the best time, and followed you to your room.";
    default:
      return undefined;
  }
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://house");
  const { pathname } = url;
  const did = url.searchParams.get("did");
  const route = `${req.method} ${pathname}`;
  const me = personById(cookie(req, "who"));

  if (route === "GET /") {
    if (!me) return send(res, 200, doorPage(store.lastSeen(), Date.now()));
    return send(res, 200, housePage(visit(me)));
  }

  if (route === "POST /me") {
    const who = personById((await readForm(req))?.get("who") ?? undefined);
    if (!who) return send(res, 400, messagePage("Who's that?", "That isn't one of the five of us."));
    return redirect(res, "/", { "set-cookie": whoCookie(req, who.id, YEAR) });
  }

  if (route === "POST /leave") return redirect(res, "/", { "set-cookie": whoCookie(req, "", 0) });

  if (route === "GET /readme") return redirect(res, "/readme/");
  if (route === "GET /readme/") return send(res, 200, readmePage(markdown(readFileSync(README, "utf8"))));
  if (route === "GET /style.css") return send(res, 200, readFileSync(STYLE), "text/css; charset=utf-8");

  const roomMatch = pathname.match(/^\/room\/([^/]+)(\/leave|\/tidy)?$/);
  const owner = roomMatch ? personById(roomMatch[1]) : undefined;
  if (roomMatch && !owner) return send(res, 404, messagePage("No such room", "There are five rooms in this house, and that isn't one of them."));

  const pages: Record<string, (v: Visit) => string> = {
    "/living": (v) => livingPage(v, confirmation(did)),
    "/kitchen": (v) => kitchenPage(v, confirmation(did)),
    "/garden": (v) => gardenPage(v, confirmation(did)),
  };
  if (req.method === "GET" && (pages[pathname] || (owner && !roomMatch?.[2]))) {
    if (!me) return redirect(res, "/");
    const v = visit(me);
    return send(res, 200, owner ? bedroomPage(owner, v, confirmation(did, owner)) : pages[pathname](v));
  }

  if (req.method !== "POST") return send(res, 404, messagePage("Nothing here", "There's no room by that name in this house."));

  const writes = ["/wall", "/kitchen", "/garden/water", "/garden/plant", "/garden/dog"];
  if (!writes.includes(pathname) && !roomMatch?.[2]) {
    return send(res, 404, messagePage("Nothing here", "There's no room by that name in this house."));
  }
  if (!me) return send(res, 403, messagePage("Knock first", "Pick who you are at the door before leaving something."));
  const form = await readForm(req);
  if (!form) return send(res, 413, messagePage("Too much", "That's more than fits."));
  const body = text(form, "body");
  const item = text(form, "item");

  if (owner && roomMatch?.[2] === "/tidy") {
    store.leave({ author: me.id, kind: "tidy", place: roomPlace(owner.id) });
    return redirect(res, `/room/${owner.id}?did=tidy`);
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

  if (pathname === "/garden/plant") {
    if (!find(PLANTS, item)) return send(res, 400, messagePage("Plant what?", "Pick something to plant first.", "/garden"));
    store.leave({ author: me.id, kind: "plant", place: "garden", item });
    return redirect(res, "/garden?did=plant");
  }

  store.leave({ author: me.id, kind: pathname === "/garden/water" ? "water" : "play", place: "garden" });
  return redirect(res, pathname === "/garden/water" ? "/garden?did=water" : "/garden?did=play");
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
