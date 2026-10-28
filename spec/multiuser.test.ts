import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

// The house when two to five friends are in it at once: live news reaching
// the right pages, everyone's steps, and two friends acting at the same
// moment. Checked against the running app over HTTP, like spec/house.test.ts.
//
// These run in made houses (ADR 0017), each with its own five. Rithika's
// five are signed in by spec/house.test.ts for its whole run, and vitest runs
// the two files side by side, so signing them in here too would turn one or
// the other away at the door.
const baseUrl = inject("baseUrl");

// These checks leave things behind and mark people as having visited, so they
// only run against a throwaway house (CI's container, a local run), never the
// friends' real one on Fly.
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

type Person = { id: string; name: string };

const parse = (html: string): Document => new JSDOM(html).window.document;

// Coming in at a house's door as one of its five, the way a browser does.
function signIn(id: string, base: string): Promise<Response> {
  return fetch(new URL(`${base}/me`, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ who: id }),
    redirect: "manual",
  });
}

const sessionOf = (res: Response): string | undefined =>
  res.headers.getSetCookie().find((c) => c.startsWith("who="))?.split(";")[0];

// One session per friend per house for the whole run, let go of at the end.
const sessions = new Map<string, string>();
const keyOf = (base: string, who: string): string => `${base}|${who}`;

async function cookieFor(who: string, base: string): Promise<string> {
  const known = sessions.get(keyOf(base, who));
  if (known) return known;
  const res = await signIn(who, base);
  if (res.status === 409) throw new Error(`someone else is in ${base} as ${who}; their window opens two minutes after they leave`);
  const cookie = sessionOf(res);
  if (!cookie) throw new Error(`couldn't come in as ${who} at ${base} (HTTP ${res.status})`);
  sessions.set(keyOf(base, who), cookie);
  return cookie;
}

async function signOut(who: string, base: string): Promise<void> {
  const cookie = sessions.get(keyOf(base, who));
  sessions.delete(keyOf(base, who));
  if (cookie) await fetch(new URL(`${base}/leave`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
}

afterAll(async () => {
  for (const key of [...sessions.keys()]) {
    const [base, who] = key.split("|");
    await signOut(who, base);
  }
});

async function page(path: string, who: string, base: string): Promise<Document> {
  const res = await fetch(new URL(`${base}${path}`, baseUrl), { headers: { cookie: await cookieFor(who, base) } });
  expect(res.status, `GET ${base}${path}`).toBe(200);
  return parse(await res.text());
}

async function post(path: string, fields: Record<string, string>, who: string, base: string): Promise<Response> {
  return fetch(new URL(`${base}${path}`, baseUrl), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: await cookieFor(who, base) },
    body: new URLSearchParams(fields),
    redirect: "manual",
  });
}

async function people(base: string): Promise<Person[]> {
  const door = parse(await (await fetch(new URL(`${base}/`, baseUrl))).text());
  return [...door.querySelectorAll<HTMLButtonElement>("button[name=who]")].map((b) => ({
    id: b.value,
    name: b.querySelector(".name")?.textContent ?? "",
  }));
}

const text = (el: Element | null | undefined): string => el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const unique = (label: string): string => `${label} ${Date.now()}-${Math.random().toString(36).slice(2)}`;

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// Making a house the way the form does, as a visitor of its own each time.
async function makeHouse(): Promise<string> {
  const fields = new URLSearchParams();
  ["Ivy", "Rae", "Kit", "Bo", "Dee"].forEach((name, i) => fields.set(`name-${i + 1}`, name));
  const res = await fetch(new URL("/make", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "fly-client-ip": unique("multiuser") },
    body: fields,
    redirect: "manual",
  });
  const code = res.status === 201 ? (await res.text()).match(/\/h\/([a-z0-9]{10})\//)?.[1] : undefined;
  if (!code) throw new Error(`the house wasn't made (HTTP ${res.status})`);
  return `/h/${code}`;
}

