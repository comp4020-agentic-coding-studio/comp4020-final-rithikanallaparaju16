import type { ServerResponse } from "node:http";
import { house, inHouse, type House } from "./houses.ts";
import * as store from "./store.ts";

// Open pages listen here (GET /live, server-sent events) so the house changes
// in front of whoever's looking, without a refresh (ADR 0010). Anything that
// writes to the store tells every page `changed`, and each page fetches itself
// again; a friend walking tells signed-in pages where she `moved`, so she
// walks on their screens too. The door listens as well, for windows opening
// and closing. Nothing here is state friends must see: a page that misses an
// event is only as stale as it was before live updates.
//
// Each page is in one house (src/houses.ts), and only hears that house.

type Client = { res: ServerResponse; house: House; person?: string; token?: string };

const clients = new Set<Client>();

// Fly's proxy closes a connection that's quiet for a minute or so.
const HEARTBEAT = 25 * 1000;
// Going to another page closes the connection and opens a new one a moment
// later; only a friend who's still gone after this has left.
const GONE = 3 * 1000;
const leaving = new Map<string, ReturnType<typeof setTimeout>>();

// A friend is a person in a house: "2" in Rithika's, "2" in a made one.
const key = (c: { house: House; person?: string }): string => `${c.house.code}/${c.person}`;

function send(c: Client, event: string, data: object): void {
  c.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function broadcast(change: store.Change, code: string): void {
  for (const c of clients) {
    if (c.house.code !== code) continue;
    if (change.type === "changed") send(c, "changed", {});
    else if (c.person) send(c, "moved", { person: change.person, place: change.place, x: change.x, y: change.y });
  }
}

// Whether `person` has this house open right now, carrying `token`.
export const connected = (person: string, token: string): boolean =>
  [...clients].some((c) => c.house.code === house().code && c.person === person && c.token === token);

export function subscribe(res: ServerResponse, me?: { person: string; token: string }): void {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    "x-accel-buffering": "no",
  });
  // Reconnect quickly after a restart or a dropped connection.
  res.write("retry: 2000\n\n");
  const c: Client = { res, house: house(), person: me?.person, token: me?.token };
  clients.add(c);
  if (c.person) {
    const pending = leaving.get(key(c));
    if (pending) {
      clearTimeout(pending);
      leaving.delete(key(c));
    } else {
      store.changed();
    }
  }
  res.on("close", () => {
    clients.delete(c);
    if (!c.person || [...clients].some((o) => key(o) === key(c))) return;
    leaving.set(key(c), setTimeout(() => {
      leaving.delete(key(c));
      inHouse(c.house, () => store.changed());
    }, GONE));
  });
}

// Keeps every connection open, and keeps each friend who has the house open
// "home now", since looking at the house is being in it.
setInterval(() => {
  const here = new Map<string, Client>();
  for (const c of clients) {
    c.res.write(": still here\n\n");
    if (c.person && c.token && inHouse(c.house, () => store.holder(c.person!).token === c.token)) here.set(key(c), c);
  }
  for (const c of here.values()) inHouse(c.house, () => store.recordVisit(c.person!));
}, HEARTBEAT).unref();
