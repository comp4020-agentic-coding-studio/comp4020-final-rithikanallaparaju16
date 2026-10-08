import type { ServerResponse } from "node:http";
import * as store from "./store.ts";

// Open pages listen here (GET /live, server-sent events) so the house changes
// in front of whoever's looking, without a refresh (ADR 0010). Anything that
// writes to the store tells every page `changed`, and each page fetches itself
// again; a friend walking tells signed-in pages where she `moved`, so she
// walks on their screens too. The door listens as well, for windows opening
// and closing. Nothing here is state friends must see: a page that misses an
// event is only as stale as it was before live updates.

type Client = { res: ServerResponse; person?: string; token?: string };

const clients = new Set<Client>();

// Fly's proxy closes a connection that's quiet for a minute or so.
const HEARTBEAT = 25 * 1000;
// Going to another page closes the connection and opens a new one a moment
// later; only a friend who's still gone after this has left.
const GONE = 3 * 1000;
const leaving = new Map<string, ReturnType<typeof setTimeout>>();

function send(c: Client, event: string, data: object): void {
  c.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function broadcast(change: store.Change): void {
  for (const c of clients) {
    if (change.type === "changed") send(c, "changed", {});
    else if (c.person) send(c, "moved", { person: change.person, place: change.place, x: change.x, y: change.y });
  }
}

// Whether `person` has the house open right now, carrying `token`.
export const connected = (person: string, token: string): boolean =>
  [...clients].some((c) => c.person === person && c.token === token);

export function subscribe(res: ServerResponse, me?: { person: string; token: string }): void {
  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    "x-accel-buffering": "no",
  });
  // Reconnect quickly after a restart or a dropped connection.
  res.write("retry: 2000\n\n");
  const c: Client = { res, person: me?.person, token: me?.token };
  clients.add(c);
  if (c.person) {
    const pending = leaving.get(c.person);
    if (pending) {
      clearTimeout(pending);
      leaving.delete(c.person);
    } else {
      store.changed();
    }
  }
  res.on("close", () => {
    clients.delete(c);
    const person = c.person;
    if (!person || [...clients].some((o) => o.person === person)) return;
    leaving.set(person, setTimeout(() => {
      leaving.delete(person);
      store.changed();
    }, GONE));
  });
}

// Keeps every connection open, and keeps each friend who has the house open
// "home now", since looking at the house is being in it.
setInterval(() => {
  const here = new Set<string>();
  for (const c of clients) {
    c.res.write(": still here\n\n");
    if (c.person && c.token && store.holder(c.person).token === c.token) here.add(c.person);
  }
  for (const person of here) store.recordVisit(person);
}, HEARTBEAT).unref();
