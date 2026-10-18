import type { Gender, Person } from "./people.ts";

// The words for a friend in the third person, by the gender her house was
// given (src/people.ts): "girl" she/her, "boy" he/him, "name" they/them.
// Rithika's five, and friends in houses made before the form asked, have no
// gender and are girls, so their words never change.

const g = (p: Person | undefined): Gender => p?.gender ?? "girl";

const pick = (p: Person | undefined, girl: string, boy: string, name: string): string =>
  ({ girl, boy, name })[g(p)];

// she / he / they
export const they = (p: Person | undefined): string => pick(p, "she", "he", "they");
// her / him / them
export const them = (p: Person | undefined): string => pick(p, "her", "him", "them");
// her / his / their
export const their = (p: Person | undefined): string => pick(p, "her", "his", "their");
// she's / he's / they're
export const theyre = (p: Person | undefined): string => pick(p, "she's", "he's", "they're");
// is / is / are, after they(p)
export const is = (p: Person | undefined): string => pick(p, "is", "is", "are");
// goes / goes / go, and so on: the verb after they(p), given its -s form.
export const verb = (p: Person | undefined, s: string, plain: string): string => pick(p, s, s, plain);
// girl / boy / one, for "the birthday girl"
export const kid = (p: Person | undefined): string => pick(p, "girl", "boy", "one");

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
