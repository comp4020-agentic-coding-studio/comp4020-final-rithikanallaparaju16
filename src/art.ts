import { esc } from "./html.ts";
import { PEOPLE, type Hair, type Person } from "./people.ts";
import type { Phase } from "./time.ts";

// Every drawing in the house is SVG built here on the server. Rooms are drawn
// in their own coordinates, so the same drawing serves the floor plan (placed
// with a translate) and the room's own page (given its own viewBox).

export type Spot = { key: string; color?: string };
export type DogState = { awake: boolean };

export type BedroomScene = {
  owner: Person;
  phase: Phase;
  clock: string;
  asleep: boolean;
  here: boolean;
  mess: 0 | 1 | 2;
  desk: Spot[];
  dog: DogState | null;
};
export type LivingScene = { phase: Phase; notes: string[]; big: boolean };
export type KitchenScene = { phase: Phase; dishes: string[] };
export type GardenScene = {
  phase: Phase;
  plots: Array<{ owner: Person; plant?: string; stage: number }>;
  thirsty: boolean;
  dog: DogState | null;
};
export type HouseScene = {
  phase: Phase;
  bedrooms: BedroomScene[];
  living: LivingScene;
  kitchen: KitchenScene;
  garden: GardenScene;
};

type Box = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

const WALL = "#6b4c3b";
const SKY: Record<Phase, string> = { night: "#26305c", dawn: "#f6b9a0", day: "#a8d8f0", dusk: "#f2925e" };
const SHADE: Record<Phase, [string, number] | null> = {
  night: ["#141a3c", 0.5],
  dusk: ["#b4532a", 0.2],
  dawn: ["#f0a088", 0.14],
  day: null,
};

function defs(): string {
  return `<defs>
<pattern id="wood" width="60" height="32" patternUnits="userSpaceOnUse"><rect width="60" height="32" fill="#dcb88e"/><path d="M0 15.5H60M0 31.5H60M20 0V16M50 16V32" stroke="#c9a176" stroke-width="1.2"/></pattern>
<pattern id="tiles" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#f4ecdd"/><rect width="14" height="14" fill="#e4d6bd"/><rect x="14" y="14" width="14" height="14" fill="#e4d6bd"/></pattern>
<pattern id="grass" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#9cc77a"/><path d="M5 9l2-4 2 4M18 22l2-4 2 4M25 7l1.5-3 1.5 3" stroke="#84b263" fill="none" stroke-width="1.4"/></pattern>
<pattern id="checks" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#d7e5f7"/><rect width="8" height="16" fill="#5f8fd6" opacity=".5"/><rect width="16" height="8" fill="#5f8fd6" opacity=".5"/></pattern>
<pattern id="mustard" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#e9b949"/><circle cx="4" cy="4" r="2" fill="#c7552f" opacity=".6"/><circle cx="13" cy="13" r="2" fill="#fff4d6" opacity=".7"/></pattern>
<pattern id="mat" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#ecd59f"/><rect width="24" height="5" fill="#c4553c"/><rect y="12" width="24" height="3" fill="#3f7f6e"/><path d="M0 19.5H24" stroke="#d9b874"/></pattern>
<pattern id="cork" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#c99a62"/><circle cx="3" cy="3" r="1" fill="#b3854f"/><circle cx="8" cy="7" r="1" fill="#dcb07a"/></pattern>
<radialGradient id="hole"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="warm"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
</defs>`;
}

/* ---------- people ---------- */

const HAIR = "#2a1a14";

function backHair(hair: Hair): string {
  switch (hair) {
    case "curly":
      return [
        [-16, -50, 8], [-10, -58, 8], [0, -61, 8], [10, -58, 8], [16, -50, 8],
        [-19, -40, 8], [19, -40, 8], [-19, -30, 7.5], [19, -30, 7.5], [-15, -22, 6.5], [15, -22, 6.5],
      ].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${HAIR}"/>`).join("");
    case "bob":
      return `<path d="M-18 -44Q-19 -60 0 -60Q19 -60 18 -44L18.5 -29Q13 -26 9 -29L-9 -29Q-13 -26 -18.5 -29Z" fill="${HAIR}"/>`;
    case "straight":
      return `<path d="M-18 -44Q-19 -60 0 -60Q19 -60 18 -44L19.5 -19Q10 -16 0 -17Q-10 -16 -19.5 -19Z" fill="${HAIR}"/>`;
    case "wavy":
      return `<path d="M-18 -46Q-20 -61 0 -61Q20 -61 18 -46Q24 -38 18 -30Q24 -22 17 -13Q8 -11 0 -12Q-8 -11 -17 -13Q-24 -22 -18 -30Q-24 -38 -18 -46Z" fill="${HAIR}"/>`;
  }
}

