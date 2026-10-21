import { house } from "./houses.ts";

// Where everything is in the picture a house is drawn on (ADR 0021), in the
// picture's own pixels (1376 × 768, the same for every picture). Rithika's
// five, and any made house for five, are drawn on her Stitch illustration
// (public/art/house.jpg, ADR 0007). A made house for 2, 3, 4, 6 or 7 friends
// is drawn on a picture of its own (public/art/house-<n>.jpg, made by
// scripts/make-layouts.py), with a bedroom each, a living room and kitchen,
// and the garden down the right.

export type Pt = [number, number];

export type Room = {
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
  // Bedrooms only, in a made house: where the first of her things is pinned
  // up, on a bit of wall or floor clear of her name tag and the bunting
  // (src/houses.ts); the rest go down below it.
  pins?: Pt;
};

export type Layout = {
  picture: string;
  rooms: Record<string, Room>;
  // Where things left in the kitchen sit.
  counter: Pt[];
  // Shinzo's blanket in the garden.
  kennel: Pt;
  fireplace: Pt;
  // Where Shinzo stops for a sniff or a sit when he's off on his own, besides
  // the rooms' own spots for him.
  dogStops: Pt[];
  // Where UNO is played (src/uno.ts): Amirdhavarshini's mat in the Stitch
  // picture, the living room's coffee table in the others. A cushion each, by
  // window.
  mat: { place: string; area: Pt[]; cushions: Record<string, Pt> };
  // The living room's sofas, each lit up on its own, and where you sit.
  sofas: Pt[][];
  sofaSeats: Pt[];
  // The memory wall, its middle, the kitchen counter you cook at, and the
  // garden patches.
  wallBoard: Pt[];
  wallMiddle: Pt;
  stove: Pt[];
  patches: Pt[];
  gardenBed: Pt;
};

// An oval as a polygon, for the round things that light up.
export const oval = (cx: number, cy: number, rx: number, ry: number): Pt[] =>
  Array.from({ length: 16 }, (_, i): Pt => [Math.round(cx + rx * Math.cos((i * Math.PI) / 8)), Math.round(cy + ry * Math.sin((i * Math.PI) / 8))]);

const box = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/* ---------- Rithika's house: the Stitch illustration ---------- */

const STITCH_ROOMS: Record<string, Room> = {
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
    pins: [322, 150],
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
    pins: [236, 588],
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
    pins: [612, 462],
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
    pins: [836, 548],
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
    pins: [1168, 520],
  },
};

export const STITCH: Layout = {
  picture: "house.jpg",
  rooms: STITCH_ROOMS,
  // On the island.
  counter: [[560, 203], [602, 214], [646, 204]],
  // Where the illustration had him.
  kennel: [1249, 122],
  fireplace: [835, 205],
  // By his bowls, on the stepping stones, the kitchen floor, the rug and
  // beside the sofas, and a clear bit of floor in each bedroom.
  dogStops: [
    [1300, 182], [1060, 45], [1290, 385], [1330, 255],
    [512, 236], [590, 270],
    [905, 292], [985, 332], [745, 412],
    [110, 335], [240, 700], [400, 668], [900, 600], [1060, 520],
  ],
  // Amirdhavarshini's round mat has a cushion for each of us, by colour.
  mat: {
    place: "room:3",
    area: oval(270, 340, 125, 76),
    cushions: { "1": [326, 299], "2": [205, 346], "3": [270, 376], "4": [340, 352], "5": [227, 297] },
  },
  sofas: [[[668, 215], [790, 205], [905, 235], [965, 240], [960, 395], [805, 405], [660, 400]]],
  sofaSeats: [[730, 342], [892, 343], [735, 252], [932, 268], [700, 258]],
  // The board above the living room's armchair.
  wallBoard: [[910, 120], [1032, 156], [1032, 264], [910, 224]],
  wallMiddle: [971, 180],
  stove: [[538, 190], [610, 160], [745, 148], [748, 200], [650, 272], [538, 272]],
  // The sunflower bed by the living room wall.
  patches: [[1075, 138], [1150, 138], [1188, 200], [1180, 228], [1100, 228], [1075, 180]],
  gardenBed: [1130, 160],
};

