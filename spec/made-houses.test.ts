import { JSDOM } from "jsdom";
import { afterAll, describe, expect, inject, it } from "vitest";

// The house maker (/make) and the houses it makes (/h/<code>/), as one visitor
// sees them, checked against the running app over HTTP. house.test.ts covers
// making a house, keeping it apart from Rithika's, its live line and its five's
// own words; this file covers the rest of what the maker promises.
const baseUrl = inject("baseUrl");
const origin = new URL(baseUrl).origin;

// Making houses writes to the server, so only against a throwaway one (CI's
// container, a local run), never the friends' real house on Fly.
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

const parse = (html: string): Document => new JSDOM(html).window.document;

const text = (el: Element | null | undefined): string => el?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const unique = (label: string): string => `${label} ${Date.now()}-${Math.random().toString(36).slice(2)}`;

const FORM = { "content-type": "application/x-www-form-urlencoded" };

// Posting the maker's form the way a browser does; a list is a set of ticks.
// Each post is a visitor of its own, so the per-visitor cap never gets in the
// way (Fly's proxy sets fly-client-ip itself in production).
async function postMake(fields: Record<string, string | string[]>): Promise<Response> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) for (const v of [value].flat()) form.append(key, v);
  return fetch(new URL("/make", baseUrl), { method: "POST", headers: { ...FORM, "fly-client-ip": unique("made-houses spec") }, body: form, redirect: "manual" });
}

const FIVE = ["Ivy", "Rae", "Kit", "Bo", "Dee"];
const named = (names: string[] = FIVE): Record<string, string> => Object.fromEntries(names.map((n, i) => [`name-${i + 1}`, n]));

type Made = { code: string; base: string; ready: Document };

async function makeHouse(fields: Record<string, string | string[]>): Promise<Made> {
  const res = await postMake(fields);
  expect(res.status, "the house wasn't made").toBe(201);
  const ready = parse(await res.text());
  const base = ready.querySelector("a.go-in")?.getAttribute("href") ?? "";
  const code = base.match(/^\/h\/([a-z0-9]{10})\/$/)?.[1];
  expect(code, "the ready page doesn't say where the house is").toBeTruthy();
  return { code: code!, base, ready };
}

// Coming in at a made house's door as one of its five; everyone's let go of at
// the end so the next run can come in.
const sessions = new Map<string, string>();

async function cookieIn(h: Made, who: string): Promise<string> {
  const key = `${h.base}${who}`;
  const known = sessions.get(key);
  if (known) return known;
  const res = await fetch(new URL(`${h.base}me`, baseUrl), { method: "POST", headers: FORM, body: `who=${who}`, redirect: "manual" });
  expect(res.status, `couldn't come in as ${who}`).toBe(303);
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("who="))!.split(";")[0];
  sessions.set(key, cookie);
  return cookie;
}

