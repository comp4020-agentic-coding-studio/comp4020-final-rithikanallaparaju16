export type Person = {
  id: string;
  name: string;
  // Where a long name may wrap on a narrow screen.
  breakAfter?: number;
  city: string;
  tz: string;
  // Local hours this person's character sleeps, e.g. [23.5, 10.5].
  sleep: [number, number];
  color: string;
  // The colour of the paper this person writes notes on.
  paper: string;
  about: string;
};

// Ids are window numbers, so renaming someone never orphans what they left.
// Each person's sticker is public/art/avatar-<id>.png.
export const PEOPLE: Person[] = [
  {
    id: "1",
    name: "Rithika",
    city: "Canberra",
    tz: "Australia/Sydney",
    sleep: [23, 7],
    color: "#e07a5f",
    paper: "#ffe4d9",
    about: "Shelves of little bottles and jars, a pink bed, and a desk where the laptop's always open.",
  },
  {
    id: "2",
    name: "Neha",
    city: "New Jersey",
    tz: "America/New_York",
    sleep: [23.5, 10.5],
    color: "#d9668a",
    paper: "#ffdbe6",
    about: "A pink tablecloth, a blue checked blanket, and the board games everyone plays. Neha sleeps the longest in this house.",
  },
  {
    id: "3",
    name: "Amirdhavarshini",
    breakAfter: 7,
    city: "Tamil Nadu",
    tz: "Asia/Kolkata",
    sleep: [23, 7],
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
    color: "#5f9e74",
    paper: "#dcf0e1",
    about: "A yoga mat where she meditates, and bananas that should have been thrown out a while ago.",
  },
];

export const personById = (id: string | undefined): Person | undefined =>
  PEOPLE.find((p) => p.id === id);
