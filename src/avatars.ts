import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { art } from "./assets.ts";
import type { Gender, Look, Person } from "./people.ts";

// Every picture of a person goes through here. Rithika's five are their own
// Google Stitch stickers (public/art/avatar-<id>.png). A made house's friends
// are drawn: a little chibi sticker in SVG, made on the server from her
// `look` (a girl or a boy, her skin, her hair and its style), served at
// /avatar/<look>.svg on the same 180 x 242 canvas, feet at the bottom, so it
// drops in wherever a Stitch sticker goes.

export const SKINS = ["#f8dcc8", "#efc4a2", "#dca57c", "#bf8459", "#93603e", "#6b432b"];
export const HAIRS = ["#2a1c16", "#4b2e21", "#76452a", "#a8743c", "#d6b06a", "#9c3a2c"];
// How many hairstyles each look has.
export const STYLES: Record<Gender, number> = { girl: 4, boy: 3, name: 3 };

// /avatar/girl-2-0-1.svg: gender, skin, hair, style.
export const lookKey = (l: Look): string => `${l.gender}-${l.skin}-${l.hair}-${l.style}`;

export function parseLook(key: string): Look | undefined {
  const m = key.match(/^(girl|boy|name)-(\d)-(\d)-(\d)$/);
  if (!m) return undefined;
  const gender = m[1] as Gender;
  const [skin, hair, style] = [Number(m[2]), Number(m[3]), Number(m[4])];
  return skin < SKINS.length && hair < HAIRS.length && style < STYLES[gender] ? { gender, skin, hair, style } : undefined;
}

// How far apart two colours are in lightness, as a WCAG contrast ratio (1 is
// the same, 21 is black on white).
function contrast(a: string, b: string): number {
  const lum = (hex: string): number => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, bl] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
// Hair at least this far from the skin reads as hair, not part of the face.
// Black hair on the deepest skin is 1.93.
const HAIR_CONTRAST = 1.9;

