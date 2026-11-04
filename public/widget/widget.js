// The house's home-screen widget itself (ADR 0025, ADR 0027), for the
// Scriptable app. Nobody pastes this: the few lines they paste
// (public/widget/scriptable.js) fetch it from the house and keep a copy, so
// a better widget reaches every phone without pasting again. It runs with
// LINK (her widget's own address), DIR (a folder of its own on the phone)
// and KEPT (where its own copy is kept).
//
// Each time the phone draws it, it shows the next card the house gave it:
// a birthday, what's on her desk, a plate saved for her, the memory wall,
// her room, everyone, Shinzo. Easy on the battery: one small JSON read at
// most every few minutes, and every picture kept on the phone once it's
// been fetched, so most draws don't touch the network at all for pictures.
//
// Scriptable runs plain JavaScriptCore: no browser URL, fetch or setTimeout.
const VERSION = "__VERSION__";

// A phone can draw the widget a few times in a row (two sizes, a Mac showing
// it too); the house is asked again only after this long.
const FRESH = 4 * 60 * 1000;
// What it asks iOS for; iOS decides, by how often the widget is looked at.
const AGAIN = 15 * 60 * 1000;

const cream = new Color("#fff8ec");
const ink = new Color("#3b2a20");
const soft = new Color("#7a6150");

const fm = FileManager.local();
const file = (name) => fm.joinPath(DIR, name);
const safe = (s) => String(s).replace(/[^A-Za-z0-9]/g, "_").slice(-100);

