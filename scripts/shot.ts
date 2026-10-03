#!/usr/bin/env node
// Screenshots a page of the running house at a given width, as one of the five.
// Headless Chrome's device emulation goes below its ~500px window minimum, and
// it can set the who= cookie, which a 390px iframe on a file:// page can't send.
//
//   node scripts/shot.ts <url> <out.png> [width=390] [who=1|none] [tap=<selector>]
//
// With a selector, it taps the middle of that element with a real mouse event
// first, says what was actually under the finger, and screenshots wherever
// the tap led. element.click() skips hit-testing, so it can't catch something
// covering a button (it missed the door's windows not taking taps).
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [url, out, width = "390", who = "1", tap] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node scripts/shot.ts <url> <out.png> [width=390] [who=1|none] [tap=<selector>]");
  process.exit(1);
}

const port = 9333;
const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${port}`, "--user-data-dir=/tmp/five-windows-shot", "--hide-scrollbars", "about:blank"],
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
if (who !== "none") await cdp("Network.setCookie", { name: "who", value: who, url: `${new URL(url).origin}/` });
await cdp("Emulation.setDeviceMetricsOverride", { width: Number(width), height: 844, deviceScaleFactor: 2, mobile: Number(width) < 600 });
// Phone widths are touch screens, which get the thumb stick. TOUCH=1 makes a
// wider screen one too (an iPad), and TOUCH=0 turns it off.
const touch = process.env.TOUCH ? process.env.TOUCH === "1" : Number(width) < 600;
await cdp("Emulation.setTouchEmulationEnabled", { enabled: touch, maxTouchPoints: touch ? 5 : 0 });
await cdp("Page.enable");
await cdp("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2500)); // web fonts
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
const { cssContentSize, cssLayoutViewport } = await cdp("Page.getLayoutMetrics");
// Capturing past the screen lays the page out again, which shifts a phone's
// sideways-scrolled house off you. A page that fits is captured as it is.
const beyond = cssContentSize.height > cssLayoutViewport.clientHeight + 1;
const shot = await cdp("Page.captureScreenshot", {
  format: "png",
  ...(beyond
    ? { captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(cssContentSize.width), height: Math.ceil(cssContentSize.height), scale: 1 } }
    : {}),
});
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`${out}: ${Math.ceil(cssContentSize.width)}x${Math.ceil(cssContentSize.height)} css px`);
socket.close();
chrome.kill();
