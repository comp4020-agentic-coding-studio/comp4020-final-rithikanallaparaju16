import { KETTLE_ROOM } from "./house.ts";
import type { Thing } from "./store.ts";

// UNO on Amirdhavarshini's mat, worked out from the log like everything else
// (ADR 0013): a `uno` row deals a game (its item is the players in turn order,
// its body the seed for the shuffle), and each `unomove` placed `uno:<id>` is
// a card played ("r7", "gS", "W4"), "draw", "pass" or "quit" (she left the
// house), with the colour picked for a wild in its body. Replaying the moves
// in order gives the table.
//
// Each turn lasts twenty seconds (ADR 0016), counted from the move before it,
// with no timer anywhere: whoever's turn runs out is taken to have gone, and
// play moves on without her. Someone who'd just drawn was there, so for her
// running out only passes.

export type Color = "r" | "y" | "g" | "b";
export const COLORS: Color[] = ["r", "y", "g", "b"];
export const COLOR_NAME: Record<Color, string> = { r: "red", y: "yellow", g: "green", b: "blue" };

// A card is its colour and what's on it: a number, S (skip), R (reverse) or
// D (draw two). Wilds have no colour: W, and W4 (wild draw four).
export type Card = string;

export const MAX_PLAYERS = 5;
const HAND = 7;
export const TURN = 20_000;

export const isCard = (c: string): boolean => /^([rygb][0-9SRD]|W4?)$/.test(c);
export const isWild = (c: Card): boolean => c.startsWith("W");
const value = (c: Card): string => (isWild(c) ? c : c.slice(1));
const isNumber = (c: Card): boolean => /^[rygb][0-9]$/.test(c);

export function cardName(c: Card): string {
  if (c === "W") return "Wild";
  if (c === "W4") return "Wild Draw Four";
  const colour = COLOR_NAME[c[0] as Color];
  const v = c.slice(1);
  return `${colour} ${v === "S" ? "Skip" : v === "R" ? "Reverse" : v === "D" ? "Draw Two" : v}`;
}

export function deck(): Card[] {
  const out: Card[] = [];
  for (const c of COLORS) {
    out.push(`${c}0`);
    for (const v of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "S", "R", "D"]) out.push(`${c}${v}`, `${c}${v}`);
  }
  for (let i = 0; i < 4; i++) out.push("W", "W4");
  return out;
}

