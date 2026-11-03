#!/usr/bin/env node
// Fills a throwaway house with a few days of the five coming and going, then
// screenshots a tour of the whole site into doc/screenshots/ for PROCESS.md.
// Dev-only, never in the image, and never against the real house: it starts
// its own server on a fresh DATA_DIR with HOUSE_MAKER=fake.
//
//   node scripts/tour.ts [port=8095]
//
// Needs Chrome (as scripts/shot.ts does) and macOS's sips for the JPEGs.
//
// No screenshot is ever lost (Rithika, 3 Nov 2026: "keep screen shots and
// never delete them"): before it takes new ones, the set already there is
// copied to doc/screenshots/archive/<when it was taken>/, never over one
// already archived.
//
// Everything is left through the house's own forms, as a friend would, then
// a few timestamps in the throwaway database are moved back so the house has
// a past: plants that have grown, a room that's got lived-in, notes from
// yesterday. Each screenshot is scripts/shot.ts, so it signs in at the door
// like anyone.
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const port = Number(process.argv[2] ?? 8095);
const base = `http://localhost:${port}`;
const dataDir = `/tmp/five-windows-tour-${port}`;
const out = "doc/screenshots";
rmSync(dataDir, { recursive: true, force: true });
mkdirSync(dataDir, { recursive: true });
mkdirSync(out, { recursive: true });
// The screenshot browser's own profile (scripts/shot.ts), started afresh: a
// fresh throwaway house gives its photos the same addresses as the last
// one's, and a browser that kept the last ones would show them instead.
rmSync(`/tmp/five-windows-shot-${port + 1000}`, { recursive: true, force: true });

// The set that's there now goes to the archive first, named for when it was
// taken (its newest picture), so retaking never overwrites a picture. A set
// that's already in the archive, picture for picture, isn't copied again
// (a fresh checkout gives old pictures new dates).
{
  const pictures = readdirSync(out).filter((f) => f.endsWith(".jpg"));
  const same = (dir: string): boolean => pictures.every((f) => existsSync(`${dir}/${f}`) && readFileSync(`${dir}/${f}`).equals(readFileSync(`${out}/${f}`)));
  const archived = existsSync(`${out}/archive`) && readdirSync(`${out}/archive`).some((d) => same(`${out}/archive/${d}`));
  if (pictures.length && !archived) {
    const taken = new Date(Math.max(...pictures.map((f) => statSync(`${out}/${f}`).mtimeMs)));
    const pad = (n: number): string => String(n).padStart(2, "0");
    const stamp = `${taken.getFullYear()}-${pad(taken.getMonth() + 1)}-${pad(taken.getDate())}-${pad(taken.getHours())}${pad(taken.getMinutes())}`;
    const keep = `${out}/archive/${stamp}`;
    mkdirSync(keep, { recursive: true });
    for (const f of pictures) if (!existsSync(`${keep}/${f}`)) copyFileSync(`${out}/${f}`, `${keep}/${f}`);
    console.log(`the last set is kept in ${keep}/`);
  }
}

const server = spawn(process.execPath, ["src/server.ts"], {
  env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, HOUSE_MAKER: "fake" },
  // Its log stays with the throwaway data, to see what went wrong.
  stdio: ["ignore", openSync(`${dataDir}/server.log`, "w"), openSync(`${dataDir}/server.log`, "a")],
});
process.on("exit", () => server.kill());
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    // not listening yet
  }
  await new Promise((r) => setTimeout(r, 200));
}

const FORM = { "content-type": "application/x-www-form-urlencoded" };
const sessions = new Map<string, string>();

// A screenshot takes longer than node's server keeps an idle connection
// open (5 s), so the next request can go out on one it has just closed:
// that one is sent again, once, on a new connection.
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    return fetch(url, { ...init, headers: { ...(init.headers as Record<string, string>), connection: "close" } });
  }
}

