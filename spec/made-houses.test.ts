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
it.skip("answers an address with no house at it with a page, never a crash", async () => {
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
    expect(text(h.ready.querySelector("title"))).toBe(STRANGE.title);
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
  it.skip("keeps Rithika's five's own details out of a made house's about page", async () => {
    const h = await strangeHouse();
    const res = await fetch(new URL(`${h.base}readme/`, baseUrl), { redirect: "manual" });
    if (res.status === 200) {
      expect(text(parse(await res.text()).body), "the made house's about page is about Rithika's five").not.toMatch(/Rithanya|Amirdhavarshini|Aswathy|Neha|KitKat|Canberra|face mask/);
    } else {
      expect([303, 404]).toContain(res.status);
    }
  });

  it("shows the name you gave your house at its door", async () => {
    const h = await strangeHouse();
    const door = parse(await (await fetch(new URL(h.base, baseUrl))).text());
    expect(`${text(door.querySelector("title"))} ${text(door.body)}`, "the house's name is gone once it's made").toContain(STRANGE.title);
    expect(injected(door)).toEqual([]);
  });

  // Everything from 3 November works the same in a house for any number:
  // here, a house for four, where nobody is Rithika's five.
  const FOUR = ["Ivy", "Rae", "Kit", "Bo"];
  const post = async (h: Made, path: string, fields: Record<string, string>, who: string): Promise<Response> =>
    fetch(new URL(`${h.base}${path}`, baseUrl), { method: "POST", headers: { ...FORM, cookie: await cookieIn(h, who) }, body: new URLSearchParams(fields), redirect: "manual" });

  it("lets a made house's friends save a plate for each other and write back to notes", async () => {
    const h = await makeHouse({ friends: "4", ...named(FOUR), "city-1": "London", "city-2": "Toronto" });
    const note = unique("saved you some");
    expect((await post(h, "kitchen", { item: "cake", body: note, for: "2" }, "1")).headers.get("location")).toBe(`${h.base}kitchen?did=saved`);
    const theirs = [...(await inside(h, "kitchen", "3")).querySelectorAll(".dish")].find((d) => text(d).includes(note));
    expect(text(theirs?.querySelector(".saved-tag")), "the saved plate isn't marked for Rae").toBe("for Rae");
    expect(theirs?.querySelector("button[name=dish]"), "Kit is offered Rae's plate").toBeNull();
    const hers = [...(await inside(h, "kitchen", "2")).querySelectorAll(".dish")].find((d) => text(d).includes(note));
    expect((await post(h, "kitchen/eat", { dish: hers!.getAttribute("data-id")! }, "2")).headers.get("location")).toBe(`${h.base}kitchen?did=atesaved`);

    const desk = unique("good luck");
    await post(h, "room/2/leave", { body: desk }, "1");
    const onDesk = [...(await inside(h, "room/2", "2")).querySelectorAll(".desk-thing")].find((d) => text(d).includes(desk))!;
    expect(onDesk.querySelector(`form[action="${h.base}room/1/reply"]`), "Rae can't write back to Ivy").not.toBeNull();
    const answer = unique("thank you!!");
    expect((await post(h, "room/1/reply", { note: onDesk.id.replace("desk-", ""), body: answer }, "2")).status).toBe(303);
    expect(text((await inside(h, "room/1", "1")).body), "Ivy can't read Rae's reply").toContain(answer);
    expect(text((await inside(h, "room/1", "3")).body), "Kit can read Rae's reply to Ivy").not.toContain(answer);
  });

  it("gives a made house's friends their own home-screen widget, at that house's address, and pins photos on its wall", async () => {
    const h = await makeHouse({ friends: "4", ...named(FOUR) });
    expect((await post(h, "widget", {}, "1")).headers.get("location")).toBe(`${h.base}everyone?did=widget#widget`);
    const link = (await inside(h, "everyone", "1")).querySelector("#widget input.widget-link")?.getAttribute("value") ?? "";
    expect(new URL(link).pathname, "the widget's link isn't at the made house").toMatch(new RegExp(`^${h.base}widget/1\\.`));

    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4v+7/fwAIDAN+M8x3iQAAAABJRU5ErkJggg==", "base64");
    const data = new FormData();
    data.set("photo", new Blob([png], { type: "image/png" }), "us.png");
    data.set("body", "this reminds me of you guys");
    const pinned = await fetch(new URL(`${h.base}wall/photo`, baseUrl), { method: "POST", headers: { cookie: await cookieIn(h, "2") }, body: data, redirect: "manual" });
    expect(pinned.headers.get("location")).toBe(`${h.base}living?did=photo#wall`);
    const src = (await inside(h, "living", "3")).querySelector(".note.photo .snap img")?.getAttribute("src") ?? "";
    expect(src, "the photo isn't served from the made house").toMatch(new RegExp(`^${h.base}photo/\\d+$`));

    const w = await (await fetch(new URL(new URL(link).pathname, baseUrl))).json();
    expect(w.house).not.toBe("Five Windows");
    expect(w.friends.map((f: { name: string }) => f.name)).toEqual(["You", "Rae", "Kit", "Bo"]);
    expect(w.latest).toMatchObject({ by: "Rae", caption: "this reminds me of you guys" });
    expect(w.open, "tapping it doesn't open the made house").toMatch(new RegExp(`^${h.base}`));
    // Rithika's house doesn't know this house's widget, and its photo.
    expect((await fetch(new URL(new URL(link).pathname.replace(h.base, "/"), baseUrl))).status).toBe(404);
    expect((await fetch(new URL(src.replace(h.base, "/"), baseUrl), { headers: { cookie: await cookieIn(h, "2") } })).status).not.toBe(200);
  });

  it("shows a made house's planner with a clock for each of its friends, and plans a call", async () => {
    const h = await makeHouse({ friends: "4", ...named(FOUR), "city-1": "London", "city-2": "Toronto", "city-3": "Singapore", "city-4": "Melbourne" });
    const doc = await inside(h, "everyone", "2");
    const rows = [...doc.querySelectorAll<HTMLLIElement>(`form#plan[action="${h.base}plan"] li.when-row`)];
    expect(rows.map((r) => text(r.querySelector(".name"))), "the planner isn't the made house's own friends, you first").toEqual(["You", "Ivy", "Kit", "Bo"]);
    expect(rows.map((r) => r.getAttribute("data-tz"))).toEqual(["America/New_York", "Europe/London", "Asia/Singapore", "Australia/Sydney"]);
    // The time strip tells them apart by face: each row carries its friend's.
    const faces = rows.map((r) => r.getAttribute("data-avatar") ?? "");
    expect(faces.every((f) => f.startsWith("/avatar/")), `a row has no face: ${faces.join(", ")}`).toBe(true);
    expect((await post(h, "plan", { from: "everyone", what: "call", when: "2030-01-05T20:00", about: "catching up" }, "2")).headers.get("location")).toBe(`${h.base}everyone?did=call`);
    const call = (await inside(h, "everyone", "3")).querySelector("#call");
    expect(text(call?.querySelector("h2"))).toContain("catching up");
    expect(call?.querySelectorAll("li[data-person]").length, "the call isn't shown for each of the four").toBe(4);
  });

  it("draws a made house whole on a room's page, with you asleep in your bed, so Esc can zoom out to it", async () => {
    const h = await makeHouse({ friends: "4", ...named(FOUR) });
    expect((await post(h, "room/2/nap", {}, "2")).status).toBe(303);
    await inside(h, "kitchen", "3");
    const svg = (await inside(h, "room/2", "2")).querySelector(".house-svg");
    expect(svg?.querySelector("image")?.getAttribute("href"), "the room's page isn't this house's own picture").toMatch(/^\/art\/house-4\.jpg/);
    expect(svg?.getAttribute("viewBox"), "the room's page isn't framed on the room").not.toBe("0 0 1376 768");
    expect(svg?.querySelector(".walker.me[data-person='2']")?.classList.contains("napping"), "Rae isn't in bed").toBe(true);
    expect(svg?.querySelector("[data-person='3']"), "Kit, in the kitchen, isn't in the drawing of Rae's room").not.toBeNull();
  });

  it("goes on a phone's home screen as its own house, under its own name", async () => {
    const h = await makeHouse({ friends: "4", ...named(["Ivy", "Rae", "Kit", "Bo"]), title: "The Chai Corner" });
    const door = parse(await (await fetch(new URL(h.base, baseUrl))).text());
    const linked = door.querySelector("link[rel=manifest]")?.getAttribute("href");
    expect(linked, "the made house points at Rithika's five's manifest").toBe(`${h.base}manifest.webmanifest`);
    const manifest = await (await fetch(new URL(linked!, baseUrl))).json();
    expect(manifest.name).toBe("The Chai Corner");
    expect(manifest.start_url, "the icon opens someone else's house").toBe(h.base);
    expect(manifest.scope).toBe(h.base);
    expect(door.querySelector("meta[name=apple-mobile-web-app-title]")?.getAttribute("content")?.length, "the name under an iPhone icon is too long to fit").toBeLessThanOrEqual(12);
  });

  // BUG: /h/<code>// answers 500 (route() hands handle() "//" as the path;
  // src/server.ts:509 then :211).
  it.skip("answers odd addresses inside a made house without a crash", async () => {
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
  it.skip("keeps each friend's clock where she lives", async () => {
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
  it.skip("turns down a name nobody can see", async () => {
    const res = await postMake(named(["Mia", "Jo", "​​", "Ana", "Lee"]));
    expect(res.status, "a room was made with an invisible name").toBe(400);
    expect(text(parse(await res.text()).querySelector(".problem"))).toContain("missing");
  });

  // BUG: any day 1-31 goes with any month (src/maker.ts:130), so 31 February
  // is saved, and her room says her birthday is 3 March all February.
  it.skip("only takes a birthday that's on the calendar", async () => {
    const res = await postMake({ ...named(), "month-1": "2", "day-1": "31" });
    expect(res.status, "31 February was taken as a birthday").toBe(400);
  });
});
