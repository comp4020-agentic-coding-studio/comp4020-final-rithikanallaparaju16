#!/usr/bin/env node
// Screenshots a page of the running house at a given width, as one of the five.
// Headless Chrome's device emulation goes below its ~500px window minimum, and
// it can set the who= cookie, which a 390px iframe on a file:// page can't send.
//
//   node scripts/shot.ts <url> <out.png> [width=390] [who=1|none]
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [url, out, width = "390", who = "1"] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node scripts/shot.ts <url> <out.png> [width=390] [who=1|none]");
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
await cdp("Page.enable");
await cdp("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 2500)); // web fonts
const { cssContentSize } = await cdp("Page.getLayoutMetrics");
const shot = await cdp("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: Math.ceil(cssContentSize.width), height: Math.ceil(cssContentSize.height), scale: 1 },
});
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`${out}: ${Math.ceil(cssContentSize.width)}x${Math.ceil(cssContentSize.height)} css px`);
socket.close();
chrome.kill();
