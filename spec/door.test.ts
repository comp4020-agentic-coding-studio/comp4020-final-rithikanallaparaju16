import { randomUUID } from "node:crypto";
import { JSDOM } from "jsdom";
import { afterAll, describe, expect, inject, it } from "vitest";

// The front door and coming in and going out (ADR 0011), and the frame every
// page shares, checked against the running app over HTTP.
const baseUrl = inject("baseUrl");

// These checks sign people in and mark them as having visited, so they only run
// against a throwaway house (CI's container, a local run), never the friends'
// real one on Fly. Same gate as spec/house.test.ts.
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

type Person = { id: string; name: string };

const parse = (html: string): Document => new JSDOM(html).window.document;

const text = (el: Element | null | undefined): string => el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// Coming in at the door as one of the five, the way a browser does.
function signIn(id: string, cookie?: string): Promise<Response> {
  return fetch(new URL("/me", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...(cookie ? { cookie } : {}) },
    body: new URLSearchParams({ who: id }),
    redirect: "manual",
  });
}

const sessionOf = (res: Response): string | undefined =>
  res.headers.getSetCookie().find((c) => c.startsWith("who="))?.split(";")[0];

// One session per friend at a time, let go of at the end so the next run can
// come in.
const sessions = new Map<string, string>();

async function cookieFor(who: string): Promise<string> {
  const known = sessions.get(who);
  if (known) return known;
  const res = await signIn(who);
  if (res.status === 409) throw new Error(`someone else is in the house as ${who}; their window opens two minutes after they leave`);
  const cookie = sessionOf(res);
  if (!cookie) throw new Error(`coming in as ${who} set no who= cookie`);
  sessions.set(who, cookie);
  return cookie;
}

const leave = (cookie: string): Promise<Response> =>
  fetch(new URL("/leave", baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });

async function signOut(who: string): Promise<void> {
  const cookie = sessions.get(who);
  sessions.delete(who);
  if (cookie) await leave(cookie);
}

afterAll(async () => {
  for (const who of [...sessions.keys()]) await signOut(who);
});

const get = (path: string, cookie?: string, init: RequestInit = {}): Promise<Response> =>
  fetch(new URL(path, baseUrl), { redirect: "manual", ...init, headers: { ...(cookie ? { cookie } : {}), ...init.headers } });

// What a browser carrying `cookie` (or none) finds at `/`.
const door = async (cookie?: string): Promise<Document> => parse(await (await get("/", cookie)).text());

const atTheDoor = (d: Document): boolean => d.querySelector("form[action='/me']") !== null && d.querySelector("ul.people") !== null;

const pane = (d: Document, id: string): HTMLButtonElement | null => d.querySelector(`button[name=who][value="${id}"]`);

async function people(): Promise<Person[]> {
  return [...(await door()).querySelectorAll<HTMLButtonElement>("button[name=who]")].map((b) => ({
    id: b.value,
    name: text(b.querySelector(".name")),
  }));
}

// An open page's live line (GET /live), as a browser holds it: everything it
// hears piles up in `heard`.
async function listen(cookie?: string): Promise<{ heard: () => string; clear: () => void; stop: () => Promise<void> }> {
  const stop = new AbortController();
  const res = await fetch(new URL("/live", baseUrl), { headers: cookie ? { cookie } : {}, signal: stop.signal });
  expect(res.headers.get("content-type")).toMatch(/^text\/event-stream/);
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let heard = "";
  const reading = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        heard += decoder.decode(value, { stream: true });
      }
    } catch {
      // the page closed
    }
  })();
  return {
    heard: () => heard,
    clear: () => void (heard = ""),
    stop: async () => {
      stop.abort();
      await reading;
    },
  };
}

/* ---------- anyone, signed in or not (read-only) ---------- */