/* ---------- the made houses' own pictures ---------- */

// A bedroom, from what was measured off its picture: its outline (top-left
// corner first, then top-right), the pillow, the bed and the nightstand or
// desk things are left on (x0, y0, x1, y1), and the spots for standing,
// clutter, Shinzo's nap, balloons and pinned-up things. The name tag goes in
// the top-left corner, the bunting along the top, and the room page looks at
// the whole room.
type Box = [number, number, number, number];
function bedroom(o: { outline: Pt[]; pillow: Pt; bed: Box; desk: Box; walk: Pt[]; mess: Pt[]; dog: Pt; balloons: Pt; pins: Pt }): Room {
  const xs = o.outline.map((p) => p[0]);
  const ys = o.outline.map((p) => p[1]);
  const [x0, y0] = [Math.max(0, Math.min(...xs) - 14), Math.max(0, Math.min(...ys) - 14)];
  const [x1, y1] = [Math.min(1376, Math.max(...xs) + 14), Math.min(768, Math.max(...ys) + 14)];
  const [top, right] = o.outline;
  const [dx0, dy0, dx1, dy1] = o.desk;
  return {
    name: "A bedroom",
    outline: o.outline,
    tag: [top[0] + 8, top[1] + 6],
    walk: o.walk,
    view: [x0, y0, x1 - x0, y1 - y0],
    bed: o.pillow,
    desk: [[Math.round(dx0 + (dx1 - dx0) * 0.32), Math.round(dy0 + (dy1 - dy0) * 0.42)], [Math.round(dx0 + (dx1 - dx0) * 0.68), Math.round(dy0 + (dy1 - dy0) * 0.48)]],
    mess: o.mess,
    dog: o.dog,
    bedArea: box(...o.bed),
    deskArea: box(...o.desk),
    party: { from: [top[0] + 6, top[1] + 68], to: [right[0] - 6, right[1] + 68], sag: 8, balloons: o.balloons },
    pins: o.pins,
  };
}

// The cushions round the coffee table: one for each window, round its oval,
// starting at the front.
const ring = ([cx, cy]: Pt, rx: number, ry: number, n: number): Record<string, Pt> =>
  Object.fromEntries(Array.from({ length: n }, (_, i): [string, Pt] => {
    const a = Math.PI / 2 + (2 * Math.PI * i) / n;
    return [String(i + 1), [Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a))]];
  }));

// The garden strip is the same picture down the right of every made house:
// a tree at the top with Shinzo's blanket in its shade, a raised bed,
// stepping stones and the sunflower bed. `left` is where its lawn starts,
// against the house.
function garden(left: number): Room {
  return {
    name: "Garden",
    outline: [[left, 14], [1370, 14], [1370, 754], [left, 754]],
    tag: [1112, 300],
    walk: [[1212, 312], [1280, 365], [1172, 268]],
    view: [Math.min(left, 990), 0, 1376 - Math.min(left, 990), 768],
  };
}
const GARDEN = {
  kennel: [1205, 238] as Pt,
  stops: [[1272, 330], [1182, 330], [1285, 600], [1250, 700]] as Pt[],
  patches: box(1145, 462, 1240, 652),
  gardenBed: [1192, 540] as Pt,
};