function frontHair(hair: Hair): string {
  switch (hair) {
    case "curly":
      return [[-12, -50, 5], [-6, -54.5, 5.5], [1, -55.5, 5.5], [8, -53.5, 5], [12.5, -48.5, 4.5], [-14, -45, 4.2]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${HAIR}"/>`).join("");
    case "bob":
      return `<path d="M-16 -37L-16 -46Q-16 -58 0 -58Q16 -58 16 -46L16 -37L13 -37L13 -47.5L-13 -47.5L-13 -37Z" fill="${HAIR}"/>`;
    case "straight":
      return `<path d="M-16 -35L-16 -46Q-16 -58 0 -58Q16 -58 16 -46L16 -35L13 -35L13 -45Q6 -52 -2 -49Q-9 -46.5 -13 -44L-13 -35Z" fill="${HAIR}"/>`;
    case "wavy":
      return `<path d="M-16 -36L-16 -46Q-16 -58 0 -58Q16 -58 16 -46L16 -36L13 -38Q14.5 -44 11 -48Q4 -52 -3 -48Q-8 -51.5 -12.5 -46L-13 -38Z" fill="${HAIR}"/>`;
  }
}

function face(p: Person, closed: boolean): string {
  const eyes = closed
    ? `<path d="M-8 -41Q-5.5 -39 -3 -41M3 -41Q5.5 -39 8 -41" stroke="${HAIR}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="-5.5" cy="-41" r="2" fill="${HAIR}"/><circle cx="5.5" cy="-41" r="2" fill="${HAIR}"/>`;
  const dimples = p.dimples
    ? `<path d="M-10.5 -37.5Q-9.3 -35.8 -10.3 -34M10.5 -37.5Q9.3 -35.8 10.3 -34" stroke="#7a4a32" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
    : "";
  return `<circle cx="0" cy="-42" r="15" fill="${p.skin}"/>${eyes}<circle cx="-9" cy="-36" r="2.6" fill="#f08a8a" opacity=".45"/><circle cx="9" cy="-36" r="2.6" fill="#f08a8a" opacity=".45"/><path d="M-4 -35Q0 -32 4 -35" stroke="#6b3a2a" stroke-width="1.4" fill="none" stroke-linecap="round"/>${dimples}${frontHair(p.hair)}`;
}

// A standing figure with feet at (0, 0), about 64 units tall.
export function figure(p: Person, opts: { closed?: boolean; here?: boolean } = {}): string {
  const ring = opts.here ? `<ellipse rx="21" ry="6.5" fill="none" stroke="#ffd36b" stroke-width="3"/>` : "";
  return `<ellipse rx="15" ry="4.5" fill="rgba(0,0,0,.18)"/>${ring}${backHair(p.hair)}<rect x="-8" y="-9" width="6" height="9" rx="2" fill="#3d3350"/><rect x="2" y="-9" width="6" height="9" rx="2" fill="#3d3350"/><path d="M-11 -26Q-17.5 -18 -15.5 -11M11 -26Q17.5 -18 15.5 -11" stroke="${p.color}" stroke-width="5.5" fill="none" stroke-linecap="round"/><circle cx="-15.5" cy="-10" r="3.2" fill="${p.skin}"/><circle cx="15.5" cy="-10" r="3.2" fill="${p.skin}"/><rect x="-3" y="-31" width="6" height="5" fill="${p.skin}"/><path d="M-11 -28Q-16 -14 -14 -6L14 -6Q16 -14 11 -28Q0 -32 -11 -28Z" fill="${p.color}"/>${face(p, opts.closed ?? false)}`;
}

export function avatar(p: Person, closed = false): string {
  return `<svg class="avatar" viewBox="-30 -68 60 74" aria-hidden="true"><g>${figure(p, { closed })}</g></svg>`;
}

/* ---------- furniture ---------- */

function bed(b: Box, blanket: string, sleeper?: Person): string {
  const pillow = Math.min(30, b.h * 0.2);
  const headY = b.y + 8 + pillow * 0.55;
  const top = sleeper ? headY + 11 : b.y + b.h * 0.36;
  const head = sleeper
    ? `<g transform="translate(${b.x + b.w / 2} ${headY}) scale(.8) translate(0 42)">${backHair(sleeper.hair)}${face(sleeper, true)}</g>`
    : "";
  const bump = sleeper
    ? `<ellipse cx="${b.x + b.w / 2}" cy="${top + (b.y + b.h - top) * 0.45}" rx="${b.w * 0.26}" ry="${(b.y + b.h - top) * 0.36}" fill="#fff" opacity=".16"/>`
    : "";
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="#8a5a3c"/><rect x="${b.x + 4}" y="${b.y + 4}" width="${b.w - 8}" height="${b.h - 8}" rx="4" fill="#fbf6ee"/><rect x="${b.x + 10}" y="${b.y + 8}" width="${b.w - 20}" height="${pillow}" rx="9" fill="#fff" stroke="#e3d8c8"/>${head}<rect x="${b.x + 4}" y="${top}" width="${b.w - 8}" height="${b.y + b.h - 4 - top}" rx="5" fill="${blanket}"/><rect x="${b.x + 4}" y="${top}" width="${b.w - 8}" height="9" rx="4" fill="#fff" opacity=".55"/>${bump}`;
}

function zzz(x: number, y: number): string {
  return `<text class="zz" x="${x}" y="${y}">z</text><text class="zz" x="${x + 11}" y="${y - 12}" font-size="22">z</text><text class="zz" x="${x + 24}" y="${y - 26}" font-size="28">Z</text>`;
}

function table(b: Box, fill = "#b98457"): string {
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="${fill}"/><rect x="${b.x}" y="${b.y + b.h - 4}" width="${b.w}" height="4" rx="2" fill="#000" opacity=".12"/>`;
}

function laptop(x: number, y: number, on: boolean): string {
  return `<g transform="translate(${x} ${y})"><rect y="-11" width="28" height="12" rx="2" fill="#3a3f4b"/><rect x="2" y="-9" width="24" height="8" rx="1" fill="${on ? "#9fd8ff" : "#4b5263"}"/><rect width="28" height="18" rx="2" fill="#c9ccd3"/><rect x="3" y="3" width="22" height="9" rx="1" fill="#a3a8b2"/><rect x="10" y="13" width="8" height="3" rx="1" fill="#b4b8c0"/></g>`;
}

function chair(x: number, y: number, color: string): string {
  return `<rect x="${x - 12}" y="${y - 11}" width="24" height="22" rx="7" fill="${color}"/><rect x="${x - 12}" y="${y + 7}" width="24" height="6" rx="3" fill="#000" opacity=".15"/>`;
}

function pot(x: number, y: number): string {
  return `<circle cx="${x}" cy="${y}" r="10" fill="#c96f45"/><circle cx="${x - 6}" cy="${y - 8}" r="8" fill="#5a9e48"/><circle cx="${x + 6}" cy="${y - 9}" r="8" fill="#4f8f3e"/><circle cx="${x}" cy="${y - 15}" r="8" fill="#68ad55"/>`;
}

function cushion(x: number, y: number, color: string, r = 15): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="#fff" opacity=".22"/>`;
}

function boardGames(x: number, y: number): string {
  return `<rect x="${x}" y="${y + 30}" width="74" height="16" rx="2" fill="#3d6bb3"/><rect x="${x + 4}" y="${y + 17}" width="68" height="15" rx="2" fill="#d64545"/><rect x="${x + 2}" y="${y + 5}" width="70" height="14" rx="2" fill="#2f9e6e"/><rect x="${x + 8}" y="${y - 7}" width="60" height="14" rx="2" fill="#f2c14e"/><text class="tiny" x="${x + 38}" y="${y + 3}" text-anchor="middle">GAMES</text><rect x="${x + 80}" y="${y + 34}" width="10" height="10" rx="2" fill="#fff" stroke="#999"/><circle cx="${x + 83}" cy="${y + 37}" r="1.2" fill="#333"/><circle cx="${x + 87}" cy="${y + 41}" r="1.2" fill="#333"/>`;
}

function catBox(x: number, y: number): string {
  const cat = (cx: number, cy: number, fur: string, eye: string): string =>
    `<path d="M${cx - 7} ${cy - 3}L${cx - 6} ${cy - 11}L${cx - 1} ${cy - 6}ZM${cx + 7} ${cy - 3}L${cx + 6} ${cy - 11}L${cx + 1} ${cy - 6}Z" fill="${fur}"/><circle cx="${cx}" cy="${cy}" r="7" fill="${fur}"/><circle cx="${cx - 2.6}" cy="${cy - 1}" r="1.3" fill="${eye}"/><circle cx="${cx + 2.6}" cy="${cy - 1}" r="1.3" fill="${eye}"/>`;
  return `<rect x="${x}" y="${y - 4}" width="40" height="10" fill="#a8743f"/>${cat(x + 9, y + 1, "#9a9a9a", "#c7e86b")}${cat(x + 21, y - 2, "#e39a4c", "#3b2a20")}${cat(x + 32, y + 2, "#3a3a3a", "#ffd36b")}<rect x="${x}" y="${y + 3}" width="40" height="24" rx="2" fill="#c8925a"/><path d="M${x} ${y + 3}l-7 -6M${x + 40} ${y + 3}l7 -6" stroke="#b07c46" stroke-width="4" stroke-linecap="round"/><rect x="${x + 17}" y="${y + 3}" width="6" height="24" fill="#e2c193" opacity=".7"/>`;
}

function books(x: number, y: number): string {
  const colors = ["#c4553c", "#3d6bb3", "#e9b949", "#5f9e74", "#8e7cc3"];
  return colors.map((c, i) => `<rect x="${x + (i % 2) * 4}" y="${y + i * 8}" width="${52 - i * 3}" height="8" rx="1.5" fill="${c}" stroke="#fff" stroke-width=".8"/>`).join("") +
    `<text class="tiny" x="${x + 24}" y="${y + 6}" text-anchor="middle" fill="#fff">UPSC</text>`;
}

function bookshelf(b: Box): string {
  const colors = ["#c4553c", "#3d6bb3", "#e9b949", "#5f9e74", "#8e7cc3", "#d9668a", "#6b4c3b"];
  let spines = "";
  for (let i = 0, x = b.x + 4; x < b.x + b.w - 8; i++, x += 9) {
    spines += `<rect x="${x}" y="${b.y + 3}" width="7" height="${b.h - 6}" fill="${colors[i % colors.length]}"/>`;
  }
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2" fill="#8a5a3c"/>${spines}`;
}

