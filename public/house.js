// The house works without this file: rooms are links and everything else is a
// form. This only makes it nicer. Nobody moves on their own; you walk
// yourself around:
// - on a keyboard with the arrow keys or WASD, and Enter (or E) goes into the
//   room you're standing in;
// - on a phone or tablet with a thumb stick, and a Go in button;
// - by tapping a room, which walks you there before the room opens.
// Going into a room zooms in on it, and walking out of the room you're in
// zooms back out to the whole house, with you where you stepped out. Laddoo
// trots after whoever last petted him. On a phone the house is wider than
// the screen, so the view follows you.
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

  const rooms = [...svg.querySelectorAll("a.room-link")].map((link) => ({
    link,
    place: link.dataset.place,
    go: link.dataset.go,
    view: link.dataset.view.split(" ").map(Number),
    outline: link.querySelector("polygon").getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number)),
  }));
  // On a room's page, the room you're in.
  const current = rooms.find((r) => r.link.getAttribute("aria-current") === "page");
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

  const near = ([px, py], outline, r) =>
    outline.some(([ax, ay], i) => {
      const [bx, by] = outline[(i + 1) % outline.length];
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(px - ax - t * dx, py - ay - t * dy) < r;
    });

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
  pad.innerHTML = `<div class="stick" aria-hidden="true"><span class="knob"></span></div><p class="keys-hint">Walk with the arrow keys or WASD</p><button type="button" class="go" hidden><span class="go-label"></span> <kbd>Enter</kbd></button>`;
  map.append(pad);
  const stickEl = pad.querySelector(".stick");
  const knob = pad.querySelector(".knob");
  const goButton = pad.querySelector(".go");
  const goLabel = pad.querySelector(".go-label");

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
    try {
      sessionStorage.setItem(CARRY, JSON.stringify({ person: me.dataset.person, x, y, at: Date.now() }));
    } catch {
      // you'll start back at your spot instead
    }
    zoom([0, 0, W, H], () => location.assign("/"));
  }

  /* ---------- Laddoo ---------- */

  // He trots after you if you were the last to pet him, a step behind,
  // on whichever side you're walking away from.
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
    if ((event.code === "Enter" || event.code === "KeyE") && (!focused || focused === document.body)) {
      const r = target();
      if (r && !busy) {
        event.preventDefault();
        enter(r);
      }
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
    }
  } catch {
    // start at your spot
  }
  if (dog) putDog();
  draw();

  // Start with you in view.
  if (map.scrollWidth > map.clientWidth) {
    const you = me.getBoundingClientRect();
    const box = map.getBoundingClientRect();
    map.scrollLeft += you.left + you.width / 2 - (box.left + box.width / 2);
  }
})();
