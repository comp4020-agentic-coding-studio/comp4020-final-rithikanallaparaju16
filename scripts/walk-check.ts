#!/usr/bin/env node
// Checks what the spec can't, in headless Chrome with real touches and keys:
// what house.js and the stylesheet do together, on a running house.
//
//   node scripts/walk-check.ts [base=http://localhost:8080]
//
// It writes: it stands friends in places (POST /here) and makes three small
// houses at /make. Run it only against a throwaway house, never Fly
// (the same rule as the spec's throwaway gate). Exits 1 if anything fails.
//
// 1. Walking by touch (ADR 0039): a tap on the floor walks you there, a drag
//    on yourself walks you after the finger, a swipe on the floor never walks
//    you, and a tap on another room walks you in. Upright and on its side.
//    On a laptop, a mouse click doesn't move you and the arrow keys walk.
// 2. Nothing stands over the page (9 Nov, "the button for cook didnt
//    disappear"): scrolled anywhere on any page with the house, at an
//    upright phone, two phones on their side and an iPad, no button or hint
//    covers one of the page's own fields, buttons or links.
// 3. Zooming out of a room (9 Nov, "zoom out to the right window
//    everytime"): Esc in any room of any size of house, at three windows,
//    shows the whole house filling the frame, and Esc again brings the room
//    back as it was.
import { spawn } from "node:child_process";

const BASE = (process.argv[2] ?? "http://localhost:8080").replace(/\/$/, "");
if (/fly\.dev/.test(BASE)) {
  console.error("walk-check writes to the house; run it against a throwaway house, not Fly.");
  process.exit(2);
}
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const failures: string[] = [];
const fail = (what: string) => {
  failures.push(what);
  console.log(`FAIL ${what}`);
};

async function signIn(base: string, who: string): Promise<string> {
  const res = await fetch(`${BASE}${base}/me`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ who }), redirect: "manual" });
  const c = res.headers.getSetCookie().find((x) => x.startsWith("who="))?.split(";")[0].slice(4);
  if (!c) throw new Error(`couldn't come in as ${who} at ${base || "/"} (HTTP ${res.status}); wait two minutes or use a fresh DATA_DIR`);
  return c;
}
const leave = (base: string, session: string) => fetch(`${BASE}${base}/leave`, { method: "POST", headers: { cookie: `who=${session}` } });
const standAt = (base: string, session: string, x: number, y: number) =>
  fetch(`${BASE}${base}/here`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: `who=${session}` }, body: new URLSearchParams({ x: String(x), y: String(y) }) });

