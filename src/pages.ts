import { PEOPLE, personById, type Person } from "./people.ts";
import type { Note } from "./store.ts";

export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const DAY = 24 * 60 * 60 * 1000;

function ago(then: number, now: number): string {
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins === 1 ? "a minute ago" : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return days === 1 ? "yesterday" : `${days} days ago`;
  return `on ${new Date(then).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`;
}

const names = (list: string[]): string =>
  new Intl.ListFormat("en-AU", { type: "conjunction" }).format(list);

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:opsz,wght@9..144,400;9..144,600&display=swap">
<link rel="stylesheet" href="/style.css">
</head>
<body>
${body}
</body>
</html>`;
}

function windowFor(p: Person, seen: Map<string, number>, now: number, me?: Person): { lit: boolean; inner: string } {
  const last = seen.get(p.id);
  const when =
    p.id === me?.id ? "you're here" : last === undefined ? "hasn't been by yet" : `here ${ago(last, now)}`;
  return {
    lit: last !== undefined && now - last < DAY,
    inner: `<span class="glass" aria-hidden="true"></span><span class="name">${esc(p.name)}</span><span class="when">${esc(when)}</span>`,
  };
}

export function doorPage(seen: Map<string, number>): string {
  const now = Date.now();
  const windows = PEOPLE.map((p) => {
    const w = windowFor(p, seen, now);
    return `<li><button class="window${w.lit ? " lit" : ""}" name="who" value="${esc(p.id)}">${w.inner}</button></li>`;
  }).join("\n");

  return shell("Five Windows", `
<main>
  <header class="sky">
    <h1>Five Windows</h1>
    <p class="greeting">A little house for five friends who live far apart. Whoever comes by leaves something on the table, and whoever comes by next finds it.</p>
  </header>
  <form method="post" action="/me" class="house">
    <div class="roof" aria-hidden="true"></div>
    <h2 class="ask">Which window is yours?</h2>
    <ul class="windows">
${windows}
    </ul>
  </form>
  <p class="hint">Just visiting? Pick any window to look around. <a href="/readme/">What is this place?</a></p>
</main>`);
}

function greeting(me: Person, fresh: Note[], firstVisit: boolean): string {
  const hello = firstVisit ? `Welcome in, ${me.name}.` : `Welcome back, ${me.name}.`;
  if (fresh.length === 0) {
    return firstVisit
      ? `${hello} The table is empty for now. You could be the first to leave something.`
      : `${hello} Nothing new since you were last here; the house has been quiet.`;
  }
  const who = names([...new Set(fresh.map((n) => personById(n.author)?.name ?? "someone"))]);
  const what = fresh.length === 1 ? "a note" : `${fresh.length} notes`;
  return firstVisit
    ? `${hello} ${who} left ${what} on the table for you.`
    : `${hello} Since you were last here, ${who} left ${what} on the table.`;
}

export function housePage(me: Person, all: Note[], seen: Map<string, number>, seenUntil: number): string {
  const now = Date.now();
  const isNew = (n: Note) => n.author !== me.id && n.createdAt > seenUntil;

  const windows = PEOPLE.map((p) => {
    const w = windowFor(p, seen, now, me);
    return `<li class="window${w.lit ? " lit" : ""}">${w.inner}</li>`;
  }).join("\n");

  const notes = all.map((n) => {
    const mine = n.author === me.id;
    const by = mine ? "you" : (personById(n.author)?.name ?? "someone");
    const cls = ["note", isNew(n) ? "new" : "", mine ? "mine" : ""].filter(Boolean).join(" ");
    return `<li class="${cls}">${isNew(n) ? `<span class="tag">new</span>` : ""}<p class="body">${esc(n.body)}</p><p class="by">${esc(by)}, ${esc(ago(n.createdAt, now))}</p></li>`;
  }).join("\n");

  return shell("Five Windows", `
<main>
  <header class="sky">
    <h1>Five Windows</h1>
    <p class="greeting">${esc(greeting(me, all.filter(isNew), seenUntil === 0))}</p>
  </header>
  <section class="house" aria-label="Who has been by">
    <div class="roof" aria-hidden="true"></div>
    <ul class="windows">
${windows}
    </ul>
  </section>
  <section class="table" aria-labelledby="table-heading">
    <h2 id="table-heading">On the table</h2>
    <form method="post" action="/notes" class="compose">
      <label for="body">Leave something for the others</label>
      <textarea id="body" name="body" rows="3" maxlength="500" required placeholder="something from your day, a thought, a small hello…"></textarea>
      <button>Leave it on the table</button>
    </form>
    ${all.length ? `<ul class="notes">\n${notes}\n</ul>` : `<p class="empty">Nothing on the table yet.</p>`}
  </section>
  <footer>
    <form method="post" action="/leave"><button class="link">Not ${esc(me.name)}?</button></form>
    <span aria-hidden="true">·</span>
    <a href="/readme/">About this place</a>
  </footer>
</main>`);
}

export function readmePage(html: string): string {
  return shell("About Five Windows", `
<main>
  <p class="back"><a href="/">Back to the house</a></p>
  <article class="paper readme">
${html}
  </article>
</main>`);
}

export function messagePage(title: string, text: string): string {
  return shell(title, `
<main>
  <article class="paper message">
    <h1>${esc(title)}</h1>
    <p>${esc(text)}</p>
    <p><a href="/">Back to the house</a></p>
  </article>
</main>`);
}
