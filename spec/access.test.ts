import { JSDOM } from "jsdom";
import { afterAll, describe, expect, inject, it } from "vitest";

// The accessibility floor the course's starters used to carry, which the
// final project's starter left to us: what every page holds to, read from
// the HTML the server sends (no script runs, as for a screen reader that
// arrives before it). Not a full audit: axe isn't a dependency (CLAUDE.md
// keeps the image to one), so contrast and focus order are judged by eye.
//
//  - the language is declared, and the page has a title
//  - one main landmark, and a top-level heading or a labelled region
//  - every picture says what it is, or is marked as decoration
//  - every button, link and field has a name a screen reader can say
//  - no id is used twice (the house SVG's ids are why: one per page)

const baseUrl = inject("baseUrl");
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

const parse = (html: string): Document => new JSDOM(html).window.document;

// What a screen reader would say for an element: its label, its words, or
// the name of a picture inside it.
function nameOf(el: Element, doc: Document): string {
  const aria = el.getAttribute("aria-label");
  if (aria?.trim()) return aria.trim();
  const by = el.getAttribute("aria-labelledby");
  if (by) return by.split(/\s+/).map((id) => doc.getElementById(id)?.textContent ?? "").join(" ").trim();
  const id = el.getAttribute("id");
  if (id && (el.matches("input, select, textarea"))) {
    const label = [...doc.querySelectorAll("label[for]")].find((l) => l.getAttribute("for") === id);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const wrapping = el.closest("label");
  if (wrapping && wrapping !== el && wrapping.textContent?.trim()) return wrapping.textContent.trim();
  if (el.matches("input[type=submit], input[type=button]")) return el.getAttribute("value") ?? "";
  if (el.matches("input, textarea") && el.getAttribute("placeholder")?.trim()) return el.getAttribute("placeholder")!.trim();
  const title = el.getAttribute("title");
  // Words, ignoring what's hidden from a screen reader.
  const clone = el.cloneNode(true) as Element;
  for (const hidden of clone.querySelectorAll("[aria-hidden=true]")) hidden.remove();
  const words = clone.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (words) return words;
  const pic = [...el.querySelectorAll("img[alt], svg title")].map((p) => (p.tagName === "IMG" ? p.getAttribute("alt") : p.textContent)).find((t) => t?.trim());
  return pic?.trim() || title?.trim() || "";
}

function problems(doc: Document): string[] {
  const out: string[] = [];
  if (!doc.documentElement.getAttribute("lang")) out.push("no lang on <html>");
  if (!doc.title.trim()) out.push("no <title>");
  const mains = doc.querySelectorAll("main");
  if (mains.length !== 1) out.push(`${mains.length} <main> landmarks`);
  if (!doc.querySelector("h1, h2, [aria-label], [aria-labelledby]")) out.push("no heading or labelled region");
  for (const img of doc.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) out.push(`an <img> with no alt: ${img.getAttribute("src")?.slice(0, 60)}`);
  }
  for (const el of doc.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea")) {
    if (el.closest("[aria-hidden=true]")) continue;
    if (!nameOf(el, doc)) out.push(`a <${el.tagName.toLowerCase()}> with no name: ${el.outerHTML.replace(/\s+/g, " ").slice(0, 120)}`);
  }
  const seen = new Map<string, number>();
  for (const el of doc.querySelectorAll("[id]")) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
  for (const [id, n] of seen) if (n > 1) out.push(`id "${id}" is used ${n} times`);
  return out;
}

async function get(path: string, cookie?: string): Promise<Document> {
  const res = await fetch(new URL(path, baseUrl), { headers: cookie ? { cookie } : {} });
  expect(res.status, `GET ${path}`).toBe(200);
  return parse(await res.text());
}

// Pages anyone with the address sees, signed in or not. Read-only, so they
// run against the deployed house too.
it("holds every page at the door to the accessibility floor", async () => {
  for (const path of ["/", "/readme/", "/make", "/app", "/offline"]) {
    expect(problems(await get(path)), path).toEqual([]);
  }
});

describe.skipIf(!throwaway)("inside the house", () => {
  let cookie = "";
  const who = "4";

  afterAll(async () => {
    if (cookie) await fetch(new URL("/leave", baseUrl), { method: "POST", headers: { cookie }, redirect: "manual" });
  });

  it("holds every page inside the house to the accessibility floor", async () => {
    const res = await fetch(new URL("/me", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ who }),
      redirect: "manual",
    });
    cookie = res.headers.getSetCookie().find((c) => c.startsWith("who="))?.split(";")[0] ?? "";
    expect(cookie, `couldn't come in as ${who} (HTTP ${res.status})`).not.toBe("");
    const paths = ["/", "/updates", "/everyone", "/movies", "/uno", "/home-screen", "/living", "/kitchen", "/garden", "/room/1", "/room/2", "/room/3", "/room/4", "/room/5"];
    for (const path of paths) expect(problems(await get(path, cookie)), path).toEqual([]);
  });
});
