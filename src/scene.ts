import { icon, messItem } from "./art.ts";
import { esc } from "./html.ts";
import type { Person } from "./people.ts";
import type { Phase } from "./time.ts";

// The house is the Google Stitch illustration (public/art/house.jpg, made by
// scripts/cut-art.py), with an SVG layer drawn on top in the image's own
// pixels: each room's outline as a link, its light for the time of day, what
// people left, Laddoo, and the five of us. A room's page is the same drawing
// with a viewBox around that room (ADR 0007).

export const W = 1376;
export const H = 768;

type Pt = [number, number];

type Room = {
  name: string;
  outline: Pt[];
  // Top-left corner of the room's name tag.
  tag: Pt;
  // Where people stand, feet first: the first is where you arrive, and
  // friends in the same room take the next ones.
  walk: Pt[];
  // The room page's viewBox: x, y, width, height.
  view: [number, number, number, number];
  // Bedrooms only: the pillow, the desk, clear floor for clutter, and where
  // Laddoo naps.
  bed?: Pt;
  desk?: Pt[];
  mess?: Pt[];
  dog?: Pt;
};

export const ROOMS: Record<string, Room> = {
  "room:3": {
    name: "Amirdhavarshini's room",
    outline: [[22, 42], [318, 42], [330, 122], [445, 245], [445, 432], [22, 432]],
    tag: [40, 48],
    walk: [[200, 330], [330, 300], [270, 410]],
    view: [10, 30, 450, 415],
    bed: [138, 198],
    desk: [[225, 185], [280, 190]],
    mess: [[95, 345], [395, 330]],
    dog: [350, 395],
  },
  kitchen: {
    name: "Kitchen",
    outline: [[445, 45], [615, 2], [785, 50], [790, 140], [700, 200], [650, 280], [560, 290], [470, 260], [445, 240]],
    tag: [468, 44],
    walk: [[495, 240], [600, 292]],
    view: [425, 0, 400, 320],
  },
  living: {
    name: "Living room",
    outline: [[785, 50], [890, 72], [1060, 132], [1145, 290], [700, 445], [595, 350], [560, 290], [650, 280], [700, 200], [790, 140]],
    tag: [835, 66],
    walk: [[640, 330], [985, 335], [745, 415]],
    view: [560, 40, 600, 420],
  },
  garden: {
    name: "Garden",
    outline: [[895, 0], [1376, 0], [1376, 560], [1312, 500], [1150, 288], [1062, 132], [890, 70]],
    tag: [1200, 178],
    walk: [[1215, 300], [1320, 330], [1150, 235]],
    view: [880, 0, 496, 420],
  },
  "room:1": {
    name: "Rithika's room",
    outline: [[22, 440], [356, 440], [356, 738], [22, 738]],
    tag: [36, 448],
    walk: [[135, 600], [215, 580], [250, 715]],
    view: [10, 425, 360, 335],
    bed: [75, 655],
    desk: [[310, 610], [330, 660]],
    mess: [[175, 615], [290, 722]],
    dog: [175, 585],
  },
  "room:4": {
    name: "Rithanya's room",
    outline: [[360, 440], [652, 440], [700, 515], [726, 738], [360, 738]],
    tag: [462, 392],
    walk: [[540, 565], [612, 605], [625, 705]],
    view: [345, 385, 395, 375],
    bed: [425, 515],
    desk: [[510, 680], [545, 690]],
    mess: [[600, 652], [400, 715]],
    dog: [580, 600],
  },
  "room:5": {
    name: "Aswathy's room",
    outline: [[704, 452], [968, 405], [1060, 738], [730, 738]],
    tag: [800, 440],
    walk: [[985, 668], [902, 640], [868, 548]],
    view: [690, 390, 385, 370],
    bed: [770, 522],
    desk: [[930, 560], [975, 575]],
    mess: [[845, 705], [1010, 560]],
    dog: [905, 700],
  },
  "room:2": {
    name: "Neha's room",
    outline: [[970, 402], [1000, 350], [1145, 295], [1305, 480], [1312, 738], [1064, 738]],
    tag: [1150, 318],
    walk: [[1035, 500], [1085, 590], [1090, 705]],
    view: [945, 280, 390, 480],
    bed: [1180, 466],
    desk: [[1145, 655], [1250, 670]],
    mess: [[1035, 560], [1130, 595]],
    dog: [1050, 640],
  },
};

// Where things left in the kitchen sit, on the island.
const COUNTER: Pt[] = [[560, 203], [602, 214], [646, 204]];
// The low round table on Amirdhavarshini's mat, where the kettle goes.
const MAT_TABLE: Pt = [292, 300];
// Laddoo's blanket in the garden, where the illustration had him.
const KENNEL: Pt = [1249, 122];
const FIREPLACE: Pt = [835, 205];