// Addresses are joined by hand: the widget's pictures are relative to its
// link ("photo/3"), and the house's own art and where a tap goes start at
// the site ("/art/…", "/h/…").
const ORIGIN = LINK.match(/^https?:\/\/[^/]+/)[0];
function at(path) {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return ORIGIN + path;
  return LINK + path.replace(/^\.\//, "");
}

function readKept(name) {
  try {
    return fm.fileExists(file(name)) ? fm.readString(file(name)) : undefined;
  } catch {
    return undefined;
  }
}

function ageOf(name) {
  try {
    const when = fm.modificationDate(file(name));
    return when ? Date.now() - when.getTime() : Infinity;
  } catch {
    return Infinity;
  }
}

// The house as JSON: kept for a few minutes, and kept for when the phone's
// offline, so the widget never goes blank.
async function load() {
  const kept = readKept("house.json");
  if (kept && ageOf("house.json") < FRESH) {
    try {
      return JSON.parse(kept);
    } catch {
      // fetched again below
    }
  }
  try {
    const req = new Request(LINK);
    req.timeoutInterval = 15;
    const house = await req.loadJSON();
    if (house && !house.error) fm.writeString(file("house.json"), JSON.stringify(house));
    else if (kept) fm.remove(file("house.json"));
    return house;
  } catch {
    if (kept) {
      try {
        return JSON.parse(kept);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

// A newer widget, kept for the next draw, when the house says there is one.
async function update(house) {
  if (!house.code || house.code === VERSION) return;
  try {
    const req = new Request(`${LINK}widget.js`);
    req.timeoutInterval = 15;
    const code = await req.loadString();
    if (code.includes("const VERSION")) fm.writeString(KEPT, code);
  } catch {
    // tried again next time
  }
}

// A picture, fetched once and kept. Each address names one picture for good
// (photos never change; faces and the house's art carry a fingerprint).
async function picture(path) {
  if (!path) return undefined;
  const kept = file(`pic-${safe(path)}`);
  try {
    if (fm.fileExists(kept)) {
      const img = Image.fromFile(kept);
      if (img) return img;
    }
  } catch {
    // fetched again
  }
  try {
    const req = new Request(at(path));
    req.timeoutInterval = 15;
    const data = await req.load();
    let img = Image.fromData(data);
    let keep = data;
    // A made house's friends are drawn (SVG), which a widget can't show:
    // drawn once into a picture in a hidden web view, then kept like any
    // other, so it's only ever done once per friend.
    if (!img && /svg/.test(String((req.response && req.response.mimeType) || "")) && typeof WebView === "function") {
      keep = await fromSvg(data.toRawString());
      img = keep ? Image.fromData(keep) : null;
    }
    if (img) fm.write(kept, keep);
    return img || undefined;
  } catch {
    return undefined;
  }
}

async function fromSvg(svg) {
  try {
    const view = new WebView();
    await view.loadHTML("<body style='margin:0'></body>");
    const png = await view.evaluateJavaScript(`
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth * 2 || 360;
        c.height = img.naturalHeight * 2 || 484;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        completion(c.toDataURL("image/png").split(",")[1]);
      };
      img.onerror = () => completion("");
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(${JSON.stringify(svg)});
    `, true);
    return png ? Data.fromBase64String(png) : undefined;
  } catch {
    return undefined;
  }
}

// Once a day, pictures not fetched for six weeks go, so the folder doesn't
// grow for ever.
function tidy() {
  if (ageOf("tidied") < 24 * 60 * 60 * 1000 || typeof fm.listContents !== "function") return;
  try {
    for (const name of fm.listContents(DIR)) {
      if ((name.startsWith("pic-") || name.startsWith("cut-")) && ageOf(name) > 42 * 24 * 60 * 60 * 1000) fm.remove(file(name));
    }
    fm.writeString(file("tidied"), String(Date.now()));
  } catch {
    // next time
  }
}

// Whose turn it is: the next card each time the phone draws the widget.
function turn(count) {
  const n = Number(readKept("turn") || 0) || 0;
  try {
    fm.writeString(file("turn"), String(n + 1));
  } catch {
    // the same card again next time
  }
  return n % count;
}

// Her room, or wherever Shinzo is, cut from the house's own picture, with
// her sticker standing in it, dimmed at night where she lives. Kept once
// drawn, so it's drawn again only when something in it changes.
async function cut(card) {
  const key = `cut-${safe([card.picture, card.view.join("x"), card.sticker ? card.sticker.src : "", card.dog || "", card.at ? card.at.map(Math.round).join("x") : "", card.dark ? "night" : "day"].join("-"))}.jpg`;
  try {
    if (fm.fileExists(file(key))) {
      const img = Image.fromFile(file(key));
      if (img) return img;
    }
  } catch {
    // drawn again
  }
  const pic = await picture(card.picture);
  if (!pic) return undefined;
  const [x, y, w, h] = card.view;
  const ctx = new DrawContext();
  ctx.size = new Size(w, h);
  ctx.respectScreenScale = false;
  ctx.opaque = true;
  ctx.drawImageAtPoint(pic, new Point(-x, -y));
  if (card.dark) {
    ctx.setFillColor(new Color("#141a3c", 0.42));
    ctx.fillRect(new Rect(0, 0, w, h));
  }
  if (card.sticker) {
    const face = await picture(card.sticker.src);
    if (face) ctx.drawImageInRect(face, new Rect(card.sticker.at[0] - 36 - x, card.sticker.at[1] - 95 - y, 72, 97));
  }
  if (card.dog) {
    const dog = await picture(card.dog);
    if (dog) {
      // Where he's napping in the picture; otherwise curled up in the corner.
      const dw = card.at ? 120 : Math.round(w * 0.42);
      const dh = Math.round((dw * 92) / 160);
      const [dx, dy] = card.at ? [card.at[0] - x - dw / 2, card.at[1] - y - dh / 2] : [w - dw - 10, h - dh - 10];
      ctx.drawImageInRect(dog, new Rect(dx, dy, dw, dh));
    }
  }
  const img = ctx.getImage();
  try {
    fm.write(file(key), Data.fromJPEG(img));
  } catch {
    // drawn again next time
  }
  return img;
}

/* ---------- drawing ---------- */

function say(stack, text, font, color, lines) {
  const t = stack.addText(text);
  t.font = font;
  t.textColor = color;
  if (lines) t.lineLimit = lines;
  t.minimumScaleFactor = 0.8;
  return t;
}

function shadowed(t) {
  t.shadowColor = new Color("#000000", 0.7);
  t.shadowRadius = 3;
  return t;
}

function warm(w, top, bottom) {
  const g = new LinearGradient();
  g.colors = [new Color(top), new Color(bottom)];
  g.locations = [0, 1];
  w.backgroundGradient = g;
}

// A friend's face in a ring; a made house's drawn faces are SVG, which a
// widget can't show, so her initial instead.
async function faceIn(stack, path, edge, color, name) {
  const img = await picture(path);
  const ring = stack.addStack();
  ring.size = new Size(edge, edge);
  ring.cornerRadius = edge / 2;
  ring.backgroundColor = new Color("#f6e3c4");
  if (color) {
    ring.borderWidth = 2;
    ring.borderColor = new Color(color);
  }
  ring.centerAlignContent();
  if (img) {
    const i = ring.addImage(img);
    i.imageSize = new Size(edge, edge);
    i.applyFillingContentMode();
  } else if (name) {
    say(ring, [...name][0], Font.boldSystemFont(edge * 0.45), new Color(color || "#7a6150"), 1);
  }
  return ring;
}

// Who left it, then what: a note on her desk, or a plate saved for her.
async function left(w, card, size) {
  warm(w, "#fff8ec", "#fbe7cf");
  const top = w.addStack();
  top.centerAlignContent();
  await faceIn(top, card.face, size === "small" ? 26 : 30, card.color, card.by);
  top.addSpacer(6);
  say(top, card.by, Font.boldSystemFont(13), new Color(card.color), 1);
  top.addSpacer();
  if (card.emoji) say(top, card.emoji, Font.systemFont(size === "small" ? 22 : 26), ink, 1);
  w.addSpacer(size === "small" ? 6 : 8);
  say(w, card.title, Font.boldSystemFont(size === "small" ? 13 : 15), ink, 2);
  w.addSpacer(3);
  say(w, card.text, Font.mediumSystemFont(size === "small" ? 12 : 13), ink, size === "large" ? 8 : size === "small" ? 3 : 2);
  w.addSpacer();
  say(w, card.ago, Font.systemFont(10), soft, 1);
}

async function birthdayCard(w, card, size) {
  warm(w, "#ffe3ee", "#fff4d6");
  const face = await picture(card.face);
  if (size === "small") {
    const row = w.addStack();
    row.addSpacer();
    if (face) {
      const i = row.addImage(face);
      i.imageSize = new Size(62, 84);
    }
    row.addSpacer();
    w.addSpacer(4);
    const t = say(w, `🎂 ${card.title}`, Font.boldSystemFont(13), ink, 2);
    t.centerAlignText();
    return;
  }
  const row = w.addStack();
  row.centerAlignContent();
  if (face) {
    const i = row.addImage(face);
    i.imageSize = size === "large" ? new Size(130, 175) : new Size(92, 124);
    row.addSpacer(12);
  }
  const words = row.addStack();
  words.layoutVertically();
  say(words, "🎂 🎈 🎉", Font.systemFont(size === "large" ? 26 : 20), ink, 1);
  words.addSpacer(4);
  say(words, card.title, Font.boldSystemFont(size === "large" ? 22 : 17), ink, 2);
  words.addSpacer(4);
  say(words, card.line, Font.mediumSystemFont(13), soft, 3);
}

async function wallCard(w, card, size) {
  w.backgroundColor = new Color("#f3e2c7");
  const photos = [];
  for (const p of card.photos.slice(0, size === "small" ? 1 : size === "large" ? 4 : 3)) {
    const img = await picture(p.src);
    if (img) photos.push({ ...p, img });
  }
  if (size === "small" && photos[0]) {
    w.backgroundImage = photos[0].img;
    w.addSpacer();
    shadowed(say(w, "📌 The memory wall", Font.boldSystemFont(12), Color.white(), 1));
    shadowed(say(w, photos[0].caption ? `“${photos[0].caption}”` : `from ${photos[0].by}`, Font.mediumSystemFont(11), Color.white(), 2));
    return;
  }
  say(w, `📌 ${card.title}`, Font.boldSystemFont(size === "small" ? 12 : 14), ink, 1);
  w.addSpacer(6);
  if (photos.length) {
    const edge = size === "large" ? 140 : 88;
    let row;
    photos.forEach((p, i) => {
      if (i % (size === "large" ? 2 : 3) === 0) {
        if (row) w.addSpacer(8);
        row = w.addStack();
        row.spacing = 8;
      }
      const img = row.addImage(p.img);
      img.imageSize = new Size(edge, edge);
      img.applyFillingContentMode();
      img.cornerRadius = 6;
      img.borderWidth = 3;
      img.borderColor = Color.white();
    });
  }
  if (photos[0]) {
    w.addSpacer(6);
    say(w, photos[0].caption ? `“${photos[0].caption}” · ${photos[0].by}` : `from ${photos[0].by}`, Font.mediumSystemFont(12), ink, 2);
  }
  for (const n of card.notes.slice(0, photos.length ? (size === "large" ? 1 : 0) : 2)) {
    w.addSpacer(4);
    say(w, n.by, Font.boldSystemFont(11), new Color(n.color), 1);
    say(w, n.text, Font.mediumSystemFont(12), ink, size === "small" ? 3 : 2);
  }
  w.addSpacer();
}

async function pictureCard(w, card, size) {
  w.backgroundColor = cream;
  const img = await cut(card);
  if (size === "small" || !img) {
    if (img) {
      w.backgroundImage = img;
      w.addSpacer();
      shadowed(say(w, card.title, Font.boldSystemFont(13), Color.white(), 1));
      shadowed(say(w, card.line, Font.mediumSystemFont(11), Color.white(), 2));
    } else {
      say(w, card.title, Font.boldSystemFont(14), ink, 1);
      w.addSpacer(4);
      say(w, card.line, Font.mediumSystemFont(12), soft, 3);
    }
    return;
  }
  if (size === "large") {
    const i = w.addImage(img);
    i.applyFillingContentMode();
    i.cornerRadius = 10;
    w.addSpacer(8);
    say(w, card.title, Font.boldSystemFont(16), ink, 1);
    say(w, card.line, Font.mediumSystemFont(13), soft, 2);
    return;
  }
  const row = w.addStack();
  row.centerAlignContent();
  const i = row.addImage(img);
  i.imageSize = new Size(150, 134);
  i.applyFillingContentMode();
  i.cornerRadius = 10;
  row.addSpacer(12);
  const words = row.addStack();
  words.layoutVertically();
  say(words, card.title, Font.boldSystemFont(16), ink, 1);
  words.addSpacer(4);
  say(words, card.line, Font.mediumSystemFont(13), soft, 4);
}

async function everyoneCard(w, card, house, size) {
  warm(w, "#fff8ec", "#f6e3c4");
  const top = w.addStack();
  top.centerAlignContent();
  say(top, card.title, Font.boldSystemFont(size === "small" ? 12 : 14), ink, 1);
  top.addSpacer();
  // Whose widget this is, so a phone that's someone else's is plain to see.
  if (house.for && size !== "small") say(top, `${house.for}'s window`, Font.mediumSystemFont(10), soft, 1);
  w.addSpacer();
  const edge = size === "small" ? 30 : size === "large" ? 48 : 38;
  const perRow = size === "small" ? 3 : house.friends.length;
  let row;
  for (let i = 0; i < house.friends.length; i++) {
    const f = house.friends[i];
    if (i % perRow === 0) {
      if (row) w.addSpacer(6);
      row = w.addStack();
      row.centerAlignContent();
    }
    const cell = row.addStack();
    cell.layoutVertically();
    cell.centerAlignContent();
    const ring = await faceIn(cell, f.face, edge, f.home ? f.color : undefined, f.name);
    if (!f.day) ring.backgroundColor = new Color("#2f2740");
    const t = say(cell, f.asleep ? `${f.time} 💤` : f.time, Font.mediumSystemFont(size === "small" ? 8 : 10), f.home ? ink : soft, 1);
    t.centerAlignText();
    if ((i + 1) % perRow !== 0 && i < house.friends.length - 1) row.addSpacer();
  }
  w.addSpacer();
}

// The lock screen's little spaces get a line of words.
function accessory(w, card) {
  const words = {
    birthday: `🎂 ${card.title}`,
    desk: `💌 ${card.title}`,
    plate: `🍱 ${card.title}`,
    wall: `📌 ${card.title}`,
    room: `🛏️ ${card.line}`,
    everyone: `🏠 ${card.title}`,
    dog: `🐾 ${card.line}`,
  }[card.kind] || card.title;
  say(w, words, Font.mediumSystemFont(12), Color.white(), 2);
}

function message(w, text) {
  w.backgroundColor = cream;
  say(w, text, Font.mediumSystemFont(13), soft, 4);
}

async function build() {
  const w = new ListWidget();
  w.setPadding(12, 12, 12, 12);
  const size = config.widgetFamily || "medium";
  const house = await load();
  if (!house) {
    message(w, "The house couldn't be reached. It'll try again soon.");
    return w;
  }
  if (house.error) {
    message(w, house.error);
    return w;
  }
  await update(house);
  const cards = house.cards && house.cards.length ? house.cards : [{ kind: "everyone", title: house.house, open: house.open }];
  const card = cards[turn(cards.length)];
  w.url = at(card.open || house.open);
  if (size.startsWith("accessory")) accessory(w, card);
  else if (card.kind === "birthday") await birthdayCard(w, card, size);
  else if (card.kind === "desk" || card.kind === "plate") await left(w, card, size);
  else if (card.kind === "wall") await wallCard(w, card, size);
  else if (card.kind === "room" || card.kind === "dog") await pictureCard(w, card, size);
  else await everyoneCard(w, card, house, size);
  tidy();
  return w;
}

const widget = await build();
widget.refreshAfterDate = new Date(Date.now() + AGAIN);
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
