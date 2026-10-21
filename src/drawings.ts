// What's in a made house friend's room, as Claude drew it in houses made from
// 20 to 21 October 2026 (ADR 0018); newer houses use pictures instead (ADR
// 0020). Each drawing is a short list of shapes in a 100 × 100 box. Only
// numbers, the shape names below and hex colours are kept, so nothing Claude
// wrote reaches the page as markup.

export const BOX = 100;
export const DRAWN = 3;
const MAX_SHAPES = 24;
const MAX_POINTS = 16;

const KINDS = ["circle", "ellipse", "rect", "polygon", "line"] as const;
type Kind = (typeof KINDS)[number];

export type Shape = { kind: Kind; fill: string; stroke: string; nums: number[] };
export type Drawing = { thing: string; shapes: Shape[] };

const HEX = /^#[0-9a-f]{6}$/i;
const colour = (c: unknown): string => (HEX.test(String(c)) ? String(c).toLowerCase() : "none");
const num = (n: unknown): number => {
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(Math.min(BOX, Math.max(0, x)) * 10) / 10 : 0;
};

// How many numbers each kind needs: circle cx cy r; ellipse cx cy rx ry; rect
// x y w h; line x1 y1 x2 y2; polygon x y pairs.
const NEEDS: Record<Kind, number> = { circle: 3, ellipse: 4, rect: 4, line: 4, polygon: 6 };

function tidyShape(s: unknown): Shape | undefined {
  const o = (s ?? {}) as Record<string, unknown>;
  const kind = KINDS.find((k) => k === o.kind);
  if (!kind || !Array.isArray(o.nums)) return undefined;
  let nums = o.nums.slice(0, kind === "polygon" ? MAX_POINTS * 2 : NEEDS[kind]).map(num);
  if (kind === "polygon") nums = nums.slice(0, nums.length - (nums.length % 2));
  if (nums.length < NEEDS[kind]) return undefined;
  const fill = kind === "line" ? "none" : colour(o.fill);
  const stroke = colour(o.stroke);
  if (fill === "none" && stroke === "none") return undefined;
  return { kind, fill, stroke, nums };
}

// Whatever came back, a drawing that's kept has a name from her own list and
// only well-formed shapes; one with nothing left to draw is dropped.
export function tidyDrawings(raw: unknown, things: string[]): Drawing[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.slice(0, DRAWN).flatMap((d, i): Drawing[] => {
    const o = (d ?? {}) as Record<string, unknown>;
    const shapes = (Array.isArray(o.shapes) ? o.shapes : []).slice(0, MAX_SHAPES).map(tidyShape).filter((s): s is Shape => s !== undefined);
    const thing = things[i];
    return thing && shapes.length ? [{ thing, shapes }] : [];
  });
}

const paint = (s: Shape): string => `fill="${s.fill}" stroke="${s.stroke}"`;

function shapeSvg(s: Shape): string {
  const n = s.nums;
  switch (s.kind) {
    case "circle": return `<circle cx="${n[0]}" cy="${n[1]}" r="${n[2]}" ${paint(s)}/>`;
    case "ellipse": return `<ellipse cx="${n[0]}" cy="${n[1]}" rx="${n[2]}" ry="${n[3]}" ${paint(s)}/>`;
    case "rect": return `<rect x="${n[0]}" y="${n[1]}" width="${n[2]}" height="${n[3]}" rx="2" ${paint(s)}/>`;
    case "line": return `<line x1="${n[0]}" y1="${n[1]}" x2="${n[2]}" y2="${n[3]}" ${paint(s)}/>`;
    case "polygon": return `<polygon points="${n.join(" ")}" ${paint(s)}/>`;
  }
}

// The shapes alone, in the drawing's own 100 × 100 box.
export const drawingShapes = (d: Drawing): string => d.shapes.map(shapeSvg).join("");

// A drawing on its own, for the room page's list.
export const drawingSvg = (d: Drawing): string =>
  `<svg class="drawing" viewBox="0 0 ${BOX} ${BOX}" aria-hidden="true">${drawingShapes(d)}</svg>`;
