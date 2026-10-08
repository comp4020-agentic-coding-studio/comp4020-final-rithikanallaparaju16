import { balloons, BLANKET, bunting, cake, confetti, CROWN, DOG_STANDING, EMOJI, icon, messItem, PARTY_HAT, pop } from "./art.ts";
import { art } from "./assets.ts";
import { along, DOG, KETTLE_ROOM, MASK_ROOM, rejoin, YOGA_ROOM, type DogSpot, type Pose, type Waypoint } from "./house.ts";
import { esc } from "./html.ts";
import type { Person } from "./people.ts";
import type { Phase } from "./time.ts";

// The house is the Google Stitch illustration (public/art/house.jpg, made by
// scripts/cut-art.py), with an SVG layer drawn on top in the image's own
// pixels: each room's outline as a link, its light for the time of day, what
// people left, the things you can do something with, Shinzo the dog, and the
// five of us. A room's page is the same drawing with a viewBox around that
// room (ADR 0007). The dog was called Laddoo until session 7, which is why
// his code and picture are still `laddoo`.

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
  // Shinzo naps.
  bed?: Pt;
  desk?: Pt[];
  mess?: Pt[];
  dog?: Pt;
  // Bedrooms only: the outlines of the bed and the study table, which light up
  // when you walk up to them.
  bedArea?: Pt[];
  deskArea?: Pt[];
  // Bedrooms only: in her birthday month, bunting from `from` to `to`
  // (sagging by `sag`) and balloons tied down at `balloons`.
  party?: { from: Pt; to: Pt; sag: number; balloons: Pt };
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
    bedArea: [[80, 168], [196, 168], [198, 296], [80, 296]],
    deskArea: [[205, 170], [302, 170], [302, 240], [205, 240]],
    party: { from: [30, 125], to: [312, 120], sag: 10, balloons: [74, 300] },
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
    bedArea: [[42, 636], [230, 636], [230, 728], [42, 728]],
    deskArea: [[280, 572], [352, 572], [352, 700], [280, 700]],
    party: { from: [26, 512], to: [352, 512], sag: 9, balloons: [298, 566] },
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
    bedArea: [[366, 490], [482, 490], [482, 650], [366, 650]],
    deskArea: [[460, 645], [602, 645], [602, 705], [460, 705]],
    party: { from: [364, 470], to: [648, 470], sag: 9, balloons: [600, 562] },
  },
  "room:5": {
    name: "Aswathy's room",
    outline: [[704, 452], [968, 405], [1060, 738], [730, 738]],
    tag: [800, 440],
    walk: [[985, 668], [902, 640], [868, 548]],
    view: [690, 390, 385, 370],
    bed: [770, 522],
    // Her one study table now, at the foot of the bed (scripts/cut-art.py).
    desk: [[766, 683], [798, 684]],
    mess: [[845, 705], [965, 578]],
    dog: [905, 700],
    bedArea: [[718, 488], [820, 488], [852, 645], [718, 645]],
    deskArea: [[738, 642], [856, 642], [858, 692], [740, 692]],
    party: { from: [712, 515], to: [962, 500], sag: 8, balloons: [940, 585] },
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
    bedArea: [[1128, 442], [1220, 442], [1272, 575], [1270, 612], [1172, 612], [1128, 525]],
    deskArea: [[1120, 630], [1262, 630], [1288, 700], [1120, 712]],
    party: { from: [992, 410], to: [1222, 400], sag: 10, balloons: [1015, 530] },
  },
};

// Where things left in the kitchen sit, on the island.
const COUNTER: Pt[] = [[560, 203], [602, 214], [646, 204]];
// The low round table on Amirdhavarshini's mat, where the kettle goes.
const MAT_TABLE: Pt = [292, 300];
// Shinzo's blanket in the garden, where the illustration had him.
export const KENNEL: Pt = [1249, 122];
const FIREPLACE: Pt = [835, 205];

// Where Shinzo stops for a sniff or a sit when he's off on his own, besides
// the rooms' own spots for him: by his bowls, on the stepping stones, the
// kitchen floor, the rug and beside the sofas, and a clear bit of floor in
// each bedroom.
const DOG_STOPS: Pt[] = [
  [1300, 182], [1060, 45], [1290, 385], [1330, 255],
  [512, 236], [590, 270],
  [905, 292], [985, 332], [745, 412],
  [110, 335], [240, 700], [400, 668], [900, 600], [1060, 520],
];

