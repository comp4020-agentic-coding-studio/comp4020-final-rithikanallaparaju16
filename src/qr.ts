// A QR code for a house's address, drawn as SVG (ADR 0033), so a friend on
// a laptop can point her phone at the screen and have the house. Written
// here rather than taken from a library: the house keeps to one runtime
// dependency (CLAUDE.md). Byte mode, error correction M, versions 1 to 10:
// up to 213 characters, which any house's address fits in.

// Data codewords and error-correction codewords per block, for level M,
// versions 1-10: [ec per block, blocks in group 1, data per block in group 1,
// blocks in group 2, data per block in group 2].
const M: [number, number, number, number, number][] = [
  [10, 1, 16, 0, 0],
  [16, 1, 28, 0, 0],
  [26, 1, 44, 0, 0],
  [18, 2, 32, 0, 0],
  [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0],
  [22, 2, 38, 2, 39],
  [22, 3, 36, 2, 37],
  [26, 4, 43, 1, 44],
];

// Where the alignment patterns' centres go, by version.
const ALIGN: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// Arithmetic in GF(256), for the Reed-Solomon error correction.
const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const mul = (a: number, b: number): number => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function generator(n: number): number[] {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array<number>(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j];
      next[j + 1] ^= mul(g[j], EXP[i]);
    }
    g = next;
  }
  return g;
}

function errorWords(data: number[], n: number): number[] {
  const g = generator(n);
  const r = [...data, ...new Array<number>(n).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const c = r[i];
    if (c) for (let j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], c);
  }
  return r.slice(data.length);
}

// The bits of the BCH-coded format (level M, mask) and version info.
function bch(value: number, poly: number, bits: number): number {
  let v = value << (bits - 1);
  const top = Math.floor(Math.log2(poly));
  for (let i = Math.floor(Math.log2(v)); i >= top; i--) if (v & (1 << i)) v ^= poly << (i - top);
  return v;
}
const formatBits = (mask: number): number => {
  const data = (0b00 << 3) | mask; // level M is 00
  return ((data << 10) | bch(data, 0b10100110111, 11)) ^ 0b101010000010010;
};

