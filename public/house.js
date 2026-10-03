// The house works without this file: rooms are links and everything else is a
// form. This only makes it nicer. Nobody moves on their own; you walk
// yourself around:
// - on a keyboard with the arrow keys or WASD, and Enter (or E) goes into the
//   room you're standing in;
// - on a phone or tablet with a thumb stick, and a Go in button;
// - by tapping a room, which walks you there before the room opens.
// Going into a room zooms in on it, and walking out of the room you're in
// zooms back out to the whole house, with you where you stepped out. Shinzo
// trots after whoever last petted him. On a phone the house is wider than
// the screen, so the view follows you.
//
// Walk up to something you can do something with (a bed, a desk, the wall,
// Shinzo) and it lights up, with a button for each thing you can do there,
// each with its little emoji. Doing it pops the emoji up over the thing.
// Wherever you stop walking, the house keeps: you're still there next time,
// and friends find you there.
(() => {
  const svg = document.querySelector(".house-svg");
  const me = svg?.querySelector(".walker.me");
  if (!svg || !me) return;

  const map = svg.closest(".map");
  const people = me.parentNode;
  const view = svg.viewBox.baseVal;
  const startView = svg.getAttribute("viewBox");
  const picture = svg.querySelector("image");
  const W = picture.width.baseVal.value;
  const H = picture.height.baseVal.value;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spot = (g) => g.transform.baseVal.consolidate()?.matrix ?? { a: 1, e: 0, f: 0 };
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (2 - 2 * k) ** 2 / 2);

  const points = (g) => g.querySelector("polygon").getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number));
  const rooms = [...svg.querySelectorAll("a.room-link")].map((link) => ({
    link,
    place: link.dataset.place,
    go: link.dataset.go,
    view: link.dataset.view.split(" ").map(Number),
    outline: points(link),
  }));
  // On a room's page, the room you're in.
  const current = rooms.find((r) => r.link.getAttribute("aria-current") === "page");
  // The things you can do something with (src/scene.ts), and what you can do.
  const things = [...svg.querySelectorAll("g.act")].map((g) => ({ g, place: g.dataset.place, doings: JSON.parse(g.dataset.do), outline: points(g) }));
  const others = [...people.children].filter((g) => g !== me).map((g) => ({ g, y: spot(g).f }));

  const start = spot(me);
  let x = start.e;
  let y = start.f;
  // Walking yourself somewhere on your own, or zooming: hands off.
  let busy = false;

  /* ---------- where you can stand ---------- */

  const inside = ([px, py], outline) => {
    let hit = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const [xi, yi] = outline[i];
      const [xj, yj] = outline[j];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };

  const fromEdge = ([px, py], outline) =>
    Math.min(
      ...outline.map(([ax, ay], i) => {
        const [bx, by] = outline[(i + 1) % outline.length];
        const dx = bx - ax;
        const dy = by - ay;
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(px - ax - t * dx, py - ay - t * dy);
      }),
    );
  const near = (p, outline, r) => fromEdge(p, outline) < r;

  // The walls between rooms are gaps between their outlines, up to about 50
  // wide. You walk straight through them, so there's never a door to hunt
  // for. Your head stays in the picture.
  const WALL = 28;
  const walkable = (p) =>
    p[0] > 30 && p[0] < W - 30 && p[1] > 92 && p[1] < H - 8 && rooms.some((r) => inside(p, r.outline) || near(p, r.outline, WALL));

  const roomAt = (p) => rooms.find((r) => inside(p, r.outline));

  /* ---------- the controls ---------- */

  const pad = document.createElement("div");
  pad.className = "pad";
  pad.innerHTML = `<div class="stick" aria-hidden="true"><span class="knob"></span></div><p class="keys-hint">Walk with the arrow keys or WASD</p><div class="moves"><button type="button" class="go" hidden><span class="go-label"></span> <kbd>Enter</kbd></button></div>`;
  map.append(pad);
  const stickEl = pad.querySelector(".stick");
  const knob = pad.querySelector(".knob");
  const moves = pad.querySelector(".moves");
  const goButton = pad.querySelector(".go");
  const goLabel = pad.querySelector(".go-label");
  const goKey = goButton.querySelector("kbd");

  const touchy = () => pad.classList.add("touch");
  if (matchMedia("(pointer: coarse)").matches) touchy();
  addEventListener("touchstart", touchy, { once: true, passive: true });

  const remember = (key) => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      // private browsing; the hint just comes back next time
    }
  };
  try {
    if (localStorage.getItem("five-windows-walked")) pad.querySelector(".keys-hint").remove();
  } catch {
    // keep the hint
  }

  // The room you'd go into from where you're standing; inside a wall, the one
  // you just left. On a room's own page, only somewhere else counts.
  let lastRoom;
  const target = () => {
    const r = (lastRoom = roomAt([x, y]) ?? lastRoom);
    return r && r !== current ? r : undefined;
  };

  function showGo() {
    const r = target();
    goButton.hidden = !r;
    if (r) goLabel.textContent = r.go;
  }

  goButton.addEventListener("click", () => {
    const r = target();
    if (r && !busy) enter(r);
  });

  /* ---------- zooming ---------- */

  // Zoom so `to` (x, y, width, height in the picture's pixels) fills the part
  // of the house you can see, then carry on.
  function zoom(to, then) {
    if (still) return then();
    const box = svg.getBoundingClientRect();
    // Hold the drawing's size on the page while its viewBox changes.
    Object.assign(svg.style, { width: `${box.width}px`, height: `${box.height}px`, maxWidth: "none", maxHeight: "none", aspectRatio: "auto" });
    // A phone's house is wider than the screen; only what's on it counts.
    const seenW = Math.min(box.width, map.clientWidth);
    const scale = Math.min(seenW / to[2], box.height / to[3]);
    const end = [
      to[0] + to[2] / 2 - (map.scrollLeft + seenW / 2) / scale,
      to[1] + to[3] / 2 - box.height / 2 / scale,
      box.width / scale,
      box.height / scale,
    ];
    const from = [view.x, view.y, view.width, view.height];
    const begun = performance.now();
    const frame = (now) => {
      const k = Math.min(1, (now - begun) / 550);
      svg.setAttribute("viewBox", from.map((a, i) => (a + (end[i] - a) * ease(k)).toFixed(2)).join(" "));
      if (k < 1) requestAnimationFrame(frame);
      else then();
    };
    requestAnimationFrame(frame);
  }

  const hold = () => {
    busy = true;
    keys.clear();
    letGo();
  };

  function enter(r) {
    hold();
    zoom(r.view, () => location.assign(r.link.getAttribute("href")));
  }

  // Walking out of the room you're in goes back to the whole house, and you
  // carry on from where you stepped out.
  const CARRY = "five-windows-at";
  function leave() {
    hold();
    keep();
    try {
      sessionStorage.setItem(CARRY, JSON.stringify({ person: me.dataset.person, x, y, at: Date.now() }));
    } catch {
      // you'll start back at your spot instead
    }
    zoom([0, 0, W, H], () => location.assign("/"));
  }

  /* ---------- Shinzo ---------- */

  // He trots after you if you were the last to pet him or feed him, a step
  // behind, on whichever side you're walking away from.
  const laddoo = svg.querySelector(`g.laddoo[data-with="${me.dataset.person}"]`);
  const dogScale = laddoo ? spot(laddoo).a : 1;
  let dog = laddoo ? [spot(laddoo).e, spot(laddoo).f] : undefined;
  let side = 1;
  let trotting = false;
  let trotted = 0;
  const besideYou = () => [x + side * 50, y + 6];
  const putDog = () => laddoo.setAttribute("transform", `translate(${dog[0].toFixed(1)} ${dog[1].toFixed(1)}) scale(${dogScale})`);

  function trot(now) {
    const [tx, ty] = besideYou();
    const k = still ? 1 : 1 - Math.exp(-5 * Math.min(0.05, (now - trotted) / 1000));
    trotted = now;
    dog = [dog[0] + (tx - dog[0]) * k, dog[1] + (ty - dog[1]) * k];
    putDog();
    trotting = Math.hypot(tx - dog[0], ty - dog[1]) > 0.5;
    if (trotting) requestAnimationFrame(trot);
  }

  function heel() {
    if (!laddoo || trotting) return;
    trotting = true;
    trotted = performance.now();
    requestAnimationFrame(trot);
  }

  /* ---------- where you are ---------- */

  // Where you stop is where you are: the house keeps it, so you (and Shinzo,
  // if he's with you) are still there next time, and friends find you there.
  let kept = [x, y];
  function keep() {
    if (Math.abs(x - kept[0]) < 1 && Math.abs(y - kept[1]) < 1) return;
    kept = [x, y];
    try {
      navigator.sendBeacon("/here", new URLSearchParams({ x: x.toFixed(0), y: y.toFixed(0) }));
    } catch {
      // kept the next time you stop instead
    }
  }
  addEventListener("pagehide", keep);

  // Sitting down or asleep in a bed, you get up as soon as you walk.
  const getUp = () => me.classList.remove("resting", "napping", "sitting");

  /* ---------- things you can do ---------- */

  // Shinzo is one of them, wherever he is, unless he's already at your heels.
  const pup = laddoo ? null : svg.querySelector("g.laddoo[data-do]");
  if (pup) things.push({ g: pup, place: pup.dataset.place, doings: JSON.parse(pup.dataset.do), dog: true });

  // Close enough to reach: on it, or about a step away.
  const REACH = 30;
  function nearest() {
    if (me.classList.contains("resting")) return undefined;
    let best;
    let gap = REACH;
    for (const t of things) {
      const d = t.dog
        ? Math.max(0, Math.hypot(x - spot(t.g).e, y - spot(t.g).f) - 70 * spot(t.g).a)
        : inside([x, y], t.outline) ? 0 : fromEdge([x, y], t.outline);
      if (d < gap) [best, gap] = [t, d];
    }
    return best;
  }

  // Light up the nearest thing, and put a button in the pad for each thing
  // you can do with it. Enter does the first; the number keys the rest.
  let lit;
  function showDoings() {
    const t = nearest();
    if (t === lit) return;
    lit?.g.classList.remove("near");
    lit = t;
    t?.g.classList.add("near");
    for (const b of moves.querySelectorAll(".do")) b.remove();
    t?.doings.forEach((d, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "do";
      b.innerHTML = `<span class="emoji" aria-hidden="true"></span> <span class="label"></span> <kbd>${i ? i + 1 : "Enter"}</kbd>`;
      b.querySelector(".emoji").textContent = d.emoji;
      b.querySelector(".label").textContent = d.label;
      b.addEventListener("click", () => act(t, d));
      moves.insertBefore(b, goButton);
    });
    goKey.hidden = Boolean(t);
  }

  // The thing's emoji pops up over it as you do it (the page you land on pops
  // up what came of it).
  function popUp(t, emoji) {
    const NS = "http://www.w3.org/2000/svg";
    let layer = svg.querySelector("g.pops");
    if (!layer) {
      layer = document.createElementNS(NS, "g");
      layer.setAttribute("class", "pops");
      layer.setAttribute("aria-hidden", "true");
      svg.append(layer);
    }
    let at;
    if (t.dog) {
      // Over his back, as on the page you land on (src/scene.ts).
      const m = spot(t.g);
      at = [m.e + 14, m.f - 46 * m.a - 4];
    } else {
      const box = t.g.querySelector("polygon").getBBox();
      at = [box.x + box.width / 2, box.y + box.height / 2];
    }
    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", "pop");
    text.setAttribute("x", at[0].toFixed(0));
    text.setAttribute("y", at[1].toFixed(0));
    text.setAttribute("font-size", "34");
    text.textContent = emoji;
    layer.append(text);
  }

  // Do it: a form posts, a link goes there. Something in another room zooms
  // in on that room on the way, like going in; otherwise there's a moment to
  // see the emoji first. Petting Shinzo, or giving him a treat, wakes him up
  // there and then.
  function act(t, d) {
    if (busy) return;
    popUp(t, d.emoji);
    if (t.dog) {
      t.g.classList.add("awake");
      for (const z of t.g.querySelectorAll(".zz")) z.remove();
    }
    const fields = { ...d.fields };
    // Shinzo is wherever he is now, which may not be where the page drew him.
    if (t.dog) fields.at = roomAt([spot(t.g).e, spot(t.g).f])?.place ?? fields.at;
    const there = rooms.find((r) => r.place === (fields.at ?? t.place));
    const go = () => {
      if (d.href) {
        const to = new URL(d.href, location.href);
        if (to.pathname !== location.pathname) return location.assign(to);
        // Already here: just scroll to it.
        busy = false;
        const target = document.getElementById(to.hash.slice(1));
        target?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
        target?.querySelector("textarea")?.focus({ preventScroll: true });
        return;
      }
      const form = document.createElement("form");
      form.method = "post";
      form.action = d.post;
      form.hidden = true;
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    };
    hold();
    keep();
    if (there && there !== current) zoom(there.view, go);
    else setTimeout(go, still ? 0 : 500);
  }

  /* ---------- moving ---------- */

  let lastX = x;
  function draw() {
    me.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    // Stand in front of anyone further up the picture, and behind anyone
    // further down. Only move in the page when that changes, since moving
    // restarts the sticker's bob.
    const behind = others.find((o) => o.y > y)?.g ?? null;
    if (me.nextSibling !== behind) people.insertBefore(me, behind);
    if (x > lastX + 0.01) side = -1;
    else if (x < lastX - 0.01) side = 1;
    lastX = x;
    heel();
    follow();
    showGo();
    showDoings();
    if (current && !busy && !inside([x, y], current.outline) && !near([x, y], current.outline, 10)) leave();
  }

  // Keep you in the middle part of a phone's screen.
  function follow() {
    if (!map || map.scrollWidth <= map.clientWidth) return;
    const scale = svg.getBoundingClientRect().width / view.width;
    const at = (x - view.x) * scale - map.scrollLeft;
    const edge = map.clientWidth * 0.3;
    if (at < edge) map.scrollLeft -= edge - at;
    else if (at > map.clientWidth - edge) map.scrollLeft += at - (map.clientWidth - edge);
  }

  const keys = new Set();
  let stick = [0, 0];
  let walking = false;
  let last = 0;
  // About a fifth of the view a second, so a room page feels the same pace.
  const speed = view.width * 0.22;

  function heading() {
    let dx = stick[0];
    let dy = stick[1];
    if (keys.has("left")) dx -= 1;
    if (keys.has("right")) dx += 1;
    if (keys.has("up")) dy -= 1;
    if (keys.has("down")) dy += 1;
    const length = Math.hypot(dx, dy);
    return length > 1 ? [dx / length, dy / length] : [dx, dy];
  }

  function step(now) {
    const [dx, dy] = heading();
    if (busy || (!dx && !dy)) {
      walking = false;
      me.classList.remove("walking");
      keep();
      return;
    }
    const seconds = Math.min(0.05, (now - last) / 1000);
    last = now;
    const nx = x + dx * speed * seconds;
    const ny = y + dy * speed * seconds;
    // Somewhere you can't stand, like a spot you arrived at by tapping,
    // never traps you.
    if (!walkable([x, y]) || walkable([nx, ny])) [x, y] = [nx, ny];
    else if (walkable([nx, y])) x = nx;
    else if (walkable([x, ny])) y = ny;
    draw();
    requestAnimationFrame(step);
  }

  function walk() {
    if (walking || busy) return;
    walking = true;
    last = performance.now();
    getUp();
    me.classList.add("walking");
    pad.querySelector(".keys-hint")?.remove();
    remember("five-windows-walked");
    requestAnimationFrame(step);
  }

  /* ---------- keyboard ---------- */

  const KEYS = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
  };
  const typing = (el) => el instanceof Element && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  const inView = () => {
    const box = svg.getBoundingClientRect();
    return box.bottom > 80 && box.top < innerHeight - 80;
  };

  addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || typing(event.target) || !inView()) return;
    const way = KEYS[event.code];
    if (way) {
      event.preventDefault();
      if (busy) return;
      keys.add(way);
      walk();
      return;
    }
    // Enter on a focused link or button already does its own thing.
    const focused = document.activeElement;
    if (focused && focused !== document.body) return;
    // Enter (or E) does the first thing you can do with what's lit up, and
    // the number keys the others; otherwise it goes into the room.
    const n = event.code === "Enter" || event.code === "KeyE" ? 1 : /^Digit[1-9]$/.test(event.code) ? Number(event.code.slice(5)) : 0;
    if (!n || busy) return;
    if (lit?.doings[n - 1]) {
      event.preventDefault();
      act(lit, lit.doings[n - 1]);
      return;
    }
    const r = n === 1 && target();
    if (r) {
      event.preventDefault();
      enter(r);
    }
  });
  addEventListener("keyup", (event) => keys.delete(KEYS[event.code]));
  addEventListener("blur", () => keys.clear());

  /* ---------- thumb stick ---------- */

  function push(event) {
    if (busy) return;
    const box = stickEl.getBoundingClientRect();
    const r = box.width / 2;
    let dx = (event.clientX - box.left - r) / r;
    let dy = (event.clientY - box.top - r) / r;
    const length = Math.hypot(dx, dy);
    if (length > 1) [dx, dy] = [dx / length, dy / length];
    // A light push walks slowly, all the way runs; the middle is still.
    stick = length < 0.18 ? [0, 0] : [dx, dy];
    knob.style.transform = `translate(${dx * r * 0.55}px, ${dy * r * 0.55}px)`;
    if (stick[0] || stick[1]) walk();
  }
  function letGo() {
    stick = [0, 0];
    knob.style.transform = "";
  }
  stickEl.addEventListener("pointerdown", (event) => {
    stickEl.setPointerCapture(event.pointerId);
    push(event);
  });
  stickEl.addEventListener("pointermove", (event) => {
    if (stickEl.hasPointerCapture(event.pointerId)) push(event);
  });
  stickEl.addEventListener("pointerup", letGo);
  stickEl.addEventListener("pointercancel", letGo);
  stickEl.addEventListener("lostpointercapture", letGo);

  /* ---------- tapping a room ---------- */

  svg.addEventListener("click", (event) => {
    const link = event.target.closest("a.room-link");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const r = rooms.find((room) => room.link === link);
    if (still || r === current) return;
    event.preventDefault();
    if (busy) return;
    if (roomAt([x, y]) === r) return enter(r);
    hold();
    getUp();
    const [tx, ty] = link.dataset.walk.split(",").map(Number);
    const [fx, fy] = [x, y];
    const ms = Math.min(1100, Math.max(450, Math.hypot(tx - fx, ty - fy) * 1.4));
    const begun = performance.now();
    me.classList.add("walking");
    const glide = (now) => {
      const k = Math.min(1, (now - begun) / ms);
      x = fx + (tx - fx) * ease(k);
      y = fy + (ty - fy) * ease(k);
      draw();
      if (k < 1) return requestAnimationFrame(glide);
      me.classList.remove("walking");
      enter(r);
    };
    requestAnimationFrame(glide);
  });

  // In a room, every way back to the whole house zooms out on the way.
  if (current) {
    for (const link of document.querySelectorAll('a[href="/"]')) {
      link.addEventListener("click", (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || still) return;
        event.preventDefault();
        if (!busy) leave();
      });
    }
  }

  // Coming back with the browser's back button can restore the page mid-walk
  // or mid-zoom.
  addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    svg.setAttribute("viewBox", startView);
    svg.removeAttribute("style");
    [x, y] = [start.e, start.f];
    keys.clear();
    letGo();
    me.classList.remove("walking");
    busy = false;
    draw();
  });

  /* ---------- arriving ---------- */

  // Back in the whole house after walking out of a room: pick up where you
  // stepped out.
  try {
    const carried = JSON.parse(sessionStorage.getItem(CARRY) ?? "null");
    sessionStorage.removeItem(CARRY);
    if (!current && carried?.person === me.dataset.person && Date.now() - carried.at < 20000 && walkable([carried.x, carried.y])) {
      [x, y] = [carried.x, carried.y];
      lastX = x;
      if (dog) [dog[0], dog[1]] = besideYou();
      // In case the house hadn't heard where you stepped out yet.
      keep();
    }
  } catch {
    // start at your spot
  }
  if (dog) putDog();
  draw();

  // Arriving at something to write, like the wall from "Write on the wall",
  // puts you straight in it.
  if (location.hash) document.getElementById(location.hash.slice(1))?.querySelector("textarea")?.focus({ preventScroll: true });

  // Start with you in view.
  if (map.scrollWidth > map.clientWidth) {
    const you = me.getBoundingClientRect();
    const box = map.getBoundingClientRect();
    map.scrollLeft += you.left + you.width / 2 - (box.left + box.width / 2);
  }
})();