afterAll(async () => {
  for (const [key, cookie] of sessions) {
    const base = key.replace(/\d+$/, "");
    await fetch(new URL(`${base}leave`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
  }
});

async function inside(h: Made, path: string, who = "2"): Promise<Document> {
  const res = await fetch(new URL(`${h.base}${path}`, baseUrl), { headers: { cookie: await cookieIn(h, who) }, redirect: "manual" });
  expect(res.status, `GET ${h.base}${path}`).toBe(200);
  return parse(await res.text());
}

// Anything typed that came out as markup instead of words.
const injected = (doc: Document): string[] =>
  [...doc.querySelectorAll("img[src='x'], [onerror], [onload], [onmouseover], b.typed, script:not([src])")].map((el) => el.outerHTML.slice(0, 80));

/* ---------- the form, which anyone can look at ---------- */

it("offers each of the five every room-thing picture, and every picture loads", async () => {
  const maker = parse(await (await fetch(new URL("/make", baseUrl))).text());
  const first = [...maker.querySelectorAll<HTMLInputElement>("input[type=checkbox][name=things-1]")].map((i) => i.value);
  expect(first.length, "the form doesn't offer the whole set").toBe(42);
  expect(new Set(first).size, "a picture is offered twice").toBe(42);
  for (let n = 2; n <= 5; n++) {
    const theirs = [...maker.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name=things-${n}]`)].map((i) => i.value);
    expect(theirs, `friend ${n} isn't offered the same pictures`).toEqual(first);
    expect(maker.querySelectorAll(`input[type=radio][name=gender-${n}]`).length, `friend ${n} can't be a girl, a boy or just a name`).toBe(3);
  }
  const pictures = new Set([...maker.querySelectorAll(".belongings-pick img")].map((img) => img.getAttribute("src") ?? ""));
  expect(pictures.size).toBe(42);
  const broken: string[] = [];
  for (const src of pictures) {
    const res = await fetch(new URL(src, baseUrl));
    if (res.status !== 200 || !res.headers.get("content-type")?.startsWith("image/")) broken.push(`${src} ${res.status}`);
  }
  expect(broken, "a room thing's picture doesn't load").toEqual([]);
});

// BUG: an address with an empty segment ("//", "/h/<code>//") makes
// `new URL(req.url, "http://house")` in handle() throw (src/server.ts:211), so
// the server answers 500 and logs a stack trace.
it("answers an address with no house at it with a page, never a crash", async () => {
  for (const path of ["/h/xxxx/", "/h/ABCDEFGHIJ/", "/h/..%2F..%2Fhouses/", "/h/", "//"]) {
    const res = await fetch(`${origin}${path}`, { redirect: "manual" });
    expect(res.status, `${path} broke the server`).toBeLessThan(500);
  }
  const none = await fetch(`${origin}/h/abcdefghij/`, { redirect: "manual" });
  expect(none.status).toBe(404);
  expect(parse(await none.text()).querySelector("a[href='/make']"), "a missing house doesn't offer to make one").not.toBeNull();
});

/* ---------- making houses ---------- */

describe.skipIf(!throwaway)("making a house for any five friends", () => {
  // Strings that look like code, everywhere a visitor can type.
  const STRANGE = {
    title: `<script>alert("t")</script> & "Co"`,
    names: [`<img src=x onerror=alert(1)>`, `Jo"><b class="typed">bold</b>`, "S&amp;m", "Ana's", `<svg onload=alert(2)>`],
    city: `<i>Porto</i> & "Lisbon"`,
    qualities: `<b class="typed">loud</b>, kind`,
    memories: [`<script>alert("m")</script>`, `</textarea><b class="typed">escaped</b>`, "javascript:alert(1)"],
  };

  // One house with all of them in it, made once for the tests that only look.
  let strange: Promise<Made> | undefined;
  const strangeHouse = (): Promise<Made> =>
    (strange ??= makeHouse({
      ...named(STRANGE.names),
      title: STRANGE.title,
      "city-1": STRANGE.city,
      "qualities-1": STRANGE.qualities,
      "things-1": ["guitar", "books"],
      memories: STRANGE.memories.join("\n"),
    }));

  it("gives you an address to share that opens your house's own door", async () => {
    const h = await strangeHouse();
    const shared = text(h.ready.querySelector(".made-url"));
    expect(shared, "the address to share isn't where the house lives").toBe(`${origin}/h/${h.code}/`);
    const door = parse(await (await fetch(shared)).text());
    expect([...door.querySelectorAll("button[name=who] .name")].map(text), "the shared address opens someone else's door").toEqual(STRANGE.names);
  });

  it("shows every name, place and memory exactly as written, even when it looks like code", async () => {
    const h = await strangeHouse();
    expect(text(h.ready.querySelector("h1"))).toBe(`${STRANGE.title} is ready`);
    expect(text(h.ready.querySelector("title"))).toBe(`${STRANGE.title} · Five Windows`);
    expect(injected(h.ready), "the ready page ran what was typed").toEqual([]);

    const door = parse(await (await fetch(new URL(h.base, baseUrl))).text());
    expect(text(door.querySelector("button[name=who][value='1'] .where"))).toBe(STRANGE.city);

    const room = await inside(h, "room/1");
    expect(text(room.querySelector(".house-svg")), "her room's name tag isn't her name").toContain(`${STRANGE.names[0]}'s room`);
    const everyone = await inside(h, "everyone");
    expect(text(everyone.querySelector("main")), "what was said about her isn't shown as written").toContain(STRANGE.qualities.split(",")[0]);
    const living = await inside(h, "living");
    expect([...living.querySelectorAll(".notes.memories .note .body")].map(text), "the memories aren't on the wall as written").toEqual(STRANGE.memories);

    for (const [page, doc] of [["door", door], ["room", room], ["everyone", everyone], ["living", living], ["home", await inside(h, "")]] as const) {
      expect(injected(doc), `the ${page} page ran what was typed`).toEqual([]);
    }
  });

  it("keeps every link, form and picture in a made house inside it", async () => {
    const h = await strangeHouse();
    const shared = /^\/(art|avatar)\/|^\/style\.css$|^\/make$/;
    const leaks: string[] = [];
    const links = new Set<string>();
    const pictures = new Set<string>();
    for (const page of ["", "room/1", "room/2", "room/3", "room/4", "room/5", "living", "kitchen", "garden", "updates", "everyone", "movies", "uno"]) {
      const doc = await inside(h, page);
      for (const el of doc.querySelectorAll("[href], [action], [src]")) {
        for (const attr of ["href", "action", "src"]) {
          const to = el.getAttribute(attr);
          if (!to?.startsWith("/") || to.startsWith("//")) continue;
          if (shared.test(to)) {
            if (attr !== "action" && !to.startsWith("/make")) pictures.add(to);
          } else if (!to.startsWith(`${h.base}`)) leaks.push(`${page || "home"}: ${attr}="${to}"`);
          else if (attr === "href" && el.tagName.toLowerCase() === "a") links.add(to.split("#")[0]);
        }
      }
    }
    expect(leaks, "a link or form leaves the made house").toEqual([]);

    const cookie = await cookieIn(h, "2");
    const dead: string[] = [];
    for (const to of links) {
      const res = await fetch(new URL(to, baseUrl), { headers: { cookie }, redirect: "manual" });
      if (res.status >= 400) dead.push(`${to} ${res.status}`);
    }
    expect(dead, "a link in the made house goes nowhere").toEqual([]);
    const broken: string[] = [];
    for (const src of pictures) {
      const res = await fetch(new URL(src, baseUrl));
      if (res.status !== 200) broken.push(`${src} ${res.status}`);
    }
    expect(broken, "a picture in the made house is missing").toEqual([]);
  });

  // BUG: /h/<code>/readme/ (linked from the made house's door and bar as
  // "What is this place?" / "About this place") renders Rithika's README, so
  // strangers read her five's names, cities, birthdays, sleep hours, KitKats,
  // masks and kettle (src/server.ts:249 serves README.md in every house).
  it("keeps Rithika's five's own details out of a made house's about page", async () => {
    const h = await strangeHouse();
    const res = await fetch(new URL(`${h.base}readme/`, baseUrl), { redirect: "manual" });
    if (res.status === 200) {
      expect(text(parse(await res.text()).body), "the made house's about page is about Rithika's five").not.toMatch(/Rithanya|Amirdhavarshini|Aswathy|Neha|KitKat|Canberra|face mask/);
    } else {
      expect([303, 404]).toContain(res.status);
    }
  });

  // BUG: the form asks for "A name for your house", but only the ready page
  // ever shows it; inside the house the door and every page say "Five Windows"
  // (spec.title is read only in src/maker.ts readyPage).
  it("shows the name you gave your house at its door", async () => {
    const h = await strangeHouse();
    const door = parse(await (await fetch(new URL(h.base, baseUrl))).text());
    expect(`${text(door.querySelector("title"))} ${text(door.body)}`, "the house's name is gone once it's made").toContain(STRANGE.title);
    expect(injected(door)).toEqual([]);
  });

  // BUG: /h/<code>// answers 500 (route() hands handle() "//" as the path;
  // src/server.ts:509 then :211).
  it("answers odd addresses inside a made house without a crash", async () => {
    const h = await strangeHouse();
    const bare = await fetch(`${origin}/h/${h.code}`, { redirect: "manual" });
    expect(bare.status).toBe(303);
    expect(bare.headers.get("location"), "the house's address without a slash doesn't reach its door").toBe(`/h/${h.code}/`);
    expect((await fetch(`${origin}/h/${h.code.toUpperCase()}/`, { redirect: "manual" })).status, "a house answers to its code in capitals").toBe(404);
    for (const path of [`/h/${h.code}/make`, `/h/${h.code}/nowhere`, `/h/${h.code}//`]) {
      expect((await fetch(`${origin}${path}`, { redirect: "manual" })).status, `${path} broke the server`).toBe(404);
    }
  });

  it("never lets a friend from one made house into another", async () => {
    const a = await strangeHouse();
    const b = await makeHouse(named());
    const fromA = await cookieIn(a, "1");
    const note = unique("only in house A");
    expect((await fetch(new URL(`${a.base}wall`, baseUrl), { method: "POST", headers: { ...FORM, cookie: fromA }, body: new URLSearchParams({ body: note }), redirect: "manual" })).status).toBe(303);

    const bDoor = parse(await (await fetch(new URL(b.base, baseUrl), { headers: { cookie: fromA } })).text());
    expect(bDoor.querySelector("button[name=who]"), "house A's cookie walked straight into house B").not.toBeNull();
    expect(bDoor.querySelector("button[name=who][value='1']")?.hasAttribute("disabled"), "being 1 in house A holds 1's window in house B").toBe(false);
    const wrote = await fetch(new URL(`${b.base}wall`, baseUrl), { method: "POST", headers: { ...FORM, cookie: fromA }, body: new URLSearchParams({ body: "from A" }), redirect: "manual" });
    expect(wrote.status, "house A's cookie wrote in house B").toBe(403);

    const bWall = await inside(b, "living", "1");
    expect(text(bWall.querySelector("main")), "house A's note turned up in house B").not.toContain(note);
    expect(text((await inside(a, "living", "1")).querySelector("main")), "house A lost its note").toContain(note);
  });

  // BUG: the local maker (how every live house is made) matches places by
  // substring, in list order (src/maker.ts:260-274): "Indiana" contains
  // "india", Washington state hits New York before Seattle, "Western
  // Australia" hits Sydney before Perth, "New South Wales" hits London.
  it("keeps each friend's clock where she lives", async () => {
    const places: [string, string[]][] = [
      ["Indianapolis", ["America/Indiana/Indianapolis", "America/Indianapolis", "America/New_York", "UTC"]],
      ["Perth, Western Australia", ["Australia/Perth"]],
      ["Seattle, Washington", ["America/Los_Angeles"]],
      ["Newcastle, New South Wales", ["Australia/Sydney", "UTC"]],
      ["Brisbane, Australia", ["Australia/Brisbane"]],
    ];
    const h = await makeHouse({ ...named(), ...Object.fromEntries(places.map(([city], i) => [`city-${i + 1}`, city])) });
    const door = parse(await (await fetch(new URL(h.base, baseUrl))).text());
    const wrong = places
      .map(([city, zones], i) => [city, zones, door.querySelector(`button[name=who][value='${i + 1}'] .clock`)?.getAttribute("data-tz") ?? ""] as const)
      .filter(([, zones, tz]) => !zones.includes(tz))
      .map(([city, , tz]) => `${city} keeps ${tz} time`);
    expect(wrong, "a friend's clock is somewhere she doesn't live").toEqual([]);
  });

  it("puts up to six pictured things in a room, counting one ticked twice once", async () => {
    const seven = ["guitar", "keyboard", "headphones", "record-player", "fairy-lights", "lava-lamp", "candles"];
    const tooMany = await postMake({ ...named(), "things-1": seven });
    expect(tooMany.status, "a room took seven things").toBe(400);
    const form = parse(await tooMany.text());
    expect(text(form.querySelector(".problem"))).toContain("up to 6");
    expect([...form.querySelectorAll<HTMLInputElement>("input[name=things-1]:checked")].map((i) => i.value), "the ticks were lost").toEqual(seven);

    const h = await makeHouse({ ...named(), "things-1": [...seven.slice(0, 6), "guitar", "pony"] });
    const room = await inside(h, "room/1");
    expect([...room.querySelectorAll(".room-things-card li")].map(text)).toEqual(["a guitar", "a keyboard", "big headphones", "a record player", "fairy lights", "a lava lamp"]);
  });

  it("turns down names, places, house names and answers that are too long", async () => {
    const cases: [Record<string, string>, string][] = [
      [{ "name-1": "x".repeat(41) }, "Names fit up to 40"],
      [{ "city-1": "c".repeat(61) }, "Places fit up to 60"],
      [{ title: "t".repeat(61) }, "name fits up to 60"],
      [{ "qualities-2": "q".repeat(4097) }, "longer than fits"],
      [{ memories: "m".repeat(4097) }, "longer than fits"],
    ];
    for (const [fields, problem] of cases) {
      const res = await postMake({ ...named(), ...fields });
      expect(res.status, `${Object.keys(fields)[0]} too long was taken`).toBe(400);
      expect(text(parse(await res.text()).querySelector(".problem"))).toContain(problem);
    }
  });

  it("keeps everything you wrote when it asks you to fix something", async () => {
    const res = await postMake({
      ...named(["Mia", "Jo", "Sam", "Ana", ""]),
      title: "The flat on Chapel Street",
      "gender-2": "boy",
      "city-1": "Chennai",
      "qualities-1": "always late\nloves movies",
      "things-1": ["guitar", "telescope"],
      "month-1": "10",
      "day-1": "21",
      memories: "the road trip\n3 am chai",
      together: "the Goa trip",
      joke: "it's just a small hill",
    });
    expect(res.status).toBe(400);
    const form = parse(await res.text());
    const value = (sel: string): string => form.querySelector<HTMLInputElement>(sel)?.value ?? "";
    expect(value("#title")).toBe("The flat on Chapel Street");
    expect(value("#name-4")).toBe("Ana");
    expect(form.querySelector<HTMLInputElement>("input[name=gender-2][value=boy]")?.checked, "his gender was lost").toBe(true);
    expect(value("#city-1")).toBe("Chennai");
    expect(value("#qualities-1")).toBe("always late\nloves movies");
    const ticked = [...form.querySelectorAll<HTMLInputElement>("input[name=things-1]:checked")];
    expect(ticked.map((i) => i.value)).toEqual(["guitar", "telescope"]);
    expect(ticked.every((i) => !i.closest("details")), "a ticked thing is folded out of sight").toBe(true);
    expect(value("#month-1")).toBe("10");
    expect(value("select[name=day-1]")).toBe("21");
    expect(value("#memories")).toBe("the road trip\n3 am chai");
    expect(value("#together")).toBe("the Goa trip");
    expect(value("#joke")).toBe("it's just a small hill");
  });

  // BUG: the whole form is capped at 32 KB of URL-encoded bytes
  // (src/maker.ts:24, readBody), and a Tamil letter is 9 encoded bytes, so
  // five 800-letter answers (a fifth of each field's 4096 limit) get a bare
  // 413 "Too much" page and everything typed is lost.
  it("keeps what you wrote in Tamil, within each answer's limit, when it asks you to fix something", async () => {
    const tamil = "அன்பு".repeat(160);
    const qualities = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`qualities-${n}`, tamil]));
    const res = await postMake({ ...named(["Mia", "Jo", "Sam", "Ana", ""]), ...qualities });
    expect(res.status, "answers in Tamil were too much for the form").toBe(400);
    expect(parse(await res.text()).querySelector<HTMLTextAreaElement>("#qualities-1")?.value, "the Tamil answer was lost").toBe(tamil);
  });

  // Only checkable against a server that waits on Claude (started with
  // ANTHROPIC_BASE_URL pointing nowhere, MAKER_UNREACHABLE=1, as in
  // house.test.ts); a HOUSE_MAKER=fake server makes houses without waiting.
  // BUG: the cap is checked before Claude is awaited and counted only after
  // (src/maker.ts:426 and :448), so houses asked for at the same moment all
  // get past it: 6 at once from one visitor, or 36 in all, were all made.
  it.skipIf(process.env.MAKER_UNREACHABLE !== "1")("makes only three houses for a visitor who asks for several at once", async () => {
    const visitor = unique("an eager visitor");
    const statuses = await Promise.all(Array.from({ length: 5 }, () =>
      fetch(new URL("/make", baseUrl), { method: "POST", headers: { ...FORM, "fly-client-ip": visitor }, body: new URLSearchParams(named()), redirect: "manual" }).then((r) => r.status)));
    expect(statuses.filter((s) => s === 201).length, "the per-visitor cap let them all through").toBe(3);
    expect(statuses.filter((s) => s === 429).length).toBe(2);
  });

  // BUG: trim() leaves zero-width spaces, so a name of only those is taken
  // and the door shows a window with no name (src/maker.ts:132, 145).
  it("turns down a name nobody can see", async () => {
    const res = await postMake(named(["Mia", "Jo", "​​", "Ana", "Lee"]));
    expect(res.status, "a room was made with an invisible name").toBe(400);
    expect(text(parse(await res.text()).querySelector(".problem"))).toContain("missing");
  });

  // BUG: any day 1-31 goes with any month (src/maker.ts:130), so 31 February
  // is saved, and her room says her birthday is 3 March all February.
  it("only takes a birthday that's on the calendar", async () => {
    const res = await postMake({ ...named(), "month-1": "2", "day-1": "31" });
    expect(res.status, "31 February was taken as a birthday").toBe(400);
  });
});
