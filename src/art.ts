import { esc } from "./html.ts";
import type { Person } from "./people.ts";

// The small drawings that go on top of the illustrated house (src/scene.ts)
// and into the forms: what people leave, a lived-in room's clutter, and the
// garden's plants. All SVG, built on the server.

/* ---------- a lived-in room ---------- */

export function messItem(i: number, x: number, y: number, scale = 1): string {
  const r = (i * 47) % 360;
  const items = [
    `<path d="M-4 -8h7v9q0 3 3 3h5v6h-9q-6 0 -6 -6z" fill="#f2f2f2" stroke="#b9b9b9"/>`,
    `<path d="M-11 -9l6 -3q5 3 10 0l6 3l4 6l-5 3l-2 -2v13h-16v-13l-2 2l-5 -3z" fill="#e07a5f" opacity=".9"/>`,
    `<circle r="6" fill="#fff" stroke="#c9c9c9"/><path d="M-3 -1l2 2l3 -3" stroke="#c9c9c9" fill="none"/>`,
    `<rect x="5" y="-2.5" width="5" height="5" rx="1.5" fill="#5b8dd6"/><circle r="6.5" fill="#5b8dd6"/><circle r="4.5" fill="#6b4226"/>`,
    `<rect x="-7" y="-9" width="14" height="18" rx="2" fill="#f0b429"/><rect x="-7" y="-9" width="14" height="4" fill="#d64545"/>`,
  ];
  return `<g transform="translate(${x} ${y}) scale(${scale}) rotate(${r})">${items[i % items.length]}</g>`;
}

/* ---------- things people leave ---------- */

export function icon(key: string, color = "#e07a5f"): string {
  switch (key) {
    case "chai":
      return `<rect x="7" y="-2.5" width="6" height="5" rx="2" fill="#fff" stroke="#d8cfc2"/><circle r="9" fill="#fff" stroke="#d8cfc2"/><circle r="6.5" fill="#c8925a"/>`;
    case "coffee":
      return `<circle r="10.5" fill="#c9ced6" stroke="#a7aeb8"/><circle r="6.5" fill="#e4e7eb" stroke="#a7aeb8"/><circle r="4.8" fill="#8a5a34"/><circle cx="-1" cy="-1" r="2" fill="#d9b48a"/>`;
    case "dosa":
      return `<circle r="11" fill="#fff" stroke="#d8cfc2"/><path d="M-8 6L8 6L0 -8Z" fill="#d99a3c" stroke="#b97a24"/><circle cx="-6" cy="-5" r="2.5" fill="#f4f0e2" stroke="#d8d2bf"/><circle cx="6" cy="-5" r="2.5" fill="#e2753b"/>`;
    case "biryani":
      return `<circle r="10.5" fill="#b5603b"/><circle r="8.5" fill="#f0c45c"/><circle cx="-3" cy="-2" r="1.5" fill="#fff"/><circle cx="3" cy="2" r="1.5" fill="#fff"/><circle cx="2" cy="-4" r="1.5" fill="#e2753b"/><circle cx="-3" cy="4" r="1.5" fill="#e2753b"/><ellipse cx="4" cy="-1" rx="2.5" ry="1.4" fill="#4f8f3a"/>`;
    case "maggi":
      return `<circle r="10.5" fill="#d0453b"/><circle r="8.5" fill="#f4d35e"/><path d="M-6 -2q2.5 -3 5 0t5 0M-6 2.5q2.5 -3 5 0t5 0" stroke="#d9a520" fill="none" stroke-width="1.3"/>`;
    case "cake":
      return `<path d="M-9 8L9 8L0 -9Z" fill="#f6d9a8" stroke="#d9b07a"/><path d="M-9 8L9 8L7.5 5L-7.5 5Z" fill="#e88aa5"/><circle cy="-3" r="2.4" fill="#d6304a"/>`;
    case "mango":
      return `<ellipse rx="8" ry="10" transform="rotate(-25)" fill="#f2b233"/><ellipse cx="-2" cy="2" rx="4" ry="5" fill="#e8783a" opacity=".55"/><path d="M3 -9q5 -4 8 -1q-4 3 -8 1" fill="#4f8f3a"/>`;
    case "flower":
      return [0, 72, 144, 216, 288].map((a) => `<circle cx="${(Math.cos((a * Math.PI) / 180) * 5).toFixed(1)}" cy="${(Math.sin((a * Math.PI) / 180) * 5).toFixed(1)}" r="4.5" fill="#f27aa3"/>`).join("") + `<circle r="3.4" fill="#ffd36b"/>`;
    case "chocolate":
      return `<rect x="-9" y="-6" width="18" height="12" rx="1.5" fill="#6b3d23"/><path d="M-3 -6v12M-9 0h10" stroke="#4e2a17"/><rect x="1" y="-7" width="9" height="14" rx="1" fill="#c9302c"/>`;
    case "kitkat":
      return `<g transform="rotate(-20)"><rect x="-11" y="-6" width="22" height="12" rx="2" fill="#d62828" stroke="#7f1212"/><ellipse rx="6" ry="3" fill="#fff"/></g>`;
    case "note":
      return `<path d="M-9 -7h14l4 4v10h-18z" fill="#fff8e6" stroke="#d8cbb0"/><path d="M5 -7v4h4" fill="#ecdfc3" stroke="#d8cbb0"/><path d="M-6 -2h8M-6 1h10M-6 4h7" stroke="#c9b48e" stroke-width="1"/><circle cx="5" cy="4" r="2.2" fill="${color}"/>`;
    default:
      return "";
  }
}