// A made friend's look, picked when the house is made: the gender she was
// given, and a skin, hair colour and hairstyle chosen from the house's code
// and her window, so the five in a house mostly look different from each
// other (two can match by chance) and the same house always draws them the
// same way. Hair too close to her skin steps to a darker colour (round to the
// light ones past black) until it stands out.
export function lookFor(gender: Gender, code: string, window: number): Look {
  let h = 2166136261;
  for (const c of `${code}/${window}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const skin = (h + window * 2) % SKINS.length;
  let hair = (h >>> 8) % HAIRS.length;
  for (let i = 0; i < HAIRS.length && contrast(SKINS[skin], HAIRS[hair]) < HAIR_CONTRAST; i++) hair = (hair + HAIRS.length - 1) % HAIRS.length;
  return { gender, skin, hair, style: (h >>> 16) % STYLES[gender] };
}

// The address of someone's picture, for an <img> or an SVG <image>.
// Browsers keep a sticker for a day, so its address carries a fingerprint of
// this file: change how stickers are drawn and every address changes with it,
// the way art() does for the Stitch pictures.
const DRAWN = createHash("sha256").update(readFileSync(new URL(import.meta.url))).digest("hex").slice(0, 10);

export const avatarUrl = (p: Person): string => (p.look ? `/avatar/${lookKey(p.look)}.svg?v=${DRAWN}` : art(`avatar-${p.id}.png`));

/* ---------- drawing a sticker ---------- */

// Soft outfit colours that suit the house, as [main, shade, trim]. Which one a
// friend wears comes from her look, so the five in a house differ.
const OUTFITS: [string, string, string][] = [
  ["#8fb8de", "#6f9cc7", "#ffffff"],
  ["#f2a7b8", "#de8399", "#fff3f6"],
  ["#9fcf9b", "#7cb378", "#f4fff2"],
  ["#f5c86b", "#e0a947", "#fff8e3"],
  ["#c3a6e0", "#a585c9", "#f7f1ff"],
  ["#f29a7a", "#dc7a58", "#fff1ea"],
  ["#88cfc4", "#62b3a7", "#effffc"],
];
const TROUSERS = ["#5a6b8c", "#7a6a5a", "#4f6f6a", "#8a7fa0"];

// A colour a little darker, for shading and outlines.
function darker(hex: string, by = 0.18): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - by)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// The face, the same for everyone: closed happy eyes, blush, an open smile.
const face = (skin: string): string => {
  const line = darker(skin, 0.55);
  return `<path d="M56 92q10-12 20 0M104 92q10-12 20 0" fill="none" stroke="${line}" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="54" cy="108" rx="11" ry="7" fill="#f2808f" opacity=".55"/><ellipse cx="126" cy="108" rx="11" ry="7" fill="#f2808f" opacity=".55"/>
<path d="M74 104q16 22 32 0z" fill="#7a2c2c"/><path d="M80 112q10 8 20 0q-10-4-20 0z" fill="#f07c86"/><path d="M76 104h28" stroke="#fff" stroke-width="3" opacity=".9"/>`;
};

// The head: a big round face with an ear on each side.
const head = (skin: string): string =>
  `<ellipse cx="30" cy="98" rx="9" ry="12" fill="${skin}"/><ellipse cx="150" cy="98" rx="9" ry="12" fill="${skin}"/><ellipse cx="90" cy="88" rx="61" ry="57" fill="${skin}"/>`;

type Part = { back: string; front: string; sides?: string };

// Each hairstyle: what's drawn behind the head, and in front of it (fringe).
function hairFor(l: Look, c: string): Part {
  const s = darker(c, 0.25);
  const hood = outfit(l)[0];
  const fringe = (d: string): string => `<path d="${d}" fill="${c}"/>`;
  if (l.gender === "girl") {
    switch (l.style) {
      case 0: // long and loose, past the shoulders
        return {
          back: `<path d="M22 96Q18 24 90 20Q162 24 158 96L164 174Q144 186 124 170L124 126H56L56 170Q36 186 16 174Z" fill="${c}"/><path d="M36 126q-6 30 0 48M144 126q6 30 0 48" stroke="${s}" stroke-width="3" fill="none"/>`,
          sides: `<path d="M30 96Q26 130 40 150L50 150Q38 126 40 96ZM150 96Q154 130 140 150L130 150Q142 126 140 96Z" fill="${c}"/>`,
          front: fringe("M28 104Q26 30 90 28Q154 30 152 104Q146 64 124 56Q106 78 72 72Q44 76 32 104Z"),
        };
      case 1: // a high ponytail, tied with a bow
        return {
          back: `<path d="M24 98Q20 26 90 22Q160 26 156 98Z" fill="${c}"/><path d="M128 30Q170 36 162 96Q156 130 138 140Q150 96 130 64Z" fill="${c}"/><path d="M146 70q8 26 0 52" stroke="${s}" stroke-width="3" fill="none"/><circle cx="128" cy="32" r="9" fill="#e8607a"/>`,
          front: fringe("M28 102Q26 30 90 28Q154 30 152 102Q144 62 120 54Q100 74 66 68Q42 72 30 102Z"),
        };
      case 2: // a short bob with a straight fringe
        return {
          back: `<path d="M20 96Q18 22 90 20Q162 22 160 96L160 136Q142 146 130 132L130 110H50L50 132Q38 146 20 136Z" fill="${c}"/>`,
          front: fringe("M28 108Q26 30 90 28Q154 30 152 108L148 78Q120 72 90 72Q60 72 32 78Z"),
        };
      default: // a bun on top, with two short braids
        return {
          back: `<circle cx="90" cy="26" r="20" fill="${c}"/><path d="M28 96Q24 30 90 28Q156 30 152 96Z" fill="${c}"/><path d="M34 112q-4 22 0 40M146 112q4 22 0 40" stroke="${c}" stroke-width="12" stroke-linecap="round" fill="none"/><circle cx="34" cy="156" r="5" fill="#e8607a"/><circle cx="146" cy="156" r="5" fill="#e8607a"/>`,
          front: fringe("M28 102Q26 34 90 32Q154 34 152 102Q140 64 112 58Q92 74 62 68Q42 72 30 102Z"),
        };
    }
  }
  if (l.gender === "boy") {
    switch (l.style) {
      case 0: // a short crop
        return {
          back: `<path d="M26 100Q22 26 90 24Q158 26 154 100Z" fill="${c}"/>`,
          front: fringe("M28 98Q28 30 90 28Q152 30 152 98L146 86Q138 62 112 60Q96 66 76 62Q50 62 34 86Z"),
        };
      case 1: // messy curls
        return {
          back: `<path d="M24 100Q20 26 90 22Q160 26 156 100Z" fill="${c}"/>`,
          front: [[34, 70], [44, 48], [62, 32], [86, 24], [110, 28], [130, 40], [146, 62], [150, 84], [30, 92], [74, 52], [100, 50], [122, 60], [52, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="${c}"/>`).join("") + `<path d="M58 36a10 10 0 0 1 14 4M96 28a10 10 0 0 1 14 6M128 46a10 10 0 0 1 10 10" stroke="${s}" stroke-width="2.5" fill="none"/>`,
        };
      default: // a side part, swept across
        return {
          back: `<path d="M26 100Q22 24 90 22Q158 24 154 100Z" fill="${c}"/>`,
          front: fringe("M28 98Q28 28 90 26Q152 28 152 98L146 84Q140 56 116 50Q92 48 68 64Q48 74 32 90Z") + `<path d="M70 42q22-8 44 2" stroke="${s}" stroke-width="3" fill="none"/>`,
        };
    }
  }
  switch (l.style) {
    case 0: // a beanie over short hair
      return {
        back: `<path d="M32 96Q30 50 90 48Q150 50 148 96Z" fill="${c}"/>`,
        front: `<path d="M28 76Q28 18 90 16Q152 18 152 76Z" fill="#d97b5d"/><rect x="24" y="66" width="132" height="18" rx="9" fill="#b8604a"/><path d="M40 70v12M56 70v12M72 70v12M88 70v12M104 70v12M120 70v12M136 70v12" stroke="#a5523f" stroke-width="2"/><circle cx="90" cy="14" r="11" fill="#f3e3cf"/>`,
      };
    case 1: // a hood up, a little hair peeking out
      return {
        back: `<path d="M14 106Q12 8 90 6Q168 8 166 106L162 142Q90 160 18 142Z" fill="${hood}"/>`,
        front: fringe("M36 84Q38 40 90 38Q142 40 144 84Q124 64 104 62Q88 72 66 66Q48 70 36 84Z") + `<path d="M22 102Q24 24 90 22Q156 24 158 102" fill="none" stroke="${darker(hood, 0.2)}" stroke-width="6"/>`,
      };
    default: // a round cap, worn backwards
      return {
        back: `<path d="M32 92Q30 34 90 32Q150 34 148 92Z" fill="${c}"/>`,
        front: `<path d="M34 70Q36 22 90 20Q144 22 146 70Z" fill="#5d9c8c"/><path d="M128 64q30 2 32 14q-16 4-34-6z" fill="#4a7f72"/><circle cx="90" cy="22" r="5" fill="#4a7f72"/>` + fringe("M36 82Q40 68 58 72Q70 66 86 76Q60 76 36 82Z"),
      };
  }
}

