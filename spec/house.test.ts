import { JSDOM } from "jsdom";
import { afterAll, describe, expect, inject, it } from "vitest";

// The house's promises, checked against the running app over HTTP.
const baseUrl = inject("baseUrl");

// These checks leave things behind and mark people as having visited, so they
// only run against a throwaway house (CI's container, a local run), never the
// friends' real one on Fly.
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

type Person = { id: string; name: string };

const parse = (html: string): Document => new JSDOM(html).window.document;

// Coming in at the door as one of the five, the way a browser does: the house
// answers with a who= cookie, which every later request carries.
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

// One session per friend for the whole run (only one of us can be each friend
// at a time), let go of at the end so the next run can come in. Anyone who
// isn't one of the five just sends what she claims to be.
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

async function signOut(who: string): Promise<void> {
  const cookie = sessions.get(who);
  sessions.delete(who);
  if (cookie) await fetch(new URL("/leave", baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
}

afterAll(async () => {
  for (const who of [...sessions.keys()]) await signOut(who);
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

// The time as the house writes it ("4:43 am") in a given zone.
function localTime(tz: string, at: number): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", { timeZone: tz, hour: "numeric", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour) % 24;
  return `${hour % 12 === 0 ? 12 : hour % 12}:${parts.minute} ${hour < 12 ? "am" : "pm"}`;
}

// Where each of us lives.
const ZONES: Record<string, string> = {
  Rithika: "Australia/Sydney",
  Neha: "America/New_York",
  Amirdhavarshini: "Asia/Kolkata",
  Rithanya: "Asia/Kolkata",
  Aswathy: "Asia/Kolkata",
};

it("greets a newcomer at the door with the five of us", async () => {
  const five = await people();
  expect(five.map((p) => p.name).sort()).toEqual(["Amirdhavarshini", "Aswathy", "Neha", "Rithanya", "Rithika"]);
  expect(new Set(five.map((p) => p.id)).size).toBe(5);
});

it("shows each friend's own time, wherever they live", async () => {
  const before = Date.now();
  const door = await page("/");
  const after = Date.now();
  for (const button of door.querySelectorAll("button[name=who]")) {
    const name = text(button.querySelector(".name"));
    const shown = text(button.querySelector(".clock"));
    expect([localTime(ZONES[name], before), localTime(ZONES[name], after)], `${name}'s clock`).toContain(shown);
  }
});

// Each of us sleeps at night where she lives, from bedtime to waking.
const SLEEP: Record<string, [number, number]> = {
  Rithika: [23, 7],
  Neha: [22, 8],
  Amirdhavarshini: [23, 7],
  Rithanya: [23.5, 9.5],
  Aswathy: [23, 7],
};

it("puts each friend to bed at her own bedtime", async () => {
  const at = Date.now();
  const door = await page("/");
  for (const button of door.querySelectorAll("button[name=who]")) {
    const name = text(button.querySelector(".name"));
    // Whoever's in the house right now is up, whatever the time.
    if (text(button.querySelector(".when")).includes("home now") || button.hasAttribute("disabled")) continue;
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-AU", { timeZone: ZONES[name], hour: "numeric", minute: "numeric", hourCycle: "h23" })
        .formatToParts(at)
        .map((p) => [p.type, p.value]),
    );
    const hour = (Number(parts.hour) % 24) + Number(parts.minute) / 60;
    const [from, to] = SLEEP[name];
    const asleep = from > to ? hour >= from || hour < to : hour >= from && hour < to;
    expect(text(button).includes(", asleep"), `${name} at ${parts.hour}:${parts.minute} her time`).toBe(asleep);
  }
});

describe.skipIf(!throwaway)("living in the house", () => {
  it("remembers who you are", async () => {
    const [me] = await people();
    await signOut(me.id);
    const res = await signIn(me.id);
    expect(res.status).toBe(303);
    const cookie = sessionOf(res);
    expect(cookie, "picking who you are set no who= cookie").toBeDefined();
    sessions.set(me.id, cookie!);

    const res2 = await fetch(new URL("/", baseUrl), { headers: { cookie: cookie! } });
    const home = parse(await res2.text());
    expect(text(home.querySelector(".greeting"))).toContain(me.name);
    expect(home.querySelectorAll("a[href^='/room/']").length).toBeGreaterThanOrEqual(5);
  });

  it("keeps a note on the living room wall for a friend to find later", async () => {
    const [a, b] = await people();
    const note = unique("a note from the spec");
    expect((await post("/wall", { body: note }, a.id)).status).toBe(303);

    const found = withText(await page("/living", b.id), ".note", note);
    expect(found, `${b.name} can't find the note ${a.name} pinned up`).toBeDefined();
    expect(text(found)).toContain(a.name);
    expect(found!.classList.contains("new")).toBe(true);
    expect(text((await page("/updates", b.id)).querySelector(".away"))).toContain(`${a.name} wrote on the wall`);
  });

  it("knows which notes are yours", async () => {
    const [a] = await people();
    const note = unique("a note to myself");
    await post("/wall", { body: note }, a.id);

    const found = withText(await page("/living", a.id), ".note", note);
    expect(found).toBeDefined();
    expect(found!.classList.contains("mine")).toBe(true);
    expect(found!.classList.contains("new")).toBe(false);
  });

  it("shows a note exactly as written, even when it looks like code", async () => {
    const [a, b] = await people();
    const note = unique("<b>bold?</b> & <script>alert(1)</script>");
    await post("/wall", { body: note }, a.id);

    const found = withText(await page("/living", b.id), ".note", note);
    expect(found, "the note's text didn't come back intact").toBeDefined();
    expect(found!.querySelector("b, script")).toBeNull();
  });

  it("only lets the five leave things", async () => {
    const note = unique("from a stranger");
    expect((await post("/wall", { body: note })).status).toBe(403);
    expect((await post("/wall", { body: note }, "intruder")).status).toBe(403);
    const [a] = await people();
    expect((await post("/room/9/leave", { body: note }, a.id)).status).toBe(404);
    expect(withText(await page("/living", a.id), ".note", note)).toBeUndefined();
  });

  it("keeps a note left on a friend's desk for that friend's eyes only", async () => {
    const [a, b, c] = await people();
    const note = unique("good luck today");
    expect((await post(`/room/${b.id}/leave`, { body: note, item: "chai" }, a.id)).status).toBe(303);

    const desk = withText(await page(`/room/${b.id}`, b.id), ".desk-thing", note);
    expect(desk, `${b.name} can't find the note on her desk`).toBeDefined();
    expect(text(desk)).toContain(a.name);
    expect(text(desk)).toContain("masala chai");
    expect(text((await page("/updates", b.id)).querySelector(".away"))).toContain(`${a.name} left a note and a cup of masala chai on your desk`);

    const peek = await page(`/room/${b.id}`, c.id);
    expect(text(peek.body)).not.toContain(note);
    expect(text(peek.querySelector(".desk-thing"))).toContain(`A folded note for ${b.name}`);
  });

  it("puts food from the kitchen out for everyone", async () => {
    const [a, b] = await people();
    const note = unique("made too much");
    expect((await post("/kitchen", { item: "dosa", body: note }, a.id)).status).toBe(303);

    const dish = withText(await page("/kitchen", b.id), ".dish", note);
    expect(dish, `${b.name} can't see what ${a.name} cooked`).toBeDefined();
    expect(text(dish)).toContain(`${a.name} made dosa`);
  });

  it("takes food off the counter once someone eats it, and tells the cook", async () => {
    const [a, b, c] = await people();
    const note = unique("help yourselves");
    await post("/kitchen", { item: "biryani", body: note }, a.id);
    const id = withText(await page("/kitchen", b.id), ".dish", note)?.getAttribute("data-id");
    expect(id, "the biryani never made it onto the counter").toBeTruthy();

    expect((await post("/kitchen/eat", { dish: id! }, b.id)).headers.get("location")).toBe("/kitchen?did=eat");
    expect(withText(await page("/kitchen", c.id), ".dish", note), "the empty plate is still on the counter").toBeUndefined();
    expect(text((await page("/updates", a.id)).querySelector(".away"))).toContain(`${b.name} ate your biryani`);
    expect((await post("/kitchen/eat", { dish: id! }, c.id)).status, "the same biryani got eaten twice").toBe(400);
  });

  it("tells a friend who tidied their room while they were away", async () => {
    const [a, b] = await people();
    expect((await post(`/room/${b.id}/tidy`, {}, a.id)).status).toBe(303);

    expect(text((await page("/updates", b.id)).querySelector(".away"))).toContain(`${a.name} tidied your room`);
    expect(text((await page(`/room/${b.id}`, b.id)).querySelector(".status"))).toContain(`Last tidied by ${a.name}`);
  });

  it("remembers who planted what and who watered the garden", async () => {
    const [a, b, c] = await people();
    expect((await post("/garden/plant", { item: "marigold" }, a.id)).status).toBe(303);
    expect((await post("/garden/water", {}, b.id)).status).toBe(303);

    const garden = await page("/garden", c.id);
    expect(text(garden.querySelector(".status"))).toContain(`Last watered by ${b.name}`);
    expect(text(withText(garden, ".patches li", `${a.name}'s patch`))).toContain("Marigolds");
  });

  it("sends Shinzo along with whoever pets him, wherever they go", async () => {
    const [a, b] = await people();
    await page("/kitchen", b.id);
    const res = await post("/garden/dog", { at: "kitchen" }, b.id);
    expect(res.status).toBe(303);
    expect(res.headers.get("location"), `${b.name} didn't stay in the kitchen`).toBe("/kitchen?did=play");

    let house = await page("/", a.id);
    expect(house.querySelector(`.laddoo[data-with="${b.id}"][data-place="kitchen"]`), `Shinzo isn't in the kitchen with ${b.name}`).not.toBeNull();

    await page(`/room/${b.id}`, b.id);
    house = await page("/", a.id);
    expect(house.querySelector(`.laddoo[data-with="${b.id}"][data-place="room:${b.id}"]`), `Shinzo didn't follow ${b.name} to her room`).not.toBeNull();
  });

  it("keeps you where you walked to, with Shinzo beside you if you fed him", async () => {
    const [a, b] = await people();
    await page("/garden", b.id);
    expect((await post("/garden/treat", { at: "garden" }, b.id)).status).toBe(303);
    // Where public/house.js says you stopped walking: out by the stepping
    // stones, which isn't one of the garden's own spots.
    expect((await post("/here", { x: "1290", y: "380" }, b.id)).status).toBe(204);

    const house = await page("/", a.id);
    const friend = house.querySelector(`.walker[data-person="${b.id}"]`);
    expect(friend?.getAttribute("transform"), `${a.name} doesn't find ${b.name} where she walked to`).toBe("translate(1290 380)");
    expect(friend!.getAttribute("data-place")).toBe("garden");
    expect(house.querySelector(`.laddoo[data-with="${b.id}"][data-place="garden"]`)?.getAttribute("transform"), "Shinzo isn't beside her").toMatch(/^translate\(1340 386\)/);
    expect(text((await page("/updates", a.id)).querySelector(".away"))).toContain(`${b.name} gave Shinzo a treat`);

    const back = await page("/", b.id);
    expect(back.querySelector(".walker.me")?.getAttribute("transform"), `${b.name} isn't where she left off`).toBe("translate(1290 380)");
  });

  it("lets anyone sleep in anyone's bed or sit down, and shows her there", async () => {
    const [a, b] = await people();
    const res = await post(`/room/${a.id}/nap`, {}, b.id);
    expect(res.headers.get("location")).toBe(`/room/${a.id}?did=nap`);
    expect((await page("/", a.id)).querySelector(`.sleeper[data-person="${b.id}"][data-place="room:${a.id}"]`), `${b.name} isn't asleep in ${a.name}'s bed`).not.toBeNull();
    expect(text((await page("/updates", a.id)).querySelector(".away"))).toContain(`${b.name} slept in your bed`);

    expect((await post("/sit", { seat: "sofa" }, b.id)).headers.get("location")).toBe("/living?did=sit");
    const house = await page("/", a.id);
    expect(house.querySelector(`.sitter[data-person="${b.id}"][data-place="living"]`), `${b.name} isn't on the sofa`).not.toBeNull();
    expect(house.querySelector(`.sleeper[data-person="${b.id}"]`), "she's still in bed after getting up").toBeNull();
  });

  it("offers what you can do at each thing in the house, where it is", async () => {
    const [a] = await people();
    const house = await page("/", a.id);
    const all = [...house.querySelectorAll(".act, .laddoo")].flatMap((g) => JSON.parse(g.getAttribute("data-do") ?? "[]") as { label: string; emoji?: string }[]);
    const doings = all.map((d) => d.label);
    expect(doings.filter((l) => l.startsWith("Sleep in")).length, "not every bed can be slept in").toBe(5);
    for (const label of ["Write on the wall", "Sit on the sofa", "Sit on your cushion", "Water the garden", "Pet Shinzo", "Give Shinzo a treat"]) {
      expect(doings, `nothing offers "${label}"`).toContain(label);
    }
    expect(all.filter((d) => !d.emoji).map((d) => d.label), "these have no emoji").toEqual([]);
  });

  it("pops a little emoji up where you did something, once it's done", async () => {
    const [a] = await people();
    const did = async (path: string, fields: Record<string, string>): Promise<Document> =>
      page((await post(path, fields, a.id)).headers.get("location")!, a.id);
    const pops = (doc: Document): string => text(doc.querySelector(".house-svg .pops"));

    const watered = await did("/garden/water", {});
    expect(text(watered.querySelector(".done")), "the line that says it's done has no drop").toContain("💧");
    expect(pops(watered), "no drops fall on the garden").toContain("💧");
    expect(pops(await did("/garden/plant", { item: "jasmine" })), "nothing sprouts where you planted").toContain("🌱");

    const petted = await did("/garden/dog", { at: "garden" });
    expect(pops(petted), "no hearts over Shinzo").toContain("💕");
    expect(petted.querySelector(".laddoo.awake"), "Shinzo's still asleep after being petted").not.toBeNull();

    expect((await page("/garden", a.id)).querySelector(".house-svg .pops"), "it pops up again on an ordinary visit").toBeNull();
  });

  it("shows a friend who's home right now wherever they are in the house", async () => {
    const [a, b] = await people();
    await page("/kitchen", a.id);

    const house = await page("/", b.id);
    const friend = house.querySelector(`.walker[data-person="${a.id}"]`);
    expect(friend, `${b.name} can't see ${a.name} in the house`).not.toBeNull();
    expect(friend!.getAttribute("data-place")).toBe("kitchen");
    expect(text(withText(await page("/everyone", b.id), ".clocks li", a.name))).toContain("home now, in the kitchen");
  });

  it("never walks anyone around on their own", async () => {
    const [a] = await people();
    const house = await page("/", a.id);
    const walkers = [...house.querySelectorAll(".walker")];
    expect(walkers.length, "nobody's standing in the house").toBeGreaterThan(0);
    for (const w of walkers) {
      expect(w.getAttribute("style") ?? "", `person ${w.getAttribute("data-person")} is set to wander`).not.toMatch(/animation/);
    }
    expect(text(house.querySelector(".house-svg style")), "the house has walking keyframes").not.toMatch(/@keyframes/);
  });

  it("puts a face mask on whoever does one with Rithanya's powder", async () => {
    const five = await people();
    const rithanya = five.find((p) => p.name === "Rithanya")!;
    const friend = five.find((p) => p.name !== "Rithanya")!;
    await page("/", friend.id);
    expect((await post(`/room/${rithanya.id}/mask`, {}, friend.id)).status).toBe(303);

    const house = await page("/", rithanya.id);
    expect(house.querySelector(`.walker[data-person="${friend.id}"] .mask`), `${friend.name} isn't in a face mask`).not.toBeNull();
    expect(text((await page("/updates", rithanya.id)).querySelector(".away"))).toContain(`${friend.name} used your face mask powder`);
  });

  it("leaves kettle Maggi out on Amirdhavarshini's mat", async () => {
    const five = await people();
    const amirdha = five.find((p) => p.name === "Amirdhavarshini")!;
    const friend = five.find((p) => p.name !== "Amirdhavarshini")!;
    const note = unique("hostel nights");
    expect((await post(`/room/${amirdha.id}/kettle`, { body: note }, friend.id)).status).toBe(303);

    const room = await page(`/room/${amirdha.id}`, amirdha.id);
    expect(room.querySelector(".kettle"), "there's no kettle on the mat").not.toBeNull();
    expect(text(room.body)).toContain(note);
    expect(text((await page("/updates", amirdha.id)).querySelector(".away"))).toContain(`${friend.name} made kettle Maggi in your room`);
  });

  it("keeps movie suggestions and who's watched them", async () => {
    const [a, b, c] = await people();
    const title = unique("Kumbalangi Nights");
    expect((await post("/movies", { title, why: "for a sofa night" }, a.id)).status).toBe(303);

    const movie = withText(await page("/movies", b.id), ".movie", title);
    expect(movie, `${b.name} can't find ${a.name}'s suggestion`).toBeDefined();
    expect(text(movie)).toContain(`Suggested by ${a.name}`);
    expect((await post("/movies/watched", { movie: movie!.getAttribute("data-id")! }, b.id)).status).toBe(303);
    expect(text(withText(await page("/movies", c.id), ".movie", title))).toContain(`Watched by ${b.name}`);
  });

  it("shows movie night in each friend's own time", async () => {
    const five = await people();
    const rithika = five.find((p) => p.name === "Rithika")!;
    const title = unique("96");
    await post("/movies", { title }, rithika.id);
    const id = withText(await page("/movies", rithika.id), ".movie", title)!.getAttribute("data-id")!;
    // 8 pm on 5 January 2030 in Canberra, which is on daylight time (UTC+11).
    expect((await post("/movies/night", { movie: id, when: "2030-01-05T20:00" }, rithika.id)).status).toBe(303);

    const night = (await page("/movies", five.find((p) => p.name === "Neha")!.id)).querySelector(".night");
    expect(text(night)).toContain(title);
    const at = Date.UTC(2030, 0, 5, 9, 0);
    for (const p of five) {
      const shown = text(night?.querySelector(`li[data-person="${p.id}"] .clock`));
      expect(shown, `${p.name}'s time for movie night`).toBe(localTime(ZONES[p.name], at));
    }
  });

  it("only takes things the house actually has", async () => {
    const [a, b] = await people();
    expect((await post("/kitchen", { item: "pizza" }, a.id)).status).toBe(400);
    expect((await post("/kitchen/eat", { dish: "999999" }, a.id)).status).toBe(400);
    expect((await post(`/room/${b.id}/leave`, { item: "diamond" }, a.id)).status).toBe(400);
    expect((await post("/garden/plant", { item: "cactus" }, a.id)).status).toBe(400);
    expect((await post(`/room/${a.id}/leave`, { body: "to me" }, a.id)).status).toBe(400);
    const five = await people();
    const notRithanya = five.find((p) => p.name !== "Rithanya")!;
    const notAmirdha = five.find((p) => p.name !== "Amirdhavarshini")!;
    expect((await post(`/room/${notRithanya.id}/mask`, {}, a.id)).status).toBe(404);
    expect((await post(`/room/${notAmirdha.id}/kettle`, {}, a.id)).status).toBe(404);
    expect((await post("/movies/watched", { movie: "999999" }, a.id)).status).toBe(400);
    expect((await post("/movies/night", { movie: "999999", when: "2030-01-05T20:00" }, a.id)).status).toBe(400);
    expect((await post("/sit", { seat: "throne" }, a.id)).status).toBe(400);
    expect((await post("/here", { x: "5", y: "5" }, a.id)).status).toBe(400);
  });

  it("shows a friend's open page what you do, and where you walk, without a refresh", async () => {
    const [a, b] = await people();
    // Both already in, so coming in isn't what's heard.
    await cookieFor(a.id);
    const stop = new AbortController();
    const res = await fetch(new URL("/live", baseUrl), { headers: { cookie: await cookieFor(b.id) }, signal: stop.signal });
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
    const until = async (needle: string): Promise<void> => {
      for (let i = 0; i < 50 && !heard.includes(needle); i++) await new Promise((r) => setTimeout(r, 100));
    };
    // Whatever opening the page set off has been and gone.
    await new Promise((r) => setTimeout(r, 500));

    heard = "";
    const note = unique("live from the wall");
    await post("/wall", { body: note }, a.id);
    await until("event: changed");
    expect(heard, `${b.name}'s open page never heard that ${a.name} wrote on the wall`).toContain("event: changed");

    heard = "";
    await post("/here", { x: "1250", y: "300" }, a.id);
    await until("event: moved");
    stop.abort();
    await reading;
    const step = heard.split("\n\n").find((e) => e.startsWith("event: moved"));
    expect(step, `${b.name} never saw ${a.name} walk`).toBeDefined();
    expect(JSON.parse(step!.split("data: ")[1])).toEqual({ person: a.id, place: "garden", x: 1250, y: 300 });

    // What her page fetches when it hears: the note's there.
    expect(withText(await page("/living", b.id), ".note", note)).toBeDefined();
  });

  it("lets only one person be each of us at a time", async () => {
    const five = await people();
    const her = five[4];
    const door = async (cookie?: string): Promise<Document> =>
      parse(await (await fetch(new URL("/", baseUrl), { headers: cookie ? { cookie } : {} })).text());
    const pane = (d: Document): HTMLButtonElement | null => d.querySelector(`button[name=who][value="${her.id}"]`);
    await signOut(her.id);

    const first = sessionOf(await signIn(her.id));
    expect(first, `nobody could come in as ${her.name}`).toBeDefined();
    const second = await signIn(her.id);
    expect(second.status, `a second person got in as ${her.name}`).toBe(409);
    expect(sessionOf(second)).toBeUndefined();
    expect(pane(await door())?.disabled, `${her.name}'s window can still be picked at the door`).toBe(true);
    // A cookie that only says who it is doesn't get in either.
    expect((await door(`who=${her.id}`)).querySelector("form[action='/me']"), "a made-up cookie got into the house").not.toBeNull();

    await fetch(new URL("/leave", baseUrl), { method: "POST", headers: { cookie: first! }, redirect: "manual" });
    expect(pane(await door())?.disabled, `${her.name}'s window didn't open again once she left`).toBe(false);
    const third = await signIn(her.id);
    expect(third.status).toBe(303);
    sessions.set(her.id, sessionOf(third)!);
    expect((await door(first)).querySelector("form[action='/me']"), "the first device is still in after leaving").not.toBeNull();
  });

  // Everyone else goes off to the kitchen, so only `sitting` are on
  // Amirdhavarshini's mat.
  async function onlyOnTheMat(sitting: Person[], five: Person[]): Promise<void> {
    for (const p of five) if (!sitting.includes(p)) await page("/kitchen", p.id);
    for (const p of sitting) expect((await post("/sit", { seat: "mat" }, p.id)).status).toBe(303);
  }

  const backs = (doc: Document, id: string): number => doc.querySelectorAll(`.uno-player[data-person="${id}"] .uno-back`).length;

  it("deals UNO, seven cards each, to friends sitting together on Amirdhavarshini's mat", async () => {
    const five = await people();
    const amirdha = five.find((p) => p.name === "Amirdhavarshini")!;
    const [a, b] = five;
    await onlyOnTheMat([a, b], five);
    expect((await page(`/room/${amirdha.id}`, a.id)).querySelector("form[action='/uno']"), "the mat doesn't offer UNO to two friends on it").not.toBeNull();
    const res = await post("/uno", {}, a.id);
    expect(res.headers.get("location")).toBe("/uno?did=uno");

    for (const [me, other] of [[a, b], [b, a]]) {
      const table = await page("/uno", me.id);
      expect(table.querySelectorAll(".uno-hand .in-hand").length, `${me.name} wasn't dealt seven cards`).toBe(7);
      expect(backs(table, other.id), `${me.name} can't see ${other.name}'s seven cards face down`).toBe(7);
    }
    expect(text((await page("/updates", b.id)).querySelector(".away"))).toContain(`${a.name} started UNO with you`);
  });

  it("only lets whoever's turn it is play UNO", async () => {
    const five = await people();
    const [a, b] = five;
    await onlyOnTheMat([a, b], five);
    await post("/uno", {}, a.id);
    const game = (await page("/uno", b.id)).querySelector("input[name=game]")?.getAttribute("value");
    expect(game, "there's no game on the table").toBeTruthy();

    expect((await post("/uno/move", { game: game!, card: "draw" }, b.id)).status, `${b.name} drew out of turn`).toBe(400);
    expect((await post("/uno/move", { game: game!, card: "draw" }, a.id)).status, `${a.name} couldn't draw on her turn`).toBe(303);
  });

  it("deals UNO only when you're sitting on the mat with a friend", async () => {
    const five = await people();
    const [a, b, c] = five;
    await onlyOnTheMat([a, b], five);
    expect((await post("/uno", {}, c.id)).status, `${c.name} dealt without sitting on the mat`).toBe(400);
    await page("/kitchen", b.id);
    expect((await post("/uno", {}, a.id)).status, `${a.name} dealt with nobody else on the mat`).toBe(400);
  });

  it("deals all five in when everyone's on the mat", async () => {
    const five = await people();
    const dealer = five[2];
    await onlyOnTheMat(five, five);
    expect((await post("/uno", {}, dealer.id)).status).toBe(303);

    const table = await page("/uno", dealer.id);
    expect(table.querySelectorAll(".uno-player").length, "not everyone on the mat is playing").toBe(5);
    expect(table.querySelectorAll(".uno-hand .in-hand").length).toBe(7);
    for (const p of five.filter((p) => p !== dealer)) expect(backs(table, p.id), `${p.name} wasn't dealt seven`).toBe(7);
  });

  it("lets Shinzo get up and wander the house on his own, the same for everyone", async () => {
    const [a, b] = await people();
    const [one, two] = await Promise.all([page("/", a.id), page("/", b.id)]);
    type Waypoint = [number, number, number, string];
    const dogOf = (doc: Document): Element => doc.querySelector(".house-svg g.laddoo")!;
    const path = (doc: Document): Waypoint[] => JSON.parse(dogOf(doc).getAttribute("data-path") ?? "[]");
    const mine = path(one);
    const theirs = path(two);
    const now = Number(dogOf(one).getAttribute("data-now"));

    const hour = mine.filter(([t]) => t <= now + 60 * 60 * 1000);
    expect(new Set(hour.map(([, x, y]) => `${x},${y}`)).size, "he stays put for the whole hour").toBeGreaterThanOrEqual(2);
    for (const [, x, y] of mine) {
      expect(x >= 0 && x <= 1376 && y >= 0 && y <= 768, `(${x}, ${y}) is outside the house`).toBe(true);
    }
    const from = Math.max(mine[0][0], theirs[0][0]);
    expect(theirs.filter(([t]) => t > from), `${a.name} and ${b.name} see him go different ways`).toEqual(mine.filter(([t]) => t > from));

    // Up on his feet unless he's napping; curled up in his picture only then.
    const dog = dogOf(one);
    expect(dog.classList.contains("napping"), "he's drawn asleep while he's up, or up while he's asleep").toBe(mine[0][3] === "nap");
    expect(dog.classList.contains("walking"), "he's walking while standing still, or still while walking").toBe(mine[0][3] === "walk");
    expect(dog.querySelector(".standing .leg"), "he has no legs to get up on").not.toBeNull();
    expect(dog.querySelector(".lying image"), "his curled-up picture is gone").not.toBeNull();
  });

  it("lets friends who are close hug, up to all five of you", async () => {
    const [a, b, c, d, e] = await people();
    const offline = !text(withText(await page("/"), "button[name=who]", e.name)?.querySelector(".when")).includes("home now");
    // a, b and c are home and stand together in the garden; d is home too,
    // but over by the tree.
    for (const p of [a, b, c, d]) await page("/garden", p.id);
    await post("/here", { x: "1200", y: "300" }, a.id);
    await post("/here", { x: "1260", y: "330" }, b.id);
    await post("/here", { x: "1230", y: "280" }, c.id);
    await post("/here", { x: "1320", y: "180" }, d.id);

    expect((await post("/hug", { with: d.id }, a.id)).status, `${a.name} hugged ${d.name} from across the garden`).toBe(400);
    if (offline) {
      // Standing right where e is drawn, in her own room, while she's away.
      expect((await post("/hug", { with: e.id, x: "985", y: "668" }, a.id)).status, `${a.name} hugged ${e.name}, who isn't here`).toBe(400);
      await post("/here", { x: "1200", y: "300" }, a.id);
    }

    expect((await post("/hug", { with: `${b.id},${c.id}` }, a.id)).headers.get("location")).toBe("/garden?did=hug");
    const house = await page("/", d.id);
    for (const p of [a, b, c]) {
      expect(house.querySelector(`.walker.hugging[data-person="${p.id}"]`), `${p.name} isn't in the hug`).not.toBeNull();
    }
    expect(house.querySelector(`.walker.hugging[data-person="${d.id}"]`), `${d.name} got pulled in from over by the tree`).toBeNull();
    expect(text((await page("/updates", b.id)).querySelector(".away"))).toContain(`${a.name} pulled you and ${c.name} into a group hug`);
  });

  it("celebrates a friend's birthday all month, with bunting and a crown", async () => {
    const five = await people();
    const MONTHS: Record<string, number> = { Rithika: 10, Neha: 6, Amirdhavarshini: 5, Rithanya: 1, Aswathy: 11 };
    const now = Date.now();
    const month = (tz: string): number => Number(new Intl.DateTimeFormat("en-AU", { timeZone: tz, month: "numeric" }).format(now));
    // Around the turn of a month, two of us can be in our birthday months at once.
    const girls = five.filter((p) => MONTHS[p.name] === month(ZONES[p.name]));
    const others = five.filter((p) => !girls.includes(p));
    const [visitor, notHers] = others;

    const house = await page("/", visitor.id);
    const crowned = [...house.querySelectorAll(".house-svg [data-person]")].filter((g) => g.querySelector(".crown")).map((g) => g.getAttribute("data-person"));
    expect(crowned.sort(), "the wrong people are wearing crowns").toEqual(girls.map((p) => p.id).sort());
    expect([...house.querySelectorAll(".house-svg .party")].map((g) => g.getAttribute("data-place")).sort()).toEqual(girls.map((p) => `room:${p.id}`).sort());
    expect((await post(`/room/${notHers.id}/wish`, {}, visitor.id)).status, `wished ${notHers.name} a happy birthday outside her month`).toBe(404);

    for (const girl of girls) {
      expect((await post(`/room/${girl.id}/wish`, {}, visitor.id)).headers.get("location")).toBe(`/room/${girl.id}?did=wish`);
      expect(text((await page("/updates", girl.id)).querySelector(".away"))).toContain(`${visitor.name} wished you a happy birthday`);
      expect(text((await page(`/room/${girl.id}`, girl.id)).querySelector(".birthday-card")), "her room doesn't keep who wished her").toContain(visitor.name);
    }
  });
});
