// Five Windows on your iPhone's home screen, like Locket (ADR 0025).
// For the Scriptable app (free, on the App Store): make a new script, paste
// all of this in, then add a Scriptable widget to your home screen and pick
// this script. The house filled in your own link below; keep it to yourself,
// since it shows what friends left for you.
//
// Small: the newest photo or note a friend left you. Medium and large: that,
// and everyone's face and clock, glowing if she's home now. Tap it to go in.
const LINK = "__LINK__";

const cream = new Color("#fff8ec");
const ink = new Color("#3b2a20");
const soft = new Color("#7a6150");

// Scriptable runs plain JavaScriptCore, which has no URL (a browser's), so
// addresses are joined by hand: the widget's own pictures are relative to its
// link ("photo/3", "./"), and where a tap goes starts at the site ("/h/…").
const ORIGIN = LINK.match(/^https?:\/\/[^/]+/)[0];
function at(path) {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return ORIGIN + path;
  return LINK + path.replace(/^\.\//, "");
}

async function get(path, as = "json") {
  const req = new Request(at(path));
  req.timeoutInterval = 20;
  return as === "image" ? req.loadImage() : req.loadJSON();
}

async function picture(path) {
  try {
    return await get(path, "image");
  } catch {
    return undefined;
  }
}

async function build() {
  const w = new ListWidget();
  w.backgroundColor = cream;
  w.setPadding(12, 12, 12, 12);
  let house;
  try {
    house = await get("./");
  } catch {
    const t = w.addText("The house couldn't be reached. It'll try again soon.");
    t.font = Font.mediumSystemFont(13);
    t.textColor = soft;
    return w;
  }
  if (house.error) {
    const t = w.addText(house.error);
    t.font = Font.mediumSystemFont(13);
    t.textColor = soft;
    return w;
  }
  w.url = at(house.open);
  const size = config.widgetFamily ?? "medium";
  const latest = house.latest;

  // A friend's photo, once. The house's own form shrinks photos before they
  // go, so it's a few hundred KB; if it won't load, the widget shows her face
  // and words instead, never a blank square.
  const photo = latest?.photo ? await picture(latest.photo) : undefined;

  // Small: a photo fills it, like Locket; otherwise her face and her words.
  if (size === "small") {
    if (photo) {
      w.backgroundImage = photo;
      w.addSpacer();
      const by = w.addText(`${latest.by} · ${latest.ago}`);
      by.font = Font.boldSystemFont(11);
      by.textColor = Color.white();
      by.shadowColor = new Color("#000000", 0.6);
      by.shadowRadius = 3;
      return w;
    }
    await line(w, latest, house, 3);
    return w;
  }

  // Medium and large: what's new for you, then everyone.
  const top = w.addStack();
  top.layoutHorizontally();
  top.centerAlignContent();
  if (photo) {
    const img = top.addImage(photo);
    const edge = size === "large" ? 140 : 64;
    img.imageSize = new Size(edge, edge);
    img.cornerRadius = 8;
    top.addSpacer(10);
  }
  const words = top.addStack();
  words.layoutVertically();
  await line(words, latest, house, photo ? 3 : 2);
  w.addSpacer();
  const row = w.addStack();
  row.layoutHorizontally();
  for (const f of house.friends) {
    const cell = row.addStack();
    cell.layoutVertically();
    cell.centerAlignContent();
    const face = await picture(f.face);
    const ring = cell.addStack();
    ring.size = new Size(34, 34);
    ring.cornerRadius = 17;
    ring.borderWidth = f.home ? 3 : 1.5;
    ring.borderColor = new Color(f.color, f.home ? 1 : 0.5);
    ring.backgroundColor = new Color(f.day ? "#f6e3c4" : "#2f2740");
    // A made house's faces are drawings Scriptable can't show: her initial,
    // in her colour, instead.
    ring.centerAlignContent();
    if (face) {
      const img = ring.addImage(face);
      img.imageSize = new Size(34, 34);
    } else {
      const i = ring.addText([...f.name][0]);
      i.font = Font.boldSystemFont(14);
      i.textColor = new Color(f.color);
    }
    const t = cell.addText(f.asleep ? `${f.time} 💤` : f.time);
    t.font = Font.mediumSystemFont(9);
    t.textColor = f.home ? ink : soft;
    t.lineLimit = 1;
    row.addSpacer();
  }
  return w;
}

// Who left it, her face, what it was and when; or that it's quiet.
async function line(stack, latest, house, lines) {
  if (!latest) {
    const t = stack.addText(`Nothing new in ${house.house}. Leave something for someone?`);
    t.font = Font.mediumSystemFont(13);
    t.textColor = soft;
    t.lineLimit = lines;
    return;
  }
  const who = stack.addStack();
  who.centerAlignContent();
  const face = await picture(latest.face);
  if (face) {
    const img = who.addImage(face);
    img.imageSize = new Size(22, 22);
    img.cornerRadius = 11;
    who.addSpacer(6);
  }
  const by = who.addText(latest.by);
  by.font = Font.boldSystemFont(13);
  by.textColor = new Color(latest.color);
  const t = stack.addText(latest.caption ? `“${latest.caption}”` : latest.text);
  t.font = Font.mediumSystemFont(13);
  t.textColor = ink;
  t.lineLimit = lines;
  const when = stack.addText(latest.ago);
  when.font = Font.systemFont(10);
  when.textColor = soft;
}

const widget = await build();
// Widgets refresh when iOS lets them; this asks for about every 15 minutes.
widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