// What every made layout works out the same way: the garden, and where
// Shinzo stops (the garden, the shared rooms and a spot in each bedroom).
function made(n: number, l: Omit<Layout, "picture" | "kennel" | "dogStops" | "patches" | "gardenBed" | "mat"> & { table: Pt; tableR: [number, number] }): Layout {
  const { table, tableR, ...rest } = l;
  const bedrooms = Object.entries(l.rooms).filter(([k]) => k.startsWith("room:")).map(([, r]) => r.walk[1]);
  return {
    ...rest,
    picture: `house-${n}.jpg`,
    kennel: GARDEN.kennel,
    dogStops: [...GARDEN.stops, ...l.rooms.living.walk.slice(1), ...l.rooms.kitchen.walk.slice(1), ...bedrooms],
    mat: { place: "living", area: oval(table[0], table[1], tableR[0], tableR[1]), cushions: ring(table, tableR[0], tableR[1], n) },
    patches: GARDEN.patches,
    gardenBed: GARDEN.gardenBed,
  };
}

const TWO = made(2, {
  rooms: {
    living: { name: "Living room", outline: [[195, 100], [612, 100], [612, 430], [80, 430], [18, 368]], tag: [420, 200], walk: [[565, 320], [395, 288], [575, 405]], view: [0, 86, 640, 360] },
    kitchen: { name: "Kitchen", outline: [[612, 100], [1035, 100], [1078, 265], [1078, 430], [612, 430]], tag: [845, 108], walk: [[702, 285], [830, 420], [635, 420]], view: [596, 86, 500, 360] },
    "room:1": bedroom({ outline: [[24, 432], [552, 432], [552, 766], [24, 766]], pillow: [338, 540], bed: [255, 468, 442, 752], desk: [462, 515, 540, 600], walk: [[497, 685], [205, 690], [497, 745]], mess: [[215, 748], [500, 622]], dog: [348, 735], balloons: [118, 605], pins: [160, 545] }),
    "room:2": bedroom({ outline: [[558, 432], [1078, 432], [1078, 766], [558, 766]], pillow: [762, 540], bed: [668, 475, 862, 752], desk: [855, 485, 952, 595], walk: [[918, 680], [612, 712], [918, 745]], mess: [[640, 756], [905, 622]], dog: [765, 735], balloons: [615, 640], pins: [975, 600] }),
    garden: garden(1084),
  },
  counter: [[685, 340], [730, 350], [780, 345]],
  fireplace: [345, 230],
  table: [352, 340],
  tableR: [55, 48],
  sofas: [box(185, 262, 292, 422), box(430, 255, 512, 420)],
  sofaSeats: [[240, 345], [470, 345], [240, 405], [470, 405], [355, 425]],
  wallBoard: box(420, 128, 515, 195),
  wallMiddle: [467, 160],
  stove: [[640, 195], [835, 195], [835, 268], [810, 300], [810, 415], [650, 415], [650, 300], [640, 268]],
});

const THREE = made(3, {
  rooms: {
    living: { name: "Living room", outline: [[205, 78], [600, 92], [600, 405], [85, 405]], tag: [430, 98], walk: [[550, 300], [372, 388], [555, 385]], view: [70, 64, 550, 360] },
    kitchen: { name: "Kitchen", outline: [[600, 92], [860, 88], [1000, 330], [1000, 405], [600, 405]], tag: [700, 96], walk: [[745, 300], [780, 385], [630, 330]], view: [586, 64, 430, 360] },
    "room:1": bedroom({ outline: [[105, 407], [405, 407], [405, 698], [100, 698], [20, 558]], pillow: [255, 505], bed: [180, 455, 325, 670], desk: [335, 500, 382, 566], walk: [[365, 640], [145, 640], [255, 688]], mess: [[140, 690], [365, 600]], dog: [255, 655], balloons: [140, 600], pins: [36, 585] }),
    "room:2": bedroom({ outline: [[405, 407], [715, 407], [715, 698], [405, 698]], pillow: [560, 505], bed: [495, 455, 622, 670], desk: [625, 500, 682, 572], walk: [[665, 640], [452, 640], [560, 688]], mess: [[440, 690], [668, 600]], dog: [560, 655], balloons: [452, 600], pins: [412, 575] }),
    "room:3": bedroom({ outline: [[715, 407], [1040, 407], [1082, 555], [995, 698], [715, 698]], pillow: [835, 505], bed: [768, 455, 910, 670], desk: [910, 500, 968, 572], walk: [[955, 640], [742, 660], [840, 690]], mess: [[760, 695], [960, 600]], dog: [840, 655], balloons: [745, 600], pins: [985, 575] }),
    garden: garden(1088),
  },
  counter: [[832, 290], [836, 325], [840, 360]],
  fireplace: [380, 235],
  table: [372, 318],
  tableR: [52, 48],
  sofas: [box(225, 255, 312, 378), box(430, 255, 500, 378)],
  sofaSeats: [[268, 320], [465, 320], [268, 370], [465, 370], [372, 392]],
  wallBoard: box(448, 143, 506, 196),
  wallMiddle: [477, 170],
  stove: [[615, 215], [810, 215], [870, 260], [880, 400], [820, 400], [800, 265], [615, 265]],
});