// Coming in at a house's door as `who`; `door` is "" for the five, or a made
// house's /h/<code>.
async function signIn(who: string, door = ""): Promise<string> {
  const key = `${door}|${who}`;
  const known = sessions.get(key);
  if (known) return known;
  const res = await send(`${base}${door}/me`, { method: "POST", headers: FORM, body: new URLSearchParams({ who }), redirect: "manual" });
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("who="))?.split(";")[0];
  if (!cookie) throw new Error(`couldn't come in as ${who} at ${door || "/"} (${res.status})`);
  sessions.set(key, cookie);
  return cookie;
}

async function signOut(who: string, door = ""): Promise<void> {
  const cookie = sessions.get(`${door}|${who}`);
  if (!cookie) return;
  await send(`${base}${door}/leave`, { method: "POST", headers: { cookie }, redirect: "manual" });
  sessions.delete(`${door}|${who}`);
}

async function get(who: string, path: string, door = ""): Promise<void> {
  const res = await send(`${base}${door}${path}`, { headers: { cookie: await signIn(who, door) }, redirect: "manual" });
  await res.arrayBuffer();
}

async function post(who: string, path: string, fields: Record<string, string> = {}, door = ""): Promise<void> {
  const res = await send(`${base}${door}${path}`, { method: "POST", headers: { ...FORM, cookie: await signIn(who, door) }, body: new URLSearchParams(fields), redirect: "manual" });
  if (res.status >= 400) throw new Error(`${who} POST ${door}${path}: ${res.status} ${(await res.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 160)}`);
  await res.arrayBuffer();
}

// Standing somewhere in the picture, as public/house.js reports it.
const here = (who: string, x: number, y: number, door = ""): Promise<void> => post(who, "/here", { x: String(x), y: String(y) }, door);