// The body: legs and shoes, an outfit, and arms.
const outfit = (l: Look): [string, string, string] => OUTFITS[(l.skin * 3 + l.hair * 2 + l.style) % OUTFITS.length];

function bodyFor(l: Look, skin: string): string {
  const [main, shade, trim] = outfit(l);
  const trousers = TROUSERS[(l.hair + l.style) % TROUSERS.length];
  const shoes = `<ellipse cx="74" cy="230" rx="13" ry="7" fill="#5a3d33"/><ellipse cx="106" cy="230" rx="13" ry="7" fill="#5a3d33"/>`;
  const arms = `<path d="M54 156q-14 18-12 36" stroke="${main}" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M126 156q14 18 12 36" stroke="${main}" stroke-width="16" stroke-linecap="round" fill="none"/><circle cx="42" cy="194" r="8" fill="${skin}"/><circle cx="138" cy="194" r="8" fill="${skin}"/>`;
  const legsBare = `<rect x="66" y="196" width="14" height="32" rx="6" fill="${skin}"/><rect x="100" y="196" width="14" height="32" rx="6" fill="${skin}"/>`;
  const legsIn = (c: string): string => `<rect x="64" y="186" width="18" height="42" rx="7" fill="${c}"/><rect x="98" y="186" width="18" height="42" rx="7" fill="${c}"/>`;
  if (l.gender === "girl") {
    // A dress for even styles, a kurta over trousers for odd ones.
    if (l.style % 2 === 0) {
      return `${legsBare}${shoes}<path d="M60 142Q90 132 120 142L136 206Q90 220 44 206Z" fill="${main}"/><path d="M50 196Q90 210 130 196" stroke="${trim}" stroke-width="4" fill="none"/><path d="M76 142q14 10 28 0" stroke="${shade}" stroke-width="3" fill="none"/>${arms}`;
    }
    return `${legsIn("#f3efe7")}${shoes}<path d="M58 142Q90 132 122 142L130 202Q90 210 50 202Z" fill="${main}"/><path d="M90 140v34" stroke="${shade}" stroke-width="3"/>${[150, 162, 174, 186].map((y) => `<circle cx="${y % 24 ? 72 : 108}" cy="${y}" r="2.2" fill="${trim}"/>`).join("")}${arms}`;
  }
  if (l.gender === "boy") {
    // A t-shirt and trousers; a kurta for the side part.
    if (l.style === 2) {
      return `${legsIn("#f3efe7")}${shoes}<path d="M58 142Q90 132 122 142L128 206Q90 212 52 206Z" fill="${main}"/><path d="M90 140v30" stroke="${shade}" stroke-width="3"/>${arms}`;
    }
    return `${legsIn(trousers)}${shoes}<path d="M56 142Q90 132 124 142L124 194Q90 200 56 194Z" fill="${main}"/><path d="M76 140q14 10 28 0" stroke="${shade}" stroke-width="4" fill="none"/>${arms}`;
  }
  // A cosy hoodie and trousers, with a pocket.
  return `${legsIn(trousers)}${shoes}<path d="M54 142Q90 132 126 142L128 198Q90 206 52 198Z" fill="${main}"/><path d="M70 176h40v14H70z" fill="${shade}" rx="4"/><path d="M84 142v14M96 142v14" stroke="${trim}" stroke-width="2.5"/>${arms}`;
}

// The sticker itself, as a whole SVG document: everything drawn twice, first
// as a thick white edge underneath, then in colour on top, like a die-cut
// sticker. Hair gets a darker line round it, so it stays apart from the face;
// a bolder one when it's close to the skin (houses made before lookFor kept
// them apart can still have that).
export function avatarSvg(l: Look): string {
  const skin = SKINS[l.skin];
  const hair = hairFor(l, HAIRS[l.hair]);
  const c = HAIRS[l.hair];
  const width = contrast(skin, c) < HAIR_CONTRAST ? 5 : 3;
  const lined = (s: string): string => s.replaceAll(`fill="${c}"`, `fill="${c}" stroke="${darker(c, 0.45)}" stroke-width="${width}" stroke-linejoin="round"`);
  const figure = `${lined(hair.back)}${bodyFor(l, skin)}${head(skin)}${face(skin)}${lined((hair.sides ?? "") + hair.front)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 242" width="180" height="242"><g stroke="#fff" stroke-width="12" stroke-linejoin="round" fill="#fff" opacity=".97">${hair.back}${bodyFor(l, skin)}${head(skin)}${hair.front}</g><g filter="drop-shadow(0 1px 1px rgba(60,40,30,.25))">${figure}</g></svg>`;
}
