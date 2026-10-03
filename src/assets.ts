import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

// The house's pictures in public/art/, made by scripts/cut-art.py. Browsers
// keep them for a day, so each page asks for one by a fingerprint of the file:
// when the art changes, its address changes, and nobody's left looking at
// yesterday's house. Only files that are there at boot are served, so a path
// can never reach outside public/art.
export const ART = new URL("../public/art/", import.meta.url);
export const ART_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg" };

const prints = new Map(
  readdirSync(ART)
    .filter((f) => ART_TYPES[f.slice(f.lastIndexOf("."))])
    .map((f) => [f, createHash("sha256").update(readFileSync(new URL(f, ART))).digest("hex").slice(0, 10)]),
);

export const isArt = (file: string): boolean => prints.has(file);

export const art = (file: string): string => `/art/${file}?v=${prints.get(file) ?? ""}`;