export function qr(text: string): boolean[][] {
  const bytes = [...new TextEncoder().encode(text)];
  // The smallest version it fits in.
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const [, b1, d1, b2, d2] = M[v - 1];
    const capacity = b1 * d1 + b2 * d2;
    const countBits = v < 10 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= capacity * 8) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error("too long for a QR code here");
  const [ec, b1, d1, b2, d2] = M[version - 1];
  const capacity = b1 * d1 + b2 * d2;

  // The data: mode, length, bytes, terminator, padding.
  const bits: number[] = [];
  const put = (value: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0; data.length < capacity; pad++) data.push(pad % 2 ? 0x11 : 0xec);

  // Split into blocks, add error correction, interleave.
  const blocks: number[][] = [];
  let at = 0;
  for (let i = 0; i < b1; i++) blocks.push(data.slice(at, (at += d1)));
  for (let i = 0; i < b2; i++) blocks.push(data.slice(at, (at += d2)));
  const ecs = blocks.map((b) => errorWords(b, ec));
  const words: number[] = [];
  for (let i = 0; i < Math.max(d1, d2); i++) for (const b of blocks) if (i < b.length) words.push(b[i]);
  for (let i = 0; i < ec; i++) for (const e of ecs) words.push(e[i]);

  // The grid, with the fixed patterns.
  const size = 17 + version * 4;
  const grid: (boolean | null)[][] = Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null));
  const fixed: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (r: number, c: number, on: boolean) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    grid[r][c] = on;
    fixed[r][c] = true;
  };
  const finder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++)
      for (let c = -1; c <= 7; c++) {
        const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
        set(r0 + r, c0 + c, ring !== 2 && ring !== 4);
      }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  const centres = ALIGN[version - 1];
  for (const r of centres)
    for (const c of centres) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  set(size - 8, 8, true); // the dark module
  // Reserve the format and version areas.
  for (let i = 0; i < 9; i++) {
    if (!fixed[8][i]) set(8, i, false);
    if (!fixed[i][8]) set(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    set(8, size - 1 - i, false);
    set(size - 1 - i, 8, false);
  }
  if (version >= 7) for (let i = 0; i < 18; i++) {
    set(Math.floor(i / 3), size - 11 + (i % 3), false);
    set(size - 11 + (i % 3), Math.floor(i / 3), false);
  }

  // The data, zig-zagging up and down in pairs of columns from the right.
  const stream: number[] = [];
  for (const w of words) for (let i = 7; i >= 0; i--) stream.push((w >> i) & 1);
  let k = 0;
  let up = true;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c = 5;
    for (let i = 0; i < size; i++) {
      const r = up ? size - 1 - i : i;
      for (const cc of [c, c - 1]) {
        if (fixed[r][cc]) continue;
        grid[r][cc] = k < stream.length ? stream[k] === 1 : false;
        k++;
      }
    }
    up = !up;
  }

  // Try each mask, keep the one with the lowest penalty.
  const masks: ((r: number, c: number) => boolean)[] = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (_r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];
  let best: boolean[][] = [];
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const g = grid.map((row, r) => row.map((on, c) => (fixed[r][c] ? !!on : !!on !== masks[m](r, c))));
    // Format bits, around the top-left finder and split across the others.
    // Bit 14 is the most significant; the standard places bits 0-14.
    const f = formatBits(m);
    const bit = (i: number): boolean => ((f >> i) & 1) === 1;
    // Around the top-left finder: down column 8, then along row 8.
    for (let i = 0; i <= 5; i++) g[i][8] = bit(i);
    g[7][8] = bit(6);
    g[8][8] = bit(7);
    g[8][7] = bit(8);
    for (let i = 9; i < 15; i++) g[8][14 - i] = bit(i);
    // The copy: along row 8 at the right, and down column 8 at the bottom.
    for (let i = 0; i < 8; i++) g[8][size - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) g[size - 15 + i][8] = bit(i);
    if (version >= 7) {
      const v = (version << 12) | bch(version, 0b1111100100101, 13);
      for (let i = 0; i < 18; i++) {
        const on = ((v >> i) & 1) === 1;
        g[Math.floor(i / 3)][size - 11 + (i % 3)] = on;
        g[size - 11 + (i % 3)][Math.floor(i / 3)] = on;
      }
    }
    const score = penalty(g);
    if (score < bestScore) {
      bestScore = score;
      best = g;
    }
  }
  return best;
}

function penalty(g: boolean[][]): number {
  const n = g.length;
  let p = 0;
  // Runs of five or more the same.
  for (let r = 0; r < n; r++)
    for (const line of [g[r], g.map((row) => row[r])]) {
      let run = 1;
      for (let i = 1; i < n; i++) {
        if (line[i] === line[i - 1]) run++;
        else {
          if (run >= 5) p += run - 2;
          run = 1;
        }
      }
      if (run >= 5) p += run - 2;
    }
  // 2x2 blocks.
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) if (g[r][c] === g[r][c + 1] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 1][c + 1]) p += 3;
  // Finder-like patterns.
  const pat = [true, false, true, true, true, false, true, false, false, false, false];
  const rev = [...pat].reverse();
  for (let r = 0; r < n; r++)
    for (let c = 0; c <= n - 11; c++)
      for (const pp of [pat, rev]) {
        if (pp.every((v, i) => g[r][c + i] === v)) p += 40;
        if (pp.every((v, i) => g[c + i][r] === v)) p += 40;
      }
  // Balance of dark and light.
  const dark = g.flat().filter(Boolean).length;
  p += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return p;
}

// The code as an SVG, with a quiet zone round it, in the house's ink.
export function qrSvg(text: string, label: string): string {
  const g = qr(text);
  const n = g.length;
  const q = 4;
  let path = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g[r][c]) path += `M${c + q} ${r + q}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${n + q * 2} ${n + q * 2}" role="img" aria-label="${label.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch] ?? ch)}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fffdf7"/><path d="${path}" fill="#2a1e17"/></svg>`;
}
