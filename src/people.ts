export type Hair = "curly" | "bob" | "straight" | "wavy";

export type Person = {
  id: string;
  name: string;
  // Where a long name may wrap on a narrow screen.
  breakAfter?: number;
  city: string;
  tz: string;
  // Local hours this person's character sleeps, e.g. [23.5, 10.5].
  sleep: [number, number];
  hair: Hair;
  dimples: boolean;
  color: string;
  // The colour of the paper this person writes notes on.
  paper: string;
  skin: string;
  about: string;
};

// Ids are window numbers, so renaming someone never orphans what they left.
export const PEOPLE: Person[] = [
  {
    id: "1",
    name: "Rithika",
    city: "Canberra",
    tz: "Australia/Sydney",
    sleep: [23, 7],
    hair: "curly",
    dimples: false,
    color: "#e07a5f",
    paper: "#ffe4d9",
    skin: "#b07650",
    about: "Fairy lights over the bed, a plant by the desk, and a laptop that's always open.",
  },
  {
    id: "2",
    name: "Neha",
    city: "New Jersey",
    tz: "America/New_York",
    sleep: [23.5, 10.5],
    hair: "bob",
    dimples: false,
    color: "#d9668a",
    paper: "#ffdbe6",
    skin: "#bb8460",
    about: "A pink tablecloth, a blue checked blanket, and the board games everyone plays. Neha sleeps the longest in this house.",
  },
  {
    id: "3",
    name: "Amirdhavarshini",
    breakAfter: 7,
    city: "Tamil Nadu",
    tz: "Asia/Kolkata",
    sleep: [23, 7],
    hair: "wavy",
    dimples: false,
    color: "#e0a33a",
    paper: "#fff0c4",
    skin: "#a46a45",
    about: "The biggest room and the biggest bed, with a mat on the floor where everyone ends up hanging out.",
  },
  {
    id: "4",
    name: "Rithanya",
    city: "Bangalore",
    tz: "Asia/Kolkata",
    sleep: [23.5, 9.5],
    hair: "straight",
    dimples: true,
    color: "#8e7cc3",
    paper: "#e9e2fb",
    skin: "#b98058",
    about: "UPSC books in every pile, and a box of cats on the study table. Rithanya likes a long sleep too.",
  },
  {
    id: "5",
    name: "Aswathy",
    city: "Bangalore",
    tz: "Asia/Kolkata",
    sleep: [23, 7],
    hair: "curly",
    dimples: false,
    color: "#5f9e74",
    paper: "#dcf0e1",
    skin: "#a86f4a",
    about: "A yoga mat, a quiet corner for meditating together, and a banana that should have been thrown out a while ago.",
  },
];

export const personById = (id: string | undefined): Person | undefined =>
  PEOPLE.find((p) => p.id === id);
