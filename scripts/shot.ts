#!/usr/bin/env node
// Screenshots a page of the running house at a given width, as one of the five.
// Headless Chrome's device emulation goes below its ~500px window minimum, and
// it can set the who= cookie, which a 390px iframe on a file:// page can't send.
//
//   node scripts/shot.ts <url> <out.png> [width=390] [who=1|none] [tap=<selector>]
//
// SHOT_COOKIE uses a session that's already in (see below),
// SHOT_MAX_HEIGHT cuts a long page's picture off that many css px down, and
// SHOT_JS runs a line of script on the page just before the picture (after any
// tap) and prints what it returns: to fill something in, or to read it back.
//
// With a selector, it taps the middle of that element with a real mouse event
// first, says what was actually under the finger, and screenshots wherever
// the tap led. element.click() skips hit-testing, so it can't catch something
// covering a button (it missed the door's windows not taking taps).
//
// SHOT_FILE="<selector> <path>" picks that file in a file field first, as the
// file picker does (it fires `change`), before any tap.
//
// SHOT_DRAG="<selector> <dx>" drags across that element instead, from its
// middle, dx css px sideways (negative is left), with a finger on a touch
// screen and a mouse otherwise, in steps. Halfway through, SHOT_DRAG_READ
// (a line of script) reads the page while the finger's still down.
// SHOT_DRAG="@<x>,<y> <dx>,<dy>" puts the finger down at a point on the
// screen instead, and drags any way. SHOT_DRAG_HOLD=<ms> keeps it down that
// long at the end and saves <out>-held.png before letting go.
//
// SHOT_TAP_AT="<x>,<y>" taps that point on the screen as it is, without
// scrolling anything into view first, with a finger on a touch screen (a
// quick touch down and up), and says what was under it.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [url, out, width = "390", who = "1", tap] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node scripts/shot.ts <url> <out.png> [width=390] [who=1|none] [tap=<selector>]");
  process.exit(1);
}

// Comes in at the door as `who` for a real session (only one of us can be
// each friend at a time, ADR 0011), and leaves again at the end.
const origin = new URL(url).origin;
// A made house's url starts /h/<code>: you come in at that house's door, and
// its cookie only goes to its own pages.
const door = `${origin}${new URL(url).pathname.match(/^\/h\/[^/]+/)?.[0] ?? ""}`;
// SHOT_COOKIE is a session already in the house as `who` (scripts/tour.ts
// keeps the five in while it takes its pictures): used as it is, with no
// coming in at the door and no leaving at the end.
const given = process.env.SHOT_COOKIE;
let session: string | undefined = given;
if (!given && who !== "none") {
  const res = await fetch(`${door}/me`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ who }),
    redirect: "manual",
  });
  session = res.headers.getSetCookie().find((c) => c.startsWith("who="))?.split(";")[0].slice("who=".length);
  if (!session) throw new Error(`couldn't come in as ${who} (HTTP ${res.status}): someone may be in the house as her`);
}

