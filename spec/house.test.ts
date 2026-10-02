import { JSDOM } from "jsdom";
import { describe, expect, inject, it } from "vitest";

// The core promise: one friend leaves something, another finds it later.
const baseUrl = inject("baseUrl");

// These checks leave notes behind and mark people as having visited, so they
// only run against a throwaway house (CI's container, a local run), never the
// friends' real one on Fly.
const throwaway =
  ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname) || process.env.SPEC_WRITES === "1";

type Person = { id: string; name: string };

const parse = (html: string): Document => new JSDOM(html).window.document;

async function visit(who?: string): Promise<Document> {
  const res = await fetch(new URL("/", baseUrl), { headers: who ? { cookie: `who=${who}` } : {} });
  expect(res.status).toBe(200);
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
  const door = await visit();
  return [...door.querySelectorAll<HTMLButtonElement>("button[name=who]")].map((b) => ({
    id: b.value,
    name: b.querySelector(".name")?.textContent ?? "",
  }));
}

const noteWith = (page: Document, text: string): Element | undefined =>
  [...page.querySelectorAll(".note")].find((n) => n.textContent?.includes(text));

const unique = (label: string): string => `${label} ${Date.now()}-${Math.random().toString(36).slice(2)}`;

it("greets a newcomer at the door with five windows to choose from", async () => {
  const five = await people();
  expect(five).toHaveLength(5);
  expect(new Set(five.map((p) => p.id)).size).toBe(5);
});

describe.skipIf(!throwaway)("leaving something for a friend", () => {
  it("remembers which window is yours", async () => {
    const [me] = await people();
    const res = await post("/me", { who: me.id });
    expect(res.status).toBe(303);
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith("who="));
    expect(cookie, "picking a window set no who= cookie").toBeDefined();

    const inside = await visit(cookie!.split(";")[0].slice("who=".length));
    expect(inside.querySelector("form[action='/notes']")).not.toBeNull();
    expect(inside.querySelector(".greeting")?.textContent).toContain(me.name);
  });

  it("keeps what one friend leaves for another to find on a later visit", async () => {
    const [a, b] = await people();
    const text = unique("a note from the spec");
    expect((await post("/notes", { body: text }, a.id)).status).toBe(303);

    const note = noteWith(await visit(b.id), text);
    expect(note, `${b.name} can't find the note ${a.name} left`).toBeDefined();
    expect(note!.textContent).toContain(a.name);
    expect(note!.classList.contains("new")).toBe(true);
  });

  it("knows which notes are yours", async () => {
    const [a] = await people();
    const text = unique("a note to myself");
    await post("/notes", { body: text }, a.id);

    const note = noteWith(await visit(a.id), text);
    expect(note).toBeDefined();
    expect(note!.classList.contains("mine")).toBe(true);
    expect(note!.classList.contains("new")).toBe(false);
  });

  it("shows a note exactly as written, even when it looks like code", async () => {
    const [a, b] = await people();
    const text = unique("<b>bold?</b> & <script>alert(1)</script>");
    await post("/notes", { body: text }, a.id);

    const note = noteWith(await visit(b.id), text);
    expect(note, "the note's text didn't come back intact").toBeDefined();
    expect(note!.querySelector("b, script")).toBeNull();
  });

  it("only lets the five leave things", async () => {
    const text = unique("from a stranger");
    expect((await post("/notes", { body: text })).status).toBe(403);
    expect((await post("/notes", { body: text }, "intruder")).status).toBe(403);

    const [a] = await people();
    expect(noteWith(await visit(a.id), text)).toBeUndefined();
  });
});