export type Spot = { key: string; color?: string; fresh: boolean };

export type Bedroom = {
  owner: Person;
  phase: Phase;
  clock: string;
  status: string;
  mess: 0 | 1 | 2;
  desk: Spot[];
  // A lamp's on at night when the owner's awake.
  lamp: boolean;
};

export type Figure = { person: Person; place: string; asleep: boolean; here: boolean; me: boolean; masked: boolean };

export type Scene = {
  // The visitor's own time of day: shared rooms, the hallway and outside.
  light: Phase;
  me: Person;
  bedrooms: Bedroom[];
  figures: Figure[];
  dishes: Spot[];
  // Kettle Maggi on Amirdhavarshini's mat.
  kettle: boolean;
  dog: { place: string; awake: boolean };
  // Places with something new for the visitor since their last visit.
  fresh: Set<string>;
  // A room page's place; the whole house when absent.
  focus?: string;
};

export const isPlace = (place: string): boolean => Object.hasOwn(ROOMS, place);

const pts = (list: Pt[]): string => list.map(([x, y]) => `${x},${y}`).join(" ");

const SHADE: Record<Phase, [string, number] | null> = {
  night: ["#141a3c", 0.5],
  dusk: ["#a4502c", 0.22],
  dawn: ["#f0a088", 0.16],
  day: null,
};

const dark = (phase: Phase): boolean => phase === "night" || phase === "dusk";

function light(s: Scene): string {
  const outside = SHADE[s.light];
  const bedrooms = s.bedrooms.map((b) => {
    const room = ROOMS[`room:${b.owner.id}`];
    const shade = SHADE[b.phase];
    const fill = shade ? `<polygon points="${pts(room.outline)}" fill="${shade[0]}" opacity="${shade[1]}"/>` : "";
    const lamp = b.lamp && dark(b.phase) && room.desk ? `<circle cx="${room.desk[0][0]}" cy="${room.desk[0][1]}" r="120" fill="url(#glow)"/>` : "";
    return fill + lamp;
  }).join("");
  const rest = outside ? `<rect width="${W}" height="${H}" fill="${outside[0]}" opacity="${outside[1]}" mask="url(#not-bedrooms)"/>` : "";
  const fire = dark(s.light) ? `<circle cx="${FIREPLACE[0]}" cy="${FIREPLACE[1]}" r="140" fill="url(#glow)"/>` : "";
  return `<g class="light" aria-hidden="true">${rest}${bedrooms}${fire}</g>`;
}

function left(spot: Spot, [x, y]: Pt, scale: number): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="${spot.fresh ? "left fresh" : "left"}">${icon(spot.key, spot.color)}</g></g>`;
}

function things(s: Scene): string {
  const rooms = s.bedrooms.map((b) => {
    const room = ROOMS[`room:${b.owner.id}`];
    const clutter = (room.mess ?? []).slice(0, b.mess).map(([x, y], i) => messItem(Number(b.owner.id) + i, x, y, 1.4)).join("");
    const desk = b.desk.slice(0, room.desk?.length ?? 0).map((spot, i) => left(spot, room.desk![i], 1.3)).join("");
    return clutter + desk;
  }).join("");
  const dishes = s.dishes.slice(0, COUNTER.length).map((spot, i) => left(spot, COUNTER[i], 1.2)).join("");
  return `<g class="things" aria-hidden="true">${rooms}${dishes}</g>`;
}

const kitkat = (x: number, y: number, r: number): string =>
  `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-11" y="-4.5" width="22" height="9" rx="1.5" fill="#d62828" stroke="#7f1212"/><ellipse rx="5" ry="2.3" fill="#fff" opacity=".9"/></g>`;

const towel = (x: number, y: number, color: string): string =>
  `<circle cx="${x}" cy="${y}" r="10" fill="${color}" stroke="#a8998a"/><path d="M${x - 5} ${y}a5 5 0 1 1 5 5a3 3 0 1 1 -3 -3" fill="none" stroke="#a8998a"/>`;

const tub = (x: number, y: number, body: string, lid: string): string =>
  `<rect x="${x - 5}" y="${y - 3}" width="10" height="8" rx="2" fill="${body}" stroke="#7a5a48" stroke-width=".8"/><rect x="${x - 5.5}" y="${y - 5}" width="11" height="3" rx="1.2" fill="${lid}"/>`;