function banana(x: number, y: number): string {
  return `<path d="M${x - 13} ${y - 3}Q${x} ${y + 11} ${x + 13} ${y - 5}Q${x + 2} ${y + 3} ${x - 13} ${y - 3}Z" fill="#c9a43c" stroke="#8a6a22" stroke-width="1"/><circle cx="${x - 5}" cy="${y + 2}" r="1.8" fill="#5b3d16"/><circle cx="${x + 3}" cy="${y + 2.5}" r="2.2" fill="#5b3d16"/><circle cx="${x + 9}" cy="${y - 1}" r="1.5" fill="#5b3d16"/><rect x="${x + 12}" y="${y - 8}" width="3" height="5" rx="1" fill="#4a3a1a"/><path d="M${x - 3} ${y - 7}q3 -3 0 -6q-3 -3 0 -6M${x + 5} ${y - 8}q3 -3 0 -6" stroke="#8aa04a" stroke-width="1.4" fill="none" opacity=".8"/><circle cx="${x - 10}" cy="${y - 14}" r="1.5" fill="#333"/><ellipse cx="${x - 11.5}" cy="${y - 16}" rx="2" ry="1.2" fill="#cfe3f2"/><circle cx="${x + 12}" cy="${y - 17}" r="1.5" fill="#333"/><ellipse cx="${x + 13.5}" cy="${y - 19}" rx="2" ry="1.2" fill="#cfe3f2"/>`;
}

