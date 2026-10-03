// The house works without this file: rooms are links and everything else is a
// form. This only makes it nicer. Nobody moves on their own; you walk
// yourself around:
// - on a keyboard with the arrow keys or WASD, and Enter (or E) goes into the
//   room you're standing in;
// - on a phone or tablet with a thumb stick, and a Go in button;
// - by tapping a room, which walks you there before the room opens.
// On a phone the house is wider than the screen, so the view follows you.
(() => {
  const svg = document.querySelector(".house-svg");
  const me = svg?.querySelector(".walker.me");
  if (!svg || !me) return;

  const map = svg.closest(".map");
  const people = me.parentNode;
  const view = svg.viewBox.baseVal;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spot = (g) => g.transform.baseVal.consolidate()?.matrix ?? { e: 0, f: 0 };

  const rooms = [...svg.querySelectorAll("a.room-link")].map((link) => ({
    link,
    place: link.dataset.place,
    go: link.dataset.go,
    outline: link.querySelector("polygon").getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number)),
  }));
  // On a room's page, the room you're already in.
  const current = svg.querySelector("a.room-link[aria-current=page]")?.dataset.place;
  const others = [...people.children].filter((g) => g !== me).map((g) => ({ g, y: spot(g).f }));

  const start = spot(me);
  let x = start.e;
  let y = start.f;

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
    p[0] > view.x + 30 &&
    p[0] < view.x + view.width - 30 &&
    p[1] > view.y + 92 &&
    p[1] < view.y + view.height - 8 &&
    rooms.some((r) => inside(p, r.outline) || near(p, r.outline, WALL));

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
    return r && r.place !== current ? r : undefined;
  };

  function showGo() {
    const r = target();
    goButton.hidden = !r;
    if (r) goLabel.textContent = r.go;
  }

  const enter = (r) => location.assign(r.link.getAttribute("href"));
  goButton.addEventListener("click", () => {
    const r = target();
    if (r) enter(r);
  });

  /* ---------- moving ---------- */

  function draw() {
    me.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    // Stand in front of anyone further up the picture, and behind anyone
    // further down. Only move in the page when that changes, since moving
    // restarts the sticker's bob.
    const behind = others.find((o) => o.y > y)?.g ?? null;
    if (me.nextSibling !== behind) people.insertBefore(me, behind);
    follow();
    showGo();
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
    if (!dx && !dy) {
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
    if (walking) return;
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
      keys.add(way);
      walk();
      return;
    }
    // Enter on a focused link or button already does its own thing.
    const focused = document.activeElement;
    if ((event.code === "Enter" || event.code === "KeyE") && (!focused || focused === document.body)) {
      const r = target();
      if (r) {
        event.preventDefault();
        enter(r);
      }
    }
  });
  addEventListener("keyup", (event) => keys.delete(KEYS[event.code]));
  addEventListener("blur", () => keys.clear());

  /* ---------- thumb stick ---------- */

  function push(event) {
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
  const letGo = () => {
    stick = [0, 0];
    knob.style.transform = "";
  };
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
    if (still || roomAt([x, y])?.link === link) return;
    event.preventDefault();
    const [tx, ty] = link.dataset.walk.split(",").map(Number);
    const [fx, fy] = [x, y];
    const ms = Math.min(1100, Math.max(450, Math.hypot(tx - fx, ty - fy) * 1.4));
    const begun = performance.now();
    me.classList.add("walking");
    const glide = (now) => {
      const k = Math.min(1, (now - begun) / ms);
      const eased = k < 0.5 ? 2 * k * k : 1 - (2 - 2 * k) ** 2 / 2;
      x = fx + (tx - fx) * eased;
      y = fy + (ty - fy) * eased;
      draw();
      if (k < 1) requestAnimationFrame(glide);
      else location.assign(link.getAttribute("href"));
    };
    requestAnimationFrame(glide);
  });

  // Coming back with the browser's back button can restore the page mid-walk.
  addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    [x, y] = [start.e, start.f];
    keys.clear();
    letGo();
    me.classList.remove("walking");
    draw();
  });

  // Start with you in view, and the way into the room you're standing in.
  if (map.scrollWidth > map.clientWidth) {
    const you = me.getBoundingClientRect();
    const box = map.getBoundingClientRect();
    map.scrollLeft += you.left + you.width / 2 - (box.left + box.width / 2);
  }
  showGo();
})();