// Everywhere he goes on his own (src/house.ts wander): his blanket and the
// foot of each bed to nap on, mostly the blanket, and the stops above.
export const DOG_SPOTS: DogSpot[] = [
  { at: KENNEL, nap: 5 },
  ...Object.values(ROOMS).flatMap((r): DogSpot[] => (r.dog ? [{ at: r.dog, nap: 1 }] : [])),
  ...DOG_STOPS.map((at): DogSpot => ({ at })),
];

// An oval as a polygon, for the round things that light up.
const oval = (cx: number, cy: number, rx: number, ry: number): Pt[] =>
  Array.from({ length: 16 }, (_, i): Pt => [Math.round(cx + rx * Math.cos((i * Math.PI) / 8)), Math.round(cy + ry * Math.sin((i * Math.PI) / 8))]);

// The things in the picture you can do something with, besides beds and desks.
// Amirdhavarshini's round mat has a cushion for each of us, by colour.
const MAT = oval(270, 340, 125, 76);
const CUSHIONS: Record<string, Pt> = { "1": [326, 299], "2": [205, 346], "3": [270, 376], "4": [340, 352], "5": [227, 297] };
// The living room's sofas and armchair, and where you sit on them.
const SOFAS: Pt[] = [[668, 215], [790, 205], [905, 235], [965, 240], [960, 395], [805, 405], [660, 400]];
const SOFA_SEATS: Pt[] = [[730, 342], [892, 343], [735, 252], [932, 268], [700, 258]];
const YOGA: Pt[] = [[945, 608], [1003, 608], [1036, 720], [980, 724]];
const YOGA_SEATS: Pt[] = [[990, 672], [975, 632]];
// Rithanya's mirror and face mask powder, in RITHANYA below.
const MIRROR: Pt[] = [[500, 458], [554, 458], [554, 512], [500, 512]];
// The memory wall, the board above the living room's armchair.
const WALL_BOARD: Pt[] = [[910, 120], [1032, 156], [1032, 264], [910, 224]];
const STOVE: Pt[] = [[538, 190], [610, 160], [745, 148], [748, 200], [650, 272], [538, 272]];
// The sunflower bed by the living room wall, where the patches are.
const PATCHES: Pt[] = [[1075, 138], [1150, 138], [1188, 200], [1180, 228], [1100, 228], [1075, 180]];

export type Spot = { key: string; color?: string; fresh: boolean };

// A dish on the counter, and what eating it is called ("Eat Neha's dosa").
export type Dish = Spot & { id: number; label: string };

// Something you can do at a thing in the picture: post a form (with its
// fields), or go to a page. public/house.js offers it when you walk up, with
// its emoji on the button, and pops the emoji over the thing as you do it.
export type Doing = { label: string; emoji: string; post?: string; fields?: Record<string, string>; href?: string };

// Asleep in a bed ("nap", in `place`'s bed), or sitting on a seat (house.ts
// SEATS).
export type Rest = { kind: "nap" | "sit"; place: string; seat: string };

export type Bedroom = {
  owner: Person;
  phase: Phase;
  clock: string;
  status: string;
  mess: 0 | 1 | 2;
  desk: Spot[];
  // A lamp's on at night when the owner's awake.
  lamp: boolean;
  // Her birthday month (1), or the day itself (2), by her own clock.
  birthday: 0 | 1 | 2;
};

// `spot` is where she walked to in `place`, if she has since going in.
// `crown` is for the birthday girl, all month; `hat` for anyone who's just
// wished someone a happy birthday.
export type Figure = { person: Person; place: string; asleep: boolean; here: boolean; me: boolean; masked: boolean; rest?: Rest; spot?: Pt; crown: boolean; hat: boolean };

// A hug still going on: whoever gave it, and everyone still in it.
export type HugGroup = { by: string; people: string[] };