function yogaMat(b: Box): string {
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="#8f6bb3"/><rect x="${b.x}" y="${b.y}" width="${b.w}" height="15" rx="7" fill="#74539a"/><path d="M${b.x + 6} ${b.y + 30}H${b.x + b.w - 6}" stroke="#a88bc7" stroke-width="2"/>`;
}

function diya(x: number, y: number, lit: boolean): string {
  return `${lit ? `<circle cx="${x}" cy="${y - 4}" r="18" fill="url(#warm)"/>` : ""}<ellipse cx="${x}" cy="${y}" rx="8" ry="4.5" fill="#b5603b"/><path d="M${x} ${y - 12}Q${x + 4} ${y - 6} ${x} ${y - 3}Q${x - 4} ${y - 6} ${x} ${y - 12}Z" fill="#ffb53b"/>`;
}

function fairyLights(x1: number, x2: number, y: number): string {
  const colors = ["#ffd36b", "#ff9fb2", "#9fe0ff", "#c3f08a"];
  let pts = "";
  let bulbs = "";
  for (let i = 0, x = x1; x <= x2; i++, x += 14) {
    const yy = y + (i % 2) * 7;
    pts += `${x},${yy} `;
    bulbs += `<circle cx="${x}" cy="${yy + 2}" r="3" fill="${colors[i % colors.length]}"/>`;
  }
  return `<polyline points="${pts}" fill="none" stroke="#5a4a3a" stroke-width="1"/>${bulbs}`;
}

function messItem(i: number, x: number, y: number): string {
  const r = (i * 47) % 360;
  const items = [
    `<path d="M-4 -8h7v9q0 3 3 3h5v6h-9q-6 0 -6 -6z" fill="#f2f2f2" stroke="#b9b9b9"/>`,
    `<path d="M-11 -9l6 -3q5 3 10 0l6 3l4 6l-5 3l-2 -2v13h-16v-13l-2 2l-5 -3z" fill="#e07a5f" opacity=".9"/>`,
    `<circle r="6" fill="#fff" stroke="#c9c9c9"/><path d="M-3 -1l2 2l3 -3" stroke="#c9c9c9" fill="none"/>`,
    `<rect x="5" y="-2.5" width="5" height="5" rx="1.5" fill="#5b8dd6"/><circle r="6.5" fill="#5b8dd6"/><circle r="4.5" fill="#6b4226"/>`,
    `<rect x="-7" y="-9" width="14" height="18" rx="2" fill="#f0b429"/><rect x="-7" y="-9" width="14" height="4" fill="#d64545"/>`,
  ];
  return `<g transform="translate(${x} ${y}) rotate(${r})">${items[i % items.length]}</g>`;
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
    case "note":
      return `<path d="M-9 -7h14l4 4v10h-18z" fill="#fff8e6" stroke="#d8cbb0"/><path d="M5 -7v4h4" fill="#ecdfc3" stroke="#d8cbb0"/><path d="M-6 -2h8M-6 1h10M-6 4h7" stroke="#c9b48e" stroke-width="1"/><circle cx="5" cy="4" r="2.2" fill="${color}"/>`;
    default:
      return "";
  }
}

export function iconSvg(key: string): string {
  return `<svg class="icon" viewBox="-13 -13 26 26" aria-hidden="true">${icon(key)}</svg>`;
}

function placeIcons(spots: Spot[], slots: Pt[]): string {
  return spots.slice(0, slots.length).map((s, i) => `<g transform="translate(${slots[i].x} ${slots[i].y})">${icon(s.key, s.color)}</g>`).join("");
}

/* ---------- Laddoo ---------- */

function dog(x: number, y: number, awake: boolean): string {
  const fur = "#dca35a";
  const ear = "#a8692e";
  if (!awake) {
    return `<g class="dog" transform="translate(${x} ${y})"><ellipse cy="6" rx="21" ry="6" fill="rgba(0,0,0,.15)"/><path d="M14 4Q23 -2 16 -11" stroke="#c98f45" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse rx="17" ry="11" fill="${fur}"/><circle cx="-11" cy="-3" r="8.5" fill="#e2ad66"/><ellipse cx="-17" cy="-7" rx="3.5" ry="5.5" transform="rotate(-30 -17 -7)" fill="${ear}"/><ellipse cx="-6" cy="-10" rx="3" ry="5" transform="rotate(25 -6 -10)" fill="${ear}"/><path d="M-14 -3q2 1.5 4 0" stroke="#3b2a20" stroke-width="1.3" fill="none"/><circle cx="-18.5" cy="0" r="1.7" fill="#3b2a20"/></g>`;
  }
  return `<g class="dog" transform="translate(${x} ${y})"><ellipse cy="2" rx="16" ry="5" fill="rgba(0,0,0,.15)"/><path d="M9 -2Q21 -4 19 -17" stroke="#c98f45" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cy="-9" rx="11" ry="12" fill="${fur}"/><rect x="-7" y="-6" width="5" height="8" rx="2" fill="#e2ad66"/><rect x="2" y="-6" width="5" height="8" rx="2" fill="#e2ad66"/><circle cy="-25" r="9.5" fill="#e2ad66"/><ellipse cx="-9" cy="-25" rx="3.5" ry="6.5" transform="rotate(15 -9 -25)" fill="${ear}"/><ellipse cx="9" cy="-25" rx="3.5" ry="6.5" transform="rotate(-15 9 -25)" fill="${ear}"/><circle cx="-3.5" cy="-27" r="1.6" fill="#3b2a20"/><circle cx="3.5" cy="-27" r="1.6" fill="#3b2a20"/><ellipse cy="-22" rx="2.2" ry="1.6" fill="#3b2a20"/><ellipse cy="-18.5" rx="2" ry="2.6" fill="#f08a8a"/></g>`;
}

/* ---------- rooms ---------- */

function sky(w: Box, phase: Phase): string {
  const star = phase === "night" ? `<circle cx="${w.x + w.w * 0.3}" cy="${w.y + w.h * 0.5}" r="1.6" fill="#fff"/>` : "";
  return `<rect class="window" x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" fill="${SKY[phase]}" stroke="#fff" stroke-width="2"/>${star}`;
}

function shade(id: string, w: number, h: number, phase: Phase, lamp?: Pt & { r: number }): string {
  const s = SHADE[phase];
  if (!s) return "";
  const [fill, opacity] = s;
  if (!lamp) return `<rect width="${w}" height="${h}" fill="${fill}" opacity="${opacity}"/>`;
  return `<mask id="lamp-${id}"><rect width="${w}" height="${h}" fill="#fff"/><circle cx="${lamp.x}" cy="${lamp.y}" r="${lamp.r}" fill="url(#hole)"/></mask><rect width="${w}" height="${h}" fill="${fill}" opacity="${opacity}" mask="url(#lamp-${id})"/><circle cx="${lamp.x}" cy="${lamp.y}" r="${lamp.r}" fill="url(#warm)"/>`;
}