export function iconSvg(key: string): string {
  return `<svg class="icon" viewBox="-13 -13 26 26" aria-hidden="true">${icon(key)}</svg>`;
}

/* ---------- the garden ---------- */

function plantArt(key: string | undefined, stage: number, thirsty: boolean): string {
  if (!key) {
    return `<rect x="-2" y="-30" width="4" height="30" fill="#8a5a3c"/><rect x="-14" y="-38" width="28" height="14" rx="2" fill="#e8d5b5" stroke="#8a5a3c"/>`;
  }
  const leaf = thirsty ? "#a5a35a" : "#5a9e48";
  const droop = thirsty ? 28 : 0;
  const leafPair = (y: number, size: number): string =>
    `<ellipse cx="${-size}" cy="${y}" rx="${size}" ry="${size / 2.2}" transform="rotate(${-20 + droop} 0 ${y})" fill="${leaf}"/><ellipse cx="${size}" cy="${y}" rx="${size}" ry="${size / 2.2}" transform="rotate(${20 - droop} 0 ${y})" fill="${leaf}"/>`;
  if (stage === 1) return `<path d="M0 0V-12" stroke="${leaf}" stroke-width="3"/>${leafPair(-12, 7)}`;
  if (stage === 2) return `<path d="M0 0V-30" stroke="${leaf}" stroke-width="3.5"/>${leafPair(-12, 10)}${leafPair(-26, 8)}`;
  const tilt = thirsty ? 10 : 0;
  const bloom: Record<string, string> = {
    sunflower: Array.from({ length: 10 }, (_, i) => `<ellipse cx="0" cy="-10" rx="4" ry="8" transform="rotate(${i * 36})" fill="#f6c63b"/>`).join("") + `<circle r="7" fill="#7a4a22"/>`,
    jasmine: `<circle cx="-8" cy="4" r="10" fill="${leaf}"/><circle cx="8" cy="4" r="10" fill="${leaf}"/><circle cy="-4" r="10" fill="${leaf}"/>` + [[-9, 0], [6, -6], [9, 6], [-2, 8], [-4, -9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff"/><circle cx="${x}" cy="${y}" r="1" fill="#f2c14e"/>`).join(""),
    hibiscus: [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-8" rx="6.5" ry="9" transform="rotate(${a})" fill="#e0323f"/>`).join("") + `<circle r="3.5" fill="#8a1c2a"/><path d="M0 0l7 -7" stroke="#f2c14e" stroke-width="2"/>`,
    tomato: `<circle cx="-8" cy="4" r="11" fill="${leaf}"/><circle cx="8" cy="4" r="11" fill="${leaf}"/><circle cy="-6" r="11" fill="${leaf}"/>` + [[-7, 4], [6, -4], [8, 9], [-3, -8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#e0402f"/>`).join(""),
    tulsi: `<circle cx="-7" cy="4" r="10" fill="${leaf}"/><circle cx="7" cy="4" r="10" fill="${leaf}"/><circle cy="-5" r="10" fill="${leaf}"/>` + [[-8, -6], [0, -14], [8, -6]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="5" fill="#8e5cb3"/>`).join(""),
    marigold: [[-9, 2], [9, 0], [0, -8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#f28c28"/><circle cx="${x}" cy="${y}" r="3.5" fill="#d96b12"/>`).join(""),
  };
  return `<g transform="rotate(${tilt} 0 0)"><path d="M0 0V-38" stroke="${leaf}" stroke-width="4"/>${leafPair(-14, 11)}${leafPair(-28, 9)}<g transform="translate(0 -46)" opacity="${thirsty ? 0.8 : 1}">${bloom[key] ?? ""}</g></g>`;
}

export function plantSvg(key: string): string {
  return `<svg class="icon" viewBox="-30 -80 60 86" aria-hidden="true">${plantArt(key, 3, false)}</svg>`;
}

export type Plot = { owner: Person; plant?: string; stage: number };

// The five patches side by side, big enough to see what's growing on a phone.
// Just after watering, drops fall on every patch; just after planting, a
// sprout pops up in yours (`did` and `me`).
export function patchesSvg(plots: Plot[], thirsty: boolean, did?: string, me?: string): string {
  const soil = thirsty ? "#a3805a" : "#6b4a30";
  const beds = plots.map((p, i) => {
    const x = 10 + i * 112;
    const name = p.owner.name;
    const fit = name.length > 9 ? ` textLength="104" lengthAdjust="spacingAndGlyphs"` : "";
    const done = did === "water" || (did === "plant" && p.owner.id === me) ? pop(did, [x + 48, 46], 26, i * 0.15) : "";
    return `<rect x="${x}" y="14" width="96" height="88" rx="6" fill="#8a5a3c"/><rect x="${x + 6}" y="20" width="84" height="76" rx="4" fill="${soil}"/><g transform="translate(${x + 48} ${p.plant ? 84 : 80})">${plantArt(p.plant, p.stage, thirsty)}</g><text class="plot-name" x="${x + 48}" y="128" text-anchor="middle"${fit}>${esc(name)}</text>${done}`;
  }).join("");
  return `<svg class="patches-svg" viewBox="0 0 570 140" role="img" aria-label="The five patches up close"><rect width="570" height="140" rx="10" fill="#9cc77a"/>${beds}</svg>`;
}

/* ---------- birthdays ---------- */

// A gold crown, its band's middle at (0, 0), for the top of a head.
export const CROWN = `<g class="crown"><path d="M-13 0L-14.5 -14L-7 -6.5L0 -17L7 -6.5L14.5 -14L13 0Z" fill="#f6c63b" stroke="#a8740e" stroke-width="1.6" stroke-linejoin="round"/><rect x="-13.5" y="-3.5" width="27" height="5" rx="1.5" fill="#e9a91e" stroke="#a8740e" stroke-width="1.2"/><circle cy="-17" r="2.4" fill="#e0405a" stroke="#a8740e" stroke-width=".8"/><circle cx="-14.5" cy="-14" r="2" fill="#4aa3df"/><circle cx="14.5" cy="-14" r="2" fill="#4aa3df"/><circle cy="-1" r="1.8" fill="#e0405a"/><circle cx="-7.5" cy="-1" r="1.4" fill="#5fb8a5"/><circle cx="7.5" cy="-1" r="1.4" fill="#5fb8a5"/></g>`;

// The crown on its own, for a window pane at the door or on Everyone.
export const crownSvg = (): string => `<svg class="crown" viewBox="-17 -21 34 24" aria-hidden="true">${CROWN}</svg>`;

// A striped party hat with a pompom, its brim's middle at (0, 0).
export const PARTY_HAT = `<g class="party-hat"><path d="M-9.5 0L0 -24L9.5 0Z" fill="#8ec5ff" stroke="#3d6fb0" stroke-width="1.3" stroke-linejoin="round"/><path d="M-6.5 -7L5.5 -8.5M-3.6 -14.5L3 -15.5" stroke="#ff7aa8" stroke-width="2.6" stroke-linecap="round"/><circle cy="-25" r="3.4" fill="#ffd34d" stroke="#c99a12" stroke-width="1"/></g>`;

const FLAGS = ["#f2685b", "#f6c63b", "#5fb8a5", "#8e7cc3", "#f29ac0", "#5b9bd5"];

// A string of little flags sagging from `a` to `b`, with "Happy birthday" on
// a card hanging from the middle.
export function bunting([ax, ay]: [number, number], [bx, by]: [number, number], sag: number, name: string): string {
  const [cx, cy] = [(ax + bx) / 2, (ay + by) / 2 + sag * 2];
  const at = (t: number): [number, number] => [
    (1 - t) ** 2 * ax + 2 * (1 - t) * t * cx + t ** 2 * bx,
    (1 - t) ** 2 * ay + 2 * (1 - t) * t * cy + t ** 2 * by,
  ];
  const n = Math.max(5, Math.round(Math.hypot(bx - ax, by - ay) / 24));
  const flags = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const [x, y] = at(t);
    const [x2, y2] = at(Math.min(1, t + 0.01));
    const angle = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    return `<path d="M-7 0H7L0 15Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})" fill="${FLAGS[i % FLAGS.length]}" stroke="rgba(80,50,30,.45)" stroke-width=".8"/>`;
  }).join("");
  const [mx, my] = at(0.5);
  const words = `Happy birthday, ${name}!`;
  const w = Math.round(words.length * 6.4 + 18);
  const card = `<g class="banner" transform="translate(${mx.toFixed(1)} ${(my + 12).toFixed(1)})"><path d="M0 -12V2" stroke="#8a5a3c" stroke-width="1"/><rect x="${-w / 2}" y="2" width="${w}" height="21" rx="4" fill="#fff8ea" stroke="#e07a5f" stroke-width="1.5"/><text class="banner-words" y="17.5">${esc(words)}</text></g>`;
  return `<path d="M${ax} ${ay}Q${cx} ${cy} ${bx} ${by}" fill="none" stroke="#8a5a3c" stroke-width="1.6"/>${flags}${card}`;
}

const BALLOONS: [number, number, string][] = [
  [-17, -86, "#f2685b"],
  [7, -104, "#f6c63b"],
  [23, -80, "#5b9bd5"],
  [-3, -70, "#f29ac0"],
];

// A bunch of balloons tied down at (x, y), floating up above it.
export function balloons(x: number, y: number): string {
  const each = BALLOONS.map(([dx, dy, fill], i) =>
    `<g class="balloon" style="animation-delay:${(-i * 0.7).toFixed(1)}s"><path d="M0 0Q${dx / 2 - 6} ${dy / 2} ${dx} ${dy + 15}" fill="none" stroke="#7a6a5a" stroke-width="1"/><path d="M${dx - 3} ${dy + 16}L${dx} ${dy + 12}L${dx + 3} ${dy + 16}Z" fill="${fill}"/><ellipse cx="${dx}" cy="${dy}" rx="11" ry="13.5" fill="${fill}" stroke="rgba(60,30,20,.35)" stroke-width="1"/><ellipse cx="${dx - 4}" cy="${dy - 5}" rx="3" ry="4.5" fill="#fff" opacity=".55"/></g>`).join("");
  return `<g class="balloons" transform="translate(${x} ${y})">${each}<circle r="2.5" fill="#7a6a5a"/></g>`;
}

// On the day itself: a cake on her desk with a candle lit, and confetti.
export function cake(x: number, y: number): string {
  return `<g class="cake" transform="translate(${x} ${y})"><ellipse cy="9" rx="17" ry="4.5" fill="#fff" stroke="#d8cfc2"/><rect x="-13" y="-4" width="26" height="12" rx="3" fill="#f6d9a8" stroke="#c9945a"/><rect x="-13" y="-4" width="26" height="4" rx="2" fill="#f29ac0"/><circle cx="-7" cy="3" r="1.5" fill="#e0405a"/><circle cx="0" cy="4" r="1.5" fill="#5fb8a5"/><circle cx="7" cy="3" r="1.5" fill="#5b9bd5"/><rect x="-1.3" y="-14" width="2.6" height="10" rx="1" fill="#8ec5ff"/><path class="flame" d="M0 -22Q4 -17 0 -14Q-4 -17 0 -22Z" fill="#ffb02e"/></g>`;
}

export function confetti(around: [number, number][]): string {
  const bits = around.flatMap(([x, y], i) =>
    Array.from({ length: 7 }, (_, j) => {
      const k = i * 7 + j;
      const dx = ((k * 37) % 70) - 35;
      const dy = ((k * 53) % 44) - 22;
      return `<rect x="${x + dx}" y="${y + dy}" width="5" height="3" rx="1" fill="${FLAGS[k % FLAGS.length]}" transform="rotate(${(k * 41) % 180} ${x + dx} ${y + dy})"/>`;
    }));
  return `<g class="confetti">${bits.join("")}</g>`;
}

/* ---------- a little emoji for everything you do ---------- */

// On the button for each thing you can do, in the house and on the pages.
// Most keys are the `did` a form sends you back with (src/server.ts).
export const EMOJI: Record<string, string> = {
  nap: "😴",
  sit: "🛋️",
  yoga: "🧘",
  tidy: "🧹",
  desk: "💌",
  look: "📬",
  mask: "🥒",
  kettle: "🍜",
  write: "✏️",
  wall: "📌",
  read: "👀",
  dish: "🍳",
  eat: "😋",
  water: "💧",
  plant: "🌱",
  play: "🐾",
  treat: "🦴",
  movie: "🎬",
  watched: "✅",
  night: "🍿",
  hug: "🤗",
  wish: "🎂",
  uno: "🃏",
};

// What pops up where you did it, once it's done.
export const POP: Record<string, string[]> = {
  nap: ["💤"],
  sit: ["😌"],
  tidy: ["✨", "✨", "✨"],
  desk: ["💌"],
  mask: ["🥒", "✨"],
  kettle: ["🍜"],
  wall: ["📌"],
  dish: ["🍳"],
  eat: ["😋", "✨"],
  water: ["💧", "💧", "💧"],
  plant: ["🌱"],
  play: ["💕", "💗", "💕"],
  treat: ["🦴", "😋"],
  movie: ["🎬"],
  watched: ["✅"],
  night: ["🍿"],
  hug: ["💞", "🤗", "💞"],
  wish: ["🎉", "🎂", "🎈"],
  uno: ["🃏"],
};

export const emoji = (key: string): string => (EMOJI[key] ? `<span class="emoji" aria-hidden="true">${EMOJI[key]}</span>` : "");

// The pop itself: a few emoji side by side at (x, y), rising and fading
// (water falls instead). Under reduced motion they just sit there.
export function pop(key: string, [x, y]: [number, number], size = 34, delay = 0): string {
  const all = POP[key] ?? [];
  return all.map((e, i) => {
    const dx = (i - (all.length - 1) / 2) * size * 0.9;
    const cls = key === "water" ? "pop fall" : "pop";
    return `<text class="${cls}" x="${(x + dx).toFixed(0)}" y="${y}" font-size="${size}" style="animation-delay:${(delay + i * 0.25).toFixed(2)}s">${e}</text>`;
  }).join("");
}