it("keeps every room shut to anyone who hasn't come in at the door", async () => {
  for (const path of ["/updates", "/everyone", "/movies", "/uno", "/living", "/kitchen", "/garden", "/room/1"]) {
    const res = await get(path);
    expect(res.status, `GET ${path} without coming in`).toBe(303);
    expect(res.headers.get("location"), `GET ${path} without coming in`).toBe("/");
  }
});

it("lets anyone in at the door without any script", async () => {
  const d = await door();
  const form = d.querySelector("form[action='/me']");
  expect(form?.getAttribute("method")).toBe("post");
  const windows = [...form!.querySelectorAll<HTMLButtonElement>("button[name=who]")];
  expect(windows.length).toBe(5);
  for (const w of windows) expect(w.getAttribute("type") ?? "submit", `${text(w.querySelector(".name"))}'s window doesn't submit`).toBe("submit");
});

it("serves the house's own stylesheet, scripts and pictures", async () => {
  const html = await (await get("/")).text();
  const d = parse(html);
  const wanted = [
    ...[...d.querySelectorAll("link[rel=stylesheet]")].map((l) => l.getAttribute("href")!),
    ...[...d.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")!),
    ...[...d.querySelectorAll("img[src]")].map((i) => i.getAttribute("src")!),
    ...[...html.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]),
  ].filter((u) => u.startsWith("/"));
  expect(wanted.some((u) => u.startsWith("/art/house.jpg"))).toBe(true);
  const types: Record<string, RegExp> = { css: /^text\/css/, js: /javascript/, png: /^image\/png/, jpg: /^image\/jpeg/ };
  for (const u of new Set(wanted)) {
    const res = await get(u);
    expect(res.status, `GET ${u}`).toBe(200);
    const ext = new URL(u, baseUrl).pathname.split(".").pop()!;
    expect(res.headers.get("content-type"), `GET ${u}`).toMatch(types[ext]);
  }
});

// ADR 0033: "buid a webapp of this that renders like a mobile app in
// phone,so even distribution becaomes easy". An app page anyone with the
// address can open, a QR code that reads back as the house's address, a
// service worker at the house's own address, and a page for offline.
it("hands the house out as an app: a page to share and install from, a QR code that reads back, and a service worker", async () => {
  const res = await get("/app");
  expect(res.status, "the app page needs signing in").toBe(200);
  const page = parse(await res.text());
  expect(text(page.querySelector("h1"))).toBe("Five Windows");
  expect(page.querySelector(".app-install"), "there's nowhere for an Install button").not.toBeNull();
  expect(page.querySelectorAll("details.app-way").length, "not every kind of phone has its steps").toBe(5);
  const link = page.querySelector("button[data-share-link]")?.getAttribute("data-share-link") ?? "";
  expect(new URL(link).pathname, "it shares the wrong address").toBe("/");
  // The QR code: a grid of modules whose size fits a version 1-10 code.
  const qr = page.querySelector("svg.qr");
  expect(qr, "there's no QR code").not.toBeNull();
  const side = Number(qr?.getAttribute("viewBox")?.split(" ")[2]) - 8;
  expect((side - 17) % 4 === 0 && side >= 21 && side <= 57, `the QR code is ${side} modules, not a real size`).toBe(true);
  expect(page.querySelector("a[href='/']"), "no way in from the app page").not.toBeNull();
  // The door links to it.
  expect(parse(await (await get("/")).text()).querySelector("a[href='/app']"), "the door doesn't offer the app").not.toBeNull();

  const sw = await get("/sw.js");
  expect(sw.status).toBe(200);
  expect(sw.headers.get("cache-control"), "the service worker is kept, so a new one isn't found").toBe("no-cache");
  const code = await sw.text();
  expect(code, "the service worker doesn't know its house").toContain('const BASE = "";');
  // A page always comes from the house, the cache only when offline.
  expect(code, "the service worker serves pages from its cache").toContain('event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)');
  const offline = await get("/offline");
  expect(offline.status).toBe(200);
  expect(text(parse(await offline.text()).querySelector("h1"))).toContain("out of reach");
  const manifest = await (await get("/manifest.webmanifest")).json();
  expect(manifest.id, "the app has no id").toBe("/");
  expect((manifest.shortcuts as { url: string }[]).map((s) => s.url), "holding the icon offers nothing").toEqual(["/updates", "/movies", "/everyone"]);
});