// A fresh headless Chrome, its own profile, so no old house.js is cached.
async function browser() {
  const port = 9500 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/five-windows-walk-check-${port}-${Date.now()}`, "about:blank"], { stdio: "ignore" });
  let ep: string | undefined;
  for (let i = 0; i < 100 && !ep; i++) {
    try {
      ep = ((await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[]).find((x) => x.type === "page")?.webSocketDebuggerUrl;
    } catch {
      // not up yet
    }
    if (!ep) await wait(200);
  }
  if (!ep) throw new Error("headless Chrome never opened a page");
  const ws = new WebSocket(ep);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const pend = new Map<number, (r: Record<string, any>) => void>();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String(e.data));
    pend.get(m.id)?.(m.result ?? {});
    pend.delete(m.id);
  });
  let id = 0;
  const cdp = (method: string, params: object = {}): Promise<Record<string, any>> =>
    new Promise((r) => {
      const i = ++id;
      pend.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const js = async (expression: string): Promise<any> => {
    const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    return r.result?.value ?? r.exceptionDetails?.exception?.description;
  };
  await cdp("Network.enable");
  await cdp("Page.enable");
  const screen = async (w: number, h: number, touch: boolean) => {
    await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: touch && (w < 600 || h < 500), screenOrientation: w > h ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 } });
    await cdp("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 0 });
  };
  const signedIn = async (base: string, session: string) => {
    await cdp("Network.clearBrowserCookies");
    await cdp("Network.setCookie", { name: "who", value: session, url: `${BASE}${base}/`, path: base || "/" });
  };
  const go = async (path: string) => {
    await cdp("Page.navigate", { url: `${BASE}${path}` });
    await wait(2200);
  };
  const tap = async (x: number, y: number) => {
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await wait(60);
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const drag = async (x0: number, y0: number, x1: number, y1: number, steps = 14) => {
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= steps; i++) {
      await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] });
      await wait(40);
    }
    await wait(500);
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const key = async (code: string, keyName: string, vk: number, hold = 0) => {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: keyName, code, windowsVirtualKeyCode: vk });
    if (hold) await wait(hold);
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: keyName, code, windowsVirtualKeyCode: vk });
  };
  const close = () => {
    ws.close();
    chrome.kill();
  };
  return { cdp, js, screen, signedIn, go, tap, drag, key, close };
}

const ME = `(() => { const m = document.querySelector("g.people .me"); const r = m.getBoundingClientRect(); const t = m.getAttribute("transform").match(/translate\\(([\\d.-]+) ([\\d.-]+)\\)/); return { pic: [+t[1], +t[2]], screen: [r.x + r.width / 2, r.y + r.height * 0.8] }; })()`;
const toScreen = (px: number, py: number) => `(() => { const p = new DOMPoint(${px}, ${py}).matrixTransform(document.querySelector(".house-svg").getScreenCTM()); return [p.x, p.y]; })()`;
const far = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* ---------- 1. walking by touch ---------- */

async function touchWalk() {
  const b = await browser();
  const session = await signIn("", "3");
  try {
    await b.signedIn("", session);
    for (const [label, w, h] of [["upright 390x844", 390, 844], ["sideways 844x390", 844, 390]] as const) {
      await b.screen(w, h, true);
      await standAt("", session, 600, 230);
      await b.go("/");
      const ui = await b.js(`({ corners: [...document.querySelectorAll(".walk-corner")].filter((c) => getComputedStyle(c).display !== "none").length, stick: getComputedStyle(document.querySelector(".stick")).display })`);
      if (ui.corners || ui.stick !== "none") fail(`${label}: the corner sticks still show (${JSON.stringify(ui)})`);
      const [tx, ty] = await b.js(toScreen(520, 260));
      await b.tap(tx, ty);
      await wait(1600);
      const tapped = await b.js(ME);
      if (far(tapped.pic, [520, 260]) > 6) fail(`${label}: a tap on the floor at 520,260 walked her to ${tapped.pic.map(Math.round)}`);
      const scale = await b.js(`document.querySelector(".house-svg").getScreenCTM().a`);
      const [sx, sy] = tapped.screen;
      await b.drag(sx, sy - 8, sx + 50, sy + 10);
      await wait(900);
      const dragged = await b.js(ME);
      const want = [tapped.pic[0] + 50 / scale, tapped.pic[1] + 18 / scale];
      if (far(dragged.pic, want) > 20) fail(`${label}: dragging herself 50px right left her at ${dragged.pic.map(Math.round)}, not near ${want.map(Math.round)}`);
      const [fx, fy] = await b.js(toScreen(470, 300));
      await b.drag(fx, fy, fx - 120, fy, 8);
      await wait(900);
      const swiped = await b.js(ME);
      if (far(swiped.pic, dragged.pic) > 1) fail(`${label}: a swipe on the floor walked her`);
      const [gx, gy] = await b.js(`(() => { const [x, y] = document.querySelector("a.room-link[data-place=garden]").dataset.walk.split(",").map(Number); const p = new DOMPoint(x, y).matrixTransform(document.querySelector(".house-svg").getScreenCTM()); return [p.x, p.y]; })()`);
      if (gx > 0 && gx < w && gy > 0 && gy < h) {
        await b.tap(gx, gy);
        await wait(2600);
        const at = await b.js(`location.pathname`);
        if (at !== "/garden") fail(`${label}: a tap on the garden landed on ${at}`);
      }
      console.log(`ok   touch ${label}`);
    }
    // a laptop: a click doesn't walk, the arrow keys do
    await b.screen(1920, 1080, false);
    await standAt("", session, 600, 230);
    await b.go("/");
    const start = await b.js(ME);
    const [cx, cy] = await b.js(toScreen(520, 280));
    for (const type of ["mousePressed", "mouseReleased"]) await b.cdp("Input.dispatchMouseEvent", { type, x: cx, y: cy, button: "left", clickCount: 1 });
    await wait(1200);
    const clicked = await b.js(ME);
    if (far(clicked.pic, start.pic) > 1) fail("laptop: a mouse click on the floor walked her");
    await b.key("ArrowDown", "ArrowDown", 40, 500);
    await wait(400);
    const keyed = await b.js(ME);
    if (far(keyed.pic, clicked.pic) < 20) fail("laptop: the arrow keys didn't walk her");
    console.log("ok   laptop: click stays, keys walk");
  } finally {
    await leave("", session);
    b.close();
  }
}

/* ---------- 2. nothing stands over the page ---------- */

const PAGES: [string, number, number][] = [
  ["/kitchen", 520, 200],
  ["/living", 800, 300],
  ["/garden", 1250, 300],
  ["/room/2", 795, 665],
  ["/room/1", 316, 640],
  ["/", 520, 200],
];
const SHAPES: [string, number, number][] = [
  ["upright 390x844", 390, 844],
  ["sideways 844x346 (Chrome)", 844, 346],
  ["sideways 844x390 (Safari)", 844, 390],
  ["iPad 820x1180", 820, 1180],
];
const OVER = `(() => { const hits = []; for (const b of document.querySelectorAll(".pad .do, .pad .go:not([hidden]), .pad .keys-hint, .pad .walk-corner")) { const s = getComputedStyle(b); if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) continue; const r = b.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue; for (const c of document.querySelectorAll("main form input, main form textarea, main form button, main form label, main a, main details > summary")) { if (c.closest(".pad, svg")) continue; const q = c.getBoundingClientRect(); if (!q.width) continue; if (q.x < r.right && q.right > r.x && q.y < r.bottom && q.bottom > r.y) { hits.push((b.querySelector(".short")?.textContent || b.className).trim().slice(0, 16) + " over " + c.tagName.toLowerCase() + " " + (c.textContent || c.getAttribute("name") || "").trim().slice(0, 18)); break; } } } return hits; })()`;

async function nothingOver() {
  for (const [shape, w, h] of SHAPES) {
    const b = await browser();
    const session = await signIn("", process.env.OVER_WHO ?? "2");
    try {
      await b.signedIn("", session);
      await b.screen(w, h, true);
      for (const [path, x, y] of PAGES) {
        await standAt("", session, x, y);
        await b.go(path);
        const problems = new Set<string>();
        const height = await b.js(`document.documentElement.scrollHeight`);
        for (let at = 0; at <= height; at += Math.max(200, h / 2)) {
          await b.js(`scrollTo(0, ${at}); true`);
          await wait(450);
          for (const hit of await b.js(OVER)) problems.add(`${hit} (scrolled ${at})`);
        }
        if (problems.size) fail(`${shape} ${path}: ${[...problems].slice(0, 3).join("; ")}`);
      }
      console.log(`ok   nothing over the page: ${shape}`);
    } finally {
      await leave("", session);
      b.close();
    }
  }
}

/* ---------- 3. zooming out of a room fills the window ---------- */

async function zoomOut() {
  // ZOOM_SIZES=5,7 checks just those (5 is Rithika's five at /).
  const sizes = (process.env.ZOOM_SIZES ?? "5,2,4,7").split(",").map(Number);
  const houses: [string, string][] = sizes.includes(5) ? [["five", ""]] : [];
  for (const n of sizes.filter((x) => x !== 5)) {
    const f = new URLSearchParams({ friends: String(n) });
    for (let i = 1; i <= n; i++) f.set(`name-${i}`, `F${i}`);
    const r = await fetch(`${BASE}/make`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "fly-client-ip": `walk-check-${n}-${Date.now()}` }, body: f, redirect: "manual" });
    const code = (await r.text()).match(/\/h\/([a-z0-9]{10})\//)?.[1];
    if (code) houses.push([`${n} friends`, `/h/${code}`]);
    else fail(`couldn't make a house for ${n} (HTTP ${r.status})`);
  }
  const MEASURE = `(() => { const s = document.querySelector(".house-svg"); const f = s.getBoundingClientRect(); const p = s.querySelector("image").getBoundingClientRect(); return { frame: [Math.round(f.width), Math.round(f.height)], bands: [p.x - f.x, f.right - p.right, p.y - f.y, f.bottom - p.bottom].map(Math.round), vb: s.getAttribute("viewBox") }; })()`;
  const b = await browser();
  try {
    for (const [label, base] of houses) {
      const session = await signIn(base, "1");
      await b.signedIn(base, session);
      const door = await (await fetch(`${BASE}${base}/`, { headers: { cookie: `who=${session}` } })).text();
      const rooms = [...new Set([...door.matchAll(/class="room-link" href="([^"]+)"/g)].map((m) => m[1]))];
      for (const [w, h, touch] of [[1920, 1080, false], [1000, 645, false], [820, 1180, true]] as const) {
        await b.screen(w, h, touch);
        for (const room of rooms) {
          await b.go(base && room.startsWith(base) ? room : base + room);
          const before = await b.js(MEASURE);
          await b.key("Escape", "Escape", 27);
          await wait(1000);
          const out = await b.js(MEASURE);
          await b.key("Escape", "Escape", 27);
          await wait(1000);
          const back = await b.js(MEASURE);
          if (typeof before !== "object" || typeof out !== "object" || typeof back !== "object") {
            fail(`${label} ${w}x${h} ${room}: no house to measure at ${await b.js("location.pathname")} (${String(typeof out === "object" ? back : out).slice(0, 80)})`);
            continue;
          }
          if (out.bands.some((x: number) => Math.abs(x) > 2)) fail(`${label} ${w}x${h} ${room}: zoomed out, the house has bands ${out.bands} in a ${out.frame} frame`);
          if (back.vb !== before.vb || back.frame.join() !== before.frame.join()) fail(`${label} ${w}x${h} ${room}: back in, the room isn't as it was (${before.vb} ${before.frame} -> ${back.vb} ${back.frame})`);
        }
      }
      await leave(base, session);
      console.log(`ok   zoom out: ${label}, ${rooms.length} rooms at 3 windows`);
    }
  } finally {
    b.close();
  }
}

const only = process.env.ONLY;
if (!only || only === "touch") await touchWalk();
if (!only || only === "over") await nothingOver();
if (!only || only === "zoom") await zoomOut();
console.log(failures.length ? `\n${failures.length} failed` : "\nall passed");
process.exit(failures.length ? 1 : 0);