// A screenshot, as `who` ("none" for the door) at `door` ("" for the five):
// with the session the tour already holds for her, so she stays home and
// everyone else stays where they are. A phone shot is one phone screen, as
// someone holding it sees it (a longer one would leave the fixed tab bar
// floating halfway down); a long desktop page stops 2200 css px down.
// `js` runs on the page just before the picture (scripts/shot.ts's SHOT_JS):
// to open something, fill something in, or scroll to it.
// `drag` is scripts/shot.ts's SHOT_DRAG: "<selector> <px>", a real finger or
// mouse dragged across it before the picture. With `hold` (ms), the finger
// stays down at the end that long and the picture is taken before it lifts.
async function shot(path: string, file: string, width: number, who: string, opts: { touch?: boolean; door?: string; js?: string; drag?: string; hold?: number } = {}): Promise<void> {
  const door = opts.door ?? "";
  const cookie = who === "none" ? undefined : (await signIn(who, door)).slice("who=".length);
  const png = `${dataDir}/${file}.png`;
  const args = ["scripts/shot.ts", `${base}${door}${path}`, png, String(width), who];
  const env = {
    ...process.env,
    SHOT_PORT: String(port + 1000),
    SHOT_MAX_HEIGHT: width < 600 ? "844" : "2200",
    ...(cookie ? { SHOT_COOKIE: cookie } : {}),
    ...(opts.touch ? { TOUCH: "1" } : {}),
    ...(opts.js ? { SHOT_JS: opts.js } : {}),
    ...(opts.drag ? { SHOT_DRAG: opts.drag } : {}),
    ...(opts.hold ? { SHOT_DRAG_HOLD: String(opts.hold) } : {}),
  };
  console.log(execFileSync(process.execPath, args, { env, encoding: "utf8" }).trim());
  if (opts.hold) renameSync(png.replace(/\.png$/, "-held.png"), png);
  // Chrome draws at twice the size; the repo keeps a JPEG at the page's own
  // width (a desktop one at 1000 px), about 100 KB instead of 1.5 MB.
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", "--resampleWidth", String(Math.min(width, 1000)), png, "--out", `${out}/${file}.jpg`], { stdio: "ignore" });
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/* ---------- Rithika's five: a few days of coming and going ---------- */
// 1 Rithika, 2 Neha, 3 Amirdhavarshini, 4 Rithanya, 5 Aswathy.

// Everyone has been home before (the door says when). Rithika was last here
// two days ago, so coming back shows her what's new. Before she went, she
// left Neha a note for her interview.
for (const who of ["1", "2", "3", "4", "5"]) await get(who, "/");
await post("1", "/room/2/leave", { body: "you've got this. call me after the interview?" });
await signOut("1");

await post("2", "/wall", { body: "got the internship!!! 🎉", big: "1" });
await post("3", "/wall", { body: "who's up for movie night this weekend" });
await post("5", "/wall", { body: "the bananas are still here. they're family now" });
// Rithanya pins a photo on the memory wall (ADR 0024). For the tour it's a
// crop of the house's own picture, the living room by the fire, cut out by
// macOS's sips like the screenshots, so no new picture is kept in the repo.
// Neha pins one too, of a corner of a bedroom, so two sit side by side.
for (const [who, crop, words] of [
  ["2", ["300", "330", "430", "30"], "this reminds me of you guys"],
  ["4", ["360", "450", "70", "660"], "sofa, fire, all five of us"],
] as const) {
  const snap = `${dataDir}/snap-${who}.jpg`;
  execFileSync("sips", ["-c", crop[0], crop[1], "--cropOffset", crop[2], crop[3], "public/art/house.jpg", "--out", snap], { stdio: "ignore" });
  const data = new FormData();
  data.set("photo", new Blob([readFileSync(snap)], { type: "image/jpeg" }), "snap.jpg");
  data.set("body", words);
  const res = await send(`${base}/wall/photo`, { method: "POST", headers: { cookie: await signIn(who) }, body: data, redirect: "manual" });
  if (res.status !== 303) throw new Error(`the tour's photo wasn't pinned (${res.status})`);
}
await post("4", "/garden/plant", { item: "sunflower" });
await post("5", "/garden/plant", { item: "tulsi" });
await post("2", "/garden/plant", { item: "jasmine" });
await post("4", "/movies", { title: "Kabhi Khushi Kabhie Gham", why: "for the third time, yes" });
await post("2", "/movies", { title: "Spirited Away" });
await post("4", "/room/1/leave", { body: "saw this and thought of you", item: "kitkat" });
await post("2", "/room/1/leave", { body: "good luck for the exam!! you've got this", item: "chai" });
await post("3", "/kitchen", { item: "maggi", body: "kettle-style, for old times" });
// Plates saved for friends who are away: they wait, covered, however long.
await post("5", "/kitchen", { item: "dosa", for: "1", body: "saved you the crispiest one, don't tell anyone" });
await post("4", "/kitchen", { item: "cake", for: "2", body: "for after your shift" });
// Neha writes back to Rithika's note, onto Rithika's desk.
{
  const db = new DatabaseSync(`${dataDir}/house.db`);
  const note = db.prepare("SELECT id FROM things WHERE kind = 'desk' AND author = '1'").get();
  db.close();
  await post("2", "/room/1/reply", { note: String(note?.id), body: "it went SO well. I got it!! thank you for the pep talk 🥹" });
}

// The past: the house has been lived in for a few days.
{
  const db = new DatabaseSync(`${dataDir}/house.db`);
  const back = (kind: string, ms: number): void => void db.prepare("UPDATE things SET created_at = created_at - ? WHERE kind = ?").run(ms, kind);
  back("plant", 3 * DAY);
  back("movie", 2 * DAY);
  db.prepare("UPDATE things SET created_at = created_at - ? WHERE kind = 'desk' AND author = '1'").run(2 * DAY + HOUR);
  db.prepare("UPDATE things SET created_at = created_at - ? WHERE kind = 'note' AND item = 'big'").run(DAY);
  db.prepare("UPDATE visits SET last_seen = last_seen - ?, seen_until = 0 WHERE person = '1'").run(2 * DAY);
  // The others came by at different times today; they come back in below.
  [["2", 9], ["3", 5], ["4", 3], ["5", 7]].forEach(([who, hours]) =>
    db.prepare("UPDATE visits SET last_seen = last_seen - ? WHERE person = ?").run(Number(hours) * HOUR, who));
  db.close();
}

// The door, with nobody in: everyone's window, clock and when she was last
// here. (The four are let in again straight after.)
for (const who of ["2", "3", "4", "5"]) await signOut(who);
await shot("/", "01-door", 1280, "none");
await shot("/", "02-door-phone", 390, "none");

// Stickers on Neha's big news, and a group of friends home now.
const wallIds = (): number[] => {
  const db = new DatabaseSync(`${dataDir}/house.db`);
  const ids = db.prepare("SELECT id FROM things WHERE kind = 'note' ORDER BY id").all().map((r) => Number(r.id));
  db.close();
  return ids;
};
const [news] = wallIds();
await post("3", "/wall/sticker", { note: String(news), sticker: "love" });
await post("5", "/wall/sticker", { note: String(news), sticker: "aww" });
await post("4", "/garden/water");
await post("5", "/garden/dog", { at: "garden" });

// Where everyone is right now: Aswathy on the sofa, Neha in the kitchen,
// Amirdhavarshini and Rithanya on the mat.
await post("5", "/sit", { seat: "sofa" });
await get("2", "/kitchen");
await here("2", 600, 292);
await post("3", "/sit", { seat: "mat" });
await post("4", "/sit", { seat: "mat" });

/* ---------- screenshots of the five's house ---------- */

// Rithika comes home after two days away: what's new comes first. Her first
// page load ends the old visit, so the Updates shot goes first, while every
// page still counts what's new since two days ago.
await shot("/updates", "03-updates-phone", 390, "1");
await shot("/", "04-house", 1280, "1");
await here("1", 640, 330);
await shot("/", "05-house-phone", 390, "1");
// Her desk, with Neha's answer to her note, and writing back to it open.
await shot("/room/1", "06-your-room", 1280, "1", { js: `document.querySelector("li.desk-thing.reply details.write-back")?.setAttribute("open", "")` });
await shot("/living", "07-living-room", 1280, "1");
// On a phone, scrolled to the counter: the plate Aswathy saved her first.
const scrollTo = (selector: string): string => `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 80); return !!el; })()`;
await shot("/kitchen", "08-kitchen-phone", 390, "1", { js: scrollTo("#counter") });
await shot("/kitchen", "18-saved-plates", 1280, "1");
await shot("/garden", "09-garden-phone", 390, "1");
await shot("/movies", "10-movies-phone", 390, "1");
// Planning from Neha's clock: 9:30 tomorrow night in New Jersey, and
// everyone else's row follows.
await shot("/movies", "19-planner-phone", 390, "1", {
  js: `(() => {
    const neha = document.getElementById("plan-when-2");
    const day = new Date(neha.value.slice(0, 10) + "T00:00Z");
    day.setUTCDate(day.getUTCDate() + 1);
    neha.value = day.toISOString().slice(0, 10) + "T21:30";
    neha.dispatchEvent(new Event("input", { bubbles: true }));
    const picker = document.querySelector("#plan .when-picker");
    window.scrollTo(0, picker.getBoundingClientRect().top + scrollY - 80);
    return [...document.querySelectorAll(".when-row input")].map((i) => i.value);
  })()`,
});
// The same planner on the Everyone tab, dragged with a finger: the strip of
// everyone's day and night slides under the needle, and all five clocks,
// hands and AM/PM follow.
await shot("/everyone", "20-planner-drag-phone", 390, "1", {
  drag: "#plan .when-strip -190",
  js: `(() => {
    const strip = document.querySelector("#plan .when-strip");
    window.scrollTo(0, strip.getBoundingClientRect().top + scrollY - 140);
    return [...document.querySelectorAll("#plan .when-readout")].map((r) => r.textContent.trim());
  })()`,
});
// UNO, dealt just now for three, from Amirdhavarshini's side of the mat.
await post("1", "/sit", { seat: "mat" });
await post("3", "/uno");
await shot("/uno", "11-uno-phone", 390, "3");
await shot("/everyone", "12-everyone", 1280, "1");
await shot("/", "13-house-ipad", 820, "1", { touch: true });
// Lying in bed in her room, Rithika presses Esc and looks out at the whole
// house, to see who's up and about.
await post("1", "/room/1/nap");
await shot("/room/1", "21-look-out-from-bed", 1280, "1", {
  js: `new Promise((done) => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    setTimeout(() => done(document.querySelector(".house-svg")?.getAttribute("viewBox")), 1500);
  })`,
});

// Rithanya's and Neha's photos on the memory wall, on a phone; and small,
// beside their lines in Updates.
await shot("/living", "22-photo-on-the-wall-phone", 390, "1", { js: scrollTo(".note.photo") });
await shot("/updates", "24-photos-in-updates-phone", 390, "1", { js: scrollTo(".happenings li.with-photo") });
// Walking on a phone: a thumb held down in the bottom-left corner brings the
// stick up under it, and Rithika walks across the living room.
await shot("/", "25-walk-from-a-corner-phone", 390, "1", { drag: "@44,744 46,-26", hold: 700 });
// Rithika's home-screen widget: her link, and the iPhone's steps.
await post("1", "/widget");
await shot("/everyone", "23-widget-link-phone", 390, "1", {
  // The key is a throwaway house's, but a picture of a link reads as one to
  // copy, so it's shown with its key cut short.
  js: `(() => { document.querySelector("#widget-iphone").open = true; const link = document.querySelector("#widget input.widget-link"); link.value = link.value.replace(/(\\/widget\\/\\d+\\.)[^/]+/, "$1••••••••"); const c = document.querySelector("#widget"); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 70); return link.value; })()`,
});

for (const who of ["1", "2", "3", "4", "5"]) await signOut(who);

/* ---------- making a house for your own friends ---------- */

await shot("/make", "14-make", 1280, "none");
const made = await send(`${base}/make`, {
  method: "POST",
  headers: { ...FORM, "fly-client-ip": "tour" },
  body: new URLSearchParams([
    ["friends", "6"],
    ["title", "The Hyderabad Six"],
    ...["Priya", "Sana", "Divya", "Meghna", "Tara", "Anu"].map((n, i) => [`name-${i + 1}`, n]),
    ...["Melbourne", "Hyderabad", "London", "Perth", "Toronto", "Singapore"].map((c, i) => [`city-${i + 1}`, c]),
    ["qualities-1", "plans every reunion, keeps the album"],
    ["things-1", "camera"], ["things-1", "plants"], ["things-1", "books"],
    ["things-2", "guitar"], ["things-2", "fairy-lights"],
    ["things-3", "record-player"], ["things-3", "candles"],
    ["things-4", "telescope"], ["things-4", "cactus"],
    ["things-5", "paints"], ["things-5", "headphones"],
    ["things-6", "game-controller"], ["things-6", "flowers"],
    ["memories", "the bus that never came\nfarewell day, 2016\nchai at 2 am before boards"],
    ["together", "the Goa trip, 2019"],
    ["joke", "“it's just a small hill”"],
  ]),
  redirect: "manual",
});
const ready = await made.text();
const code = ready.match(/\/h\/([a-z0-9]{10})\//)?.[1];
if (made.status !== 201 || !code) throw new Error(`the tour's house wasn't made (${made.status})`);
const door = `/h/${code}`;
await post("2", "/wall", { body: "first one in!! who's next" }, door);
await post("3", "/kitchen", { item: "biryani", body: "Hyderabad style obviously" }, door);
// The door first, then Sana and Divya come home to the living room, by the
// framed joke, and the house is seen as Priya.
await shot("/", "15-made-door", 1280, "none", { door });
await get("2", "/", door);
await here("2", 520, 470, door);
await get("3", "/", door);
await here("3", 560, 455, door);
await shot("/", "16-made-house", 1280, "1", { door });
// The memory wall, with their inside joke framed at the top.
await shot("/living", "17-made-living-phone", 390, "1", { door, js: scrollTo("#wall") });
for (const who of ["1", "2", "3"]) await signOut(who, door);

server.kill();
console.log(`screenshots in ${out}/`);
