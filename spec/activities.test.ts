import { JSDOM } from "jsdom";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, inject, it } from "vitest";

// The things to do in Rithika's house at `/`, one friend at a time, checked
// against the running app over HTTP: what spec/house.test.ts doesn't already
// check about the wall, desks, kitchen, kettle, garden, Shinzo and movies.
const baseUrl = inject("baseUrl");

// These checks leave things behind, so they only run against a throwaway
// house (CI's container, a local run), never the friends' real one on Fly.
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

type Person = { id: string; name: string };

const parse = (html: string): Document => new JSDOM(html).window.document;

function signIn(id: string): Promise<Response> {
  return fetch(new URL("/me", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ who: id }),
    redirect: "manual",
  });
}

const sessionOf = (res: Response): string | undefined =>
  res.headers.getSetCookie().find((c) => c.startsWith("who="))?.split(";")[0];

// One session per friend for the whole run, let go of at the end so the next
// run can come in.
const sessions = new Map<string, string>();

async function cookieFor(who: string): Promise<string> {
  const known = sessions.get(who);
  if (known) return known;
  const res = await signIn(who);
  if (res.status === 409) throw new Error(`someone else is in the house as ${who}; their window opens two minutes after they leave`);
  const cookie = sessionOf(res);
  if (!cookie) return `who=${who}`;
  sessions.set(who, cookie);
  return cookie;
}

afterAll(async () => {
  for (const [who, cookie] of [...sessions]) {
    sessions.delete(who);
    await fetch(new URL("/leave", baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
  }
});

async function page(path: string, who?: string): Promise<Document> {
  const res = await fetch(new URL(path, baseUrl), { headers: who ? { cookie: await cookieFor(who) } : {} });
  expect(res.status, `GET ${path}`).toBe(200);
  return parse(await res.text());
}

async function post(path: string, fields: Record<string, string>, who?: string): Promise<Response> {
  return fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(who ? { cookie: await cookieFor(who) } : {}),
    },
    body: new URLSearchParams(fields),
    redirect: "manual",
  });
}

async function people(): Promise<Person[]> {
  const door = await page("/");
  return [...door.querySelectorAll<HTMLButtonElement>("button[name=who]")].map((b) => ({
    id: b.value,
    name: b.querySelector(".name")?.textContent ?? "",
  }));
}

const text = (el: Element | null | undefined): string => el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const withText = (doc: Document, selector: string, needle: string): Element | undefined =>
  [...doc.querySelectorAll(selector)].find((el) => text(el).includes(needle));

const unique = (label: string): string => `${label} ${Date.now()}-${Math.random().toString(36).slice(2)}`;

// `label`, padded out to exactly `length` characters.
const ofLength = (label: string, length: number): string => label.slice(0, length).padEnd(length, "x");

// Some promises hang on days passing or on a visit ending half an hour ago,
// which a spec run can't wait for. Those are asked of the house's own code,
// with things and visits made up here. It loads beside a scratch DATA_DIR
// (src/houses.ts opens houses.db there on import), never ./data.
let scratch = false;
async function fromSrc() {
  if (!scratch) process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "five-windows-spec-"));
  scratch = true;
  const [house, pages, people] = await Promise.all([import("../src/house.ts"), import("../src/pages.ts"), import("../src/people.ts")]);
  return { ...house, ...pages, ...people };
}

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

// BUG: a garden whose only plant went in just now looks thirsty if the last watering was over two days ago
it("never shows a just-planted garden as thirsty", async () => {
  const { thirsty } = await fromSrc();
  const now = Date.now();
  const thing = (id: number, kind: "plant" | "water", author: string, ago: number, item = "") =>
    ({ id, author, kind, place: "garden", body: "", item, createdAt: now - ago });
  // Newest first, as the house keeps them: Aswathy plants tulsi now, three
  // days after anyone last watered (nothing was growing then).
  expect(thirsty([thing(2, "plant", "5", 0, "tulsi"), thing(1, "water", "1", 3 * DAY)], now), "a sprout planted a moment ago already looks thirsty").toBe(false);
});

