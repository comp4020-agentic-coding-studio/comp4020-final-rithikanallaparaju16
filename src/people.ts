export type Person = {
  id: string;
  name: string;
  // Where a long name may wrap on a narrow screen.
  breakAfter?: number;
  city: string;
  tz: string;
  // Local hours this person's character sleeps, e.g. [23.5, 9.5].
  sleep: [number, number];
  // Month (1-12) and day. The whole month is her birthday month, by her own
  // clock.
  birthday: [number, number];
  color: string;
  // The colour of the paper this person writes notes on.
  paper: string;
  about: string;
  // A made house's friends only (src/houses.ts): which words fit her ("girl"
  // is she/her, "boy" he/him, "name" they/them or just her name), and how
  // her sticker looks. Rithika's five are girls, drawn by their Stitch
  // stickers, so they need neither.
  gender?: Gender;
  look?: Look;
};

export type Gender = "girl" | "boy" | "name";

// A made friend's sticker (src/avatars.ts): who it's drawn as, her skin and
// hair, and her hairstyle. Each is an index into that file's own lists.
export type Look = { gender: Gender; skin: number; hair: number; style: number };

import { house } from "./houses.ts";

// Ids are window numbers, so renaming someone never orphans what they left.
// Each person's sticker is public/art/avatar-<id>.png.
export const FIVE: Person[] = [
  {
    id: "1",
    name: "Rithika",
    city: "Canberra",
    tz: "Australia/Sydney",
    sleep: [23, 7],
    birthday: [10, 16],
    color: "#e07a5f",
    paper: "#ffe4d9",
    about: "Shelves of little bottles and jars, a pink bed, and a desk where the laptop's always open.",
  },
  {
    id: "2",
    name: "Neha",
    city: "New Jersey",
    tz: "America/New_York",
    sleep: [22, 8],
    birthday: [6, 2],
    color: "#d9668a",
    paper: "#ffdbe6",
    about: "A pink tablecloth, a blue checked blanket, and the board games everyone plays. Neha's the first one in bed, at 10.",
  },
  {
    id: "3",
    name: "Amirdhavarshini",
    breakAfter: 7,
    city: "Tamil Nadu",
    tz: "Asia/Kolkata",
    sleep: [23, 7],
    birthday: [5, 19],
    color: "#e0a33a",
    paper: "#fff0c4",
    about: "The biggest room and the biggest bed, with a mat and cushions on the floor where everyone ends up hanging out.",
  },
  {
    id: "4",
    name: "Rithanya",
    city: "Bangalore",
    tz: "Asia/Kolkata",
    sleep: [23.5, 9.5],
    birthday: [1, 12],
    color: "#8e7cc3",
    paper: "#e9e2fb",
    about: "UPSC books and a box of KitKats on the study table, a mirror, and face mask powder for everyone. Rithanya loves movies, and likes a long sleep too.",
  },
  {
    id: "5",
    name: "Aswathy",
    city: "Bangalore",
    tz: "Asia/Kolkata",
    sleep: [23, 7],
    birthday: [11, 8],
    color: "#5f9e74",
    paper: "#dcf0e1",
    about: "A yoga mat where she meditates, and bananas that should have been thrown out a while ago.",
  },
];

// The five of whichever house this request is in (src/houses.ts): Rithika's
// five, or the friends a made house was given. Reads like the array it always
// was, so nothing that loops over PEOPLE needs to know there's more than one
// house.
export const PEOPLE: Person[] = new Proxy([] as Person[], {
  get(_, key) {
    const list = house().spec?.friends ?? FIVE;
    const value = Reflect.get(list, key);
    return typeof value === "function" ? value.bind(list) : value;
  },
  has: (_, key) => Reflect.has(house().spec?.friends ?? FIVE, key),
  ownKeys: () => Reflect.ownKeys(house().spec?.friends ?? FIVE),
  getOwnPropertyDescriptor: (_, key) => Reflect.getOwnPropertyDescriptor(house().spec?.friends ?? FIVE, key),
});

export const personById = (id: string | undefined): Person | undefined =>
  PEOPLE.find((p) => p.id === id);