// SHOT_PORT lets two of these run at once without sharing a browser.
const port = Number(process.env.SHOT_PORT ?? 9333);
const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/five-windows-shot-${port}`, "--hide-scrollbars", "about:blank"],
  { stdio: "ignore" },
);

let endpoint: string | undefined;
for (let i = 0; i < 100 && !endpoint; i++) {
  try {
    const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    endpoint = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {
    // chrome isn't listening yet
  }
  if (!endpoint) await new Promise((r) => setTimeout(r, 200));
}
if (!endpoint) throw new Error("headless Chrome never opened a page");

const socket = new WebSocket(endpoint);
await new Promise((r) => socket.addEventListener("open", r, { once: true }));
const pending = new Map<number, (result: Record<string, any>) => void>();
socket.addEventListener("message", (e) => {
  const msg = JSON.parse(String(e.data));
  pending.get(msg.id)?.(msg.result ?? {});
  pending.delete(msg.id);
});
let nextId = 0;
const cdp = (method: string, params: object = {}): Promise<Record<string, any>> =>
  new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });

await cdp("Network.enable");
await cdp("Network.clearBrowserCookies");
if (session) await cdp("Network.setCookie", { name: "who", value: session, url: `${door}/`, path: new URL(`${door}/`).pathname.replace(/\/$/, "") || "/" });
// SHOT_HEIGHT sets the screen's height: a phone on its side is about
// 932 x 430 (with TOUCH=1), and is told it's in landscape (ADR 0032).
const screenH = Number(process.env.SHOT_HEIGHT || 844);
const sideways = Number(width) > screenH;
await cdp("Emulation.setDeviceMetricsOverride", {
  width: Number(width), height: screenH, deviceScaleFactor: 2, mobile: Number(width) < 600 || (sideways && screenH < 500),
  screenOrientation: sideways ? { type: "landscapePrimary", angle: 90 } : { type: "portraitPrimary", angle: 0 },
});
// Phone widths are touch screens, which get the thumb stick. TOUCH=1 makes a
// wider screen one too (an iPad), and TOUCH=0 turns it off.
const touch = process.env.TOUCH ? process.env.TOUCH === "1" : Number(width) < 600;
await cdp("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 0 });
await cdp("Page.enable");
await cdp("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2500)); // web fonts
if (process.env.SHOT_FILE) {
  const [selector, path] = process.env.SHOT_FILE.split(/ (?=\/)/);
  await cdp("DOM.enable");
  const { root } = await cdp("DOM.getDocument", { depth: 0 });
  const { nodeId } = await cdp("DOM.querySelector", { nodeId: root.nodeId, selector });
  if (!nodeId) throw new Error(`nothing matches ${selector}`);
  await cdp("DOM.setFileInputFiles", { nodeId, files: [path] });
  console.log(`picked ${path} in ${selector}`);
  await new Promise((r) => setTimeout(r, 1500));
}
if (tap) {
  const found = await cdp("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(tap)});
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      const hit = document.elementFromPoint(x, y);
      return { x, y, hit: hit ? hit.tagName.toLowerCase() + (hit.className && typeof hit.className === "string" ? "." + hit.className.trim().replace(/\\s+/g, ".") : "") : "nothing", inside: el.contains(hit) };
    })()`,
  });
  const at = found.result?.value as { x: number; y: number; hit: string; inside: boolean } | null;
  if (!at) throw new Error(`nothing matches ${tap}`);
  console.log(`tap ${tap}: under the finger is ${at.hit}${at.inside ? "" : " (not the element: something is covering it)"}`);
  for (const type of ["mousePressed", "mouseReleased"]) await cdp("Input.dispatchMouseEvent", { type, x: at.x, y: at.y, button: "left", clickCount: 1 });
  await new Promise((r) => setTimeout(r, 2500));
  const where = await cdp("Runtime.evaluate", { expression: "location.pathname + location.search", returnByValue: true });
  console.log(`after the tap: ${where.result?.value}`);
}
if (process.env.SHOT_TAP_AT) {
  const [tx, ty] = process.env.SHOT_TAP_AT.split(",").map(Number);
  const under = await cdp("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => { const h = document.elementFromPoint(${tx}, ${ty}); return h ? h.tagName.toLowerCase() + (typeof h.className === "string" && h.className.trim() ? "." + h.className.trim().replace(/\\s+/g, ".") : "") + (h.textContent ? " “" + h.textContent.trim().slice(0, 40) + "”" : "") : "nothing"; })()`,
  });
  console.log(`tap at ${tx},${ty}: on top is ${under.result?.value}`);
  if (touch) {
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: tx, y: ty }] });
    await new Promise((r) => setTimeout(r, 60));
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    for (const type of ["mousePressed", "mouseReleased"]) await cdp("Input.dispatchMouseEvent", { type, x: tx, y: ty, button: "left", clickCount: 1 });
  }
  await new Promise((r) => setTimeout(r, 2500));
  const where = await cdp("Runtime.evaluate", { expression: "location.pathname + location.search", returnByValue: true });
  console.log(`after the tap: ${where.result?.value}`);
}
if (process.env.SHOT_DRAG) {
  // "<selector> <dx>", or "@<x>,<y> <dx>[,<dy>]" to put the finger down at a
  // point on the screen (css px) and drag from there, where nothing is yet
  // (a phone's walking corners, where the stick appears under the thumb).
  const [selector, by] = process.env.SHOT_DRAG.split(/ (?=-?\d+(?:,-?\d+)?$)/);
  const point = /^@(-?\d+),(-?\d+)$/.exec(selector);
  const found = point
    ? { result: { value: { x: Number(point[1]), y: Number(point[2]) } } }
    : await cdp("Runtime.evaluate", {
        returnByValue: true,
        expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`,
      });
  const from = found.result?.value as { x: number; y: number } | null;
  if (!from) throw new Error(`nothing matches ${selector}`);
  const [dx, dy = 0] = by.split(",").map(Number);
  const steps = 20;
  const at = (i: number) => ({ x: from.x + (dx * i) / steps, y: from.y + (dy * i) / steps });
  const press = (type: string, p: { x: number; y: number }) =>
    touch
      ? cdp("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: p.x, y: p.y }] })
      : cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
  const [down, move, up] = touch ? ["touchStart", "touchMove", "touchEnd"] : ["mousePressed", "mouseMoved", "mouseReleased"];
  await press(down, at(0));
  for (let i = 1; i <= steps; i++) {
    await press(move, at(i));
    await new Promise((r) => setTimeout(r, 16));
    if (i === steps / 2 && process.env.SHOT_DRAG_READ) {
      const mid = await cdp("Runtime.evaluate", { expression: process.env.SHOT_DRAG_READ, returnByValue: true });
      console.log(`halfway, finger down: ${JSON.stringify(mid.result?.value ?? mid.exceptionDetails?.exception?.description ?? null)}`);
    }
  }
  // SHOT_DRAG_HOLD=<ms> keeps the finger down at the end that long, and takes
  // the picture then, before letting go: to see what holding a drag looks like.
  const hold = Number(process.env.SHOT_DRAG_HOLD ?? 0);
  if (hold) {
    for (const end = Date.now() + hold; Date.now() < end; ) {
      await press(move, at(steps));
      await new Promise((r) => setTimeout(r, 50));
    }
    const held = await cdp("Page.captureScreenshot", { format: "png" });
    writeFileSync(out.replace(/\.png$/, "-held.png"), Buffer.from(held.data, "base64"));
    console.log(`held ${hold}ms, picture taken with the finger down`);
  }
  await press(up, at(steps));
  console.log(`dragged ${selector} ${dx},${dy}px with a ${touch ? "finger" : "mouse"}`);
  await new Promise((r) => setTimeout(r, 1200)); // the glide
}
if (process.env.SHOT_JS) {
  const ran = await cdp("Runtime.evaluate", { expression: process.env.SHOT_JS, returnByValue: true, awaitPromise: true });
  console.log(`script: ${JSON.stringify(ran.result?.value ?? ran.exceptionDetails?.exception?.description ?? null)}`);
  await new Promise((r) => setTimeout(r, 500));
}
const { cssContentSize, cssLayoutViewport } = await cdp("Page.getLayoutMetrics");
// Capturing past the screen lays the page out again, which shifts a phone's
// sideways-scrolled house off you. A page that fits is captured as it is.
// SHOT_MAX_HEIGHT stops a long page's picture that many css px down.
const height = Math.min(Math.ceil(cssContentSize.height), Number(process.env.SHOT_MAX_HEIGHT ?? Infinity));
const beyond = height > cssLayoutViewport.clientHeight + 1;
const shot = await cdp("Page.captureScreenshot", {
  format: "png",
  ...(beyond
    ? { captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(cssContentSize.width), height, scale: 1 } }
    : {}),
});
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`${out}: ${Math.ceil(cssContentSize.width)}x${Math.ceil(cssContentSize.height)} css px`);
socket.close();
chrome.kill();
if (session && !given) await fetch(`${door}/leave`, { method: "POST", headers: { cookie: `who=${session}` }, redirect: "manual" });