// Neha, back an hour after her last visit ended.
async function nehaBack(things: { id: number; author: string; kind: "note" | "sticker"; place: string; body: string; item: string; createdAt: number }[], seen: [string, number][]) {
  const src = await fromSrc();
  const now = Date.now();
  return { src, visit: { me: src.personById("2")!, things, seen: new Map(seen), where: new Map(), arrived: new Map(), spots: new Map(), seenUntil: now - 60 * MINUTE, now } };
}

// BUG: news() counts only things left, while the card beside it counts visits, so they contradict each other
it("tells you the same thing at the top of Home as in while you were away", async () => {
  const now = Date.now();
  // Rithika came by five minutes ago and left nothing.
  const { src, visit } = await nehaBack([], [["1", now - 5 * MINUTE], ["2", now - 60 * MINUTE]]);
  const home = parse(src.housePage(visit));
  expect(text(home.querySelector(".away")), "the card should say Rithika came by").toContain("Rithika came by");
  expect(text(home.querySelector(".news")), "the line at the top says nobody came by").not.toContain("Nobody's been by");
});

// BUG: the Updates dot counts any new row, but a sticker on someone else's note lists nothing
it("only puts the dot on Updates when there's something new to read there", async () => {
  const now = Date.now();
  // Rithanya stuck a sticker on Rithika's old note, which is Rithika's news.
  const note = { id: 1, author: "1", kind: "note" as const, place: "wall", body: "old news", item: "", createdAt: now - 120 * MINUTE };
  const sticker = { id: 2, author: "4", kind: "sticker" as const, place: "note:1", body: "", item: "love", createdAt: now - 5 * MINUTE };
  const { src, visit } = await nehaBack([sticker, note], [["2", now - 60 * MINUTE]]);
  const updates = parse(src.updatesPage(visit));
  const lines = updates.querySelectorAll(".away .happenings li").length;
  expect(updates.querySelector(".tabs .dot") !== null, `the dot is ${lines ? "missing" : "on"} with ${lines} new lines listed`).toBe(lines > 0);
});

