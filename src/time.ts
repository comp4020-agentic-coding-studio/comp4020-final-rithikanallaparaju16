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