export type Scene = {
  // The visitor's own time of day: shared rooms, the hallway and outside.
  light: Phase;
  me: Person;
  bedrooms: Bedroom[];
  figures: Figure[];
  dishes: Dish[];
  // Kettle Maggi on Amirdhavarshini's mat.
  kettle: boolean;
  // Shinzo. `with` is whoever he's going round with, until `until`; `plan`
  // is his own day from `now` for an hour (src/house.ts wander).
  dog: { place: string; with?: string; until?: number; plan: Waypoint[]; now: number };
  hugs: HugGroup[];
  // Places with something new for the visitor since their last visit.
  fresh: Set<string>;
  // A room page's place; the whole house when absent.
  focus?: string;
  // What you just did (a `did` from src/server.ts), which pops up where you
  // did it.
  did?: string;
  // UNO on Amirdhavarshini's mat: what you can do while sitting on it with
  // friends (`seated`), and what the mat offers when you walk up (`mat`).
  uno?: { seated: Doing[]; mat: Doing[] };
};

export const isPlace = (place: string): boolean => Object.hasOwn(ROOMS, place);

const pts = (list: Pt[]): string => list.map(([x, y]) => `${x},${y}`).join(" ");

const inside = ([px, py]: Pt, outline: Pt[]): boolean => {
  let hit = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i];
    const [xj, yj] = outline[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

const fromEdge = ([px, py]: Pt, outline: Pt[]): number =>
  Math.min(...outline.map(([ax, ay], i) => {
    const [bx, by] = outline[(i + 1) % outline.length];
    const [dx, dy] = [bx - ax, by - ay];
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }));

// The room a spot in the picture is in. In the gap between two rooms (you
// walk straight through walls, public/house.js), the nearer one, as long as
// it's about a wall's width away; anywhere else isn't in the house.
export function placeAt(p: Pt): string | undefined {
  const rooms = Object.entries(ROOMS);
  const room = rooms.find(([, r]) => inside(p, r.outline));
  if (room) return room[0];
  const [place, gap] = rooms.map(([place, r]): [string, number] => [place, fromEdge(p, r.outline)]).sort((a, b) => a[1] - b[1])[0];
  return gap < 30 ? place : undefined;
}

const SHADE: Record<Phase, [string, number] | null> = {
  night: ["#141a3c", 0.5],
  dusk: ["#a4502c", 0.22],
  dawn: ["#f0a088", 0.16],
  day: null,
};

const dark = (phase: Phase): boolean => phase === "night" || phase === "dusk";

// Only bedrooms dim, each by its owner's clock. The living room, kitchen,
// garden and the halls between are always in daylight (ADR 0015); after dark
// by the visitor's clock the fire is lit, but nothing gets darker.
function light(s: Scene): string {
  const bedrooms = s.bedrooms.map((b) => {
    const room = ROOMS[`room:${b.owner.id}`];
    const shade = SHADE[b.phase];
    const fill = shade ? `<polygon points="${pts(room.outline)}" fill="${shade[0]}" opacity="${shade[1]}"/>` : "";
    const lamp = b.lamp && dark(b.phase) && room.desk ? `<circle cx="${room.desk[0][0]}" cy="${room.desk[0][1]}" r="120" fill="url(#glow)"/>` : "";
    return fill + lamp;
  }).join("");
  const fire = dark(s.light) ? `<circle cx="${FIREPLACE[0]}" cy="${FIREPLACE[1]}" r="140" fill="url(#glow)"/>` : "";
  return `<g class="light" aria-hidden="true">${bedrooms}${fire}</g>`;
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

// All through her birthday month, her room has bunting and balloons; on the
// day itself, a cake on her desk and confetti on the floor.
function party(s: Scene): string {
  return s.bedrooms.map((b) => {
    const room = ROOMS[`room:${b.owner.id}`];
    if (!b.birthday || !room.party) return "";
    const { from, to, sag, balloons: [bx, by] } = room.party;
    const day = b.birthday === 2;
    const desk = room.desk?.[0];
    const extra = day ? `${desk ? cake(desk[0] - 14, desk[1] - 16) : ""}${confetti([[bx - 30, by + 18], [(from[0] + to[0]) / 2, by + 30]])}` : "";
    return `<g class="party" data-place="room:${b.owner.id}" aria-hidden="true">${bunting(from, to, sag, b.owner.name)}${balloons(bx, by)}${extra}</g>`;
  }).join("");
}

// Where to hug from and the balloons' hotspot, around the bunch.
const balloonArea = ([x, y]: Pt): Pt[] => oval(x + 3, y - 50, 34, 58);

// Shinzo, right now: beside whoever he's with, wherever she last stood, or
// at the foot of her bed if she's asleep; otherwise wherever his own day has
// got to. `path` is where he goes from here for the next hour, so
// public/house.js can walk him; `lying` is the size of his curled-up
// picture, which is its own size only on his blanket under the tree.
const HOUR = 60 * 60 * 1000;
const same = (a: Pt, b: Pt): boolean => a[0] === b[0] && a[1] === b[1];

function dogState(s: Scene, standing: Map<string, Pt>): { at: Pt; pose: Pose; facing: 1 | -1; path: Waypoint[]; lying: number } {
  const d = s.dog;
  if (d.with) {
    const beside = standing.get(d.with);
    const at: Pt = beside ? [beside[0] + 50, beside[1] + 6] : ROOMS[d.place]?.dog ?? KENNEL;
    const after = d.until !== undefined && d.until < d.now + HOUR ? rejoin(at, d.until, d.plan) : [];
    return { at, pose: "stand", facing: 1, path: [[d.now, at[0], at[1], "stand"], ...after], lying: 0.62 };
  }
  const now = along(d.plan, d.now);
  return { at: now.at, pose: now.pose, facing: now.facing, path: d.plan, lying: same(now.at, KENNEL) ? 1 : 0.62 };
}

// Up and about, he's drawn this much smaller than his drawing's own units.
const STANDS = 0.66;

// The blanket stays under the tree while he's up. Napping, he's curled up on
// it in his picture, wherever he's napping, so it's not under the tree too.
function blanket(s: Scene, standing: Map<string, Pt>): string {
  const covered = dogState(s, standing).pose === "nap";
  return `<g class="blanket${covered ? " covered" : ""}" data-at="${KENNEL.join(",")}" transform="translate(${KENNEL[0]} ${KENNEL[1]})" aria-hidden="true">${BLANKET}</g>`;
}

// public/house.js walks him along `data-path` (from `data-now`, the server's
// clock), turns `.facing` the way he's going, and offers to pet him or give
// him a treat when you walk up to him.
function laddoo(s: Scene, standing: Map<string, Pt>): string {
  const d = dogState(s, standing);
  const [x, y] = d.at;
  const doings: Doing[] = [
    { label: `Pet ${DOG}`, emoji: EMOJI.play, post: "/garden/dog", fields: { at: s.dog.place } },
    { label: `Give ${DOG} a treat`, emoji: EMOJI.treat, post: "/garden/treat", fields: { at: s.dog.place } },
  ];
  const cls = ["laddoo", d.pose === "nap" ? "napping" : "awake", d.pose === "walk" ? "walking" : ""].filter(Boolean).join(" ");
  const lying = `<g class="lying" transform="scale(${d.lying})"><ellipse class="halo" cy="16" rx="92" ry="48"/><image href="${art("laddoo.png")}" x="-80" y="-46" width="160" height="92"/><text class="zz" x="52" y="-30">z</text><text class="zz small" x="66" y="-46">z</text></g>`;
  const up = `<g class="standing" transform="scale(${STANDS})"><ellipse class="halo" cy="-22" rx="62" ry="40"/><g class="facing" transform="scale(${d.facing} 1)">${DOG_STANDING}</g></g>`;
  const data = `data-place="${esc(s.dog.place)}" data-with="${esc(s.dog.with ?? "")}" data-now="${s.dog.now}" data-path="${esc(JSON.stringify(d.path))}" data-do="${esc(JSON.stringify(doings))}"`;
  return `<g class="${cls}" ${data} transform="translate(${x} ${y})" aria-hidden="true">${lying}${up}</g>`;
}

// What you just did pops up where you did it, once, on top of everything:
// hearts over Shinzo, drops falling on the garden, a sprout, sparkles where
// the clutter was, a letter on the desk, z's over you in bed.
const GARDEN_BED: Pt = [1130, 160];
const WALL_MIDDLE: Pt = [971, 180];

function pops(s: Scene, standing: Map<string, Pt>): string {
  if (!s.did) return "";
  const room = s.focus ? ROOMS[s.focus] : undefined;
  const above = (p: Pt | undefined, dy: number): Pt[] => (p ? [[p[0], p[1] - dy]] : []);
  const you = standing.get(s.me.id);
  // Over his back, clear of whoever he's beside.
  const dog = dogState(s, standing);
  const pup: Pt[] = [dog.pose === "nap" ? [dog.at[0] + 14, dog.at[1] - Math.round(46 * dog.lying + 4)] : [dog.at[0] + 6, dog.at[1] - 52]];
  const where: Record<string, Pt[]> = {
    play: pup,
    treat: pup,
    water: [GARDEN_BED],
    plant: above(GARDEN_BED, -10),
    tidy: room?.mess ?? [],
    desk: above(room?.desk?.[0], 28),
    kettle: above(MAT_TABLE, 44),
    wall: [WALL_MIDDLE],
    dish: above(COUNTER[1], 30),
    // Over whoever ate it, who's usually standing in front of the counter.
    eat: above(you, 118),
    nap: above(you, 42),
    sit: above(you, 90),
    mask: above(you, 108),
    // Over the middle of the hug, above everyone's heads.
    hug: above(you, 128),
    wish: room?.party ? [[room.party.balloons[0] + 3, room.party.balloons[1] - 128]] : [],
  };
  const size = s.did === "tidy" || s.did === "play" || s.did === "treat" ? 24 : 32;
  const all = (where[s.did] ?? []).map((p, i) => pop(s.did!, p, size, i * 0.3)).join("");
  return all ? `<g class="pops" aria-hidden="true">${all}</g>` : "";
}

// Everything in the picture you can do something with, each lit up when you
// walk up to it (public/house.js). Every one of these is also a button or a
// form on its room's page, so nothing needs the script.
function hotspots(s: Scene): string {
  const spots: { place: string; area: Pt[]; doings: Doing[]; seated?: boolean }[] = [];
  for (const b of s.bedrooms) {
    const { id, name } = b.owner;
    const place = `room:${id}`;
    const room = ROOMS[place];
    const mine = id === s.me.id;
    // Anyone can sleep in anyone's bed.
    if (room.bedArea) spots.push({ place, area: room.bedArea, doings: [{ label: `Sleep in ${mine ? "your" : `${name}'s`} bed`, emoji: EMOJI.nap, post: `/room/${id}/nap` }] });
    if (room.deskArea) {
      const desk: Doing = mine
        ? { label: "See what's on your desk", emoji: EMOJI.look, href: `/room/${id}#desk` }
        : { label: `Leave something on ${name}'s desk`, emoji: EMOJI.desk, href: `/room/${id}#leave-something` };
      spots.push({ place, area: room.deskArea, doings: [desk] });
    }
    for (const [x, y] of (room.mess ?? []).slice(0, b.mess)) {
      spots.push({ place, area: oval(x, y, 26, 18), doings: [{ label: mine ? "Tidy your room" : `Tidy up ${name}'s room`, emoji: EMOJI.tidy, post: `/room/${id}/tidy` }] });
    }
    // Her birthday month: walk up to the balloons to wish her a happy birthday.
    if (b.birthday && room.party) {
      spots.push({ place, area: balloonArea(room.party.balloons), doings: [{ label: mine ? "Celebrate your birthday" : `Wish ${name} a happy birthday`, emoji: EMOJI.wish, post: `/room/${id}/wish` }] });
    }
  }
  spots.push(
    { place: `room:${KETTLE_ROOM}`, area: MAT, doings: [{ label: "Sit on your cushion", emoji: EMOJI.sit, post: "/sit", fields: { seat: "mat" } }, { label: "Make kettle Maggi", emoji: EMOJI.kettle, post: `/room/${KETTLE_ROOM}/kettle` }, ...(s.uno?.mat ?? [])] },
    { place: `room:${MASK_ROOM}`, area: MIRROR, doings: [{ label: "Do a face mask", emoji: EMOJI.mask, post: `/room/${MASK_ROOM}/mask` }] },
    { place: `room:${YOGA_ROOM}`, area: YOGA, doings: [{ label: "Meditate on the yoga mat", emoji: EMOJI.yoga, post: "/sit", fields: { seat: "yoga" } }] },
    { place: "living", area: WALL_BOARD, doings: [{ label: "Write on the wall", emoji: EMOJI.write, href: "/living#write" }, { label: "Read the wall", emoji: EMOJI.read, href: "/living#wall" }] },
    { place: "living", area: SOFAS, doings: [{ label: "Sit on the sofa", emoji: EMOJI.sit, post: "/sit", fields: { seat: "sofa" } }, { label: "Plan a movie night", emoji: EMOJI.night, href: "/movies" }] },
    // Whatever's out on the counter can be eaten, which takes it away.
    { place: "kitchen", area: STOVE, doings: [
      { label: "Cook something", emoji: EMOJI.dish, href: "/kitchen#cook" },
      ...s.dishes.slice(0, COUNTER.length).map((d): Doing => ({ label: d.label, emoji: EMOJI.eat, post: "/kitchen/eat", fields: { dish: String(d.id) } })),
    ] },
    { place: "garden", area: PATCHES, doings: [{ label: "Water the garden", emoji: EMOJI.water, post: "/garden/water" }, { label: "Plant something", emoji: EMOJI.plant, href: "/garden#plant" }] },
  );
  // Sitting on the mat with friends, there's UNO. Only someone sitting down
  // is offered these (public/house.js); standing, the mat's own spot is there.
  if (s.uno?.seated.length) spots.push({ place: `room:${KETTLE_ROOM}`, area: MAT, doings: s.uno.seated, seated: true });
  const svg = spots.map((h) => `<g class="act${h.seated ? " seated" : ""}" data-place="${h.place}" data-do="${esc(JSON.stringify(h.doings))}"><polygon class="halo" points="${pts(h.area)}"/><polygon class="edge" points="${pts(h.area)}"/></g>`);
  return `<g class="acts" aria-hidden="true">${svg.join("")}</g>`;
}

// data-go is what the Go in button says when you walk yourself into the room,
// and data-view is what to zoom to on the way in (public/house.js).
function links(s: Scene): string {
  return Object.entries(ROOMS).map(([place, room]) => {
    const owner = s.bedrooms.find((b) => `room:${b.owner.id}` === place)?.owner;
    const href = owner ? `/room/${owner.id}` : `/${place}`;
    const label = owner?.id === s.me.id ? "Your room" : room.name;
    const go = place === "garden" ? "Go out to the garden" : `Go into ${owner ? (owner.id === s.me.id ? "your room" : room.name) : `the ${room.name.toLowerCase()}`}`;
    const current = place === s.focus ? ` aria-current="page"` : "";
    return `<a class="room-link" href="${href}" data-place="${place}" data-walk="${room.walk[0].join(",")}" data-view="${room.view.join(" ")}" data-go="${esc(go)}" aria-label="${esc(label)}"${current}><polygon points="${pts(room.outline)}"/></a>`;
  }).join("");
}

// A green face mask with cucumber slices, over a standing sticker's face.
const MASK = `<g class="mask"><ellipse cx="1" cy="-57" rx="16" ry="16" fill="#9fcf8f" fill-opacity=".85"/><circle cx="-7" cy="-61" r="4.6" fill="#e2f4cf" stroke="#6fae5c" stroke-width="1.4"/><circle cx="9" cy="-61" r="4.6" fill="#e2f4cf" stroke="#6fae5c" stroke-width="1.4"/></g>`;

// A sleeper is just her head on the pillow, under the picture's blanket. A
// second one in the same bed lies beside the first.
// The birthday girl's crown, or the party hat of anyone who's just wished
// someone a happy birthday, on top of a standing sticker's head. `dy` moves
// it down for someone sitting.
const HEAD_TOP = -86;
function headwear(f: Figure, dy = 0): string {
  if (f.crown) return `<g transform="translate(0 ${HEAD_TOP + dy})">${CROWN}</g>`;
  if (f.hat) return `<g transform="translate(8 ${HEAD_TOP + 3 + dy}) rotate(16)">${PARTY_HAT}</g>`;
  return "";
}

const BED_SPOTS: Pt[] = [[0, 0], [34, 6], [-30, 10]];
const lying = (f: Figure): string => {
  const hat = f.crown ? `<g transform="translate(0 -20) scale(.75)">${CROWN}</g>` : f.hat ? `<g transform="translate(6 -19) rotate(16) scale(.75)">${PARTY_HAT}</g>` : "";
  return `<g transform="rotate(-10)"><image href="${art(`avatar-${f.person.id}.png`)}" x="-32" y="-27.5" width="64" height="86" clip-path="url(#head)"/>${hat}<text class="zz" x="22" y="-24">z</text><text class="zz small" x="34" y="-40">z</text></g>`;
};

// Someone sitting is drawn lower, with her legs tucked out of sight, so she
// sits on the cushion or the sofa.
const SIT_DOWN = 20;
const sitting = (f: Figure): string =>
  `<image href="${art(`avatar-${f.person.id}.png`)}" x="-36" y="${SIT_DOWN - 95}" width="72" height="97" clip-path="url(#sit)"/>${f.masked ? `<g transform="translate(0 ${SIT_DOWN})">${MASK}</g>` : ""}${headwear(f, SIT_DOWN)}`;

// A standing friend (or you), feet on (x, y). `extra` adds classes; someone
// in a hug leans in toward its middle by `lean` degrees (style.css turns her
// while she's `hugging`).
function walkerSvg(f: Figure, [x, y]: Pt, pose: string, extra: string, lean?: number): string {
  const p = f.person;
  const cls = ["walker", f.me ? "me" : "", f.here ? "here" : "", extra].filter(Boolean).join(" ");
  const body = `<g class="bob"><image href="${art(`avatar-${p.id}.png`)}" x="-36" y="-95" width="72" height="97"/>${f.masked ? MASK : ""}${headwear(f)}</g>`;
  const style = `--accent:${p.color}${lean === undefined ? "" : `;--lean:${lean}deg`}`;
  return `<g class="${cls}" data-person="${p.id}" data-place="${f.place}" transform="translate(${x} ${y})" style="${style}"><ellipse class="shadow" rx="22" ry="7"/>${lean === undefined ? body : `<g class="lean">${body}</g>`}${pose}<text class="who" y="24">${esc(f.me ? "you" : p.name)}</text></g>`;
}

// How close you have to be to hug someone, in the picture's pixels: about a
// step and a half, feet to feet.
export const HUG_REACH = 120;
// How far apart people stand in a hug: close enough to overlap, with
// everyone's face still showing.
const HUG_GAP = 40;

const HEART = "M0 5C-7 -1 -11 -6 -6.5 -10.5C-3.5 -13 0 -11 0 -7.5C0 -11 3.5 -13 6.5 -10.5C11 -6 7 -1 0 5Z";

const listed = (names: string[]): string =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

// The next free spot in that bed or on that seat. On Amirdhavarshini's mat,
// everyone has her own cushion.
function restSpot(rest: Rest, who: string, taken: Map<string, number>): Pt | undefined {
  const key = `${rest.kind} ${rest.place} ${rest.seat}`;
  const n = taken.get(key) ?? 0;
  taken.set(key, n + 1);
  if (rest.kind === "nap") {
    const bed = ROOMS[rest.place]?.bed;
    const [dx, dy] = BED_SPOTS[n % BED_SPOTS.length];
    return bed && [bed[0] + dx, bed[1] + dy];
  }
  if (rest.seat === "mat") return CUSHIONS[who];
  const seats = rest.seat === "sofa" ? SOFA_SEATS : YOGA_SEATS;
  return seats[n % seats.length];
}

// The stickers are 180 × 242; a standing friend is drawn 72 wide, feet on
// the spot. Nobody moves on their own: friends stand where they are, and only
// you walk, when you walk yourself (public/house.js). A friend who's asleep,
// in her own bed at night or in anyone's for a nap, is tucked up in it, and a
// friend who's sat down is on her seat. Everyone else stands where she last
// walked to, or on the room's spots if she hasn't walked since going in.
// You're always a walker, so you can get up and go. Whoever's further down
// the picture is drawn in front. `standing` is where everyone who isn't
// asleep is, so Shinzo can be beside her.
//
// People in a hug stand close around whoever gave it, leaning in, with
// hearts over them and their names together underneath.
function figures(s: Scene): { svg: string; standing: Map<string, Pt> } {
  const drawn: { y: number; svg: string }[] = [];
  const standing = new Map<string, Pt>();
  const count = new Map<string, number>();
  const taken = new Map<string, number>();
  const hugging = new Set(s.hugs.flatMap((h) => h.people));
  const waiting: { f: Figure; at: Pt }[] = [];
  // Whoever's room it is gets its first spot, and her own bed's pillow.
  const own = (f: Figure): number => ((f.rest?.place ?? f.place) === `room:${f.person.id}` ? 0 : 1);
  for (const f of [...s.figures].sort((a, b) => own(a) - own(b))) {
    const p = f.person;
    const rest: Rest | undefined = f.rest ?? (f.asleep ? { kind: "nap", place: f.place, seat: "" } : undefined);
    const at = rest && restSpot(rest, p.id, taken);
    if (rest && at && !f.me) {
      const [x, y] = at;
      if (rest.kind === "sit") standing.set(p.id, at);
      const body = rest.kind === "nap" ? lying(f) : sitting(f);
      drawn.push({ y, svg: `<g class="${rest.kind === "nap" ? "sleeper" : "sitter"}${f.here ? " here" : ""}" data-person="${p.id}" data-place="${rest.place}" transform="translate(${x} ${y})" style="--accent:${p.color}">${body}</g>` });
      continue;
    }
    // You, sitting or asleep, are on your seat or in the bed. Friends in the
    // same room without a spot of their own stand on different spots.
    const fixed = at ?? f.spot;
    const i = fixed ? 0 : count.get(f.place) ?? 0;
    if (!fixed) count.set(f.place, i + 1);
    const spot: Pt = fixed ?? ROOMS[f.place].walk[i % ROOMS[f.place].walk.length];
    standing.set(p.id, spot);
    const pose = !rest || !at ? "" : `<g class="pose">${rest.kind === "nap" ? lying(f) : sitting(f)}</g>`;
    if (!pose && hugging.has(p.id)) {
      waiting.push({ f, at: spot });
      continue;
    }
    drawn.push({ y: spot[1], svg: walkerSvg(f, spot, pose, pose ? `resting ${rest!.kind === "nap" ? "napping" : "sitting"}` : "") });
  }
  for (const h of s.hugs) {
    const group = waiting.filter((w) => h.people.includes(w.f.person.id)).sort((a, b) => a.at[0] - b.at[0]);
    if (group.length < 2) {
      for (const w of group) drawn.push({ y: w.at[1], svg: walkerSvg(w.f, w.at, "", "") });
      continue;
    }
    const [cx, cy] = group.find((w) => w.f.person.id === h.by)?.at
      ?? [group.reduce((a, w) => a + w.at[0], 0) / group.length, group.reduce((a, w) => a + w.at[1], 0) / group.length];
    group.forEach((w, i) => {
      const off = (i - (group.length - 1) / 2) * HUG_GAP;
      const at: Pt = [Math.round(cx + off), Math.round(cy)];
      standing.set(w.f.person.id, at);
      const lean = Math.round(Math.max(-12, Math.min(12, -off * 0.32)));
      // The middle of the hug in front, arms round the others.
      drawn.push({ y: cy - Math.abs(off) / 100, svg: walkerSvg(w.f, at, "", "hugging", lean) });
    });
    const hearts = [[-18, 0, 0], [0, -14, 0.6], [18, -2, 1.2]].map(([dx, dy, delay]) =>
      `<g transform="translate(${dx} ${dy - 112})"><path class="heart" d="${HEART}" style="animation-delay:${delay}s"/></g>`).join("");
    const names = listed(group.map((w) => (w.f.me ? "you" : w.f.person.name)));
    const people = group.map((w) => w.f.person.id).join(",");
    drawn.push({ y: cy + 1, svg: `<g class="hug" data-people="${people}" transform="translate(${Math.round(cx)} ${Math.round(cy)})">${hearts}<text class="who hug-names" y="24">${esc(names)}</text></g>` });
  }
  drawn.sort((a, b) => a.y - b.y);
  return { svg: `<g class="people" aria-hidden="true">${drawn.map((d) => d.svg).join("")}</g>`, standing };
}

// Where everyone who isn't asleep is drawn, so the server can tell who's
// close enough to hug.
export const standingSpots = (s: Scene): Map<string, Pt> => figures(s).standing;

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
  const people = figures(s);
  return `<svg class="house-svg" viewBox="${x} ${y} ${w} ${h}" role="group" aria-label="${s.focus ? "The room, and the house around it" : "The house. Tap a room to go in."}">
<defs>
<clipPath id="head" clipPathUnits="objectBoundingBox"><ellipse cx=".5" cy=".32" rx=".36" ry=".27"/></clipPath>
<clipPath id="sit" clipPathUnits="objectBoundingBox"><rect width="1" height=".78"/></clipPath>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6f4f8"/><stop offset="1" stop-color="#b9d6e2"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".6"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
</defs>
<image href="${art("house.jpg")}" width="${W}" height="${H}" aria-hidden="true"/>
${RITHANYA}
${kettleMaggi(s)}
${blanket(s, people.standing)}
${light(s)}
${things(s)}
${party(s)}
${hotspots(s)}
${laddoo(s, people.standing)}
<g class="links">${links(s)}</g>
${people.svg}
<g class="nametags" aria-hidden="true">${tags(s)}</g>
${pops(s, people.standing)}
</svg>`;
}
