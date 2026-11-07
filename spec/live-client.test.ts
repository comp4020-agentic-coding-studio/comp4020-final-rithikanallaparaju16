import { JSDOM } from "jsdom";
import { expect, inject, it } from "vitest";

// What a page does on its own, with the script the house serves. The rest
// of the spec talks to the house over HTTP, which can't see a page's
// script. This runs the served public/live.js in jsdom, with an EventSource
// stood in so the test can drop the line and bring it back.

const base = inject("baseUrl");

class FakeSource extends EventTarget {
  static all: FakeSource[] = [];
  static CLOSED = 2;
  readyState = 0;
  url: string;
  constructor(url: string) {
    super();
    this.url = url;
    FakeSource.all.push(this);
  }
  close(): void {
    this.readyState = FakeSource.CLOSED;
  }
  fire(type: string, data = ""): void {
    if (type === "open") this.readyState = 1;
    this.dispatchEvent(Object.assign(new Event(type), { data }));
  }
}

async function page(): Promise<{ asked: string[]; source: FakeSource; wait: (ms: number) => Promise<void> }> {
  const script = await (await fetch(`${base}/live.js`)).text();
  const html = `<!doctype html><html><body class="page-home" data-base=""><main><p data-live="news">old</p></main></body></html>`;
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window as unknown as { EventSource: unknown; fetch: unknown; matchMedia: unknown; eval: (s: string) => void; setTimeout: (f: () => void, ms: number) => number };
  const asked: string[] = [];
  FakeSource.all = [];
  w.EventSource = FakeSource;
  // jsdom has no media queries; the rest of live.js asks a few.
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  w.fetch = async (url: unknown) => {
    asked.push(String(url));
    return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
  };
  w.eval(script);
  return { asked, source: FakeSource.all[0], wait: (ms) => new Promise((r) => w.setTimeout(r, ms)) };
}

// The brief's top band: "holds up under ... a slow connection". A line that
// drops comes back by itself, but the house counts her as here throughout,
// so nothing tells the page what friends did meanwhile. It asks for itself.
it("catches a page up after its live line drops and comes back", async () => {
  const { asked, source, wait } = await page();
  expect(source, "the page never opened a live line").toBeDefined();
  expect(source.url).toBe("/live");

  source.fire("open");
  await wait(300);
  expect(asked, "the first open fetched the page, which it already has").toEqual([]);

  source.fire("error");
  source.fire("open");
  await wait(300);
  expect(asked, "back on the line, the page didn't catch up").toEqual(["/"]);
});

it("fetches the page when a friend changes something, once for a burst", async () => {
  const { asked, source, wait } = await page();
  source.fire("open");
  source.fire("changed");
  source.fire("changed");
  await wait(300);
  expect(asked, "two writes a moment apart should be one fetch").toEqual(["/"]);
});
