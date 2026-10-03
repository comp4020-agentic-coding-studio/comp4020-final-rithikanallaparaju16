import { JSDOM } from "jsdom";
import { describe, expect, inject, it } from "vitest";

// The house's promises, checked against the running app over HTTP.
const baseUrl = inject("baseUrl");

// These checks leave things behind and mark people as having visited, so they
// only run against a throwaway house (CI's container, a local run), never the
// friends' real one on Fly.
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

type Person = { id: string; name: string };

const parse = (html: string): Document => new JSDOM(html).window.document;

async function page(path: string, who?: string): Promise<Document> {
  const res = await fetch(new URL(path, baseUrl), { headers: who ? { cookie: `who=${who}` } : {} });
  expect(res.status, `GET ${path}`).toBe(200);
  return parse(await res.text());
}

function post(path: string, fields: Record<string, string>, who?: string): Promise<Response> {
  return fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(who ? { cookie: `who=${who}` } : {}),
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

describe.skipIf(!throwaway)("living in the house", () => {
  it("remembers who you are", async () => {
    const [me] = await people();
    const res = await post("/me", { who: me.id });
    expect(res.status).toBe(303);
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith("who="));
    expect(cookie, "picking who you are set no who= cookie").toBeDefined();

    const home = await page("/", cookie!.split(";")[0].slice("who=".length));
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

  it("lets Laddoo follow whoever played with him", async () => {
    const [a, b, c] = await people();
    expect((await post("/garden/dog", {}, b.id)).status).toBe(303);

    const house = await page("/", a.id);
    expect(house.querySelector(`.laddoo[data-place="room:${b.id}"]`), `Laddoo isn't in ${b.name}'s room`).not.toBeNull();
    expect(house.querySelector(`.laddoo[data-place="room:${c.id}"]`)).toBeNull();
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
  });
});