const FOUR = made(4, {
  rooms: {
    living: { name: "Living room", outline: [[228, 104], [640, 104], [640, 448], [12, 448], [12, 384]], tag: [236, 108], walk: [[440, 412], [606, 330], [300, 420]], view: [0, 90, 660, 372] },
    kitchen: { name: "Kitchen", outline: [[640, 104], [880, 104], [1080, 336], [1080, 448], [640, 448]], tag: [688, 106], walk: [[780, 330], [790, 420], [668, 425]], view: [626, 90, 468, 372] },
    "room:1": bedroom({ outline: [[12, 450], [296, 450], [296, 664], [100, 664]], pillow: [236, 494], bed: [128, 460, 296, 650], desk: [132, 494, 182, 552], walk: [[98, 618], [212, 652], [268, 652]], mess: [[90, 655], [268, 610]], dog: [212, 628], balloons: [70, 560], pins: [140, 566] }),
    "room:2": bedroom({ outline: [[296, 450], [560, 450], [560, 664], [296, 664]], pillow: [456, 494], bed: [376, 460, 540, 650], desk: [354, 498, 398, 550], walk: [[330, 620], [458, 652], [548, 640]], mess: [[322, 655], [548, 600]], dog: [458, 628], balloons: [318, 570], pins: [380, 566] }),
    "room:3": bedroom({ outline: [[560, 450], [788, 450], [788, 664], [560, 664]], pillow: [680, 494], bed: [600, 460, 770, 650], desk: [570, 498, 610, 550], walk: [[580, 620], [685, 652], [778, 640]], mess: [[578, 655], [778, 600]], dog: [685, 628], balloons: [575, 575], pins: [604, 566] }),
    "room:4": bedroom({ outline: [[788, 450], [1076, 450], [1000, 664], [788, 664]], pillow: [912, 494], bed: [828, 460, 1008, 650], desk: [800, 498, 838, 550], walk: [[812, 620], [918, 652], [1000, 610]], mess: [[808, 655], [996, 560]], dog: [918, 628], balloons: [810, 580], pins: [838, 566] }),
    garden: garden(1086),
  },
  counter: [[730, 240], [770, 236], [810, 240]],
  fireplace: [428, 250],
  table: [402, 330],
  tableR: [45, 50],
  sofas: [box(240, 240, 350, 382), box(484, 252, 574, 382)],
  sofaSeats: [[292, 320], [528, 325], [292, 372], [528, 375], [210, 395]],
  wallBoard: box(494, 154, 566, 202),
  wallMiddle: [530, 178],
  stove: [[700, 195], [890, 195], [925, 385], [830, 385], [830, 290], [700, 290]],
});

