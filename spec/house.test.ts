import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
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

  it("lets friends stick a sticker on a note, and tells the writer how they felt", async () => {
    const [a, b, c] = await people();
    const note = unique("big news from the spec");
    await post("/wall", { body: note, big: "1" }, a.id);
    const id = withText(await page("/living", b.id), ".note", note)?.getAttribute("data-id");
    expect(id, "the note never made it onto the wall").toBeTruthy();

    expect((await post("/wall/sticker", { note: id!, sticker: "haha" }, b.id)).headers.get("location")).toBe(`/living?did=sticker#note-${id}`);
    await post("/wall/sticker", { note: id!, sticker: "love" }, c.id);
    // One sticker each: b changes her mind, and 😂 becomes 🥹.
    await post("/wall/sticker", { note: id!, sticker: "aww" }, b.id);

    const stuck = withText(await page("/living", a.id), ".note", note)!;
    const chips = [...stuck.querySelectorAll(".sticker")].map((s) => text(s));
    expect(chips, "the stickers aren't on the note, each with who stuck it").toEqual([`❤️ ${c.name}, love it`, `🥹 ${b.name}, aww`]);
    const away = text((await page("/updates", a.id)).querySelector(".away"));
    expect(away).toContain(`${b.name} stuck 🥹 on your note`);
    expect(away).toContain(`${c.name} stuck ❤️ on your note`);
    expect(away, "she still hears about the sticker b swapped out").not.toContain(`${b.name} stuck 😂`);

    expect((await post("/wall/sticker", { note: id!, sticker: "love" }, a.id)).status, "she stickered her own note").toBe(400);
    expect((await post("/wall/sticker", { note: id!, sticker: "thumbsdown" }, b.id)).status).toBe(400);
  });

  // Rithika: "on memory wall, give the user an option to upload an image, so
  // if sumn reminds them of the group, they can send an image saying, this
  // reminds me of you guys" (ADR 0024).
  it("pins a photo on the memory wall with what it reminds you of, for friends in the house to see", async () => {
    const [a, b] = await people();
    const living = await page("/living", a.id);
    const form = living.querySelector("form#photo[action='/wall/photo'][enctype='multipart/form-data']");
    expect(form, "there's no way to pin a photo on the wall").not.toBeNull();
    expect(form!.querySelector("input[type=file][name=photo]")?.getAttribute("accept")).toContain("image/jpeg");
    expect(form!.querySelector<HTMLInputElement>("input[name=body]")?.getAttribute("value")).toBe("this reminds me of you guys");

    // A tiny real PNG (1 x 1, one warm pixel), as a phone would send a photo.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4v+7/fwAIDAN+M8x3iQAAAABJRU5ErkJggg==", "base64");
    const caption = unique("this reminds me of you guys");
    const pin = async (file: Blob, name: string, body = caption, who = a.id): Promise<Response> => {
      const data = new FormData();
      data.set("photo", file, name);
      data.set("body", body);
      return fetch(new URL("/wall/photo", baseUrl), { method: "POST", headers: { cookie: await cookieFor(who) }, body: data, redirect: "manual" });
    };
    const res = await pin(new Blob([png], { type: "image/png" }), "chai.png");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/living?did=photo#wall");

    // b finds it on the wall, as a polaroid with a's words under it, and hears about it.
    const note = withText(await page("/living", b.id), ".note.photo", caption);
    expect(note, "the photo isn't on the wall").toBeDefined();
    const src = note!.querySelector(".snap img")?.getAttribute("src") ?? "";
    expect(src).toMatch(/^\/photo\/\d+$/);
    expect(text(note!.querySelector(".by"))).toContain(a.name);
    expect(text((await page("/updates", b.id)).body)).toContain(`${a.name} pinned a photo on the wall`);
    // Small, around the house: beside its line in Updates, and pinned on the
    // living room's board in the picture.
    const line = withText(await page("/updates", b.id), ".happenings li", `${a.name} pinned a photo on the wall: “${caption.slice(0, 40)}`);
    expect(line?.querySelector(".photo-thumb img")?.getAttribute("src"), "Updates doesn't show the photo small").toBe(src);
    const board = [...(await page("/", b.id)).querySelectorAll(".house-svg g.board-photos image")].map((i) => i.getAttribute("href"));
    expect(board, "the photo isn't pinned on the board in the house").toContain(src);

    // The photo itself, exactly as sent, for friends in the house only.
    const shown = await fetch(new URL(src, baseUrl), { headers: { cookie: await cookieFor(b.id) } });
    expect(shown.status).toBe(200);
    expect(shown.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await shown.arrayBuffer()).equals(png), "the photo came back changed").toBe(true);
    expect((await fetch(new URL(src, baseUrl))).status, "someone who isn't in the house can see the photo").toBe(403);
    expect((await fetch(new URL("/photo/999999", baseUrl), { headers: { cookie: await cookieFor(b.id) } })).status).toBe(404);

    // Only pictures: a file that says it's a photo but isn't is turned away.
    expect((await pin(new Blob(["<script>alert(1)</script>"], { type: "image/png" }), "not-a-photo.png")).status).toBe(400);
    expect((await pin(new Blob([], { type: "image/png" }), "")).status, "pinned without a photo").toBe(400);
    expect((await pin(new Blob([png], { type: "image/png" }), "long.png", "x".repeat(501))).status).toBe(400);
  });

  // Rithika, on "Drawings, voice notes and real-time chat": "wait can we do
  // this? do it if its possible", and "Skip chat for now" (ADR 0037).
  it("leaves a friend a drawing or a voice note on her desk that only she and its writer can see or hear", async () => {
    const [a, b, c] = await people();
    const room = await page(`/room/${b.id}`, a.id);
    const drawForm = room.querySelector(`#draw-something form[action='/room/${b.id}/draw'][enctype='multipart/form-data']`);
    expect(drawForm, "there's no paper to draw her something on").not.toBeNull();
    expect(drawForm!.querySelector("input[type=file]")?.getAttribute("accept")).toBe("image/png");
    const voiceForm = room.querySelector(`#voice-note form[action='/room/${b.id}/voice'][enctype='multipart/form-data']`);
    expect(voiceForm, "there's no way to leave her a voice note").not.toBeNull();
    expect(voiceForm!.querySelector("input[type=file]")?.getAttribute("accept")).toBe("audio/*");
    expect((await page(`/room/${a.id}`, a.id)).querySelector("#draw-something, #voice-note"), "she's offered to draw on her own desk").toBeNull();

    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4v+7/fwAIDAN+M8x3iQAAAABJRU5ErkJggg==", "base64");
    // The first bytes of a WebM recording (its EBML header), as a browser's
    // recorder sends; the house knows a sound by its first bytes.
    const webm = Buffer.concat([Buffer.from("1a45dfa3a3428681010000000000", "hex"), Buffer.alloc(64, 1)]);
    const leave = async (what: "draw" | "voice", file: Blob, body: string, who = a.id, to = b.id): Promise<Response> => {
      const data = new FormData();
      data.set(what === "draw" ? "drawing" : "voice", file, what === "draw" ? "drawing.png" : "voice.webm");
      data.set("body", body);
      if (what === "draw") data.set("drawn", "1");
      return fetch(new URL(`/room/${to}/${what}`, baseUrl), { method: "POST", headers: { cookie: await cookieFor(who) }, body: data, redirect: "manual" });
    };
    const drawLine = unique("this is you, sorry");
    const drew = await leave("draw", new Blob([png], { type: "image/png" }), drawLine);
    expect(drew.status).toBe(303);
    expect(drew.headers.get("location")).toBe(`/room/${b.id}?did=draw`);
    const voiceLine = unique("listen when you wake up");
    expect((await leave("voice", new Blob([webm], { type: "audio/webm" }), voiceLine)).status).toBe(303);

    // b finds both on her desk: the drawing to look at, the voice note to play.
    const hers = await page(`/room/${b.id}`, b.id);
    const drawing = withText(hers, ".desk-thing", drawLine);
    const src = drawing?.querySelector(".desk-drawing img")?.getAttribute("src") ?? "";
    expect(src, "she can't see the drawing").toMatch(/^\/drawing\/\d+$/);
    const voice = withText(hers, ".desk-thing", voiceLine);
    const clip = voice?.querySelector("audio")?.getAttribute("src") ?? "";
    expect(clip, "she can't play the voice note").toMatch(/^\/voice\/\d+$/);
    const news = text((await page("/updates", b.id)).body);
    expect(news).toContain(`${a.name} left a drawing on your desk`);
    expect(news).toContain(`${a.name} left a voice note on your desk`);

    // Exactly as sent, for her and for whoever left it.
    for (const who of [b.id, a.id]) {
      const pic = await fetch(new URL(src, baseUrl), { headers: { cookie: await cookieFor(who) } });
      expect(pic.status, `the drawing for ${who}`).toBe(200);
      expect(pic.headers.get("content-type")).toBe("image/png");
      expect(Buffer.from(await pic.arrayBuffer()).equals(png)).toBe(true);
      const sound = await fetch(new URL(clip, baseUrl), { headers: { cookie: await cookieFor(who) } });
      expect(sound.status, `the voice note for ${who}`).toBe(200);
      expect(sound.headers.get("content-type")).toBe("audio/webm");
      expect(Buffer.from(await sound.arrayBuffer()).equals(webm)).toBe(true);
    }

    // A third friend walking in sees that something's been left, and no more.
    const theirs = await page(`/room/${b.id}`, c.id);
    expect(text(theirs.querySelector("#desk"))).toContain(`A folded drawing for ${b.name}`);
    expect(text(theirs.querySelector("#desk"))).toContain(`A voice note for ${b.name}`);
    expect(text(theirs.querySelector("#desk")), "the line with the drawing shows to a third friend").not.toContain(drawLine);
    expect(theirs.querySelector(`.desk-drawing, audio[src='${clip}']`)).toBeNull();
    for (const path of [src, clip]) {
      expect((await fetch(new URL(path, baseUrl), { headers: { cookie: await cookieFor(c.id) } })).status, `${path} for a third friend`).toBe(404);
      expect((await fetch(new URL(path, baseUrl))).status, `${path} for someone not in the house`).toBe(403);
    }

    // Only a drawing and only a sound: anything else is turned away, and
    // nobody leaves them on her own desk.
    expect((await leave("draw", new Blob(["<svg onload=alert(1)>"], { type: "image/png" }), "x")).status).toBe(400);
    expect((await leave("draw", new Blob([png], { type: "image/png" }), "x", a.id, a.id)).status, "she drew on her own desk").toBe(400);
    expect((await leave("voice", new Blob([png], { type: "audio/webm" }), "x")).status, "a picture went up as a voice note").toBe(400);
    expect((await leave("voice", new Blob(["<script>alert(1)</script>"], { type: "audio/webm" }), "x")).status).toBe(400);
    expect((await leave("voice", new Blob([webm], { type: "audio/webm" }), "x".repeat(501))).status).toBe(400);
  });

  it("pins a drawing on the wall like a photo, for friends to sticker", async () => {
    const [a, b] = await people();
    const living = await page("/living", a.id);
    expect(living.querySelector("#draw form[action='/wall/photo'] input[name=drawn][value='1']"), "there's no paper on the wall to draw on").not.toBeNull();

    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4v+7/fwAIDAN+M8x3iQAAAABJRU5ErkJggg==", "base64");
    const caption = unique("us at the beach, kind of");
    const data = new FormData();
    data.set("photo", new Blob([png], { type: "image/png" }), "drawing.png");
    data.set("drawn", "1");
    data.set("body", caption);
    const res = await fetch(new URL("/wall/photo", baseUrl), { method: "POST", headers: { cookie: await cookieFor(a.id) }, body: data, redirect: "manual" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/living?did=drawing#wall");

    const note = withText(await page("/living", b.id), ".note.photo.sketched", caption);
    expect(note, "the drawing isn't on the wall").toBeDefined();
    expect(note!.querySelector(".snap img")?.getAttribute("alt")).toContain(`A drawing from ${a.name}`);
    expect(text((await page("/updates", b.id)).body)).toContain(`${a.name} pinned a drawing on the wall`);
    const id = note!.id.replace(/^note-/, "");
    expect((await post("/wall/sticker", { note: id, sticker: "love" }, b.id)).status).toBe(303);
    expect(text((await page("/updates", a.id)).body)).toContain(`${b.name} stuck ❤️ on your drawing “${caption.slice(0, 40)}`);

    // A drawing is a PNG from the paper; a JPEG sent as one is turned away.
    const jpeg = Buffer.from("ffd8ffe000104a46494600010100000100010000ffd9", "hex");
    const fake = new FormData();
    fake.set("photo", new Blob([jpeg], { type: "image/jpeg" }), "drawing.png");
    fake.set("drawn", "1");
    expect((await fetch(new URL("/wall/photo", baseUrl), { method: "POST", headers: { cookie: await cookieFor(a.id) }, body: fake, redirect: "manual" })).status).toBe(400);
  });

  // Rithika: "can you make this into sumn i can view on the homescreen, like
  // locket?" (ADR 0025). A widget reads one private link per friend.
  // And (ADR 0027): "when i enter the home through laptop,phone or ipad,
  // there should be an option asking if i want the widget on my homescreen,
  // if i say yes, it has to work", showing things that keep changing.
  it("asks on Home about a home-screen widget, and yes gives each friend one that shows what friends left her, to nobody else", async () => {
    const [a, b] = await people();
    // Home asks, with a yes and a not now.
    const home = await page("/", a.id);
    expect(home.querySelector(".widget-ask form[action='/widget/yes'] button"), "Home doesn't ask about the widget").not.toBeNull();
    expect(home.querySelector(".widget-ask form[action='/widget/later'] button"), "Home's question has no not now").not.toBeNull();

    // Yes makes her link and shows the steps for the phone she's on.
    expect((await post("/widget/yes", {}, a.id)).headers.get("location")).toBe("/home-screen#widget");
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    const steps = parse(await (await fetch(new URL("/home-screen", baseUrl), { headers: { cookie: await cookieFor(a.id), "user-agent": iphone } })).text());
    expect(steps.querySelector("details.widget-way[open]")?.id, "an iPhone isn't shown the iPhone steps first").toBe("on-iphone");
    expect([...steps.querySelectorAll("details.widget-way[data-device]")].map((d) => d.id).sort()).toEqual(["on-android", "on-ipad", "on-iphone", "on-mac"]);
    expect(steps.querySelector(".widget-status.waiting"), "the page doesn't say it's waiting for the widget").not.toBeNull();
    const link = steps.querySelector<HTMLInputElement>("input.widget-link")?.getAttribute("value") ?? "";
    expect(link).toMatch(new RegExp(`/widget/${a.id}\\.[A-Za-z0-9_-]{20,}/$`));
    const path = new URL(link).pathname;
    // Saying yes again keeps the same link working.
    await post("/widget/yes", {}, a.id);
    expect((await page("/home-screen", a.id)).querySelector("input.widget-link")?.getAttribute("value")).toBe(link);

    // b pins a photo, leaves a note and a KitKat on a's desk, and saves her a plate.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4v+7/fwAIDAN+M8x3iQAAAABJRU5ErkJggg==", "base64");
    const caption = unique("this reminds me of you guys");
    const data = new FormData();
    data.set("photo", new Blob([png], { type: "image/png" }), "us.png");
    data.set("body", caption);
    data.set("widget", "yes");
    await fetch(new URL("/wall/photo", baseUrl), { method: "POST", headers: { cookie: await cookieFor(b.id) }, body: data, redirect: "manual" });
    const note = unique("for the exam, you've got this");
    expect((await post(`/room/${a.id}/leave`, { item: "chocolate", body: note }, b.id)).status).toBe(303);
    const plateNote = unique("saved yours");
    expect((await post("/kitchen", { item: "biryani", for: a.id, body: plateNote }, b.id)).status).toBe(303);

    // Read with no cookie at all: the link is the key.
    const res = await fetch(new URL(path, baseUrl));
    expect(res.status).toBe(200);
    const w = await res.json();
    expect(w.for).toBe(a.name);
    expect(w.latest, "the widget doesn't show b's photo").toMatchObject({ by: b.name, caption, text: `${b.name} pinned a photo on the wall` });
    expect(w.latest.photo).toMatch(/^photo\/\d+$/);
    const five = await people();
    expect(w.friends.map((f: { name: string }) => f.name), "the widget doesn't show all five").toEqual(five.map((p) => (p.id === a.id ? "You" : p.name)));
    for (const f of w.friends) expect(f.time, `${f.name} has no clock`).toMatch(/^\d{1,2}:\d{2} [ap]m$/);
    // Its cards: what's for her first, then the wall, her room, everyone and Shinzo.
    const kinds = w.cards.map((c: { kind: string }) => c.kind).filter((k: string) => k !== "birthday");
    expect(kinds, "the widget's cards").toEqual(["desk", "plate", "wall", "room", "everyone", "dog"]);
    const card = (kind: string) => w.cards.find((c: { kind: string }) => c.kind === kind);
    expect(card("desk"), "the widget doesn't show the note b left").toMatchObject({ by: b.name, text: `“${note}”`, emoji: "🍫" });
    expect(card("plate"), "the widget doesn't show the plate b saved").toMatchObject({ by: b.name, title: `${b.name} saved you some biryani`, text: `“${plateNote}”` });
    expect(card("wall").photos[0], "the widget's wall doesn't show b's photo").toMatchObject({ by: b.name, caption });
    // A widget is one friend's for good, whoever's in the browser, so her
    // room says whose it is: Rithika's iPhone showed "Your room" over
    // Amirdhavarshini's, from a widget made while she was in as her.
    expect(card("room").title, "the widget's room doesn't say whose it is").toBe(`${a.name}'s room`);
    expect(card("room").open).toMatch(new RegExp(`/room/${a.id}$`));

    // The photo and faces come through the same link, so the widget never signs in.
    const photo = await fetch(new URL(w.latest.photo, new URL(path, baseUrl)));
    expect(Buffer.from(await photo.arrayBuffer()).equals(png)).toBe(true);
    expect((await fetch(new URL(w.friends[0].face, new URL(path, baseUrl)))).status).toBe(200);
    const script = await (await fetch(new URL(`${path}scriptable.js`, baseUrl))).text();
    expect(script, "the iPhone script doesn't carry her link").toContain(`const LINK = "${new URL(path, baseUrl).origin}${path}";`);
    expect(steps.querySelector("textarea.widget-script")?.textContent, "the script isn't on the widget's page to copy").toBe(script);

    // And it runs as Scriptable runs it: plain JavaScriptCore, with no
    // browser's URL or fetch, only Scriptable's own Request, ListWidget,
    // FileManager and the rest (stood in for here). The pasted lines fetch
    // the widget itself from the house; each draw shows the next card, and
    // pictures already kept aren't fetched again.
    const folder = mkdtempSync(join(tmpdir(), "scriptable-"));
    const draw = async (): Promise<{ asked: string[]; url?: string; texts: string[] }> => {
      const asked: string[] = [];
      let shown: { url?: string } | undefined;
      const texts: string[] = [];
      const stack = (): Record<string, unknown> => ({
        addText: (t: string) => (texts.push(t), { centerAlignText: () => {} }),
        addImage: () => ({ applyFillingContentMode: () => {} }),
        addSpacer: () => {},
        addStack: () => stack(),
        layoutHorizontally: () => {},
        layoutVertically: () => {},
        centerAlignContent: () => {},
      });
      const sandbox = vm.createContext({
        Request: class {
          url: string;
          timeoutInterval = 0;
          constructor(url: string) {
            this.url = url;
            asked.push(url);
          }
          async ok() {
            const r = await fetch(this.url);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r;
          }
          async loadJSON() {
            return (await fetch(this.url)).json();
          }
          async loadString() {
            return (await this.ok()).text();
          }
          async load() {
            return { bytes: Buffer.from(await (await this.ok()).arrayBuffer()) };
          }
        },
        FileManager: {
          local: () => ({
            joinPath: (x: string, y: string) => join(x, y),
            libraryDirectory: () => folder,
            fileExists: (f: string) => existsSync(f),
            createDirectory: (f: string) => mkdirSync(f, { recursive: true }),
            readString: (f: string) => readFileSync(f, "utf8"),
            writeString: (f: string, t: string) => writeFileSync(f, t),
            write: (f: string, d: { bytes: Buffer }) => writeFileSync(f, d.bytes),
            remove: (f: string) => rmSync(f),
            modificationDate: (f: string) => statSync(f).mtime,
            listContents: (f: string) => readdirSync(f),
          }),
        },
        Image: { fromFile: (f: string) => (existsSync(f) ? {} : null), fromData: (d: { bytes: Buffer }) => (d.bytes.length ? {} : null) },
        Data: { fromJPEG: () => ({ bytes: Buffer.from("drawn") }) },
        DrawContext: class {
          drawImageAtPoint() {}
          drawImageInRect() {}
          setFillColor() {}
          fillRect() {}
          getImage() {
            return {};
          }
        },
        ListWidget: class {
          url?: string;
          constructor() {
            Object.assign(this, stack());
          }
          setPadding() {}
          async presentMedium() {
            shown = this;
          }
        },
        LinearGradient: class {},
        Color: class {
          static white() {
            return {};
          }
        },
        Font: { mediumSystemFont: () => ({}), boldSystemFont: () => ({}), systemFont: () => ({}) },
        Size: class {},
        Point: class {},
        Rect: class {},
        config: { runsInWidget: false, widgetFamily: "medium" },
        Script: { setWidget: () => {}, complete: () => {} },
        console,
      });
      expect(vm.runInContext("typeof URL + ' ' + typeof fetch + ' ' + typeof setTimeout", sandbox), "the sandbox isn't as bare as Scriptable").toBe("undefined undefined undefined");
      await vm.runInContext(`(async () => {\n${script}\n})()`, sandbox);
      return { asked, url: shown?.url, texts };
    };
    const origin = new URL(baseUrl).origin;
    const first = await draw();
    expect(first.asked.slice(0, 2), "the iPhone widget didn't fetch itself and read her link").toEqual([`${origin}${path}widget.js`, `${origin}${path}`]);
    const order = [...w.cards.map((c: { kind: string }) => c.kind)];
    const firstCard = w.cards[0];
    expect(first.url, "tapping the widget doesn't go to what it shows").toBe(`${origin}${firstCard.open}`);
    const seen = [first];
    for (let i = 1; i < order.length + 1; i++) seen.push(await draw());
    // Each draw is the next card, round and round.
    expect(seen.map((d) => d.url), "the widget doesn't show the next card each time").toEqual([...w.cards, w.cards[0]].map((c: { open: string }) => `${origin}${c.open}`));
    const deskDraw = seen[order.indexOf("desk")];
    expect(deskDraw.texts, "the widget doesn't show b's note").toContain(`“${note}”`);
    expect(seen[order.indexOf("plate")].texts, "the widget doesn't show the saved plate").toContain(`${b.name} saved you some biryani`);
    // Easy on the battery: it doesn't fetch itself again, asks the house
    // again only after a few minutes, and keeps every picture it's fetched.
    expect(seen.slice(1).flatMap((d) => d.asked).filter((u) => u.endsWith("widget.js") || u === `${origin}${path}`), "the widget kept asking the house").toEqual([]);
    expect(seen[seen.length - 1].asked, "the widget fetched a picture it already had").toEqual([]);

    // Each friend's widget is her own (Rithika, 4 Nov: "when i login as
    // rithika, i want my widget also to show updates for me"): b's says it's
    // b's, and a's private note isn't on it.
    await post("/widget/yes", {}, b.id);
    const bSteps = await page("/home-screen", b.id);
    expect(text(bSteps.querySelector(".widget-whose")), "the page doesn't say whose widget it is").toContain(`${b.name}'s`);
    const bLink = bSteps.querySelector("input.widget-link")?.getAttribute("value") ?? "";
    expect(bLink, "b got a's link").not.toBe(link);
    const bw = await (await fetch(new URL(new URL(bLink).pathname, baseUrl))).json();
    expect(bw.for).toBe(b.name);
    expect(bw.friends.find((f: { name: string }) => f.name === "You")?.id, "b's widget thinks she's someone else").toBe(b.id);
    expect(JSON.stringify(bw.cards), "a's private note is on b's widget").not.toContain(note);

    // Her widget looked in: her page says it's working. The browser that said
    // yes stops asking; another browser is asked to put it there too (ADR 0032).
    expect((await page("/home-screen", a.id)).querySelector(".widget-status.working"), "the page doesn't say her widget's working").not.toBeNull();
    const saidYes = parse(await (await fetch(new URL("/", baseUrl), { headers: { cookie: `${await cookieFor(a.id)}; widget-ask=yes` } })).text());
    expect(saidYes.querySelector(".widget-ask"), "the browser that said yes is still asked").toBeNull();
    expect(text((await page("/", a.id)).querySelector(".widget-ask")), "another browser isn't asked to put it there too").toContain("too");

    // A widget reading the house isn't coming by: her window stays as it was.
    await signOut(a.id);
    await fetch(new URL(path, baseUrl));
    const back = await signIn(a.id);
    expect(back.status, "reading the widget held her window").toBe(303);
    await fetch(new URL("/leave", baseUrl), { method: "POST", headers: { cookie: sessionOf(back) ?? "" }, redirect: "manual" });

    // Wrong keys, other friends' ids and old links read nothing.
    expect((await fetch(new URL(path.replace(/\.[^/]+\//, ".wrongkeywrongkeywrongkey/"), baseUrl))).status).toBe(404);
    expect((await fetch(new URL(path.replace(`/widget/${a.id}.`, `/widget/${b.id}.`), baseUrl))).status, "a's key opens b's widget").toBe(404);
    expect((await fetch(new URL(`${path.replace(/\.[^/]+\//, ".wrongkeywrongkeywrongkey/")}widget.js`, baseUrl))).status).toBe(404);
    expect((await post("/widget", {}, a.id)).headers.get("location")).toBe("/home-screen?did=widget#widget");
    expect((await fetch(new URL(path, baseUrl))).status, "the old link still works after making a new one").toBe(404);
    expect((await post("/widget", {})).status, "a stranger made a widget link").toBe(403);
    expect((await post("/widget/yes", {})).status, "a stranger said yes to a widget").toBe(403);
  });

  // "Not now" is this browser's own answer: Home stops asking here, and shows
  // a quiet way back instead.
  it("lets a friend say not now to the widget, and Home stops asking on that browser", async () => {
    const [, , c] = await people();
    expect((await page("/", c.id)).querySelector(".widget-ask"), "Home doesn't ask").not.toBeNull();
    const res = await post("/widget/later", {}, c.id);
    expect(res.headers.get("location")).toBe("/");
    const later = res.headers.getSetCookie().find((x) => x.startsWith("widget-ask="))?.split(";")[0] ?? "";
    expect(later, "not now isn't kept").toBe("widget-ask=later");
    const home = parse(await (await fetch(new URL("/", baseUrl), { headers: { cookie: `${await cookieFor(c.id)}; ${later}` } })).text());
    expect(home.querySelector(".widget-ask"), "Home still asks after not now").toBeNull();
    expect(home.querySelector("a.to-widget")?.getAttribute("href"), "there's no way back to the widget").toBe("/home-screen#widget");
    // That way back leads somewhere useful: with no widget made yet, the page
    // offers to make it rather than an empty box to copy.
    const steps = await page("/home-screen", c.id);
    expect(steps.querySelector("textarea.widget-script"), "an empty script to copy, before the widget's made").toBeNull();
    expect(steps.querySelector("#on-iphone form[action='/widget/yes'] button"), "the page can't make the widget from here").not.toBeNull();
  });

  // Rithika, 4 Nov: "when amirdha puts a note on my desk, i want a small
  // preview. if theres an update on the mermory wall i want a small preview
  // on my widget / if amirdha leaves a note on nehas desk, i dont need a
  // preview, but if food is left on the counter for me i need to see, but
  // if its a note, it could be private, so dont read it / but memory wall
  // wont be private. so maybe ask if it can be shown on the widget before
  // you show." (ADR 0029)
  it("puts what's left for her on her widget first, never a friend's note, and only the wall its writers share", async () => {
    const [a, b, c] = await people();
    await post("/widget/yes", {}, a.id);
    const link = (await page("/home-screen", a.id)).querySelector("input.widget-link")?.getAttribute("value") ?? "";
    const read = async () => (await fetch(new URL(new URL(link).pathname, baseUrl))).json();

    // Asked before it leaves the house: unticked, on both of the wall's forms.
    const living = await page("/living", b.id);
    for (const form of ["form[action='/wall']", "form#photo"]) {
      const box = living.querySelector<HTMLInputElement>(`${form} input[type=checkbox][name=widget][value=yes]`);
      expect(box, `the wall's ${form} doesn't ask about widgets`).not.toBeNull();
      expect(box?.hasAttribute("checked"), "it's ticked before anyone says").toBe(false);
    }

    // b writes two notes on the wall: one she shares, one she doesn't.
    const shared = unique("you've got this, all of you");
    const kept = unique("only for in here");
    expect((await post("/wall", { body: kept }, b.id)).status).toBe(303);
    expect((await post("/wall", { body: shared, widget: "yes" }, b.id)).status).toBe(303);
    // b leaves a note on c's desk, and a's: a's widget shows only her own.
    const forC = unique("for c only");
    const forA = unique("a little note for a");
    expect((await post(`/room/${c.id}/leave`, { item: "flower", body: forC }, b.id)).status).toBe(303);
    expect((await post(`/room/${a.id}/leave`, { item: "flower", body: forA }, b.id)).status).toBe(303);

    let w = await read();
    const all = JSON.stringify(w);
    expect(all, "a friend's private desk note is on her widget").not.toContain(forC);
    expect(all, "a wall note its writer didn't share is on her widget").not.toContain(kept);
    const wallCard = w.cards.find((k: { kind: string }) => k.kind === "wall");
    expect(wallCard?.notes.map((n: { text: string }) => n.text), "the wall note b shared isn't on her widget").toContain(shared);
    // What's newest is marked, so the widget shows it first.
    const desk = w.cards.find((k: { kind: string }) => k.kind === "desk");
    expect(desk, "her widget doesn't show the note on her desk").toMatchObject({ by: b.name, text: `“${forA}”` });
    expect(w.newest, "the newest thing on her widget isn't marked").toBe(desk.at);

    // b changes her mind about the shared note: off friends' widgets, still on the wall.
    const mine = [...(await page("/living", b.id)).querySelectorAll(".wall .note")].find((n) => n.textContent?.includes(shared));
    const id = mine?.getAttribute("data-id") ?? "";
    expect(mine?.querySelector("form.widget-say[action='/wall/widget'] button[aria-pressed='true']"), "the writer can't see it's on widgets, or take it off").not.toBeNull();
    expect((await post("/wall/widget", { note: id, widget: "yes" }, c.id)).status, "a friend changed where b's note shows").toBe(400);
    expect((await post("/wall/widget", { note: id, widget: "" }, b.id)).headers.get("location")).toBe(`/living?did=offwidget#note-${id}`);
    w = await read();
    expect(JSON.stringify(w), "a note taken off widgets is still on hers").not.toContain(shared);
    expect(text((await page("/living", a.id)).querySelector("#wall")), "taking it off widgets took it off the wall").toContain(shared);
    // Housekeeping isn't news: c isn't told b changed a setting.
    expect(text((await page("/updates", c.id)).querySelector("main")), "a widget setting shows up as news").not.toMatch(/widget/i);
  });

  // RICE AA (ADR 0030): a card written any time stays sealed until her
  // birthday. Nobody but her and its writer ever reads it; before the day
  // she sees who it's from. (It opening on the day is checked in a made
  // house, where a birthday can be today.)
  it("seals a birthday card until her birthday, and only she and its writer read it", async () => {
    const five = await people();
    const [writer, other] = [five[2], five[3]];
    const her = five[1];
    const words = unique("happy birthday, I remember");
    expect((await post(`/room/${her.id}/card`, { body: words }, writer.id)).headers.get("location")).toBe(`/room/${her.id}?did=card#card`);
    expect((await post(`/room/${writer.id}/card`, { body: "me" }, writer.id)).status, "a card to yourself was sealed").toBe(400);
    expect((await post(`/room/${her.id}/card`, { body: "" }, writer.id)).status, "a blank card was sealed").toBe(400);

    const room = await page(`/room/${her.id}`, her.id);
    const card = text(room.querySelector("#card"));
    // Unless today is her birthday, it's sealed: she sees who, not what.
    if (!card.includes(words)) expect(card, "she doesn't see a card is waiting").toContain(`from ${writer.name}, waiting for your birthday`);
    expect(text((await page(`/room/${her.id}`, writer.id)).querySelector("#card")), "the writer can't see the card she sealed").toContain(words);
    expect(text((await page(`/room/${her.id}`, other.id)).querySelector("main")), "another friend read the card").not.toContain(words);
    expect(text((await page("/updates", other.id)).querySelector("main")), "another friend heard about the surprise").not.toContain("birthday card");
  });

  // ADR 0031: leaving the light on, a hug that waits for her.
  it("leaves the light on in a friend's window, glowing until she comes home to it", async () => {
    const [a, b, c] = await people();
    expect((await post(`/room/${b.id}/lamp`, {}, a.id)).headers.get("location")).toBe(`/room/${b.id}?did=lamp`);
    expect((await post(`/room/${a.id}/lamp`, {}, a.id)).status, "a light left on in your own window").toBe(400);
    // Lit in the picture, for everyone, and c sees who left it.
    const house = await page("/", c.id);
    expect(house.querySelectorAll("g.light circle.left-on").length, "the window isn't lit in the picture").toBeGreaterThan(0);
    expect(text((await page(`/room/${b.id}`, c.id)).querySelector(".left-on-line")), "the room doesn't say who left the light on").toContain(`${a.name} left the light on for ${b.name}`);
    // b comes home to it: her room and Updates say who; nobody else is told.
    expect(text((await page(`/room/${b.id}`, b.id)).querySelector(".left-on-line")), "she doesn't see who left it on").toContain(`${a.name} left the light on for you`);
    expect(text((await page("/updates", b.id)).querySelector("main")), "Updates doesn't tell her").toContain(`${a.name} left the light on for you`);
    expect(text((await page("/updates", c.id)).querySelector("main")), "a third friend heard about it").not.toContain("left the light on");
  });

  // ADR 0031: one line each under a friend's photo, never a thread.
  it("lets each friend write one line under a friend's photo, and the photo's writer hears it", async () => {
    const [a, b, c] = await people();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4v+7/fwAIDAN+M8x3iQAAAABJRU5ErkJggg==", "base64");
    const data = new FormData();
    data.set("photo", new Blob([png], { type: "image/png" }), "us.png");
    data.set("body", unique("the beach"));
    await fetch(new URL("/wall/photo", baseUrl), { method: "POST", headers: { cookie: await cookieFor(a.id) }, body: data, redirect: "manual" });
    const living = await page("/living", b.id);
    const note = [...living.querySelectorAll(".wall .note.photo")].find((n) => n.querySelector("form.photo-line-form"));
    const id = note?.getAttribute("data-id") ?? "";
    expect(id, "there's no way to write under a friend's photo").not.toBe("");
    const first = unique("best day");
    const second = unique("best day ever");
    expect((await post("/wall/caption", { note: id, body: first }, b.id)).headers.get("location")).toBe(`/living?did=caption#note-${id}`);
    expect((await post("/wall/caption", { note: id, body: second }, b.id)).status).toBe(303);
    expect((await post("/wall/caption", { note: id, body: "mine" }, a.id)).status, "the writer wrote under her own photo").toBe(400);
    const lines = [...(await page("/living", c.id)).querySelectorAll(`#note-${id} .photo-lines li`)].map(text);
    expect(lines.filter((l) => l.includes("best day")), "a friend's lines became a thread, not one each").toEqual([`${second} ${b.name}`]);
    expect(text((await page("/updates", a.id)).querySelector("main")), "the photo's writer doesn't hear the line").toContain(`${b.name} wrote under your photo`);
  });

  // ADR 0031: tell them I was here, a message to send yourself.
  it("offers a message to send the group yourself, naming what you did and never what you wrote", async () => {
    const [a, b] = await people();
    const secret = unique("a secret for b");
    await post(`/room/${b.id}/leave`, { item: "flower", body: secret }, a.id);
    await post("/garden/water", {}, a.id);
    const home = await page("/updates", a.id);
    const message = home.querySelector("textarea.tell-message")?.textContent ?? "";
    expect(message, "the message doesn't say what you did").toContain(`left ${b.name} something on`);
    expect(message).toContain("watered the garden");
    expect(message, "the message quotes what you wrote").not.toContain(secret);
  });

  // Rithika, 5 Nov: "amirdha tried from her laptop and her phone, she uses
  // windows and android she says she didnt get the pop up thingee" (ADR
  // 0032). Her widget had looked in from another phone, which stopped every
  // device asking. Now each browser is asked until it answers.
  it("asks each browser about the widget until that browser answers, even if her widget works elsewhere", async () => {
    const [, , c] = await people();
    await post("/widget/yes", {}, c.id);
    const link = (await page("/home-screen", c.id)).querySelector("input.widget-link")?.getAttribute("value") ?? "";
    await fetch(new URL(new URL(link).pathname, baseUrl)); // her widget looks in, from somewhere
    const windows = { cookie: await cookieFor(c.id), "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" };
    const home = parse(await (await fetch(new URL("/", baseUrl), { headers: windows })).text());
    expect(home.querySelector(".widget-ask form[action='/widget/yes']"), "a new browser isn't asked because her widget works elsewhere").not.toBeNull();
    expect(text(home.querySelector(".widget-ask")), "it doesn't say her widget's already working").toContain("too");
    // On Windows, the steps say it lives on a phone, and Android's come first.
    const steps = parse(await (await fetch(new URL("/home-screen", baseUrl), { headers: windows })).text());
    expect(text(steps.querySelector(".widget-on-phone")), "Windows isn't told the widget lives on a phone").toContain("lives on your phone");
    expect(steps.querySelector("details.widget-way[open]")?.id, "Windows isn't shown Android's steps first").toBe("on-android");
    // This browser says yes: it stops asking here.
    const yes = await fetch(new URL("/widget/yes", baseUrl), { method: "POST", headers: { ...windows, "content-type": "application/x-www-form-urlencoded" }, redirect: "manual" });
    const answered = yes.headers.getSetCookie().find((x) => x.startsWith("widget-ask=yes"));
    expect(answered, "saying yes isn't kept in this browser").toBeTruthy();
    const after = parse(await (await fetch(new URL("/", baseUrl), { headers: { ...windows, cookie: `${windows.cookie}; widget-ask=yes` } })).text());
    expect(after.querySelector(".widget-ask"), "the browser that said yes is still asked").toBeNull();
  });

  it("only lets the five leave things", async () => {
    const note = unique("from a stranger");
    expect((await post("/wall", { body: note })).status).toBe(403);
    expect((await post("/wall", { body: note }, "intruder")).status).toBe(403);
    const photo = new FormData();
    photo.set("photo", new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0])], { type: "image/jpeg" }), "a.jpg");
    expect((await fetch(new URL("/wall/photo", baseUrl), { method: "POST", body: photo, redirect: "manual" })).status, "a stranger pinned a photo").toBe(403);
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

  it("lets a friend write back to a note on her desk, onto the writer's desk, for her eyes only", async () => {
    const [a, b, c] = await people();
    const note = unique("good luck for the exam 🍀");
    await post(`/room/${b.id}/leave`, { body: note }, a.id);
    const onDesk = withText(await page(`/room/${b.id}`, b.id), ".desk-thing", note)!;
    const id = onDesk.id.replace("desk-", "");
    const form = onDesk.querySelector(`details.write-back form[action="/room/${a.id}/reply"]`);
    expect(form, `${b.name} can't write back to ${a.name}'s note`).not.toBeNull();

    // Only a note on your own desk, from whoever you're writing back to.
    expect((await post(`/room/${a.id}/reply`, { note: id, body: "hi" }, c.id)).status, `${c.name} wrote back to a note on ${b.name}'s desk`).toBe(400);
    expect((await post(`/room/${c.id}/reply`, { note: id, body: "hi" }, b.id)).status, `${b.name} wrote back to ${c.name} about ${a.name}'s note`).toBe(400);
    expect((await post(`/room/${a.id}/reply`, { note: id, body: " " }, b.id)).status, "an empty reply was taken").toBe(400);

    const answer = unique("thank you!! it went well");
    const res = await post(`/room/${a.id}/reply`, { note: id, body: answer }, b.id);
    expect(res.headers.get("location")).toBe(`/room/${b.id}?did=reply#desk-${id}`);

    const reply = withText(await page(`/room/${a.id}`, a.id), ".desk-thing.reply", answer);
    expect(reply, `${a.name} can't find ${b.name}'s reply on her desk`).toBeDefined();
    expect(text(reply!.querySelector(".reply-to")), "the reply doesn't say which note it answers").toContain(`your note “${[...note].slice(0, 20).join("")}`);
    expect(text(reply)).toContain(`from ${b.name}`);
    expect(text((await page("/updates", a.id)).querySelector(".away"))).toContain(`${b.name} wrote back to your note`);

    const peek = await page(`/room/${a.id}`, c.id);
    expect(text(peek.body), `${c.name} can read ${b.name}'s reply`).not.toContain(answer);
    expect(text(peek.body)).not.toContain(note);
    expect(text(withText(await page(`/room/${b.id}`, b.id), ".desk-thing", note)?.querySelector(".wrote-back"))).toBe(`You wrote back to ${a.name}.`);
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

  it("keeps a plate saved for a friend covered for her alone, and tells the cook she found it", async () => {
    const [a, b, c] = await people();
    const note = unique("saved you the last bowl");
    expect((await post("/kitchen", { item: "maggi", body: note, for: a.id }, a.id)).status, "a plate got saved for its own cook").toBe(400);
    expect((await post("/kitchen", { item: "maggi", body: note, for: "nobody" }, a.id)).status, "a plate got saved for someone who isn't one of us").toBe(400);
    const saved = await post("/kitchen", { item: "maggi", body: note, for: b.id }, a.id);
    expect(saved.headers.get("location")).toBe("/kitchen?did=saved");

    // Everyone else sees it's hers, and can't take it.
    const theirs = withText(await page("/kitchen", c.id), ".dish", note);
    expect(theirs, `${c.name} can't see the plate saved for ${b.name}`).toBeDefined();
    expect(text(theirs!.querySelector(".saved-tag"))).toBe(`for ${b.name}`);
    expect(text(theirs)).toContain(`${a.name} saved ${b.name} a bowl of Maggi`);
    expect(theirs!.querySelector("button[name=dish]"), `${c.name} is offered ${b.name}'s plate`).toBeNull();
    const id = theirs!.getAttribute("data-id")!;
    expect((await post("/kitchen/eat", { dish: id }, c.id)).status, `${c.name} ate the plate saved for ${b.name}`).toBe(400);

    // She hears it's waiting, finds it first on the counter, and eats it.
    expect(text((await page("/updates", b.id)).querySelector(".away"))).toContain(`${a.name} saved you a plate of Maggi`);
    const hers = (await page("/kitchen", b.id)).querySelector("#counter .dish");
    expect(hers?.getAttribute("data-id"), "a plate saved for her isn't first on the counter").toBe(id);
    expect(text(hers!.querySelector(".saved-tag"))).toBe("for you");
    expect((await post("/kitchen/eat", { dish: id }, b.id)).headers.get("location")).toBe("/kitchen?did=atesaved");
    expect(withText(await page("/kitchen", c.id), ".dish", note), "the empty plate is still on the counter").toBeUndefined();
    expect(text((await page("/updates", a.id)).querySelector(".away"))).toContain(`${b.name} found the plate of Maggi you saved her`);
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

  // The planner's rows, each checked against where that friend lives and
  // when she sleeps, and all showing the same moment: the next quarter of an
  // hour from now.
  const field = (tz: string, at: number): string => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  };
  const quarter = (t: number): number => Math.ceil(t / (15 * 60 * 1000)) * 15 * 60 * 1000;
  function checkPlanner(doc: Document, me: string, before: number, after: number): void {
    const picker = doc.querySelector("form#plan[action='/plan'] fieldset.when-picker");
    expect(picker, "there's no planner").not.toBeNull();
    const rows = [...picker!.querySelectorAll<HTMLLIElement>("li.when-row")];
    expect(rows.length, "the planner doesn't show everyone's clock").toBe(5);
    expect(rows[0].classList.contains("you"), "your own clock isn't first").toBe(true);
    expect(picker!.querySelectorAll("input[name=when]").length, "the house reads more than your own row").toBe(1);
    expect(rows[0].querySelector("input[name=when]")?.hasAttribute("min"), "your own clock can't go anywhere it likes").toBe(false);
    for (const row of rows) {
      const name = text(row.querySelector(".name")) === "You" ? me : text(row.querySelector(".name"));
      expect(row.getAttribute("data-tz"), `${name}'s row isn't on her clock`).toBe(ZONES[name]);
      expect(row.getAttribute("data-sleep"), `${name}'s row doesn't know when she sleeps`).toBe(SLEEP[name].join(","));
      // The time strip shows her face, not an initial two friends could share.
      expect(row.getAttribute("data-avatar"), `${name}'s row doesn't carry her face`).toMatch(new RegExp(`^/art/avatar-${row.getAttribute("data-person")}\\.png`));
      expect([field(ZONES[name], quarter(before)), field(ZONES[name], quarter(after))], `${name}'s row doesn't start now`).toContain(row.querySelector("input")!.getAttribute("value"));
    }
  }

  it("shows every friend's clock from now on, on the Everyone tab and Movies, to plan a call or a movie night", async () => {
    const five = await people();
    const neha = five.find((p) => p.name === "Neha")!;
    let before = Date.now();
    const everyoneTab = await page("/everyone", neha.id);
    checkPlanner(everyoneTab, neha.name, before, Date.now());
    expect(everyoneTab.querySelector("#plan input[name=what][value=call]")?.hasAttribute("checked"), "the Everyone tab's planner isn't for a call first").toBe(true);

    await post("/movies", { title: unique("Spirited Away") }, neha.id);
    before = Date.now();
    const moviesTab = await page("/movies", neha.id);
    checkPlanner(moviesTab, neha.name, before, Date.now());
    expect(moviesTab.querySelector("#plan input[name=what][value=movie]")?.hasAttribute("checked"), "the Movies planner isn't for movie night first").toBe(true);
    expect(moviesTab.querySelector("#plan select[name=movie]"), "you can't pick which movie").not.toBeNull();
  });

  it("plans a video call that everyone sees in her own time", async () => {
    const five = await people();
    const [neha, rithika] = [five.find((p) => p.name === "Neha")!, five.find((p) => p.name === "Rithika")!];
    const about = unique("Neha's news");
    expect((await post("/plan", { from: "everyone", what: "call", when: "2020-01-05T20:00", about }, neha.id)).status, "planned a call six years ago").toBe(400);
    expect((await post("/plan", { from: "everyone", when: "2030-01-05T20:00", about }, neha.id)).status, "planned something that's neither a call nor a movie").toBe(400);
    expect((await post("/plan", { from: "everyone", what: "call", when: "2030-01-05T20:00", about: "x".repeat(81) }, neha.id)).status).toBe(400);
    // 8 pm on 5 January 2030 in New Jersey (UTC-5).
    const res = await post("/plan", { from: "everyone", what: "call", when: "2030-01-05T20:00", about }, neha.id);
    expect(res.headers.get("location")).toBe("/everyone?did=call");

    const call = (await page("/everyone", rithika.id)).querySelector("#call");
    expect(text(call?.querySelector("h2"))).toContain(about);
    const at = Date.UTC(2030, 0, 6, 1, 0);
    for (const p of five) {
      expect(text(call?.querySelector(`li[data-person="${p.id}"] .clock`)), `${p.name}'s time for the call`).toBe(localTime(ZONES[p.name], at));
    }
    expect(text((await page("/updates", rithika.id)).querySelector(".away"))).toContain(`${neha.name} planned a video call (${about})`);
  });

  it("plans movie night from the same planner, back on the page it came from", async () => {
    const [a] = await people();
    const title = unique("Kumbalangi Nights");
    await post("/movies", { title }, a.id);
    const id = withText(await page("/movies", a.id), ".movie", title)!.getAttribute("data-id")!;
    const res = await post("/plan", { from: "movies", what: "movie", movie: id, when: "2030-01-05T20:00" }, a.id);
    expect(res.headers.get("location")).toBe("/movies?did=night");
    expect(text((await page("/movies", a.id)).querySelector(".night h2"))).toContain(title);
    expect((await post("/plan", { from: "movies", what: "movie", movie: "999999", when: "2030-01-05T20:00" }, a.id)).status).toBe(400);
  });

  // Rithika: "in movies tab, i want the time thing to come first and then
  // suggestions".
  it("puts the time for all of us first on Movies, before suggesting and the suggestions", async () => {
    const [a] = await people();
    const doc = await page("/movies", a.id);
    const order = [...doc.querySelectorAll("main > form#plan, main > form#suggest, main > section[data-live=movies]")].map((el) => el.id || "suggestions");
    expect(order, "the planner isn't first on Movies").toEqual(["plan", "suggest", "suggestions"]);
  });

  // Esc (public/house.js) zooms a room's page out to the whole house and back,
  // without leaving the page. It can only do that because a room's page is
  // the whole house's drawing, everyone in it, framed on the room: checked
  // here. The key itself is checked in a browser (doc/process-log.md).
  it("draws the whole house and everyone in it on a room's page, even while you're asleep in bed, so you can look out", async () => {
    const five = await people();
    const [me, friend] = five;
    expect((await post(`/room/${me.id}/nap`, {}, me.id)).status).toBe(303);
    await page("/kitchen", friend.id);
    const room = await page(`/room/${me.id}`, me.id);
    const svg = room.querySelector(".house-svg");
    expect(svg?.getAttribute("viewBox"), "the room's page isn't framed on the room").not.toBe("0 0 1376 768");
    expect(svg?.querySelector("image")?.getAttribute("width"), "the room's page doesn't carry the whole house's picture").toBe("1376");
    expect(svg?.querySelectorAll("a.room-link").length, "the room's page doesn't know every room").toBe(8);
    const mine = svg?.querySelector(`.walker.me[data-person="${me.id}"]`);
    expect(mine?.classList.contains("napping"), "you're not in bed").toBe(true);
    expect(svg?.querySelector(`[data-person="${friend.id}"]`), `${friend.name}, in the kitchen, isn't in the drawing of your room`).not.toBeNull();
    expect(room.querySelector("script[src^='/house.js?v=']"), "nothing on the page can zoom out").not.toBeNull();
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

  it("keeps an open UNO table up to date, and plays a card without leaving the page", async () => {
    const five = await people();
    const [a, b] = five;
    await onlyOnTheMat([a, b], five);
    await post("/uno", {}, a.id);
    const table = await page("/uno", b.id);
    const live = table.querySelector("[data-live='uno-game']");
    expect(live?.querySelector(".uno-table"), "the table doesn't change on an open page").toBeTruthy();
    expect(live?.querySelector("form#hand[data-quick]"), "playing a card reloads the whole page").toBeTruthy();

    const game = live!.querySelector("input[name=game]")!.getAttribute("value")!;
    expect((await post("/uno/move", { game, card: "draw" }, a.id)).status).toBe(303);
    // What b's open page fetches when it hears: a's move is on the table.
    expect(text((await page("/uno", b.id)).querySelector("[data-live='uno-game'] .uno-table"))).toContain(`${a.name} drew a card`);
  });

  it("gives each UNO player twenty seconds a turn, then plays on without her", async () => {
    const five = await people();
    const [a, b, c] = five;
    await onlyOnTheMat([a, b, c], five);
    expect((await post("/uno", {}, a.id)).status).toBe(303);
    const game = (await page("/uno", a.id)).querySelector("input[name=game]")!.getAttribute("value")!;
    // The dealer goes first, and lets her whole twenty seconds go by.
    await new Promise((r) => setTimeout(r, 20_600));

    const table = await page("/uno", b.id);
    expect(text(table.querySelector(".uno-turn")), "play didn't move on without her").toContain("your turn");
    expect(table.querySelector(`.uno-player.left[data-person="${a.id}"]`), `${a.name} is still in the game`).not.toBeNull();
    expect((await post("/uno/move", { game, card: "draw" }, a.id)).status, `${a.name} played after her time ran out`).toBe(400);
  }, 30_000);

  it("takes whoever leaves the house out of her UNO game, so nobody waits on her", async () => {
    const five = await people();
    const [a, b, c] = five;
    await onlyOnTheMat([a, b, c], five);
    await post("/uno", {}, a.id);
    await signOut(b.id);

    const table = await page("/uno", a.id);
    expect(table.querySelector(`.uno-player.left[data-person="${b.id}"]`), `${b.name} is still dealt in after leaving`).not.toBeNull();
    expect(text(table.querySelector(".uno-around .small"))).toContain(`Play goes you → ${c.name}`);
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

  it("keeps every common area lit, and dims only bedrooms by their owner's clock", async () => {
    const [a] = await people();
    for (const path of ["/", "/living", "/kitchen", "/garden"]) {
      const house = await page(path, a.id);
      const bedrooms = [...house.querySelectorAll(".house-svg a.room-link[data-place^='room:'] polygon")].map((p) => p.getAttribute("points"));
      expect(bedrooms.length, "there are no bedrooms to dim").toBe(5);
      // Whatever the hour, the only shade in the light layer is a bedroom's.
      expect(house.querySelector(".house-svg g.light rect"), `something shades the whole house on ${path}`).toBeNull();
      for (const shade of house.querySelectorAll(".house-svg g.light polygon")) {
        expect(bedrooms, `a common area is dimmed on ${path}`).toContain(shade.getAttribute("points"));
      }
    }
  });

  /* ---------- a house for any five friends (src/maker.ts, ADR 0017) ---------- */

  // Making a house the way the form does, and the address it lives at.
  async function makeHouse(names: string[], extra: Record<string, string> = {}): Promise<{ res: Response; code?: string }> {
    const fields: Record<string, string> = { ...extra };
    names.forEach((name, i) => (fields[`name-${i + 1}`] = name));
    // A visitor of its own each time, so runs back to back stay under the
    // per-visitor cap (Fly's proxy sets this header itself in production).
    const res = await fetch(new URL("/make", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "fly-client-ip": unique("spec") },
      body: new URLSearchParams(fields),
      redirect: "manual",
    });
    const code = res.status === 201 ? (await res.clone().text()).match(/\/h\/([a-z0-9]{10})\//)?.[1] : undefined;
    return { res, code };
  }

  it("makes a house for any five friends from what you tell it", async () => {
    const five = ["Mia", "Jo", "Sam", "Ana", "Lee"].map((n) => unique(n).slice(0, 30));
    const { res, code } = await makeHouse(five, { "city-1": "London", "things-1": "record-player", memories: "the road trip" });
    expect(res.status, "the house wasn't made").toBe(201);
    expect(code, "the made page doesn't say where the house is").toBeTruthy();

    const door = parse(await (await fetch(new URL(`/h/${code}/`, baseUrl))).text());
    const names = [...door.querySelectorAll("button[name=who] .name")].map((n) => text(n));
    expect(names, "the new house's door doesn't have its own five").toEqual(five);
    expect(text(door.body), "Rithika's five are in someone else's house").not.toContain("Rithika");
    expect(door.querySelector(`form[action="/h/${code}/me"]`), "the door's form leaves the house").not.toBeNull();
  });

  it("frames the friends' inside joke at their door and in their living room, exactly as written, under their house's name", async () => {
    const joke = `"it's just a small hill" <b class="typed">— Mia</b>`;
    const together = "the Goa trip, 2023";
    const { code } = await makeHouse(["Ivy", "Rae", "Kit", "Bo", "Dee"], { together, joke, title: "The Hill House" });
    const house = (path: string): URL => new URL(`/h/${code}${path}`, baseUrl);

    // The door: the house's name, and the joke, before anyone's even in.
    const door = parse(await (await fetch(house("/"))).text());
    expect(text(door.querySelector("h1")), "the door doesn't have the house's name").toBe("The Hill House");
    expect(text(door.querySelector(".top .inside-joke blockquote")), "the inside joke isn't framed at the door").toBe(joke);
    expect(text(door.querySelector(".top .inside-joke figcaption"))).toBe(together);

    const res = await fetch(house("/me"), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ who: "3" }), redirect: "manual" });
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith("who="))!.split(";")[0];
    const living = parse(await (await fetch(house("/living"), { headers: { cookie } })).text());
    expect(text(living.querySelector("#wall .inside-joke blockquote")), "the inside joke isn't framed on the memory wall").toBe(joke);
    expect(text(living.querySelector("#wall .inside-joke figcaption"))).toBe(together);
    expect(living.querySelector(".inside-joke b.typed"), "the joke ran as markup").toBeNull();
    expect(text(living.querySelector(".bar .brand")), "the bar doesn't have the house's name").toBe("The Hill House");
    expect(text(living.querySelector("title"))).toBe("The living room · The Hill House");

    // In the picture, it hangs on the living room wall, and walking up to it
    // offers to read it.
    const home = parse(await (await fetch(house("/"), { headers: { cookie } })).text());
    expect(home.querySelector(".house-svg g.joke-frame[data-place=living]"), "the joke doesn't hang on the wall in the picture").not.toBeNull();
    const reads = [...home.querySelectorAll<SVGGElement>(".house-svg g.act[data-place=living]")].flatMap((g) => JSON.parse(g.getAttribute("data-do") ?? "[]") as { label: string; href?: string }[]);
    expect(reads.find((d) => d.label === "Read the inside joke")?.href, "walking up to the frame doesn't offer to read it").toBe("/living#inside-joke");
    expect(living.querySelector("#inside-joke"), "reading it doesn't land on the joke").not.toBeNull();
    await fetch(house("/leave"), { method: "POST", headers: { cookie }, redirect: "manual" });

    // A house made without a joke has no frame, anywhere.
    const plain = await makeHouse(["Ivy", "Rae", "Kit", "Bo", "Dee"]);
    const plainDoor = parse(await (await fetch(new URL(`/h/${plain.code}/`, baseUrl))).text());
    expect(plainDoor.querySelector(".inside-joke"), "a house without a joke has an empty frame at its door").toBeNull();

    const half = await makeHouse(["Ivy", "Rae", "Kit", "Bo", "Dee"], { together });
    expect(half.res.status, "what you did together was taken without the joke").toBe(400);
    expect(text(parse(await half.res.text()).querySelector(".problem"))).toContain("inside joke");
  });

  // Only checkable against a server whose Claude can't be reached (started
  // with ANTHROPIC_BASE_URL pointing nowhere, MAKER_UNREACHABLE=1); the usual
  // HOUSE_MAKER=fake server never calls Claude. ADR 0019.
  it.skipIf(process.env.MAKER_UNREACHABLE !== "1")("still makes the house when Claude can't be reached", async () => {
    const { res, code } = await makeHouse(["Ivy", "Rae", "Kit", "Bo", "Dee"], { "things-1": "guitar" });
    expect(res.status, "Claude failing stopped the house being made").toBe(201);
    expect(await res.text(), "the house says Claude wrote it").toContain("built from exactly what you wrote");
    expect(code).toBeTruthy();
  });

  it("keeps each made house to itself", async () => {
    const { code } = await makeHouse(["Ivy", "Rae", "Kit", "Bo", "Dee"]);
    const house = (path: string): URL => new URL(`/h/${code}${path}`, baseUrl);
    const res = await fetch(house("/me"), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ who: "1" }), redirect: "manual" });
    const set = res.headers.getSetCookie().find((c) => c.startsWith("who="))!;
    expect(set, "the made house's who= cookie reaches other houses").toContain(`Path=/h/${code}`);
    const cookie = set.split(";")[0];

    const theirs = unique("a note in the made house");
    await fetch(house("/wall"), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie }, body: new URLSearchParams({ body: theirs }), redirect: "manual" });
    const [a] = await people();
    const ours = unique("a note in Rithika's house");
    await post("/wall", { body: ours }, a.id);

    const theirWall = parse(await (await fetch(house("/living"), { headers: { cookie } })).text());
    expect(withText(theirWall, ".note", theirs), "the made house lost its own note").toBeDefined();
    expect(withText(theirWall, ".note", ours), "Rithika's note turned up in the made house").toBeUndefined();
    expect(withText(await page("/living", a.id), ".note", theirs), "the made house's note turned up in Rithika's").toBeUndefined();
    await fetch(house("/leave"), { method: "POST", headers: { cookie }, redirect: "manual" });
  });

  it("only makes a few houses an hour for each visitor", async () => {
    const visitor = unique("the same visitor");
    const make = (): Promise<Response> => fetch(new URL("/make", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "fly-client-ip": visitor },
      body: new URLSearchParams(Object.fromEntries(["Ivy", "Rae", "Kit", "Bo", "Dee"].map((n, i) => [`name-${i + 1}`, n]))),
      redirect: "manual",
    });
    for (let i = 0; i < 3; i++) expect((await make()).status, `house ${i + 1} wasn't made`).toBe(201);
    const fourth = await make();
    expect(fourth.status, "a fourth house in the hour was made").toBe(429);
    expect(text(parse(await fourth.text()).querySelector(".problem"))).toContain("Try again in a little while");
  });

  it("turns down a house with missing friends", async () => {
    const { res } = await makeHouse(["Only", "Four", "Friends", "Here"]);
    expect(res.status, "a house was made with an empty room").toBe(400);
    expect(text(parse(await res.text()).querySelector(".problem"))).toContain("missing");
  });

  // The page scripts (public/house.js, public/live.js) send live updates,
  // steps and the house's buttons to addresses of their own. In a made house
  // they must stay in it, or friends there never see each other and what
  // they do lands in Rithika's house.
  it("keeps a made house's live line, steps and buttons in that house", async () => {
    const { code } = await makeHouse(["Ivy", "Rae", "Kit", "Bo", "Dee"]);
    const base = `/h/${code}`;
    const res = await fetch(new URL(`${base}/me`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "who=1", redirect: "manual" });
    const cookie = sessionOf(res)!;
    try {
      const home = parse(await (await fetch(new URL(`${base}/`, baseUrl), { headers: { cookie } })).text());
      expect(home.body.getAttribute("data-base"), "the page doesn't tell its scripts which house it's in").toBe(base);
      const doings = [...home.querySelectorAll(".act, .laddoo")].flatMap((g) => JSON.parse(g.getAttribute("data-do") ?? "[]") as { post?: string; href?: string }[]);
      expect(doings.length).toBeGreaterThan(0);

      // What the scripts would post to, as public/house.js builds it.
      const to = (path: string): string => (path.startsWith(`${base}/`) ? path : base + path);
      for (const d of doings.filter((d) => d.post)) {
        const r = await fetch(new URL(to(d.post!), baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie }, body: "", redirect: "manual" });
        expect(r.status, `${d.post} didn't reach the made house`).not.toBe(404);
        expect(r.status, `${d.post} was refused in the made house`).not.toBe(403);
      }

      // A step is saved in the made house, not Rithika's.
      const step = await fetch(new URL(to("/here"), baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie }, body: "x=230&y=380", redirect: "manual" });
      expect(step.status, "a step in the made house wasn't saved").toBe(204);
      const ivy = parse(await (await fetch(new URL(`${base}/`, baseUrl), { headers: { cookie } })).text()).querySelector(".walker.me");
      expect(ivy?.getAttribute("transform"), "the made house didn't keep where she stopped").toContain("230");

      // Her house's live line answers.
      const ctl = new AbortController();
      const line = await fetch(new URL(to("/live"), baseUrl), { headers: { cookie }, signal: ctl.signal });
      expect(line.headers.get("content-type"), "the made house has no live line").toContain("text/event-stream");
      ctl.abort();
    } finally {
      await fetch(new URL(`${base}/leave`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
    }
  });

  // Two to seven friends, each size drawn on a house with a bedroom each
  // (src/layouts.ts, ADR 0021). UNO is round the coffee table there, so the
  // friends sitting at it can deal.
  it("makes a house for two to seven friends, with a room each", async () => {
    const form = parse(await (await fetch(new URL("/make?friends=3", baseUrl))).text());
    expect(form.querySelectorAll(".friend-block").length, "asking for three didn't give three friends to fill in").toBe(3);
    for (const names of [["Ivy", "Rae", "Kit"], ["Ivy", "Rae", "Kit", "Bo", "Dee", "Fen", "Gus"]]) {
      const { res, code } = await makeHouse(names, { friends: String(names.length) });
      expect(res.status, `a house for ${names.length} wasn't made`).toBe(201);
      const base = `/h/${code}`;
      const door = parse(await (await fetch(new URL(`${base}/`, baseUrl))).text());
      expect(door.querySelectorAll("button[name=who]").length, `the door for ${names.length} doesn't have a window each`).toBe(names.length);
      const sign = (who: string): Promise<Response> => fetch(new URL(`${base}/me`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: `who=${who}`, redirect: "manual" });
      const [a, b] = [sessionOf(await sign("1"))!, sessionOf(await sign(String(names.length)))!];
      try {
        const home = parse(await (await fetch(new URL(`${base}/`, baseUrl), { headers: { cookie: a } })).text());
        expect(home.querySelector(".house-svg image")?.getAttribute("href"), `the house for ${names.length} isn't drawn on its own picture`).toContain(`house-${names.length}.jpg`);
        const bedrooms = [...home.querySelectorAll("a.room-link")].filter((l) => l.getAttribute("data-place")?.startsWith("room:"));
        expect(bedrooms.length, `the house for ${names.length} doesn't have a bedroom each`).toBe(names.length);
        const last = await fetch(new URL(`${base}/room/${names.length}`, baseUrl), { headers: { cookie: a } });
        expect(last.status, "the last friend's room isn't there").toBe(200);

        const post = (cookie: string, path: string, body: string): Promise<Response> =>
          fetch(new URL(`${base}${path}`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie }, body, redirect: "manual" });
        expect((await post(a, "/sit", "seat=mat")).headers.get("location"), "sitting at the table didn't go to the living room").toContain("/living");
        await post(b, "/sit", "seat=mat");
        expect((await post(a, "/uno", "")).status, "two friends at the coffee table couldn't deal UNO").toBe(303);
      } finally {
        for (const cookie of [a, b]) await fetch(new URL(`${base}/leave`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
      }
    }
  });

  it("only puts the pictured things in a made house's rooms", async () => {
    const maker = parse(await (await fetch(new URL("/make", baseUrl))).text());
    const offered = [...maker.querySelectorAll("input[name=things-1]")].map((i) => i.getAttribute("value"));
    expect(offered.length, "the form doesn't offer pictures to pick from").toBeGreaterThan(20);
    expect(maker.querySelector("textarea[name=things-1]"), "the form still asks for things in words").toBeNull();

    const form = new URLSearchParams({ "things-1": "guitar" });
    form.append("things-1", "a <b>pony</b>");
    ["Ivy", "Rae", "Kit", "Bo", "Dee"].forEach((n, i) => form.set(`name-${i + 1}`, n));
    const made = await fetch(new URL("/make", baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "fly-client-ip": unique("spec") }, body: form, redirect: "manual" });
    const base = parse(await made.text()).querySelector("a.go-in")?.getAttribute("href") ?? "";
    const cookie = sessionOf(await fetch(new URL(`${base}me`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "who=2", redirect: "manual" }))!;
    try {
      const room = parse(await (await fetch(new URL(`${base}room/1`, baseUrl), { headers: { cookie } })).text());
      expect([...room.querySelectorAll(".room-things-card li")].map(text), "something not on offer got into the room").toEqual(["a guitar"]);
    } finally {
      await fetch(new URL(`${base}leave`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
    }
  });

  it("keeps Rithika's five's own things in their rooms", async () => {
    const five = await people();
    const named = (name: string): Person => five.find((p) => p.name === name)!;
    const [rithanya, amirdha, aswathy] = ["Rithanya", "Amirdhavarshini", "Aswathy"].map(named);
    const visitor = five.find((p) => p !== rithanya && p !== amirdha)!;

    expect(text((await page("/", visitor.id)).querySelector(".house-svg .kitkat-word")), "Rithanya's KitKat box is gone").toBe("KitKat");
    expect(text((await page(`/room/${rithanya.id}`, visitor.id)).querySelector("#mask-heading")), "her face masks are gone").toBe("Face masks");
    const amirdhas = await page(`/room/${amirdha.id}`, visitor.id);
    expect(amirdhas.querySelector(`form[action="/room/${amirdha.id}/kettle"]`), "the hostel kettle is gone").not.toBeNull();
    expect(amirdhas.querySelector("input[name=item][value=kitkat]"), "there's no KitKat to leave").not.toBeNull();
    expect((await page(`/room/${aswathy.id}`, visitor.id)).querySelector("input[name=seat][value=yoga]"), "Aswathy's yoga mat is gone").not.toBeNull();
  });

  it("gives a made house's five their own rooms and memories, and none of Rithika's five's", async () => {
    const form = new URLSearchParams({ title: unique("Spec house"), memories: "the road trip where the car broke down in Porto" });
    ["Mia", "Jo", "Sam", "Ana", "Lee"].forEach((name, i) => {
      form.set(`name-${i + 1}`, name);
      form.set(`city-${i + 1}`, "London");
      for (const thing of i === 0 ? ["monstera", "fairy-lights", "record-player"] : ["books"]) form.append(`things-${i + 1}`, thing);
    });
    const made = await fetch(new URL("/make", baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "fly-client-ip": unique("spec") }, body: form, redirect: "manual" });
    expect(made.status, "the house wasn't made").toBe(201);
    const base = parse(await made.text()).querySelector("a.go-in")?.getAttribute("href") ?? "";
    expect(base).toMatch(/^\/h\/[a-z0-9]{10}\/$/);

    const cookie = sessionOf(await fetch(new URL(`${base}me`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "who=2", redirect: "manual" }))!;
    const inside = async (path: string): Promise<Document> => {
      const res = await fetch(new URL(`${base}${path}`, baseUrl), { headers: { cookie } });
      expect(res.status, `GET ${base}${path}`).toBe(200);
      return parse(await res.text());
    };
    const tryTo = async (path: string): Promise<number> =>
      (await fetch(new URL(`${base}${path}`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" })).status;
    try {
      const mias = await inside("room/1");
      const listed = [...mias.querySelectorAll(".room-things-card li")].map(text);
      expect(listed, "Mia's things aren't in her room").toEqual(["a monstera", "fairy lights", "a record player"]);
      const pictured = [...mias.querySelectorAll(".house-svg image.room-belonging[data-place='room:1']")].map((p) => text(p));
      expect(pictured, "her things aren't pictured in her room").toEqual(listed);
      for (const p of mias.querySelectorAll(".house-svg image.room-belonging")) {
        expect((await fetch(new URL(p.getAttribute("href")!, baseUrl))).status, "a room thing's picture is missing").toBe(200);
      }
      expect(text(mias.querySelector(".house-svg")), "her room has someone else's name on it").toContain("Mia's room");

      const living = await inside("living");
      expect(text(living.querySelector(".notes.memories")), "the memories aren't on the wall").toContain("Porto");

      const home = await inside("");
      expect(home.querySelector(".house-svg .kitkat-word"), "Rithanya's KitKats moved in").toBeNull();
      expect(text(home.body)).not.toMatch(/Rithanya|Amirdhavarshini|Aswathy|Rithika|Neha/);
      expect((await inside("room/4")).querySelector("#mask-heading"), "Rithanya's face masks moved in").toBeNull();
      const room3 = await inside("room/3");
      expect(room3.querySelector("form[action$='/kettle']"), "the hostel kettle moved in").toBeNull();
      expect(room3.querySelector("input[name=item][value=kitkat]"), "there's a KitKat to leave").toBeNull();
      expect((await inside("room/5")).querySelector("input[name=seat][value=yoga]"), "Aswathy's yoga mat moved in").toBeNull();
      expect(text((await inside("movies")).querySelector("main"))).not.toContain("loves movies");
      expect(await tryTo("room/4/mask")).toBe(404);
      expect(await tryTo("room/3/kettle")).toBe(404);
    } finally {
      await fetch(new URL(`${base}leave`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
    }
  });

  it("talks about a made house's friends in their own words", async () => {
    const form = new URLSearchParams({ title: unique("Words house"), memories: "the beach" });
    const five: [string, string][] = [["Arjun", "boy"], ["Priya", "girl"], ["Sam", "name"], ["Ravi", "boy"], ["Meera", "girl"]];
    five.forEach(([name, gender], i) => {
      form.set(`name-${i + 1}`, name);
      form.set(`gender-${i + 1}`, gender);
      form.set(`city-${i + 1}`, "Chennai");
      form.set(`things-${i + 1}`, "books");
    });
    const made = await fetch(new URL("/make", baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "fly-client-ip": unique("spec") }, body: form, redirect: "manual" });
    expect(made.status, "the house wasn't made").toBe(201);
    const code = (await made.text()).match(/\/h\/([a-z0-9]{10})\//)?.[1];
    const base = `/h/${code}/`;
    const signInHere = async (who: string): Promise<string> =>
      sessionOf(await fetch(new URL(`${base}me`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: `who=${who}`, redirect: "manual" }))!;
    const [arjun, priya, sam] = [await signInHere("1"), await signInHere("2"), await signInHere("3")];
    const inside = async (path: string, cookie: string): Promise<string> =>
      text(parse(await (await fetch(new URL(`${base}${path}`, baseUrl), { headers: { cookie } })).text()).body);
    try {
      // Arjun lies down in his own bed; Sam sits on their cushion.
      await fetch(new URL(`${base}room/1/nap`, baseUrl), { method: "POST", headers: { cookie: arjun }, redirect: "manual" });
      await fetch(new URL(`${base}sit`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: sam }, body: "seat=mat", redirect: "manual" });

      const room = await inside("room/1", priya);
      expect(room, "Priya's view of Arjun's room doesn't say his").toContain("Arjun is asleep in his own bed");
      expect(room, "Arjun is called she").not.toMatch(/Arjun is asleep in her/);
      const updates = await inside("updates", priya);
      expect(updates).toContain("Arjun had a nap in his own bed");
      expect(updates, "Sam is called she or he").toContain("Sam sat on their mat");
      expect(await inside("room/3", priya)).toContain("Sam is on their cushion on their own mat");

      // Someone else trying to be Arjun while he's in.
      const taken = await fetch(new URL(`${base}me`, baseUrl), { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: priya }, body: "who=1", redirect: "manual" });
      expect(taken.status).toBe(409);
      expect(text(parse(await taken.text()).body), "the 409 calls Arjun her").toContain("His window opens again");
    } finally {
      for (const cookie of [arjun, priya, sam]) await fetch(new URL(`${base}leave`, baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
    }
  });

  it("still talks about Rithika's five as she and her", async () => {
    const neha = (await people()).find((p) => p.name === "Neha")!;
    await post(`/room/${neha.id}/nap`, {}, neha.id);
    const [a] = (await people()).filter((p) => p.id !== neha.id);
    expect(text((await page("/updates", a.id)).querySelector(".away")), "Neha's nap isn't in her own words").toContain("Neha had a nap in her own bed");
  });

  it("draws a made house's friends as the gender they were given", async () => {
    const genders = ["boy", "girl", "name", "boy", "girl"];
    const { code } = await makeHouse(["Arjun", "Priya", "Sam", "Ravi", "Meera"], Object.fromEntries(genders.map((g, i) => [`gender-${i + 1}`, g])));
    const door = parse(await (await fetch(new URL(`/h/${code}/`, baseUrl))).text());
    const pictures = [...door.querySelectorAll("button[name=who] img")].map((img) => img.getAttribute("src") ?? "");
    expect(pictures.length).toBe(5);
    pictures.forEach((src, i) => expect(src, `friend ${i + 1} isn't drawn as ${genders[i]}`).toMatch(new RegExp(`^/avatar/${genders[i]}-\\d-\\d-\\d\\.svg\\?v=[0-9a-f]+$`)));

    const sticker = await fetch(new URL(pictures[0], baseUrl));
    expect(sticker.headers.get("content-type")).toMatch(/^image\/svg\+xml/);
    expect(await sticker.text()).toContain("<svg");
    expect((await page("/", (await people())[0].id)).querySelector(".switch img")?.getAttribute("src"), "Rithika's five lost their Stitch stickers").toMatch(/^\/art\/avatar-\d\.png/);
  });
});