// ADR 0032: "make the toggle visibile no matter where i am. The toggle
// should be there on the bottom corners of my screen not the page". A phone
// on its side gets the house filling the screen and the walking corners on
// the screen's own corners. ADR 0035: held upright, a phone still gets the
// house, never a page-wide cover. That's the marking phone viewport
// (390 x 844, touch), where 0032's cover left nothing but "Turn your phone
// sideways". The layout is CSS, so this checks what the page and stylesheet
// promise; the screenshots in the log show it.
it("gives a phone the house either way up, filling the screen on its side", async () => {
  const css = await (await get("/style.css")).text();
  const sideways = css.split("@media (pointer: coarse) and (orientation: landscape) and (max-height: 500px)")[1]?.split("\n}\n")[0] ?? "";
  expect(sideways, "there's no layout for a phone on its side").not.toBe("");
  // ADR 0039 (9 Nov): on a touch screen you walk by tapping where to go or
  // dragging yourself; the corner sticks, which followed a thumb across the
  // screen, are gone ("i dont like how the toggle is moving everywhere").
  expect(css, "a touch screen still shows the corner sticks").toMatch(/\.pad\.touch \.walk-corner,\s*\.pad\.touch \.stick \{[^}]*display: none !important/);
  const house = await (await get("/house.js")).text();
  expect(house, "the house can't be walked by a tap").toMatch(/Tap where to go/);
  expect(house, "a tap on the floor doesn't set where to walk").toMatch(/goal = \[/);
  // Upright: nothing in the stylesheet covers the whole screen.
  for (const block of css.split("@media (pointer: coarse) and (orientation: portrait)").slice(1)) {
    const body = block.split("\n}\n")[0];
    expect(body, "an upright phone gets something laid over the whole page").not.toMatch(/position: fixed;[^}]*inset: 0/);
  }
  const door = parse(await (await get("/")).text());
  expect(door.querySelector(".turn-phone"), "the page still carries a cover asking to be turned").toBeNull();
  expect(door.querySelector("[role=alert]"), "the door opens with an alert").toBeNull();
  expect(css, "an upright phone isn't told the house is all there sideways").toMatch(/@media \(pointer: coarse\) and \(orientation: portrait\)[^{]*\{[^@]*\.turn-hint \{[^}]*display: flex/);
});

it("can be added to a phone's home screen, Android or iPhone, with the house as its icon", async () => {
  const d = parse(await (await get("/")).text());
  const linked = d.querySelector("link[rel=manifest]")?.getAttribute("href");
  expect(linked, "Android has no manifest to install the house from").toBe("/manifest.webmanifest");
  const res = await get(linked!);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toMatch(/^application\/manifest\+json/);
  const manifest = await res.json();
  expect(manifest.name).toBe("Five Windows");
  expect(manifest.start_url, "the icon doesn't open the house").toBe("/");
  expect(manifest.display, "the icon opens a browser tab, not the house on its own").toBe("standalone");
  // Rithika, 5 Nov: "force only landscpae for phone because you can see the
  // house only then" (ADR 0032). Android keeps to it from the home screen.
  expect(manifest.orientation, "the house doesn't open sideways from the home screen").toBe("landscape");
  const sizes = (manifest.icons as { sizes: string }[]).map((i) => i.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");

  // iPhones don't read the manifest: they want their own icon and tags.
  const apple = d.querySelector("link[rel=apple-touch-icon]")?.getAttribute("href");
  expect(apple, "an iPhone has no icon for the home screen").toBeTruthy();
  expect(d.querySelector("meta[name=apple-mobile-web-app-capable]")?.getAttribute("content")).toBe("yes");
  expect(d.querySelector("meta[name=apple-mobile-web-app-title]")?.getAttribute("content")).toBe("Five Windows");
  for (const icon of [apple!, ...(manifest.icons as { src: string }[]).map((i) => i.src)]) {
    const png = await get(icon);
    expect(png.status, `GET ${icon}`).toBe(200);
    expect(png.headers.get("content-type"), `GET ${icon}`).toMatch(/^image\/png/);
  }
});

it("finds the README whether or not the address ends in a slash", async () => {
  const res = await get("/readme");
  expect(res.status).toBe(303);
  expect(res.headers.get("location")).toBe("/readme/");
});

it("answers a wrong turn with a page of its own and a way back", async () => {
  for (const path of ["/nowhere", "/room/9", "/updates/", "/README.md", "/art/nope.png", "/art/..%2f..%2fREADME.md", "/art/..%2fhouse.jpg"]) {
    const res = await get(path);
    expect(res.status, `GET ${path}`).toBe(404);
    expect(res.headers.get("content-type"), `GET ${path}`).toMatch(/^text\/html/);
    const d = parse(await res.text());
    expect(d.querySelector("link[href^='/style.css?v=']"), `GET ${path} isn't in the house's own look`).not.toBeNull();
    expect([...d.querySelectorAll("a")].some((a) => text(a) === "Go back"), `GET ${path} has no way back`).toBe(true);
  }
});

// BUG: an address with a doubled slash (`//`, `///`, `//?x`) crashes the handler (new URL in src/server.ts) and answers 500.
it("never stumbles over an extra slash in the address", async () => {
  const root = baseUrl.replace(/\/+$/, "");
  for (const path of ["//", "///", "//?x"]) {
    const res = await fetch(root + path, { redirect: "manual" });
    expect(res.status, `GET ${path}`).toBeLessThan(500);
  }
});

// A phone kept yesterday's walking under today's page (4 November): the
// page asks for its stylesheet and scripts by a fingerprint, so a changed
// file is a new address, and one asked for without it is checked every time.
it("never leaves a browser running yesterday's scripts under today's page", async () => {
  const door = parse(await (await get("/")).text());
  const own = [door.querySelector("link[rel=stylesheet][href^='/style.css']")?.getAttribute("href"), ...[...door.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"))];
  expect(own.filter((src) => /^\/(style\.css|house\.js|live\.js)/.test(src ?? "")).length, "the page's own files are missing").toBe(3);
  for (const src of own) {
    expect(src, `${src} has no fingerprint`).toMatch(/\?v=[0-9a-f]{10}$/);
    expect((await get(src!)).headers.get("cache-control"), `${src} isn't kept`).toContain("immutable");
  }
  for (const path of ["/style.css", "/house.js", "/live.js"]) expect((await get(path)).headers.get("cache-control"), `${path} on its own is kept stale`).toBe("no-cache");
});

it("answers a HEAD like a GET, without a body", async () => {
  for (const path of ["/", "/readme/", "/style.css", "/live.js", "/art/house.jpg", "/nowhere"]) {
    const [g, h] = [await get(path), await get(path, undefined, { method: "HEAD" })];
    expect(h.status, `HEAD ${path}`).toBe(g.status);
    expect(h.headers.get("content-type"), `HEAD ${path}`).toBe(g.headers.get("content-type"));
    expect(await h.text(), `HEAD ${path} sent a body`).toBe("");
  }
});

// BUG: HEAD /live is treated as GET /live, opens an event stream and never answers, not even with headers.
it.skip("answers a HEAD for the live line straight away", async () => {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 3000);
  const answered = await get("/live", undefined, { method: "HEAD", signal: stop.signal }).then(
    (res) => res.status,
    () => undefined,
  );
  clearTimeout(timer);
  expect(answered, "HEAD /live didn't answer within 3 seconds").toBeDefined();
});

it("turns away methods the house doesn't use", async () => {
  for (const path of ["/", "/me", "/leave", "/wall", "/readme/"]) {
    for (const method of ["PUT", "DELETE", "PATCH", "OPTIONS"]) {
      const res = await get(path, undefined, { method, headers: { "content-type": "application/x-www-form-urlencoded" }, body: method === "OPTIONS" ? undefined : "who=1" });
      expect(res.status, `${method} ${path}`).toBeGreaterThanOrEqual(400);
      expect(res.status, `${method} ${path}`).toBeLessThan(500);
      expect(sessionOf(res), `${method} ${path} signed someone in`).toBeUndefined();
    }
  }
});

/* ---------- coming in and going out (signs people in) ---------- */

describe.skipIf(!throwaway)("the front door", () => {
  it("lets an open door see a window shut the moment someone comes in", async () => {
    const five = await people();
    const her = five[0];
    await signOut(her.id);
    const d = await door();
    expect(d.querySelector("[data-live='door'] button[name=who]"), "the door's windows aren't a live part of the page").not.toBeNull();

    const open = await listen();
    await sleep(300);
    open.clear();
    const res = await signIn(her.id);
    expect(res.status).toBe(303);
    sessions.set(her.id, sessionOf(res)!);
    for (let i = 0; i < 30 && !open.heard().includes("event: changed"); i++) await sleep(100);
    await open.stop();
    expect(open.heard(), `an open door never heard ${her.name} come in`).toContain("event: changed");
    const after = await door();
    expect(pane(after, her.id)?.disabled).toBe(true);
    expect(pane(after, her.id)?.classList.contains("taken")).toBe(true);
  });

  it("won't let a forged or altered cookie in as anyone", async () => {
    const five = await people();
    const [a, b] = five;
    const mine = await cookieFor(a.id);
    const token = mine.split(".")[1];
    const forged = [
      `who=${b.id}.${token}`, // her own token, but someone else's window
      `who=${a.id}.${randomUUID()}`,
      `who=${a.id}.${token.toUpperCase()}`,
      `who=${a.id}.${token}x`,
      `who=${a.id}.`,
      `who=.${token}`,
      `who=${a.id}`,
    ];
    for (const cookie of forged) {
      expect(atTheDoor(await door(cookie)), `${cookie} got into the house`).toBe(true);
      const res = await get("/wall", cookie, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "body=forged" });
      expect(res.status, `${cookie} could pin a note up`).toBe(403);
    }
    expect(atTheDoor(await door(mine)), "the real cookie stopped working").toBe(false);
  });

  it("lets go of a friend only when whoever is her says so", async () => {
    const five = await people();
    const [a, b] = five;
    const mine = await cookieFor(a.id);
    const token = mine.split(".")[1];
    for (const cookie of [`who=${a.id}`, `who=${a.id}.${randomUUID()}`, `who=${b.id}.${token}`]) {
      expect((await leave(cookie)).status).toBe(303);
    }
    expect(pane(await door(), a.id)?.disabled, `someone else let go of ${a.name}`).toBe(true);
    expect(atTheDoor(await door(mine)), `${a.name} was sent back to the door by someone else`).toBe(false);
  });

  it("never signs anyone in or out from a plain link", async () => {
    const five = await people();
    const [a, , c] = five;
    await signOut(c.id);
    const res = await get(`/me?who=${c.id}`);
    expect(res.status).toBe(404);
    expect(sessionOf(res)).toBeUndefined();
    expect(pane(await door(), c.id)?.disabled, `a link let someone in as ${c.name}`).toBe(false);

    const mine = await cookieFor(a.id);
    expect((await get("/leave", mine)).status).toBe(404);
    expect(atTheDoor(await door(mine)), `a link sent ${a.name} back to the door`).toBe(false);
  });

  it("turns away anyone who isn't one of the five at the door", async () => {
    for (const who of ["", "0", "6", "intruder", "1.x", " 1", "<b>1</b>"]) {
      const res = await signIn(who);
      expect(res.status, `who=${JSON.stringify(who)}`).toBe(400);
      expect(sessionOf(res), `who=${JSON.stringify(who)} set a cookie`).toBeUndefined();
    }
  });

  it("keeps you as yourself when the friend you pick is already home", async () => {
    const five = await people();
    const [a, b] = five;
    const mine = await cookieFor(a.id);
    await cookieFor(b.id);
    const res = await signIn(b.id, mine);
    expect(res.status).toBe(409);
    expect(sessionOf(res)).toBeUndefined();
    const home = await door(mine);
    expect(atTheDoor(home), `${a.name} was sent back to the door`).toBe(false);
    expect(text(home.querySelector(".greeting"))).toContain(a.name);
    expect(pane(await door(), a.id)?.disabled, `${a.name}'s window opened`).toBe(true);
  });

  it("lets go of who you were when you come in as someone else", async () => {
    const five = await people();
    const [a, , c] = five;
    await signOut(c.id);
    const was = await cookieFor(a.id);
    const res = await signIn(c.id, was);
    expect(res.status).toBe(303);
    const now = sessionOf(res);
    expect(now).toBeDefined();
    sessions.delete(a.id);
    sessions.set(c.id, now!);

    const d = await door();
    expect(pane(d, a.id)?.disabled, `${a.name}'s window is still shut`).toBe(false);
    expect(pane(d, c.id)?.disabled).toBe(true);
    expect(atTheDoor(await door(was)), `the old cookie is still ${a.name}`).toBe(true);
    expect(text((await door(now)).querySelector(".greeting"))).toContain(c.name);
  });

  // Rithika, 5 Nov: "idk why im making the mistake of loggin in as some
  // other person everytime" (ADR 0034). Coming in says who you are, once,
  // with your sticker; a plain page load doesn't.
  it("says who you are as you come in, once, and not on every page", async () => {
    const five = await people();
    const b = five[4];
    await signOut(b.id);
    const res = await signIn(b.id);
    expect(res.status, `couldn't come in as ${b.name}`).toBe(303);
    expect(res.headers.get("location"), "coming in doesn't land on the greeting").toBe("/?hi=1");
    const cookie = sessionOf(res)!;
    const hi = parse(await (await fetch(new URL("/?hi=1", baseUrl), { headers: { cookie } })).text());
    expect(text(hi.querySelector(".hi-there")), "coming in doesn't say who you are").toContain(`Hi ${b.name}`);
    expect(hi.querySelector(".hi-there img"), "the greeting has no sticker").not.toBeNull();
    expect(hi.querySelector(".hi-there form[action='/leave'] button"), "there's no way to change who you are from it").not.toBeNull();
    const plain = parse(await (await fetch(new URL("/", baseUrl), { headers: { cookie } })).text());
    expect(plain.querySelector(".hi-there"), "every page load says hi").toBeNull();
    const live = parse(await (await fetch(new URL("/?hi=1", baseUrl), { headers: { cookie, "x-live": "1" } })).text());
    expect(live.querySelector(".hi-there"), "a live refresh says hi again").toBeNull();
    sessions.set(b.id, cookie);
    await signOut(b.id);
  });

  it("changes nothing when you pick yourself again", async () => {
    const five = await people();
    const [a] = five;
    const mine = await cookieFor(a.id);
    const res = await signIn(a.id, mine);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/?hi=1");
    expect(sessionOf(res), "picking yourself again handed out a new session").toBeUndefined();
    expect(atTheDoor(await door(mine))).toBe(false);
  });

  it("lets only one of many people pressing the same window at once in", async () => {
    const five = await people();
    const her = five[1];
    await signOut(her.id);
    const answers = await Promise.all(Array.from({ length: 20 }, () => signIn(her.id)));
    const statuses = answers.map((r) => r.status);
    expect(statuses.filter((s) => s === 303).length, `statuses: ${statuses.join(",")}`).toBe(1);
    expect(statuses.filter((s) => s === 409).length).toBe(19);
    sessions.set(her.id, sessionOf(answers.find((r) => r.status === 303)!)!);
  });

  // Fixed 7 Nov (RICE K): the Everyone tab shuts "Come in as" for a friend
  // who's in the house, as the door shuts her window, instead of a 409.
  it("never offers to come in as a friend who's already home", async () => {
    const five = await people();
    const [a, b] = five;
    const mine = await cookieFor(a.id);
    await cookieFor(b.id);
    const tab = parse(await (await get("/everyone", mine)).text());
    const offer = tab.querySelector<HTMLButtonElement>(`form[action='/me'] button[name=who][value="${b.id}"]`);
    expect(offer === null || offer.disabled, `the Everyone tab offers to come in as ${b.name} while she's in the house`).toBe(true);
  });

  // The two-minute window. These wait it out, side by side, each with a friend
  // of her own; nothing else in the house writes while the third one listens,
  // so whatever the open door hears is about her.
  const TWO_MINUTES = 2 * 60 * 1000;

  it.concurrent("holds a friend's window for two minutes after her last page, then lets someone else be her", async ({ expect }) => {
    const her = (await people())[2];
    await signOut(her.id);
    const start = Date.now();
    const first = sessionOf(await signIn(her.id));
    expect(first).toBeDefined();
    sessions.set(her.id, first!);
    expect((await get("/", first)).status).toBe(200);

    await sleep(start + 100_000 - Date.now());
    expect((await signIn(her.id)).status, `${her.name}'s window opened before two minutes were up`).toBe(409);

    // Well past two minutes, and after the open door below has done listening.
    await sleep(start + 155_000 - Date.now());
    const second = await signIn(her.id);
    expect(second.status, `${her.name}'s window never opened again`).toBe(303);
    sessions.set(her.id, sessionOf(second)!);
    expect(atTheDoor(await door(first)), "the browser that had her is still in").toBe(true);
  }, 200_000);

  it.concurrent("keeps her window shut for as long as she has the house open", async ({ expect }) => {
    const her = (await people())[3];
    await signOut(her.id);
    const start = Date.now();
    const mine = sessionOf(await signIn(her.id));
    expect(mine).toBeDefined();
    sessions.set(her.id, mine!);
    // A page load first, so the live line keeping her home isn't news to anyone.
    expect((await get("/", mine)).status).toBe(200);
    const open = await listen(mine);

    await sleep(start + TWO_MINUTES + 5_000 - Date.now());
    expect((await signIn(her.id)).status, `someone got in as ${her.name} while she had the house open`).toBe(409);

    await sleep(start + 155_000 - Date.now());
    await open.stop();
  }, 200_000);

  // BUG: nothing tells open pages when a window opens because two minutes ran out, so the door keeps showing her window shut until someone happens to do something.
  it.concurrent.skip("lights a window back up on an open door once she's been gone two minutes", async ({ expect }) => {
    const her = (await people())[4];
    await signOut(her.id);
    const open = await listen();
    const came = await signIn(her.id);
    const start = Date.now();
    expect(came.status).toBe(303);
    sessions.set(her.id, sessionOf(came)!);
    // She never loads a page or opens the house, so her window opens two
    // minutes after she came in.
    await sleep(3_000);
    open.clear();
    while (!open.heard().includes("event: changed") && Date.now() < start + 150_000) await sleep(500);
    const heard = open.heard();
    await open.stop();
    expect(pane(await door(), her.id)?.disabled, `${her.name}'s window is still shut on a fresh door`).toBe(false);
    expect(heard, `an open door never heard ${her.name}'s window open again`).toContain("event: changed");
  }, 200_000);
});