const SIX = made(6, {
  rooms: {
    "room:1": bedroom({ outline: [[180, 18], [408, 18], [408, 240], [124, 240]], pillow: [296, 104], bed: [192, 80, 376, 236], desk: [184, 124, 236, 168], walk: [[392, 226], [158, 228], [300, 232]], mess: [[150, 236], [392, 190]], dog: [290, 215], balloons: [395, 200], pins: [228, 150] }),
    "room:2": bedroom({ outline: [[408, 18], [648, 18], [648, 240], [408, 240]], pillow: [532, 104], bed: [448, 80, 616, 236], desk: [420, 128, 460, 172], walk: [[632, 226], [428, 228], [530, 232]], mess: [[426, 238], [634, 198]], dog: [530, 215], balloons: [440, 175], pins: [470, 150] }),
    "room:3": bedroom({ outline: [[648, 18], [884, 16], [948, 240], [648, 240]], pillow: [768, 104], bed: [700, 80, 880, 236], desk: [660, 124, 704, 168], walk: [[910, 220], [672, 228], [790, 232]], mess: [[668, 238], [905, 180]], dog: [790, 215], balloons: [680, 175], pins: [720, 150] }),
    living: { name: "Living room", outline: [[124, 242], [700, 242], [700, 516], [60, 516]], tag: [132, 250], walk: [[220, 460], [540, 428], [310, 416]], view: [40, 228, 680, 302] },
    kitchen: { name: "Kitchen", outline: [[700, 242], [948, 242], [960, 516], [700, 516]], tag: [770, 244], walk: [[722, 442], [850, 440], [722, 505]], view: [686, 228, 290, 302] },
    "room:4": bedroom({ outline: [[62, 518], [396, 518], [396, 756], [22, 756]], pillow: [284, 600], bed: [164, 572, 356, 746], desk: [36, 590, 112, 690], walk: [[130, 720], [378, 700], [260, 744]], mess: [[120, 745], [378, 740]], dog: [260, 725], balloons: [138, 650], pins: [176, 640] }),
    "room:5": bedroom({ outline: [[396, 518], [652, 518], [652, 756], [396, 756]], pillow: [532, 600], bed: [436, 572, 620, 748], desk: [416, 640, 464, 684], walk: [[636, 700], [420, 720], [530, 744]], mess: [[416, 748], [636, 742]], dog: [530, 725], balloons: [638, 640], pins: [470, 650] }),
    "room:6": bedroom({ outline: [[652, 518], [1048, 518], [1048, 756], [652, 756]], pillow: [772, 604], bed: [704, 572, 868, 744], desk: [664, 640, 712, 684], walk: [[890, 700], [680, 725], [980, 640]], mess: [[676, 748], [890, 745]], dog: [786, 725], balloons: [895, 620], pins: [940, 640] }),
    garden: garden(1060),
  },
  counter: [[764, 466], [796, 466], [780, 486]],
  fireplace: [628, 390],
  table: [444, 482],
  tableR: [40, 30],
  sofas: [box(336, 380, 506, 454), box(296, 428, 370, 514), box(522, 450, 598, 514)],
  sofaSeats: [[380, 440], [460, 440], [332, 500], [560, 505], [420, 445]],
  wallBoard: box(386, 278, 498, 350),
  wallMiddle: [442, 314],
  stove: [[712, 350], [884, 350], [958, 380], [958, 516], [740, 516], [712, 430]],
});

