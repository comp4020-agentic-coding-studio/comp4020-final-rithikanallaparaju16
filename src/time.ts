import type { Person } from "./people.ts";

export type Phase = "night" | "dawn" | "day" | "dusk";

export type Clock = { hour: number; minute: number; label: string; weekday: string };

const formats = new Map<string, Intl.DateTimeFormat>();

function format(tz: string): Intl.DateTimeFormat {
  let f = formats.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-AU", {
      timeZone: tz,
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formats.set(tz, f);
  }
  return f;
}

// The label is built by hand rather than by Intl so it reads the same on every
// ICU version ("4:43 am", never "4:43 AM").
export function clock(tz: string, now: number): Clock {
  const parts = Object.fromEntries(format(tz).formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const label = `${h12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "am" : "pm"}`;
  return { hour, minute, label, weekday: parts.weekday };
}

const decimal = (c: Clock): number => c.hour + c.minute / 60;

export function phase(c: Clock): Phase {
  const h = decimal(c);
  if (h < 5 || h >= 20) return "night";
  if (h < 7) return "dawn";
  if (h < 17) return "day";
  return "dusk";
}

export function asleep(p: Person, c: Clock): boolean {
  const h = decimal(c);
  const [from, to] = p.sleep;
  return from > to ? h >= from || h < to : h >= from && h < to;
}

export function hello(c: Clock): string {
  const h = c.hour;
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Hello, night owl";
}

const walls = new Map<string, Intl.DateTimeFormat>();

// The wall-clock time in `tz` at `at`, read back as if it were UTC.
function wall(tz: string, at: number): number {
  let f = walls.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-AU", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" });
    walls.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute));
}

// A date-and-time field ("2026-10-10T20:00") filled in by someone in `tz`, as
// a moment. The second pass settles it across a daylight-saving change.
export function fromLocal(local: string, tz: string): number | undefined {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return undefined;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(target);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59) return undefined;
  let at = target - (wall(tz, target) - target);
  at += target - wall(tz, at);
  return at;
}

// Now in `tz`, the way a date-and-time field writes it.
export const localInput = (tz: string, at: number): string => new Date(wall(tz, at)).toISOString().slice(0, 16);

// "Saturday 10 October", in `tz`.
export function dayLabel(tz: string, at: number): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).formatToParts(at).map((x) => [x.type, x.value]),
  );
  return `${p.weekday} ${p.day} ${p.month}`;
}

const dates = new Map<string, Intl.DateTimeFormat>();

// The year, month (1-12) and day in `tz` at `at`.
export function ymd(tz: string, at: number): [number, number, number] {
  let f = dates.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-AU", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" });
    dates.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return [Number(p.year), Number(p.month), Number(p.day)];
}

// Her birthday month, by her own clock: 0 if it isn't, 1 all month, 2 on
// the day itself.
export function birthday(p: Person, now: number): 0 | 1 | 2 {
  const [, month, day] = ymd(p.tz, now);
  if (month !== p.birthday[0]) return 0;
  return day === p.birthday[1] ? 2 : 1;
}

// "Friday 16 October": her birthday this year, in her own calendar.
export function birthdayLabel(p: Person, now: number): string {
  const [year] = ymd(p.tz, now);
  return dayLabel("UTC", Date.UTC(year, p.birthday[0] - 1, p.birthday[1], 12));
}

const DAY = 24 * 60 * 60 * 1000;

export function ago(then: number, now: number): string {
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins === 1 ? "a minute ago" : `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  const days = Math.floor((now - then) / DAY);
  if (days < 14) return days === 1 ? "yesterday" : `${days} days ago`;
  return `on ${new Date(then).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`;
}