// A small seeded random number generator (mulberry32), so the same seed always
// shuffles the same way.
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(cards: Card[], rand: () => number): Card[] {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export type Left = { who: string; why: "time" | "quit" };

export type Game = {
  start: Thing;
  // Who's still playing, in turn order; whoever's gone is in `left`.
  players: string[];
  left: Left[];
  // When the turn in play started: the deal, or the move before it.
  turnAt: number;
  hands: Map<string, Card[]>;
  // The top of each pile is its last card.
  pile: Card[];
  discard: Card[];
  color: Color;
  // Whose turn it is, as an index into players, and which way play goes.
  turn: number;
  dir: 1 | -1;
  // A card the player whose turn it is has just drawn and could still play.
  drawn?: Card;
  winner?: string;
  // The move that emptied the winner's hand.
  won?: Thing;
  // The last thing that happened, for the table to say. `move` is a card,
  // "draw", "pass", "time" (her twenty seconds ran out) or "quit".
  last?: { by: string; move: string; color?: Color };
  rand: () => number;
};

export const top = (g: Game): Card => g.discard[g.discard.length - 1];
export const whoseTurn = (g: Game): string => g.players[g.turn];

export const players = (start: Thing): string[] => start.item.split(",").filter(Boolean);

export function deal(start: Thing): Game {
  const rand = random(Number(start.body) || start.id);
  const pile = shuffle(deck(), rand);
  const ids = players(start);
  const hands = new Map<string, Card[]>(ids.map((p) => [p, []]));
  for (let i = 0; i < HAND; i++) for (const p of ids) hands.get(p)!.push(pile.pop()!);
  // Turn cards over until a number comes up; the others go to the bottom.
  while (!isNumber(pile[pile.length - 1])) pile.unshift(pile.pop()!);
  const first = pile.pop()!;
  return { start, players: ids, left: [], turnAt: start.createdAt, hands, pile, discard: [first], color: first[0] as Color, turn: 0, dir: 1, rand };
}

const next = (g: Game, steps = 1): number => (((g.turn + g.dir * steps) % g.players.length) + g.players.length) % g.players.length;

// When the turn in play runs out.
export const deadline = (g: Game): number => g.turnAt + TURN;

// `who` is out of the game: her cards go under the draw pile, and if it was
// her turn, the next one along takes it. The last one left wins.
function goes(g: Game, who: string, why: Left["why"], at: number): void {
  const i = g.players.indexOf(who);
  if (i < 0 || g.winner) return;
  g.pile.unshift(...(g.hands.get(who) ?? []));
  g.hands.set(who, []);
  const hers = i === g.turn;
  g.players.splice(i, 1);
  g.left.push({ who, why });
  g.last = { by: who, move: why };
  if (g.players.length === 1) {
    g.turn = 0;
    g.drawn = undefined;
    g.winner = g.players[0];
    return;
  }
  if (i < g.turn) g.turn -= 1;
  else if (hers) {
    g.turn = g.dir === 1 ? i % g.players.length : (i - 1 + g.players.length) % g.players.length;
    g.drawn = undefined;
    g.turnAt = at;
  }
}

// Every turn that ran out before `until`, in order.
function expire(g: Game, until: number): void {
  while (!g.winner && until - g.turnAt > TURN) {
    const at = g.turnAt + TURN;
    const who = whoseTurn(g);
    if (g.drawn !== undefined) {
      g.drawn = undefined;
      g.last = { by: who, move: "pass" };
      g.turn = next(g);
      g.turnAt = at;
    } else goes(g, who, "time", at);
  }
}

// When the draw pile runs out, everything under the top of the discards is
// shuffled into a new one.
function drawOne(g: Game, who: string): Card | undefined {
  if (g.pile.length === 0 && g.discard.length > 1) {
    const kept = g.discard.pop()!;
    g.pile = shuffle(g.discard, g.rand);
    g.discard = [kept];
  }
  const card = g.pile.pop();
  if (card) g.hands.get(who)!.push(card);
  return card;
}

export const fits = (g: Game, c: Card): boolean => isWild(c) || c[0] === g.color || (!isWild(top(g)) && value(c) === value(top(g)));

// Whether `who` may play `card` right now: her turn, in her hand, and it fits
// (after drawing, only the card she drew).
export function canPlay(g: Game, who: string, card: Card): boolean {
  if (g.winner || whoseTurn(g) !== who) return false;
  if (!g.hands.get(who)?.includes(card)) return false;
  if (g.drawn !== undefined && card !== g.drawn) return false;
  return fits(g, card);
}

export type Move = { author: string; item: string; body: string };

// Applies a move made at `at`, or says why it can't happen and leaves the game
// as it was. Turns that ran out before it have already been played out
// (replay() and the server expire them first).
export function play(g: Game, m: Move, row?: Thing, at = row?.createdAt ?? Date.now()): string | undefined {
  if (g.winner) return "This game's already over.";
  const gone = g.left.find((l) => l.who === m.author);
  if (gone) return gone.why === "time" ? "Your twenty seconds ran out, so you've left this game." : "You left the house, so you're out of this game.";
  if (!g.players.includes(m.author)) return "You're not in this game.";
  if (m.item === "quit") {
    goes(g, m.author, "quit", at);
    return undefined;
  }
  if (whoseTurn(g) !== m.author) return "It isn't your turn.";
  const hand = g.hands.get(m.author)!;

  if (m.item === "draw") {
    if (g.drawn !== undefined) return "You've already drawn this turn.";
    const card = drawOne(g, m.author);
    g.last = { by: m.author, move: "draw" };
    if (card && fits(g, card)) g.drawn = card;
    else g.turn = next(g);
    g.turnAt = at;
    return undefined;
  }

  if (m.item === "pass") {
    if (g.drawn === undefined) return "Draw a card before passing.";
    g.drawn = undefined;
    g.last = { by: m.author, move: "pass" };
    g.turn = next(g);
    g.turnAt = at;
    return undefined;
  }

  const card = m.item;
  if (!isCard(card) || !hand.includes(card)) return "That card isn't in your hand.";
  if (g.drawn !== undefined && card !== g.drawn) return "After drawing, you can only play the card you drew.";
  if (!fits(g, card)) return "That card doesn't go on this one.";
  const color = isWild(card) ? (COLORS as string[]).includes(m.body) ? (m.body as Color) : undefined : (card[0] as Color);
  if (!color) return "Pick a colour for the wild.";

  hand.splice(hand.indexOf(card), 1);
  g.discard.push(card);
  g.color = color;
  g.drawn = undefined;
  g.turnAt = at;
  g.last = { by: m.author, move: card, color: isWild(card) ? color : undefined };
  if (hand.length === 0) {
    g.winner = m.author;
    g.won = row;
    return undefined;
  }
  const v = value(card);
  const two = g.players.length === 2;
  if (v === "S" || (v === "R" && two)) g.turn = next(g, 2);
  else if (v === "R") {
    g.dir = g.dir === 1 ? -1 : 1;
    g.turn = next(g);
  } else if (v === "D" || v === "W4") {
    const victim = g.players[next(g)];
    for (let i = 0; i < (v === "D" ? 2 : 4); i++) drawOne(g, victim);
    g.turn = next(g, 2);
  } else g.turn = next(g);
  return undefined;
}

// `things` newest first, as the store gives them.
export const games = (things: Thing[]): Thing[] => things.filter((t) => t.kind === "uno");

// The latest game `who` is playing in.
export const gameOf = (things: Thing[], who: string): Thing | undefined => games(things).find((t) => players(t).includes(who));

const cache = new WeakMap<Thing[], Map<number, Game>>();

// The game as it stands at `now`, after every move so far and every turn that
// ran out in between. Moves the server would have refused are skipped. Pages
// share one replay per game (one `things` is one moment); a move about to be
// checked gets a `fresh` one, since checking it changes the game.
export function replay(start: Thing, things: Thing[], now: number, fresh = false): Game {
  let seen = cache.get(things);
  if (!seen) cache.set(things, (seen = new Map()));
  const known = fresh ? undefined : seen.get(start.id);
  if (known) return known;
  const g = deal(start);
  const place = `uno:${start.id}`;
  for (let i = things.length - 1; i >= 0; i--) {
    const t = things[i];
    if (t.kind !== "unomove" || t.place !== place) continue;
    // The server checked the move a moment before it was stored, so a move
    // it took right at the end of a turn still counts.
    expire(g, t.createdAt - 500);
    play(g, t, t);
  }
  expire(g, now);
  if (!fresh) seen.set(start.id, g);
  return g;
}

// Whether `who` is still playing a game that isn't over.
export const stillIn = (g: Game, who: string): boolean => !g.winner && g.players.includes(who);

// Everyone sitting on Amirdhavarshini's mat right now, by id, from
// house.ts resting().
export function onTheMat(rests: Map<string, Thing>): string[] {
  return [...rests.values()]
    .filter((t) => t.kind === "sit" && t.item === "mat" && t.place === `room:${KETTLE_ROOM}`)
    .map((t) => t.author)
    .sort();
}

// You can deal when you're sitting on the mat with at least one friend; the
// players are you, then everyone else on the mat by id.
export function dealFor(me: string, rests: Map<string, Thing>): string[] | undefined {
  const mat = onTheMat(rests);
  if (!mat.includes(me) || mat.length < 2) return undefined;
  return [me, ...mat.filter((p) => p !== me)].slice(0, MAX_PLAYERS);
}