const SEVEN = made(7, {
  rooms: {
    "room:1": bedroom({ outline: [[256, 52], [424, 52], [424, 244], [156, 244]], pillow: [320, 108], bed: [228, 96, 376, 236], desk: [388, 128, 424, 164], walk: [[400, 226], [195, 226], [300, 234]], mess: [[190, 238], [398, 180]], dog: [302, 214], balloons: [205, 200], pins: [240, 150] }),
    "room:2": bedroom({ outline: [[424, 52], [652, 52], [652, 244], [424, 244]], pillow: [544, 112], bed: [476, 96, 616, 236], desk: [612, 128, 648, 164], walk: [[634, 226], [450, 226], [546, 234]], mess: [[446, 238], [632, 182]], dog: [546, 214], balloons: [452, 190], pins: [490, 150] }),
    "room:3": bedroom({ outline: [[652, 52], [836, 52], [932, 244], [652, 244]], pillow: [764, 112], bed: [708, 96, 864, 236], desk: [836, 128, 872, 164], walk: [[890, 226], [680, 226], [786, 234]], mess: [[676, 238], [885, 190]], dog: [786, 214], balloons: [680, 190], pins: [722, 150] }),
    living: { name: "Living room", outline: [[156, 246], [640, 246], [640, 504], [20, 504]], tag: [168, 252], walk: [[300, 455], [452, 498], [598, 392]], view: [6, 232, 650, 286] },
    kitchen: { name: "Kitchen", outline: [[640, 246], [932, 246], [1068, 504], [640, 504]], tag: [700, 248], walk: [[700, 422], [930, 480], [690, 492]], view: [626, 232, 456, 286] },
    "room:4": bedroom({ outline: [[20, 506], [292, 506], [292, 708], [24, 708]], pillow: [152, 568], bed: [76, 544, 228, 700], desk: [236, 584, 276, 624], walk: [[262, 672], [50, 672], [152, 700]], mess: [[46, 700], [262, 640]], dog: [152, 680], balloons: [50, 640], pins: [90, 600] }),
    "room:5": bedroom({ outline: [[292, 506], [548, 506], [548, 708], [292, 708]], pillow: [408, 568], bed: [344, 544, 488, 700], desk: [492, 584, 532, 624], walk: [[518, 672], [318, 672], [416, 700]], mess: [[316, 700], [518, 640]], dog: [416, 680], balloons: [318, 640], pins: [358, 600] }),
    "room:6": bedroom({ outline: [[548, 506], [800, 506], [800, 708], [548, 708]], pillow: [680, 568], bed: [608, 544, 756, 700], desk: [748, 584, 788, 624], walk: [[778, 672], [582, 672], [682, 700]], mess: [[578, 700], [778, 640]], dog: [682, 680], balloons: [580, 640], pins: [622, 600] }),
    "room:7": bedroom({ outline: [[800, 506], [1072, 506], [1068, 708], [800, 708]], pillow: [936, 568], bed: [868, 544, 1004, 700], desk: [1004, 584, 1048, 624], walk: [[1036, 672], [832, 672], [936, 700]], mess: [[830, 700], [1036, 640]], dog: [936, 680], balloons: [832, 640], pins: [880, 600] }),
    garden: garden(1080),
  },
  counter: [[680, 362], [730, 360], [780, 362]],
  fireplace: [256, 392],
  table: [514, 472],
  tableR: [34, 28],
  sofas: [box(440, 378, 590, 442), box(338, 398, 430, 502), box(602, 398, 666, 502)],
  sofaSeats: [[480, 430], [550, 430], [384, 490], [634, 490], [515, 435]],
  wallBoard: box(398, 266, 526, 346),
  wallMiddle: [462, 306],
  stove: [[646, 340], [860, 340], [860, 400], [646, 400]],
});

// By how many friends live in the house.
export const LAYOUTS: Record<number, Layout> = { 2: TWO, 3: THREE, 4: FOUR, 5: STITCH, 6: SIX, 7: SEVEN };

// How many friends a made house can have: one picture for each.
export const SIZES = Object.keys(LAYOUTS).map(Number);

// The picture this request's house is drawn on (src/houses.ts).
export const layout = (): Layout => LAYOUTS[house().spec?.friends.length ?? 5] ?? STITCH;

// Where UNO is played, in words, and the page it's on: Amirdhavarshini's mat
// in the Stitch picture, the living room's coffee table in the others.
export function matWords(): { on: string; sit: string; table: string; href: string } {
  const place = layout().mat.place;
  return place === "living"
    ? { on: "at the coffee table", sit: "Sit at the coffee table", table: "coffee table", href: "/living" }
    : { on: "on the mat", sit: "Sit on your cushion", table: "mat", href: `/room/${place.slice("room:".length)}` };
}