// A gap in a wall between rooms that share the viewer's light.
function opening(b: Box, phase: Phase): string {
  const s = SHADE[phase];
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#d9b892"/>${s ? `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${s[0]}" opacity="${s[1]}"/>` : ""}`;
}

function door(b: Box): string {
  return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2" fill="#d6a46c" stroke="${WALL}" stroke-width="1.5"/>`;
}

function pill(x: number, y: number, title: string, sub: string | undefined, color: string): string {
  const w = Math.max(title.length * 14.5, (sub?.length ?? 0) * 10.5) + 34;
  const h = sub ? 60 : 40;
  return `<g class="pill" transform="translate(${x} ${y})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="#fffaf0" fill-opacity=".93" stroke="${color}" stroke-width="3"/><text class="pill-name" y="${sub ? -3 : 9}" text-anchor="middle">${esc(title)}</text>${sub ? `<text class="pill-sub" y="20" text-anchor="middle">${esc(sub)}</text>` : ""}</g>`;
}

type BedroomPlan = {
  box: Box;
  windows: Box[];
  door: Box;
  lamp: Pt;
  stand: Pt;
  dog: Pt;
  zzz: Pt;
  // Where the name sits on the floor plan; rooms on the hallway get a
  // nameplate just outside their door instead.
  label?: Pt;
  mess: Pt[];
  desk: Pt[];
  furniture: (s: BedroomScene) => string;
};

const BEDROOMS: Record<string, BedroomPlan> = {
  // Neha, New Jersey
  "2": {
    box: { x: 20, y: 230, w: 230, h: 270 },
    windows: [{ x: 70, y: -4, w: 80, h: 8 }],
    door: { x: 150, y: 265, w: 44, h: 10 },
    lamp: { x: 64, y: 40 },
    stand: { x: 98, y: 180 },
    dog: { x: 178, y: 184 },
    zzz: { x: 186, y: 66 },
    mess: [{ x: 40, y: 152 }, { x: 190, y: 236 }, { x: 122, y: 250 }, { x: 62, y: 128 }, { x: 206, y: 212 }],
    desk: [{ x: 70, y: 38 }, { x: 96, y: 38 }, { x: 84, y: 64 }],
    furniture: (s) =>
      `<ellipse cx="118" cy="206" rx="52" ry="30" fill="#cfe3f2"/>` +
      `<rect x="12" y="14" width="104" height="66" rx="3" fill="#f4a9bf"/>` +
      Array.from({ length: 11 }, (_, i) => `<circle cx="${16 + i * 9.6}" cy="80" r="4.5" fill="#f4a9bf"/>`).join("") +
      `<rect x="16" y="18" width="96" height="58" rx="2" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3" opacity=".8"/>` +
      laptop(22, 36, !s.asleep) + chair(54, 100, "#e98fab") + boardGames(14, 208) +
      bed({ x: 132, y: 14, w: 86, h: 140 }, "url(#checks)", s.asleep ? s.owner : undefined),
  },
  // Rithanya, Bangalore
  "4": {
    box: { x: 250, y: 230, w: 230, h: 270 },
    windows: [{ x: 60, y: -4, w: 80, h: 8 }],
    door: { x: 150, y: 265, w: 44, h: 10 },
    lamp: { x: 60, y: 44 },
    stand: { x: 100, y: 188 },
    dog: { x: 178, y: 184 },
    zzz: { x: 186, y: 66 },
    mess: [{ x: 46, y: 196 }, { x: 196, y: 234 }, { x: 150, y: 252 }, { x: 72, y: 226 }, { x: 206, y: 208 }],
    desk: [{ x: 32, y: 70 }, { x: 58, y: 70 }, { x: 86, y: 70 }],
    furniture: (s) =>
      `<ellipse cx="124" cy="206" rx="50" ry="28" fill="#f6d7c3"/>` +
      table({ x: 12, y: 14, w: 104, h: 70 }) + laptop(20, 34, !s.asleep) + catBox(70, 26) +
      chair(60, 106, "#b8a9e0") + books(14, 124) + bookshelf({ x: 14, y: 248, w: 104, h: 16 }) +
      bed({ x: 132, y: 14, w: 86, h: 140 }, "#b9a6e0", s.asleep ? s.owner : undefined),
  },
  // Aswathy, Bangalore
  "5": {
    box: { x: 480, y: 230, w: 260, h: 270 },
    windows: [{ x: 90, y: -4, w: 80, h: 8 }],
    door: { x: 180, y: 265, w: 44, h: 10 },
    lamp: { x: 60, y: 40 },
    stand: { x: 104, y: 174 },
    dog: { x: 208, y: 184 },
    zzz: { x: 214, y: 66 },
    mess: [{ x: 140, y: 152 }, { x: 232, y: 196 }, { x: 74, y: 254 }, { x: 150, y: 258 }, { x: 30, y: 98 }],
    desk: [{ x: 36, y: 66 }, { x: 62, y: 66 }, { x: 92, y: 64 }],
    furniture: (s) =>
      table({ x: 12, y: 14, w: 104, h: 64 }) + laptop(20, 32, !s.asleep) + banana(86, 30) +
      chair(60, 96, "#a8d5b4") + yogaMat({ x: 14, y: 116, w: 40, h: 120 }) +
      `<ellipse cx="148" cy="222" rx="62" ry="30" fill="#efe3c8"/>` +
      cushion(120, 226, "#e9a23b") + cushion(176, 226, "#5f9e74") + diya(148, 214, s.phase !== "day") + pot(234, 242) +
      bed({ x: 162, y: 14, w: 86, h: 140 }, "#a9cfae", s.asleep ? s.owner : undefined),
  },
  // Rithika, Canberra
  "1": {
    box: { x: 740, y: 230, w: 240, h: 270 },
    windows: [{ x: 80, y: -4, w: 80, h: 8 }],
    door: { x: 150, y: 265, w: 44, h: 10 },
    lamp: { x: 176, y: 44 },
    stand: { x: 140, y: 180 },
    dog: { x: 56, y: 188 },
    zzz: { x: 66, y: 74 },
    mess: [{ x: 110, y: 142 }, { x: 198, y: 178 }, { x: 70, y: 240 }, { x: 160, y: 252 }, { x: 24, y: 206 }],
    desk: [{ x: 140, y: 42 }, { x: 164, y: 42 }, { x: 152, y: 68 }],
    furniture: (s) =>
      `<ellipse cx="140" cy="208" rx="54" ry="30" fill="#f5d0c0"/>` +
      bed({ x: 12, y: 22, w: 86, h: 136 }, "#f2b8a2", s.asleep ? s.owner : undefined) +
      table({ x: 124, y: 22, w: 104, h: 62 }) + laptop(190, 40, !s.asleep) + chair(176, 104, "#e9a08a") +
      pot(216, 246) + fairyLights(14, 226, 9),
  },
  // Amirdhavarshini, Tamil Nadu: the biggest room, where everyone hangs out
  "3": {
    box: { x: 20, y: 580, w: 410, h: 374 },
    windows: [{ x: -4, y: 150, w: 8, h: 90 }, { x: 60, y: 370, w: 100, h: 8 }],
    door: { x: 200, y: -5, w: 44, h: 10 },
    lamp: { x: 220, y: 262 },
    stand: { x: 82, y: 184 },
    dog: { x: 330, y: 194 },
    zzz: { x: 346, y: 66 },
    label: { x: 220, y: 298 },
    mess: [{ x: 150, y: 112 }, { x: 40, y: 200 }, { x: 384, y: 222 }, { x: 384, y: 334 }, { x: 62, y: 300 }],
    desk: [{ x: 66, y: 40 }, { x: 92, y: 40 }, { x: 116, y: 40 }],
    furniture: (s) =>
      table({ x: 14, y: 14, w: 116, h: 62 }) + laptop(22, 34, !s.asleep) + chair(60, 96, "#f3cd7a") +
      `<rect x="110" y="196" width="220" height="136" rx="6" fill="url(#mat)" stroke="#b3863f" stroke-width="4"/>` +
      `<circle cx="220" cy="238" r="17" fill="#fff" stroke="#e3d8c8"/><circle cx="215" cy="234" r="4" fill="#f2c14e"/><circle cx="224" cy="236" r="4" fill="#f2c14e"/><circle cx="219" cy="243" r="4" fill="#e9a23b"/>` +
      [[180, 186], [262, 186], [100, 240], [340, 240], [220, 346]].map(([x, y], i) => cushion(x, y, PEOPLE[i].color)).join("") +
      pot(30, 342) +
      bed({ x: 262, y: 14, w: 136, h: 156 }, "url(#mustard)", s.asleep ? s.owner : undefined),
  },
};