// The illustration gave Rithanya cats. She has KitKats instead, and a mirror
// and face mask powder for everyone, so those are drawn over the cats.
const RITHANYA = `<g class="fixes" aria-hidden="true">
<path d="M503 498V466A24 17 0 0 1 551 466V498Z" fill="#9a6233"/>
<path d="M507 495V467A20 14 0 0 1 547 467V495Z" fill="url(#glass)"/>
<path d="M515 489L535 461M524 491L540 469" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>
<rect x="509" y="496" width="36" height="5" rx="2" fill="#7c4a26"/>
${tub(514, 504, "#b9d79d", "#5f8f4e")}${tub(527, 506, "#f6c7cf", "#d9768a")}${tub(540, 504, "#fbf3e4", "#c9a27a")}
${kitkat(418, 704, -25)}${kitkat(436, 699, 12)}${kitkat(447, 709, -8)}${kitkat(424, 714, 18)}${kitkat(440, 717, -30)}${kitkat(430, 707, 5)}
${towel(628, 701, "#cfe9df")}${towel(648, 698, "#f8d2bf")}${towel(638, 713, "#fbf6ee")}${towel(656, 712, "#cfe9df")}
<g transform="translate(579 668) rotate(-5)"><rect x="-22" y="-15" width="44" height="30" rx="3" fill="#d62828" stroke="#7f1212" stroke-width="1.5"/><ellipse rx="16" ry="7.5" fill="#fff"/><text class="kitkat-word" y="3.2">KitKat</text></g>
</g>`;

function kettleMaggi(s: Scene): string {
  if (!s.kettle) return "";
  const [x, y] = MAT_TABLE;
  return `<g class="kettle" data-place="room:3" aria-hidden="true">
<g transform="translate(254 318) scale(1.1)">${icon("maggi")}</g><g transform="translate(305 330) scale(1.1)">${icon("maggi")}</g>
<g transform="translate(${x} ${y})"><ellipse cy="12" rx="13" ry="4" fill="#3a2a22"/><path d="M-11 10Q-12 -10 -6 -14H6Q12 -10 11 10Z" fill="#f4f1ea" stroke="#6b5a4e" stroke-width="1.5"/><path d="M10 -7q9 2 6 13" fill="none" stroke="#2f2f2f" stroke-width="3" stroke-linecap="round"/><path d="M-10 -3l-7 -5" stroke="#6b5a4e" stroke-width="3" stroke-linecap="round"/><rect x="-6" y="-17" width="12" height="4" rx="2" fill="#2f2f2f"/><g class="steam"><path d="M-3 -21q-4 -6 0 -11t0 -11"/><path d="M4 -21q-4 -6 0 -10t0 -9"/></g></g>
</g>`;
}

function laddoo(s: Scene): string {
  const room = ROOMS[s.dog.place];
  const [x, y] = room?.dog ?? KENNEL;
  const scale = room?.dog ? 0.62 : 1;
  const zz = s.dog.awake ? "" : `<text class="zz" x="52" y="-30">z</text><text class="zz small" x="66" y="-46">z</text>`;
  return `<g class="laddoo${s.dog.awake ? " awake" : ""}" data-place="${esc(s.dog.place)}" transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true"><image href="/art/laddoo.png" x="-80" y="-46" width="160" height="92"/>${zz}</g>`;
}

// data-go is what the Go in button says when you walk yourself into the room
// (public/house.js).
function links(s: Scene): string {
  return Object.entries(ROOMS).map(([place, room]) => {
    const owner = s.bedrooms.find((b) => `room:${b.owner.id}` === place)?.owner;
    const href = owner ? `/room/${owner.id}` : `/${place}`;
    const label = owner?.id === s.me.id ? "Your room" : room.name;
    const go = place === "garden" ? "Go out to the garden" : `Go into ${owner ? (owner.id === s.me.id ? "your room" : room.name) : `the ${room.name.toLowerCase()}`}`;
    const current = place === s.focus ? ` aria-current="page"` : "";
    return `<a class="room-link" href="${href}" data-place="${place}" data-walk="${room.walk[0].join(",")}" data-go="${esc(go)}" aria-label="${esc(label)}"${current}><polygon points="${pts(room.outline)}"/></a>`;
  }).join("");
}

// A green face mask with cucumber slices, over a standing sticker's face.
const MASK = `<g class="mask"><ellipse cx="1" cy="-57" rx="16" ry="16" fill="#9fcf8f" fill-opacity=".85"/><circle cx="-7" cy="-61" r="4.6" fill="#e2f4cf" stroke="#6fae5c" stroke-width="1.4"/><circle cx="9" cy="-61" r="4.6" fill="#e2f4cf" stroke="#6fae5c" stroke-width="1.4"/></g>`;