describe.skipIf(!throwaway)("doing things around the house", () => {
  it("keeps older notes in the memory box once the wall fills up, rather than taking them down", async () => {
    const [a, b] = await people();
    const first = unique("an old note for the memory box");
    await post("/wall", { body: first }, a.id);
    // The wall shows the newest 24 everyday notes.
    for (let i = 0; i < 24; i++) await post("/wall", { body: unique(`a newer note ${i}`) }, a.id);

    const living = await page("/living", b.id);
    const kept = withText(living, "#memory-box .note", first);
    expect(kept, "the oldest note was taken down instead of kept in the memory box").toBeDefined();
    expect(text(kept)).toContain(a.name);
  });

  it("lets a friend peel her sticker off a note, and the writer stops hearing about it", async () => {
    const [a, b] = await people();
    const note = unique("peel me");
    await post("/wall", { body: note }, a.id);
    const id = withText(await page("/living", b.id), ".note", note)?.getAttribute("data-id");
    expect(id, "the note never made it onto the wall").toBeTruthy();

    await post("/wall/sticker", { note: id!, sticker: "yay" }, b.id);
    expect(text(withText(await page("/living", a.id), ".note", note)?.querySelector(".stickers"))).toContain(b.name);
    // The sticker she already stuck is the button that peels it off.
    const peel = withText(await page("/living", b.id), ".note", note)!.querySelector<HTMLButtonElement>("button[aria-pressed=true]");
    expect(peel?.value, "her own sticker isn't offered as the one to peel off").toBe("");
    expect((await post("/wall/sticker", { note: id!, sticker: "" }, b.id)).status).toBe(303);

    expect(withText(await page("/living", a.id), ".note", note)!.querySelector(".sticker"), "the sticker is still on the note").toBeNull();
    expect(text((await page("/updates", a.id)).querySelector(".away")), "the writer still hears about a peeled-off sticker").not.toContain(note);
  });

  // BUG: a second batch of kettle Maggi replaces the first, and its note goes with it
  it("keeps a friend's kettle Maggi note in the room after someone else makes more", async () => {
    const five = await people();
    const amirdha = five.find((p) => p.name === "Amirdhavarshini")!;
    const [first, second] = five.filter((p) => p !== amirdha);
    const note = unique("made extra, come sit");
    expect((await post(`/room/${amirdha.id}/kettle`, { body: note }, first.id)).status).toBe(303);
    expect((await post(`/room/${amirdha.id}/kettle`, { body: "" }, second.id)).status).toBe(303);

    const room = await page(`/room/${amirdha.id}`, amirdha.id);
    expect(text(room.body), `${first.name}'s note left with the Maggi is gone before ${amirdha.name} could read it`).toContain(note);
  });

  // BUG: Updates shows 40 lines, then links to itself for "more", so the rest can never be seen
  it("lets you reach everything that happened while you were away from Updates", async () => {
    const [a, b] = await people();
    const titles = Array.from({ length: 41 }, (_, i) => unique(`Movie ${i}`));
    for (const title of titles) await post("/movies", { title }, a.id);

    const updates = await page("/updates", b.id);
    let shown = text(updates.querySelector(".away"));
    const more = updates.querySelector<HTMLAnchorElement>(".away .more a")?.getAttribute("href");
    if (more && more !== "/updates") shown += text((await page(more, b.id)).body);
    const missing = titles.filter((t) => !shown.includes(t));
    expect(missing, `${missing.length} of ${a.name}'s suggestions can't be found from Updates`).toEqual([]);
  });

  // BUG: the writer's line cuts her note at 40 UTF-16 units, splitting an emoji into a stray "�"
  it("quotes your note intact when a friend stickers it, emoji and all", async () => {
    const [a, b] = await people();
    // 39 characters, then an emoji straddling the 40th.
    const note = `${ofLength(unique("so"), 39)}🥹 and the rest of the news`;
    await post("/wall", { body: note }, a.id);
    const id = withText(await page("/living", b.id), ".note", note.slice(0, 39))?.getAttribute("data-id");
    expect(id, "the note never made it onto the wall").toBeTruthy();
    await post("/wall/sticker", { note: id!, sticker: "love" }, b.id);

    const line = withText(await page("/updates", a.id), ".away li", note.slice(0, 39));
    expect(line, `${a.name} didn't hear about the sticker`).toBeDefined();
    expect(text(line), "the note is quoted with a broken character").not.toContain("�");
  });

  // BUG: text() only trims whitespace, so a note of zero-width spaces or NULs is pinned up blank
  it("won't pin up a note with nothing you can see on it", async () => {
    const [a] = await people();
    expect((await post("/wall", { body: "​​" }, a.id)).status, "a note of zero-width spaces was pinned up").toBe(400);
    expect((await post("/wall", { body: "\u0000" }, a.id)).status, "a note of NUL characters was pinned up").toBe(400);
  });

  it("keeps a note as long as its box allows, and turns away one that's longer", async () => {
    const five = await people();
    const [a, b] = five;
    const amirdha = five.find((p) => p.name === "Amirdhavarshini")!;
    const visitor = five.find((p) => p !== amirdha)!;
    // Each box on the page, and how the house takes what's written in it.
    const boxes: { page: string; box: string; to: string; field: string; who: string; extra?: Record<string, string> }[] = [
      { page: "/living", box: "form[action='/wall'] textarea[name=body]", to: "/wall", field: "body", who: a.id },
      { page: `/room/${b.id}`, box: `form[action='/room/${b.id}/leave'] textarea[name=body]`, to: `/room/${b.id}/leave`, field: "body", who: a.id },
      { page: "/kitchen", box: "form[action='/kitchen'] textarea[name=body]", to: "/kitchen", field: "body", who: a.id, extra: { item: "dosa" } },
      { page: `/room/${amirdha.id}`, box: `form[action='/room/${amirdha.id}/kettle'] textarea[name=body]`, to: `/room/${amirdha.id}/kettle`, field: "body", who: visitor.id },
      { page: "/movies", box: "form[action='/movies'] input[name=title]", to: "/movies", field: "title", who: a.id },
      { page: "/movies", box: "form[action='/movies'] textarea[name=why]", to: "/movies", field: "why", who: a.id, extra: { title: unique("a movie with a long why") } },
    ];
    for (const { page: path, box, to, field, who, extra = {} } of boxes) {
      const max = Number((await page(path, who)).querySelector(box)?.getAttribute("maxlength"));
      expect(max, `${box} on ${path} has no limit`).toBeGreaterThan(0);
      const fits = ofLength(unique("fits"), max);
      expect((await post(to, { ...extra, [field]: fits }, who)).status, `${to} turned away a ${field} that fits its box`).toBe(303);
      expect((await post(to, { ...extra, [field]: `${fits}x` }, who)).status, `${to} kept a ${field} longer than its box`).toBe(400);
    }
  });

  it("won't plan a movie night for a time that's already gone, or a day that doesn't exist", async () => {
    const [a, b] = await people();
    const title = unique("Before Sunrise");
    await post("/movies", { title }, a.id);
    const id = withText(await page("/movies", a.id), ".movie", title)!.getAttribute("data-id")!;

    expect((await post("/movies/night", { movie: id, when: "2020-01-05T20:00" }, a.id)).status, "planned a movie night six years ago").toBe(400);
    expect((await post("/movies/night", { movie: id, when: "2031-02-30T20:00" }, a.id)).status, "planned a movie night on 30 February").toBe(400);
    expect((await post("/movies/night", { movie: id, when: "tonight" }, a.id)).status).toBe(400);
    expect(text((await page("/movies", b.id)).querySelector(".night")), "a refused plan shows as movie night").not.toContain(title);
  });

  it("only takes things the house actually has, even ones named like JavaScript's own", async () => {
    const [a, b] = await people();
    for (const name of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect((await post("/kitchen", { item: name }, a.id)).status, `cooked "${name}"`).toBe(400);
      expect((await post("/garden/plant", { item: name }, a.id)).status, `planted "${name}"`).toBe(400);
      expect((await post(`/room/${b.id}/leave`, { item: name }, a.id)).status, `left "${name}" on a desk`).toBe(400);
      expect((await post("/sit", { seat: name }, a.id)).status, `sat on "${name}"`).toBe(400);
      expect((await post("/wall/sticker", { note: name, sticker: "love" }, a.id)).status, `stickered note "${name}"`).toBe(400);
    }
    // A dish is on the counter, not on the wall: it can't take a sticker.
    const dish = unique("not a note");
    await post("/kitchen", { item: "mango", body: dish }, b.id);
    const dishId = withText(await page("/kitchen", a.id), ".dish", dish)!.getAttribute("data-id")!;
    expect((await post("/wall/sticker", { note: dishId, sticker: "love" }, a.id)).status, "stuck a sticker on a dish").toBe(400);
  });

  it("keeps you on a page in the house after petting Shinzo, wherever the form says you were", async () => {
    const [, b] = await people();
    for (const at of ["//elsewhere.example", "https://elsewhere.example", "constructor", "room:9"]) {
      const res = await post("/garden/dog", { at }, b.id);
      expect(res.status).toBe(303);
      expect(res.headers.get("location"), `petting Shinzo "at ${at}" sent her somewhere else`).toBe("/garden?did=play");
    }
  });

  it("only says the house's own lines after you do something, whatever the address says", async () => {
    const [a] = await people();
    for (const did of ["<script>alert(1)</script>", "toString", "__proto__", "nothing"]) {
      const living = await page(`/living?did=${encodeURIComponent(did)}`, a.id);
      expect(living.querySelector(".done"), `?did=${did} says something was done`).toBeNull();
      expect(living.querySelector(".house-svg .pops"), `?did=${did} pops something up`).toBeNull();
      expect(living.querySelector("main script"), `?did=${did} put a script on the page`).toBeNull();
    }
  });
});
