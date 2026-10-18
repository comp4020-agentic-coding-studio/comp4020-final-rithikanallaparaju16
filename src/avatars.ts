import { art } from "./assets.ts";
import type { Gender, Look, Person } from "./people.ts";

// Every picture of a person goes through here. Rithika's five are their own
// Google Stitch stickers (public/art/avatar-<id>.png). A made house's friends
// are drawn: a little chibi sticker in SVG, made on the server from her
// `look` (a girl or a boy, her skin, her hair and its style), served at
// /avatar/<look>.svg on the same 180 x 242 canvas, feet at the bottom, so it
// drops in wherever a Stitch sticker goes.

export const SKINS = ["#f6d7c3", "#eac0a0", "#d9a37c", "#b97d58", "#8d5a3b", "#6a412a"];
export const HAIRS = ["#2b1d16", "#4a2f22", "#7a4a2a", "#b07a3e", "#d8b36a", "#a33b2a"];
// How many hairstyles each look has; src/avatars.ts draws them.
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

// A made friend's look, picked when the house is made: the gender she was
// given, and a skin, hair colour and hairstyle chosen from the house's code
// and her window, so the five in a house look different from each other and
// the same house always draws them the same way.
export function lookFor(gender: Gender, code: string, window: number): Look {
  let h = 2166136261;
  for (const c of `${code}/${window}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return {
    gender,
    skin: (h + window * 2) % SKINS.length,
    hair: (h >>> 8) % HAIRS.length,
    style: (h >>> 16) % STYLES[gender],
  };
}

// The address of someone's picture, for an <img> or an SVG <image>.
export const avatarUrl = (p: Person): string => (p.look ? `/avatar/${lookKey(p.look)}.svg` : art(`avatar-${p.id}.png`));

// Drawn by the art agent: the sticker itself, as a whole SVG document.
export function avatarSvg(l: Look): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 242" width="180" height="242"><ellipse cx="90" cy="70" rx="44" ry="44" fill="${SKINS[l.skin]}"/><rect x="58" y="112" width="64" height="120" rx="20" fill="${HAIRS[l.hair]}"/></svg>`;
}
