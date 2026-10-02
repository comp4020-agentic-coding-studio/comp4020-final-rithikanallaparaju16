export type Person = { id: string; name: string };

// Ids are window numbers, so renaming someone never orphans what they left.
// Names 2-5 are placeholders until the real five move in.
export const PEOPLE: Person[] = [
  { id: "1", name: "Rithika" },
  { id: "2", name: "Friend 2" },
  { id: "3", name: "Friend 3" },
  { id: "4", name: "Friend 4" },
  { id: "5", name: "Friend 5" },
];

export const personById = (id: string | undefined): Person | undefined =>
  PEOPLE.find((p) => p.id === id);