// The stickers are 180 × 242; a standing friend is drawn 72 wide, feet on
// the spot. Nobody moves on their own: friends stand where they are, and only
// you walk, when you walk yourself (public/house.js). Whoever's further down
// the picture is drawn in front.
function figures(s: Scene): string {
  const drawn: { y: number; svg: string }[] = [];
  const count = new Map<string, number>();
  // Whoever's room it is gets its first spot.
  const own = (f: Figure): number => (f.place === `room:${f.person.id}` ? 0 : 1);
  for (const f of [...s.figures].sort((a, b) => own(a) - own(b))) {
    const p = f.person;
    const room = ROOMS[f.place];
    if (f.asleep && room.bed) {
      const [x, y] = room.bed;
      drawn.push({ y, svg: `<g class="sleeper" data-person="${p.id}" data-place="${f.place}" transform="translate(${x} ${y}) rotate(-10)"><image href="/art/avatar-${p.id}.png" x="-32" y="-27.5" width="64" height="86" clip-path="url(#head)"/><text class="zz" x="22" y="-24">z</text><text class="zz small" x="34" y="-40">z</text></g>` });
      continue;
    }
    // Friends in the same room stand on different spots.
    const i = count.get(f.place) ?? 0;
    count.set(f.place, i + 1);
    const [x, y] = room.walk[i % room.walk.length];
    const cls = ["walker", f.me ? "me" : "", f.here ? "here" : ""].filter(Boolean).join(" ");
    const who = f.me ? "you" : p.name;
    const mask = f.masked ? MASK : "";
    drawn.push({ y, svg: `<g class="${cls}" data-person="${p.id}" data-place="${f.place}" transform="translate(${x} ${y})" style="--accent:${p.color}"><ellipse class="shadow" rx="22" ry="7"/><g class="bob"><image href="/art/avatar-${p.id}.png" x="-36" y="-95" width="72" height="97"/>${mask}</g><text class="who" y="24">${esc(who)}</text></g>` });
  }
  drawn.sort((a, b) => a.y - b.y);
  return `<g class="people" aria-hidden="true">${drawn.map((d) => d.svg).join("")}</g>`;
}

const SPARKLE = "M0 -10L2.6 -2.6L10 0L2.6 2.6L0 10L-2.6 2.6L-10 0L-2.6 -2.6Z";

function tags(s: Scene): string {
  return Object.entries(ROOMS).map(([place, room]) => {
    const b = s.bedrooms.find((r) => `room:${r.owner.id}` === place);
    const title = b ? (b.owner.id === s.me.id ? "Your room" : room.name) : room.name;
    const subText = b ? `${b.clock}${b.status ? ` · ${b.status}` : ""}` : "";
    const sub = b ? `<text class="tag-sub" x="16" y="45"><tspan class="clock" data-tz="${esc(b.owner.tz)}">${esc(b.clock)}</tspan>${b.status ? ` · ${esc(b.status)}` : ""}</text>` : "";
    const w = Math.round(Math.max(title.length * 10.8, subText.length * 7.6) + 30);
    const h = b ? 56 : 38;
    const accent = b?.owner.color ?? "#8a5a3c";
    const fresh = s.fresh.has(place) ? `<g transform="translate(${w - 4} 4)"><path class="sparkle" d="${SPARKLE}"/></g>` : "";
    const [x, y] = room.tag;
    return `<g class="nametag" transform="translate(${x} ${y})" style="--accent:${accent}"><rect class="tag-bg" width="${w}" height="${h}" rx="10"/><rect class="tag-edge" x="5" y="9" width="4" height="${h - 18}" rx="2"/><text class="tag-title" x="16" y="26">${esc(title)}</text>${sub}${fresh}</g>`;
  }).join("");
}

export function houseSvg(s: Scene): string {
  const [x, y, w, h] = s.focus ? ROOMS[s.focus].view : [0, 0, W, H];
  const bedrooms = s.bedrooms.map((b) => `<polygon points="${pts(ROOMS[`room:${b.owner.id}`].outline)}" fill="#000"/>`).join("");
  return `<svg class="house-svg" viewBox="${x} ${y} ${w} ${h}" role="group" aria-label="${s.focus ? "The room, and the house around it" : "The house. Tap a room to go in."}">
<defs>
<clipPath id="head" clipPathUnits="objectBoundingBox"><ellipse cx=".5" cy=".32" rx=".36" ry=".27"/></clipPath>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6f4f8"/><stop offset="1" stop-color="#b9d6e2"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".6"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
<mask id="not-bedrooms" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${bedrooms}</mask>
</defs>
<image href="/art/house.jpg" width="${W}" height="${H}" aria-hidden="true"/>
${RITHANYA}
${kettleMaggi(s)}
${light(s)}
${things(s)}
${laddoo(s)}
<g class="links">${links(s)}</g>
${figures(s)}
<g class="nametags" aria-hidden="true">${tags(s)}</g>
</svg>`;
}