// An open page's live line (GET /live): every event it hears, as it hears it.
type Heard = { event: string; data: Record<string, unknown> };

function listen(path: string, cookie?: string): { heard: () => Heard[]; clear: () => void; stop: () => Promise<void> } {
  const stop = new AbortController();
  let raw = "";
  const reading = (async () => {
    try {
      const res = await fetch(new URL(path, baseUrl), { headers: cookie ? { cookie } : {}, signal: stop.signal });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }
    } catch {
      // the page closed
    }
  })();
  return {
    heard: () =>
      raw
        .split("\n\n")
        .filter((e) => e.startsWith("event: "))
        .map((e) => ({ event: e.split("\n")[0].slice("event: ".length), data: JSON.parse(e.split("data: ")[1] ?? "{}") })),
    clear: () => void (raw = ""),
    stop: async () => {
      stop.abort();
      await reading;
    },
  };
}

async function until(done: () => boolean, ms = 5000): Promise<void> {
  for (const end = Date.now() + ms; !done() && Date.now() < end; ) await wait(50);
}

describe.skipIf(!throwaway)("two to five friends in the house at once", () => {
  // One house for these checks (a made house's five), so a run makes only a
  // couple of houses and stays well under the maker's hourly cap.
  let base = "";
  let five: Person[] = [];

  beforeAll(async () => {
    base = await makeHouse();
    five = await people(base);
  });

  // Everyone else goes off to the kitchen, so only `sitting` are on the mat
  // in room 3 (Amirdhavarshini's in Rithika's house; the same mat in a made one).
  async function onlyOnTheMat(sitting: Person[]): Promise<void> {
    for (const p of five) if (!sitting.includes(p)) await page("/kitchen", p.id, base);
    for (const p of sitting) expect((await post("/sit", { seat: "mat" }, p.id, base)).status).toBe(303);
  }

  async function dealt(by: Person): Promise<string> {
    expect((await post("/uno", {}, by.id, base)).status, `${by.name} couldn't deal`).toBe(303);
    return (await page("/uno", by.id, base)).querySelector("input[name=game]")!.getAttribute("value")!;
  }

  const hand = (doc: Document): number => doc.querySelectorAll(".uno-hand .in-hand").length;

  it("keeps each house's live news to that house", async () => {
    const other = await makeHouse();
    const [a, b] = five;
    // Everyone's come in and loaded a page, so coming home isn't what's heard.
    await page("/", a.id, base);
    await page("/", b.id, base);
    await page("/", "1", other);
    const ours = listen(`${base}/live`, await cookieFor(a.id, base));
    const theirs = listen(`${other}/live`, await cookieFor("1", other));
    const rithikas = listen("/live");
    await wait(500);
    for (const l of [ours, theirs, rithikas]) l.clear();

    expect((await post("/here", { x: "1250", y: "300" }, b.id, base)).status).toBe(204);
    expect((await post("/wall", { body: unique("only for this house") }, b.id, base)).status).toBe(303);
    await until(() => ours.heard().some((e) => e.event === "moved") && ours.heard().some((e) => e.event === "changed"));
    await wait(300);
    for (const l of [ours, theirs, rithikas]) await l.stop();

    expect(ours.heard().find((e) => e.event === "moved")?.data, `${a.name} never saw ${b.name} walk`).toMatchObject({ person: b.id, x: 1250, y: 300 });
    expect(ours.heard().map((e) => e.event), `${a.name} never heard ${b.name} write on the wall`).toContain("changed");
    expect(theirs.heard(), "another made house heard what happened in this one").toEqual([]);
    expect(rithikas.heard(), "Rithika's house heard what happened in a made house").toEqual([]);
    await signOut("1", other);
  });

  it("shows everyone who's in where each of the others walks, when all five walk at once", async () => {
    for (const p of five) await page("/garden", p.id, base);
    const lines = await Promise.all(five.map(async (p) => listen(`${base}/live`, await cookieFor(p.id, base))));
    await wait(500);
    for (const l of lines) l.clear();

    const spots: [number, number][] = [[1200, 300], [1260, 330], [1230, 280], [1290, 320], [1215, 345]];
    const steps = await Promise.all(five.map((p, i) => post("/here", { x: String(spots[i][0]), y: String(spots[i][1]) }, p.id, base)));
    expect(steps.map((r) => r.status)).toEqual([204, 204, 204, 204, 204]);
    const all = (l: ReturnType<typeof listen>): boolean => five.every((p) => l.heard().some((e) => e.event === "moved" && e.data.person === p.id));
    await until(() => lines.every(all));
    for (const l of lines) await l.stop();

    five.forEach((me, k) => {
      for (const [i, p] of five.entries()) {
        const step = lines[k].heard().find((e) => e.event === "moved" && e.data.person === p.id);
        expect(step?.data, `${me.name}'s open page never saw ${p.name} walk`).toMatchObject({ x: spots[i][0], y: spots[i][1] });
      }
    });
    // And the house kept every one of them where she stopped.
    const house = await page("/", five[0].id, base);
    for (const [i, p] of five.entries()) {
      expect(house.querySelector(`.walker[data-person="${p.id}"]`)?.getAttribute("transform"), `${p.name} isn't where she stopped`).toBe(`translate(${spots[i][0]} ${spots[i][1]})`);
    }
  });

  it("doesn't set friends' pages off when a page only fetches itself to keep up", async () => {
    const [a, b] = five;
    await page("/kitchen", a.id, base);
    await page("/garden", b.id, base);
    const line = listen(`${base}/live`, await cookieFor(a.id, base));
    await wait(500);
    line.clear();

    // What public/live.js asks for when it hears something, and loading the
    // same room again: neither is news.
    for (const path of ["/garden", "/", "/kitchen"]) {
      const res = await fetch(new URL(`${base}${path}`, baseUrl), { headers: { cookie: await cookieFor(b.id, base), "x-live": "1" } });
      expect(res.status).toBe(200);
    }
    await page("/garden", b.id, base);
    await wait(500);
    await line.stop();
    expect(line.heard(), `${b.name}'s page keeping up set ${a.name}'s page off`).toEqual([]);
  });

  it("lets only one friend eat a dish, however many reach for it at once", async () => {
    const [cook] = five;
    expect((await post("/kitchen", { item: "dosa" }, cook.id, base)).status).toBe(303);
    const dish = [...(await page("/kitchen", cook.id, base)).querySelectorAll<HTMLButtonElement>("button[name=dish]")].pop()!.value;

    const tries = await Promise.all(five.map((p) => post("/kitchen/eat", { dish }, p.id, base)));
    expect(tries.filter((r) => r.status === 303).length, "more than one friend ate the same dosa").toBe(1);
    expect(tries.filter((r) => r.status === 400).length).toBe(4);
    expect((await page("/kitchen", cook.id, base)).querySelector(`button[name=dish][value="${dish}"]`), "the dosa's still on the counter").toBeNull();
  });

  it("draws one hug when two friends hug each other at the same moment", async () => {
    const [a, b, c] = five;
    for (const p of [a, b, c]) await page("/garden", p.id, base);
    await post("/here", { x: "1200", y: "300" }, a.id, base);
    await post("/here", { x: "1260", y: "320" }, b.id, base);
    await post("/here", { x: "700", y: "300" }, c.id, base);

    const both = await Promise.all([post("/hug", { with: b.id }, a.id, base), post("/hug", { with: a.id }, b.id, base)]);
    expect(both.map((r) => r.status)).toEqual([303, 303]);
    const hugs = [...(await page("/", c.id, base)).querySelectorAll(".house-svg g.hug")].map((h) => h.getAttribute("data-people")?.split(",").sort().join(","));
    expect(hugs, `${c.name} doesn't see one hug of ${a.name} and ${b.name}`).toEqual([[a.id, b.id].sort().join(",")]);
  });

  it("plays only one of two UNO moves sent at the same moment", async () => {
    const [a, b, c] = five;
    await onlyOnTheMat([a, b, c]);
    const game = await dealt(a);
    // A double tap on Draw: two at once.
    const both = await Promise.all([post("/uno/move", { game, card: "draw" }, a.id, base), post("/uno/move", { game, card: "draw" }, a.id, base)]);
    expect(both.map((r) => r.status).sort(), "both draws went through, or neither did").toEqual([303, 400]);

    expect(hand(await page("/uno", a.id, base)), `${a.name} drew more than one card`).toBe(8);
    // Everyone at the mat sees the same table.
    const tables = await Promise.all([a, b, c].map(async (p) => {
      const doc = await page("/uno", p.id, base);
      const counts = [...doc.querySelectorAll(".uno-player")].map((li) => `${li.getAttribute("data-person")}:${text(li.querySelector(".count"))}`).sort();
      return `${counts.join(" ")} | ${text(doc.querySelector(".uno-pile .count"))}`;
    }));
    expect(new Set(tables).size, `the three of them see different tables: ${tables.join(" / ")}`).toBe(1);
  });

  // BUG: the server checks a move against the moment it arrives, but replay()
  // (src/uno.ts) plays stored moves half a second early, so a move taken in the
  // first half second of a friend's turn, after the turn before ran out, is
  // answered 303 and then silently dropped from the game.
  it.skip("keeps an UNO move the house took right after the turn before ran out", async () => {
    const [a, b, c] = five;
    await onlyOnTheMat([a, b, c]);
    await dealt(a);
    const table = await page("/uno", b.id, base);
    const game = table.querySelector("input[name=game]")!.getAttribute("value")!;
    const turn = table.querySelector("[data-deadline]")!;
    // The house's clock, as the page gives it.
    const offset = Number(turn.getAttribute("data-now")) - Date.now();
    // The dealer lets her twenty seconds go; b draws a moment after.
    await wait(Number(turn.getAttribute("data-deadline")) - offset - Date.now() + 200);

    const res = await post("/uno/move", { game, card: "draw" }, b.id, base);
    expect(res.status, `${b.name}'s draw was turned down`).toBe(303);
    const after = await page("/uno", b.id, base);
    expect(hand(after), `the house took ${b.name}'s draw, then lost it`).toBe(8);
    expect(text(after.querySelector(".uno-table"))).toContain("You drew a card");
  }, 40_000);

  // BUG: leaving the house takes a friend out of any game she's in (ADR 0016),
  // but she still counts as sitting on the mat, so the next deal puts her in
  // a game she can't play, and everyone waits out her twenty seconds.
  it.skip("deals UNO only to friends who are still in the house", async () => {
    const [a, b, c] = five;
    await onlyOnTheMat([a, b, c]);
    await signOut(c.id, base);
    await dealt(a);

    const table = await page("/uno", a.id, base);
    expect(table.querySelector(`.uno-player[data-person="${b.id}"]`), `${b.name} wasn't dealt in`).not.toBeNull();
    expect(table.querySelector(`.uno-player[data-person="${c.id}"]`), `${c.name} was dealt in after leaving the house`).toBeNull();
  });

  // BUG: the movie-night planner on the Movies page isn't one of its live
  // parts, so a film a friend suggests while it's open never shows in it (and
  // the planner never appears for the first suggestion) until a reload.
  it.skip("keeps an open Movies page's movie-night planner up to date with friends' suggestions", async () => {
    const [a, b] = five;
    expect((await post("/movies", { title: unique("Before Sunrise") }, b.id, base)).status).toBe(303);
    const movies = await page("/movies", a.id, base);
    const planner = movies.querySelector("select[name=movie]");
    expect(planner, "there's no movie-night planner").not.toBeNull();
    expect(planner!.closest("[data-live]"), "a friend's suggestion only reaches the planner after a reload").not.toBeNull();
  });
});
