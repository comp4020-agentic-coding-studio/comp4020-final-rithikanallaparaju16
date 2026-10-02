import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { markdown } from "./markdown.ts";
import { doorPage, housePage, messagePage, readmePage } from "./pages.ts";
import { personById } from "./people.ts";
import * as store from "./store.ts";

const MAX_NOTE = 500;
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

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const { pathname } = new URL(req.url ?? "/", "http://house");
  const route = `${req.method} ${pathname}`;

  if (route === "GET /") {
    const me = personById(cookie(req, "who"));
    if (!me) return send(res, 200, doorPage(store.lastSeen()));
    const seenUntil = store.recordVisit(me.id);
    return send(res, 200, housePage(me, store.notes(), store.lastSeen(), seenUntil));
  }

  if (route === "POST /me") {
    const me = personById((await readForm(req))?.get("who") ?? undefined);
    if (!me) return send(res, 400, messagePage("Which window?", "That isn't one of the five windows."));
    return redirect(res, "/", { "set-cookie": whoCookie(req, me.id, YEAR) });
  }

  if (route === "POST /leave") {
    return redirect(res, "/", { "set-cookie": whoCookie(req, "", 0) });
  }

  if (route === "POST /notes") {
    const me = personById(cookie(req, "who"));
    if (!me) return send(res, 403, messagePage("Knock first", "Pick your window at the door before leaving something."));
    const form = await readForm(req);
    if (!form) return send(res, 413, messagePage("Too much", "That's more than fits on one note."));
    const body = (form.get("body") ?? "").replace(/\r\n?/g, "\n").trim();
    if (!body) return send(res, 400, messagePage("An empty note", "Write something before leaving it on the table."));
    if (body.length > MAX_NOTE) return send(res, 400, messagePage("Too long", `Notes fit up to ${MAX_NOTE} characters.`));
    store.leaveNote(me.id, body);
    return redirect(res, "/");
  }

  if (route === "GET /readme") return redirect(res, "/readme/");
  if (route === "GET /readme/") return send(res, 200, readmePage(markdown(readFileSync(README, "utf8"))));
  if (route === "GET /style.css") return send(res, 200, readFileSync(STYLE), "text/css; charset=utf-8");

  send(res, 404, messagePage("Nothing here", "There's no room by that name in this house."));
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