export const BEDROOM_ORDER = ["2", "4", "5", "1", "3"];

function bedroom(s: BedroomScene, plan: boolean): string {
  const r = BEDROOMS[s.owner.id];
  const { w, h } = r.box;
  const lampOn = !s.asleep && (s.phase === "night" || s.phase === "dusk");
  const messes = r.mess.slice(0, s.mess === 0 ? 0 : s.mess === 1 ? 2 : 5).map((m, i) => messItem(i, m.x, m.y)).join("");
  const person = s.asleep ? "" : `<g transform="translate(${r.stand.x} ${r.stand.y})">${figure(s.owner, { here: s.here })}</g>`;
  const pup = s.dog ? dog(r.dog.x, r.dog.y, s.dog.awake) : "";
  const sleeping = s.asleep ? zzz(r.zzz.x, r.zzz.y) : "";
  const sub = `${s.clock}${s.asleep ? " · asleep" : s.here ? " · home now" : ""}`;
  const label = r.label ?? { x: w / 2, y: h + HALL.h / 2 };
  return `<rect class="floor" width="${w}" height="${h}" fill="url(#wood)"/>${r.furniture(s)}${messes}${placeIcons(s.desk, r.desk)}${pup}${person}${shade(`b${s.owner.id}`, w, h, s.phase, lampOn ? { ...r.lamp, r: w > 300 ? 170 : 110 } : undefined)}${sleeping}<rect class="wall" width="${w}" height="${h}" fill="none" stroke="${WALL}" stroke-width="8"/>${door(r.door)}${r.windows.map((win) => sky(win, s.phase)).join("")}${plan ? pill(label.x, label.y, s.owner.name, sub, s.owner.color) : ""}`;
}

const HALL: Box = { x: 20, y: 500, w: 960, h: 80 };
const LIVING: Box = { x: 430, y: 580, w: 330, h: 374 };
const KITCHEN: Box = { x: 760, y: 580, w: 220, h: 374 };

function living(s: LivingScene, plan: boolean): string {
  const { w, h } = LIVING;
  const notes = s.notes.slice(0, 14).map((c, i) => {
    const x = 26 + (i % 7) * 26;
    const y = 12 + Math.floor(i / 7) * 15;
    return `<rect x="${x}" y="${y}" width="18" height="12" fill="${c}" transform="rotate(${(i % 3) - 1} ${x} ${y})"/><circle cx="${x + 9}" cy="${y + 2}" r="1.6" fill="#c4553c"/>`;
  }).join("");
  const star = s.big ? `<path d="M206 14l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#f2c14e" stroke="#b3863f"/>` : "";
  const lampOn = s.phase === "night" || s.phase === "dusk";
  return `<rect class="floor" width="${w}" height="${h}" fill="url(#wood)"/>` +
    `<rect x="14" y="7" width="206" height="38" rx="3" fill="url(#cork)" stroke="#8a5a3c" stroke-width="3"/>${notes}${star}` +
    `<rect x="46" y="150" width="236" height="180" rx="16" fill="#e7a977"/><rect x="58" y="162" width="212" height="156" rx="10" fill="none" stroke="#f6d6a8" stroke-width="3"/>` +
    `<rect x="14" y="176" width="52" height="58" rx="12" fill="#5f9e9a"/><rect x="14" y="176" width="14" height="58" rx="7" fill="#4b827e"/>` +
    table({ x: 116, y: 196, w: 96, h: 52 }) + `<g transform="translate(140 218)">${icon("chai")}</g>` + pot(190, 228) +
    `<rect x="76" y="278" width="176" height="62" rx="12" fill="#4f8f8b"/><rect x="76" y="318" width="176" height="22" rx="10" fill="#3f7773"/><rect x="92" y="284" width="68" height="32" rx="6" fill="#62a39f"/><rect x="168" y="284" width="68" height="32" rx="6" fill="#62a39f"/>` +
    `<circle cx="298" cy="182" r="16" fill="#f7e7c6" stroke="#d9c49a" stroke-width="2"/><circle cx="298" cy="182" r="4" fill="#8a5a3c"/>` +
    pot(294, 346) +
    shade("living", w, h, s.phase, lampOn ? { x: 298, y: 182, r: 170 } : undefined) +
    `<rect class="wall" width="${w}" height="${h}" fill="none" stroke="${WALL}" stroke-width="8"/>` +
    opening({ x: 230, y: -5, w: 70, h: 10 }, s.phase) + opening({ x: w - 5, y: 120, w: 10, h: 140 }, s.phase) +
    door({ x: 140, y: h - 5, w: 50, h: 10 }) + sky({ x: 230, y: h - 4, w: 70, h: 8 }, s.phase) +
    (plan ? pill(165, 112, "Living room", "the wall", "#8a5a3c") : "");
}

function kitchen(s: KitchenScene, plan: boolean): string {
  const { w, h } = KITCHEN;
  const slots: Pt[] = [{ x: 62, y: 160 }, { x: 106, y: 160 }, { x: 62, y: 226 }, { x: 106, y: 226 }, { x: 44, y: 345 }, { x: 88, y: 345 }, { x: 132, y: 345 }];
  const lampOn = s.phase === "night" || s.phase === "dusk";
  return `<rect class="floor" width="${w}" height="${h}" fill="url(#tiles)"/>` +
    `<rect x="156" y="12" width="54" height="60" rx="4" fill="#f7f7f4" stroke="#cfcfcf" stroke-width="2"/><circle cx="168" cy="26" r="3" fill="#e07a5f"/><circle cx="180" cy="34" r="3" fill="#5f9e74"/><rect x="186" y="22" width="10" height="8" fill="#fff3b0"/>` +
    `<rect x="168" y="80" width="44" height="284" rx="3" fill="#e8e2d6" stroke="#cfc6b5" stroke-width="2"/>` +
    `<rect x="172" y="96" width="36" height="64" rx="3" fill="#3a3a3a"/><circle cx="190" cy="112" r="9" fill="none" stroke="#777" stroke-width="2"/><circle cx="190" cy="144" r="9" fill="none" stroke="#777" stroke-width="2"/><circle cx="190" cy="112" r="11" fill="#b9bec6"/><circle cx="190" cy="112" r="3" fill="#7d838c"/>` +
    `<rect x="174" y="230" width="32" height="50" rx="6" fill="#b8c7cf" stroke="#93a6b0" stroke-width="2"/><circle cx="200" cy="236" r="2.5" fill="#93a6b0"/>` +
    `<rect x="14" y="326" width="150" height="38" rx="3" fill="#e8e2d6" stroke="#cfc6b5" stroke-width="2"/>` +
    chair(22, 160, "#e9a23b") + chair(22, 226, "#5f9e74") + chair(146, 160, "#8e7cc3") + chair(146, 226, "#d9668a") +
    table({ x: 34, y: 126, w: 100, h: 136 }) +
    placeIcons(s.dishes.map((key) => ({ key })), slots) +
    shade("kitchen", w, h, s.phase, lampOn ? { x: 84, y: 194, r: 150 } : undefined) +
    `<rect class="wall" width="${w}" height="${h}" fill="none" stroke="${WALL}" stroke-width="8"/>` +
    opening({ x: 20, y: -5, w: 70, h: 10 }, s.phase) + opening({ x: -5, y: 120, w: 10, h: 140 }, s.phase) +
    sky({ x: w - 4, y: 222, w: 8, h: 60 }, s.phase) +
    (plan ? pill(84, 96, "Kitchen", undefined, "#c4553c") : "");
}

function hallway(phase: Phase): string {
  const { w, h } = HALL;
  return `<rect class="floor" width="${w}" height="${h}" fill="url(#wood)"/><rect x="24" y="${h / 2 - 17}" width="${w - 48}" height="34" rx="4" fill="#b5523b"/><rect x="30" y="${h / 2 - 11}" width="${w - 60}" height="22" rx="2" fill="none" stroke="#e9c46a" stroke-width="2"/>${shade("hall", w, h, phase)}<rect class="wall" width="${w}" height="${h}" fill="none" stroke="${WALL}" stroke-width="8"/>`;
}

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

function garden(s: GardenScene, plan: boolean): string {
  const soil = s.thirsty ? "#a3805a" : "#6b4a30";
  const fence = Array.from({ length: 26 }, (_, i) => `<rect x="${i * 40 + 4}" y="0" width="8" height="22" rx="2" fill="#e8d5b5" stroke="#b39770"/>`).join("");
  const plots = s.plots.map((p, i) => {
    const x = 34 + i * 112;
    const name = p.owner.name;
    const fit = name.length > 9 ? ` textLength="104" lengthAdjust="spacingAndGlyphs"` : "";
    return `<rect x="${x}" y="58" width="96" height="88" rx="6" fill="#8a5a3c"/><rect x="${x + 6}" y="64" width="84" height="76" rx="4" fill="${soil}"/><g transform="translate(${x + 48} ${p.plant ? 128 : 124})">${plantArt(p.plant, p.stage, s.thirsty)}</g><text class="plot-name" x="${x + 48}" y="172" text-anchor="middle"${fit}>${esc(name)}</text>`;
  }).join("");
  const can = `<g transform="translate(606 150)"><ellipse cy="14" rx="20" ry="5" fill="rgba(0,0,0,.15)"/><rect x="-14" y="-10" width="26" height="24" rx="5" fill="#5f9eb3"/><path d="M12 -2L28 -14" stroke="#5f9eb3" stroke-width="5" stroke-linecap="round"/><path d="M-12 -10Q0 -24 10 -10" stroke="#4a8296" stroke-width="3" fill="none"/></g>`;
  const kennel = `<g transform="translate(650 52)"><rect y="22" width="86" height="58" rx="3" fill="#d9895b"/><path d="M-8 26L43 -8L94 26Z" fill="#a8432f"/><path d="M28 80V58A15 15 0 0 1 58 58V80Z" fill="#4a2e22"/><text class="plate" x="43" y="44" text-anchor="middle">LADDOO</text></g>`;
  const pup = s.dog ? dog(s.dog.awake ? 700 : 694, s.dog.awake ? 186 : 140, s.dog.awake) : "";
  const tree = `<ellipse cx="874" cy="204" rx="74" ry="16" fill="rgba(0,0,0,.14)"/><circle cx="870" cy="108" r="84" fill="#4f8f3e"/><circle cx="830" cy="80" r="40" fill="#5ea04b"/><circle cx="904" cy="128" r="44" fill="#468235"/><circle cx="880" cy="66" r="30" fill="#68ad55"/>` +
    [[840, 120], [892, 92], [910, 150], [860, 158], [826, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" fill="#f2b233"/>`).join("");
  return `<rect class="floor" width="1000" height="230" fill="url(#grass)"/><path d="M0 11H1000" stroke="#b39770" stroke-width="3"/>${fence}${plots}${can}${kennel}${pup}${tree}${shade("garden", 1000, 230, s.phase)}${plan ? pill(588, 204, "Garden", undefined, "#4f8f3e") : ""}`;
}

function frontYard(phase: Phase): string {
  const bush = (x: number, c: string): string =>
    `<circle cx="${x}" cy="40" r="16" fill="#5a9e48"/><circle cx="${x - 6}" cy="34" r="3.5" fill="${c}"/><circle cx="${x + 7}" cy="38" r="3.5" fill="${c}"/><circle cx="${x}" cy="46" r="3.5" fill="${c}"/>`;
  return `<rect class="floor" width="1000" height="70" fill="url(#grass)"/><rect x="572" width="46" height="70" fill="#dccbad"/><rect x="556" y="4" width="78" height="14" rx="3" fill="#b5523b"/>${bush(500, "#f27aa3")}${bush(690, "#f2c14e")}${bush(120, "#f27aa3")}${bush(880, "#ffffff")}${shade("front", 1000, 70, phase)}`;
}

const at = (b: Box, inner: string): string => `<g transform="translate(${b.x} ${b.y})">${inner}</g>`;

export function floorPlan(house: HouseScene): string {
  const rooms = BEDROOM_ORDER.map((id) => {
    const s = house.bedrooms.find((b) => b.owner.id === id)!;
    return `<a href="/room/${id}" aria-label="${esc(s.owner.name)}'s room">${at(BEDROOMS[id].box, bedroom(s, true))}</a>`;
  }).join("");
  return `<svg class="plan-svg" viewBox="0 0 1000 1024" aria-label="The house, seen from above">${defs()}
<a href="/garden" aria-label="The garden">${garden(house.garden, true)}</a>
${at({ x: 0, y: 954, w: 1000, h: 70 }, frontYard(house.phase))}
<rect x="20" y="230" width="960" height="724" fill="none" stroke="#5a3f30" stroke-width="16"/>
${at(HALL, hallway(house.phase))}
${rooms}
<a href="/living" aria-label="The living room">${at(LIVING, living(house.living, true))}</a>
<a href="/kitchen" aria-label="The kitchen">${at(KITCHEN, kitchen(house.kitchen, true))}</a>
</svg>`;
}

const framed = (w: number, h: number, inner: string, label: string): string =>
  `<svg class="room-svg" viewBox="-8 -8 ${w + 16} ${h + 16}" role="img" aria-label="${esc(label)}">${defs()}${inner}</svg>`;

export function bedroomSvg(s: BedroomScene): string {
  const { w, h } = BEDROOMS[s.owner.id].box;
  return framed(w, h, bedroom(s, false), `${s.owner.name}'s room, seen from above`);
}

export const livingSvg = (s: LivingScene): string => framed(LIVING.w, LIVING.h, living(s, false), "The living room, seen from above");
export const kitchenSvg = (s: KitchenScene): string => framed(KITCHEN.w, KITCHEN.h, kitchen(s, false), "The kitchen, seen from above");
export const gardenSvg = (s: GardenScene): string =>
  `<svg class="room-svg" viewBox="0 0 1000 230" role="img" aria-label="The garden">${defs()}${garden(s, false)}</svg>`;

// Just the five patches, big enough to see what's growing on a phone.
export const patchesSvg = (s: GardenScene): string =>
  `<svg class="room-svg patches-svg" viewBox="24 44 560 140" role="img" aria-label="The five patches up close">${defs()}${garden(s, false)}</svg>`;

export function plantSvg(key: string): string {
  return `<svg class="icon" viewBox="-30 -80 60 86" aria-hidden="true"><g transform="translate(0 0)">${plantArt(key, 3, false)}</g></svg>`;
}
