// The house works without this file: rooms are links and everything else is a
// form. This only makes it nicer. Nobody moves on their own; you walk
// yourself around:
// - on a keyboard with the arrow keys or WASD, and Enter (or E) goes into the
//   room you're standing in;
// - on a phone or tablet with a thumb stick, and a Go in button;
// - by tapping a room, which walks you there before the room opens.
// Going into a room zooms in on it, and walking out of the room you're in
// zooms back out to the whole house, with you where you stepped out. On a
// phone the house is wider than the screen, so the view follows you.
//
// Walk up to something you can do something with (a bed, a desk, the wall,
// Shinzo, a friend to hug) and it lights up, with a button for each thing you
// can do there, each with its little emoji. Doing it pops the emoji up over
// the thing. Sitting down, only what you can do from your seat is offered
// (UNO, on Amirdhavarshini's mat).
//
// The house is live (public/live.js, ADR 0010): friends who are here walk on
// your screen as they walk on theirs, and whatever changes is swapped into
// the drawing without a reload, while you carry on walking. Wherever you
// stop, the house keeps; while you walk it hears where you are a few times a
// second, so friends see you go.
//
// Shinzo has his own day (src/house.ts wander): he walks the path the page
// gives him by the clock, so everyone sees him in the same place, and trots
// after whoever last petted or fed him.
(() => {
  const svg = document.querySelector(".house-svg");
  let me = svg?.querySelector(".walker.me");
  if (!svg || !me) return;

  const NS = "http://www.w3.org/2000/svg";
  const map = svg.closest(".map");
  const myId = me.dataset.person;
  const view = svg.viewBox.baseVal;
  const startView = svg.getAttribute("viewBox");
  const picture = svg.querySelector("image");
  const W = picture.width.baseVal.value;
  const H = picture.height.baseVal.value;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spot = (g) => g.transform.baseVal.consolidate()?.matrix ?? { a: 1, e: 0, f: 0 };
  const where = (g) => {
    const m = spot(g);
    return [m.e, m.f];
  };
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (2 - 2 * k) ** 2 / 2);
  const people = () => svg.querySelector("g.people");

  const points = (g) => g.querySelector("polygon").getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number));
  // The room links never change, so a live update leaves them be.
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
  // `seated` ones are for someone sitting down. Read again after every live
  // update.
  let things = [];
  function scan() {
    things = [...svg.querySelectorAll("g.act")].map((g, i) => ({
      id: `act:${i}`,
      g,
      place: g.dataset.place,
      doings: JSON.parse(g.dataset.do),
      outline: points(g),
      seated: g.classList.contains("seated"),
    }));
  }
  scan();

  const start = spot(me);
  let x = start.e;
  let y = start.f;
  // Walking yourself somewhere on your own, or zooming: hands off.
  let busy = false;
  // Walking under your own steam, right now.
  let walking = false;

  const refresh = () => document.dispatchEvent(new CustomEvent("house:refresh"));

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

  // Whoever's further down the picture is drawn in front.
  function order(g) {
    const group = people();
    if (!group || g.parentNode !== group) return;
    const y0 = where(g)[1];
    const behind = [...group.children].find((o) => o !== g && where(o)[1] > y0) ?? null;
    if (g.nextSibling !== behind) group.insertBefore(g, behind);
  }

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
      sessionStorage.setItem(CARRY, JSON.stringify({ person: myId, x, y, at: Date.now() }));
    } catch {
      // you'll start back at your spot instead
    }
    zoom([0, 0, W, H], () => location.assign("/"));
  }

  /* ---------- Shinzo ---------- */

  // His standing drawing faces left at scale(1 1); `face` is 1 for left and
  // -1 for right. Curled up, his picture is its own size only on his blanket
  // under the tree.
  const blanketAt = () => svg.querySelector("g.blanket")?.dataset.at?.split(",").map(Number);
  const dog = { g: null, path: [], offset: 0, with: "", mine: false, pos: [0, 0], face: 1, thing: null, timer: 0, frame: 0, ranOut: false, pose: "" };
  let side = 1;
  let trotting = false;
  let trotted = 0;
  const besideYou = () => [x + side * 50, y + 6];

  function putDog() {
    if (!dog.g) return;
    dog.g.setAttribute("transform", `translate(${dog.pos[0].toFixed(1)} ${dog.pos[1].toFixed(1)})`);
    dog.g.querySelector(".facing")?.setAttribute("transform", `scale(${dog.face} 1)`);
  }

  // Up (standing or walking) or curled up napping, and his blanket with it.
  function dogPose(pose) {
    if (pose === dog.pose) return;
    dog.pose = pose;
    const napping = pose === "nap";
    dog.g.classList.toggle("napping", napping);
    dog.g.classList.toggle("awake", !napping);
    dog.g.classList.toggle("walking", pose === "walk");
    svg.querySelector("g.blanket")?.classList.toggle("covered", napping);
    if (napping) {
      const k = blanketAt();
      const home = k && Math.abs(dog.pos[0] - k[0]) < 1 && Math.abs(dog.pos[1] - k[1]) < 1;
      dog.g.querySelector(".lying")?.setAttribute("transform", `scale(${home ? 1 : 0.62})`);
    }
  }

  const stopDog = () => {
    clearTimeout(dog.timer);
    cancelAnimationFrame(dog.frame);
  };

  // His own day, by the house's clock: where the path says he is now. The
  // first stretch with a friend (not you) is beside her, wherever she's got
  // to, and he sets off from there when his time with her is up.
  function tick() {
    stopDog();
    if (!dog.g || dog.mine || !dog.path.length) return;
    const t = Date.now() + dog.offset;
    const path = dog.path;
    let i = 0;
    while (i + 1 < path.length && path[i + 1][0] <= t) i++;
    const [t0, x0, y0, pose] = path[i];
    const next = path[i + 1];
    let pos;
    let shown = pose === "walk" && !next ? "stand" : pose;
    if (dog.with && i === 0 && pose !== "walk") {
      const friend = people()?.querySelector(`.walker[data-person="${CSS.escape(dog.with)}"], .sitter[data-person="${CSS.escape(dog.with)}"]`);
      if (friend) {
        const [fx, fy] = where(friend);
        pos = [fx + 50, fy + 6];
        if (next) [next[1], next[2]] = pos;
      }
    }
    if (!pos && pose === "walk" && next) {
      if (Math.abs(next[1] - x0) > 1) dog.face = next[1] < x0 ? 1 : -1;
      if (still) {
        // No walking under reduced motion: he's just there.
        pos = [next[1], next[2]];
        shown = "stand";
      } else {
        const k = Math.max(0, Math.min(1, (t - t0) / (next[0] - t0)));
        pos = [x0 + (next[1] - x0) * k, y0 + (next[2] - y0) * k];
      }
    }
    dog.pos = pos ?? [x0, y0];
    dogPose(shown);
    putDog();
    if (shown === "walk") dog.frame = requestAnimationFrame(tick);
    else if (next) dog.timer = setTimeout(tick, Math.max(50, Math.min(next[0] - t + 30, 60000)));
    else if (!dog.ranOut) {
      // The end of the hour the page knew about: ask for the next one.
      dog.ranOut = true;
      refresh();
    }
  }

  // He trots after you if you were the last to pet him or feed him, a step
  // behind, on whichever side you're walking away from. He faces the way
  // he's going, and then turns to face you.
  function trot(now) {
    if (!dog.g || !dog.mine) return;
    const [tx, ty] = besideYou();
    const k = still ? 1 : 1 - Math.exp(-5 * Math.min(0.05, (now - trotted) / 1000));
    trotted = now;
    if (Math.abs(tx - dog.pos[0]) > 2) dog.face = tx < dog.pos[0] ? 1 : -1;
    dog.pos = [dog.pos[0] + (tx - dog.pos[0]) * k, dog.pos[1] + (ty - dog.pos[1]) * k];
    trotting = Math.hypot(tx - dog.pos[0], ty - dog.pos[1]) > 0.5;
    if (!trotting) dog.face = dog.pos[0] >= x ? 1 : -1;
    dog.g.classList.toggle("trotting", trotting);
    putDog();
    if (trotting) requestAnimationFrame(trot);
  }

  function heel() {
    if (!dog.g || !dog.mine || trotting) return;
    trotting = true;
    trotted = performance.now();
    requestAnimationFrame(trot);
  }

  // Read him off the page: on first load, and after every live update.
  // `keepSpot` keeps where he's trotted to beside you.
  function initDog(keepSpot) {
    stopDog();
    const g = svg.querySelector("g.laddoo");
    if (!g) {
      dog.g = null;
      dog.thing = null;
      return;
    }
    dog.g = g;
    dog.with = g.dataset.with ?? "";
    dog.mine = dog.with === myId;
    dog.offset = Number(g.dataset.now) - Date.now();
    try {
      dog.path = JSON.parse(g.dataset.path ?? "[]");
    } catch {
      dog.path = [];
    }
    dog.ranOut = false;
    dog.pose = [...["nap", "walk"]].find((p) => g.classList.contains(p === "nap" ? "napping" : "walking")) ?? "stand";
    if (!keepSpot) {
      dog.pos = where(g);
      dog.face = spot(g.querySelector(".facing") ?? g).a < 0 ? -1 : 1;
    }
    // He's one of the things you can walk up to, unless he's at your heels.
    dog.thing = dog.mine ? null : { id: "dog", g, dog: true, place: g.dataset.place, doings: JSON.parse(g.dataset.do ?? "[]") };
    if (dog.mine) {
      dogPose("stand");
      putDog();
      trotting = false;
      heel();
    } else tick();
  }

  // Petting him or giving him a treat wakes him up where he is. The page you
  // land on has him at your heels; he gets up from where he was and comes
  // over, so that spot rides along for one page load.
  const PUP = "five-windows-pup";
  function rememberPup() {
    if (!dog.g) return;
    try {
      sessionStorage.setItem(PUP, JSON.stringify({ x: dog.pos[0], y: dog.pos[1], at: Date.now() }));
    } catch {
      // he's just at your heels when you land
    }
  }
  // The room pages' own Pet and Treat buttons, too.
  document.addEventListener("submit", (event) => {
    const action = event.target.getAttribute("action");
    if (action === "/garden/dog" || action === "/garden/treat") rememberPup();
  });

  /* ---------- where you are ---------- */

  // Where you stop is where you are: the house keeps it, so you (and Shinzo,
  // if he's with you) are still there next time, and friends find you there.
  // While you walk it hears a few times a second, so friends see you go.
  let kept = [x, y];
  let sent = 0;
  function keep() {
    if (Math.abs(x - kept[0]) < 1 && Math.abs(y - kept[1]) < 1) return;
    kept = [x, y];
    sent = performance.now();
    try {
      navigator.sendBeacon("/here", new URLSearchParams({ x: x.toFixed(0), y: y.toFixed(0) }));
    } catch {
      // kept the next time you stop instead
    }
  }
  const keepWalking = (now) => {
    if (now - sent > 300 && Math.hypot(x - kept[0], y - kept[1]) > 2) keep();
  };
  addEventListener("pagehide", keep);

  // Sitting down, asleep in a bed or in a hug, you get up as soon as you walk.
  const getUp = () => me.classList.remove("resting", "napping", "sitting", "hugging");

  /* ---------- friends ---------- */

  // A friend's steps arrive as she takes them (public/live.js): she walks
  // there on your screen too, and Shinzo with her if he's hers.
  const tweens = new Map();
  function walkFriend(g, to) {
    const person = g.dataset.person;
    cancelAnimationFrame(tweens.get(person) ?? 0);
    const from = where(g);
    const put = ([px, py]) => g.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)})`);
    const done = () => {
      tweens.delete(person);
      g.classList.remove("walking");
      put(to);
      order(g);
      if (dog.with === person) tick();
      showDoings();
    };
    if (still) return done();
    const begun = performance.now();
    g.classList.add("walking");
    const frame = (now) => {
      const k = Math.min(1, (now - begun) / 300);
      put([from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k]);
      if (dog.with === person && !dog.mine) tick();
      if (k < 1) tweens.set(person, requestAnimationFrame(frame));
      else done();
    };
    tweens.set(person, requestAnimationFrame(frame));
  }

  document.addEventListener("house:moved", (event) => {
    const { person, place, x: tx, y: ty } = event.detail ?? {};
    if (!person || person === myId || !Number.isFinite(tx) || !Number.isFinite(ty)) return;
    const g = people()?.querySelector(`.walker[data-person="${CSS.escape(person)}"]`);
    // Getting up from a seat, out of bed or out of a hug: the page draws her
    // standing again.
    if (!g || g.classList.contains("hugging") || g.classList.contains("resting")) refresh();
    if (!g) return;
    g.dataset.place = place;
    walkFriend(g, [tx, ty]);
  });

  // Friends who are here right now, standing within a hug of you, nearest
  // first.
  const HUG_REACH = 120;
  const list = new Intl.ListFormat("en-AU", { type: "conjunction" });
  function huggable() {
    if (me.classList.contains("resting") || me.classList.contains("hugging")) return [];
    return [...(people()?.querySelectorAll(".walker.here") ?? [])]
      .filter((g) => g !== me && !g.classList.contains("resting"))
      .map((g) => {
        const [fx, fy] = where(g);
        return { g, id: g.dataset.person, name: g.querySelector(".who")?.textContent ?? "", d: Math.hypot(fx - x, fy - y) };
      })
      .filter((f) => f.d < HUG_REACH)
      .sort((a, b) => a.d - b.d);
  }

  function hugDoings(friends) {
    const out = [{ label: `Hug ${friends[0].name}`, emoji: "🤗", post: "/hug", fields: { with: friends[0].id } }];
    if (friends.length > 1) {
      out.push({ label: `Group hug with ${list.format(friends.map((f) => f.name))}`, emoji: "🤗", post: "/hug", fields: { with: friends.map((f) => f.id).join(",") } });
    }
    return out;
  }

  /* ---------- things you can do ---------- */

  // Close enough to reach: on it, or about a step away. Sitting down, only
  // what's offered to someone sitting (UNO on the mat) is in reach.
  const REACH = 30;
  const DOG_REACH = 45;
  function nearest() {
    const resting = me.classList.contains("resting");
    let best;
    let gap = REACH;
    for (const t of things) {
      if (t.seated !== resting) continue;
      const d = inside([x, y], t.outline) ? 0 : fromEdge([x, y], t.outline);
      if (d < gap) [best, gap] = [t, d];
    }
    if (!resting && dog.thing) {
      const d = Math.max(0, Math.hypot(x - dog.pos[0], y - dog.pos[1]) - DOG_REACH);
      if (d < gap) best = dog.thing;
    }
    return best;
  }

  // Light up the nearest thing and any friends close enough to hug, and put
  // a button in the pad for each thing you can do. Enter does the first; the
  // number keys the rest.
  let lit;
  let litKey = "";
  let litFriends = [];
  let offered = [];
  function showDoings() {
    const t = nearest();
    const friends = huggable();
    const key = `${t?.id ?? ""}|${friends.map((f) => f.id).join(",")}`;
    if (key === litKey) return;
    litKey = key;
    lit?.g.classList.remove("near");
    for (const f of litFriends) f.g.classList.remove("near");
    lit = t;
    litFriends = friends;
    t?.g.classList.add("near");
    for (const f of friends) f.g.classList.add("near");
    const hug = friends.length ? { id: "hug", hug: true, friends } : undefined;
    offered = [...(hug ? hugDoings(friends).map((d) => [hug, d]) : []), ...(t ? t.doings.map((d) => [t, d]) : [])];
    for (const b of moves.querySelectorAll(".do")) b.remove();
    offered.forEach(([thing, d], i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "do";
      b.innerHTML = `<span class="emoji" aria-hidden="true"></span> <span class="label"></span> <kbd>${i ? i + 1 : "Enter"}</kbd>`;
      b.querySelector(".emoji").textContent = d.emoji;
      b.querySelector(".label").textContent = d.label;
      b.addEventListener("click", () => act(thing, d));
      moves.insertBefore(b, goButton);
    });
    goKey.hidden = offered.length > 0;
  }

  // The thing's emoji pops up over it as you do it (the page you land on pops
  // up what came of it).
  function popUp(t, emoji) {
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
      const [dx, dy] = dog.pos;
      at = dog.pose === "nap" ? [dx + 14, dy - 50] : [dx + 6, dy - 52];
    } else if (t.hug) {
      // Between you and whoever you're hugging, over your heads.
      const [fx, fy] = where(t.friends[0].g);
      at = [(x + fx) / 2, Math.min(y, fy) - 110];
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
  // there and then. A hug says where you're standing.
  function act(t, d) {
    if (busy) return;
    popUp(t, d.emoji);
    if (t.dog) {
      stopDog();
      dogPose("stand");
      rememberPup();
    }
    const fields = { ...d.fields };
    // Shinzo is wherever he is now, which may not be where the page drew him.
    if (t.dog) fields.at = roomAt(dog.pos)?.place ?? fields.at;
    if (t.hug) Object.assign(fields, { x: x.toFixed(0), y: y.toFixed(0) });
    const there = t.hug ? undefined : rooms.find((r) => r.place === (fields.at ?? t.place));
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
    order(me);
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
    keepWalking(now);
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

  /* ---------- live updates ---------- */

  // A fresh copy of the page arrives whenever something changes
  // (public/live.js). The drawing takes the new version of everything but
  // the picture and the room links, which never change, and you, who keep
  // walking. Shinzo stays at your heels if he still is. The server's version
  // of you only counts when it's put you somewhere new without your walking
  // there: sat down, in bed, in a hug.
  const KEEP = new Set(["image", "g.links", "g.people"]);
  const keyOf = (el) => (el.tagName.toLowerCase() === "g" ? `g.${el.classList[0] ?? ""}` : el.tagName.toLowerCase());
  const poseOf = (g) => ["resting", "napping", "sitting", "hugging"].filter((c) => g.classList.contains(c)).join(" ");

  function mergePeople(group, fresh) {
    const theirs = fresh.querySelector(`[data-person="${CSS.escape(myId)}"]`);
    let mine = me;
    if (theirs && !walking && !busy && theirs.classList.contains("me") && poseOf(theirs) !== poseOf(me)) {
      mine = document.importNode(theirs, true);
      [x, y] = where(mine);
      lastX = x;
      kept = [x, y];
    }
    for (const id of tweens.keys()) cancelAnimationFrame(tweens.get(id));
    tweens.clear();
    const all = [...fresh.children].map((el) => (el.dataset.person === myId ? mine : document.importNode(el, true)));
    if (!all.includes(mine)) all.push(mine);
    group.replaceChildren(...all);
    me = mine;
    order(me);
  }

  function swap(next) {
    const fresh = [...next.children];
    const freshDog = next.querySelector("g.laddoo");
    const keepDog = dog.mine && dog.g && freshDog?.dataset.with === myId;
    const kept = new Map();
    for (const el of [...svg.children]) {
      const k = keyOf(el);
      if ((KEEP.has(k) || (k === "g.laddoo" && keepDog)) && !kept.has(k)) kept.set(k, el);
      else el.remove();
    }
    let cursor = svg.firstChild;
    for (const el of fresh) {
      const k = keyOf(el);
      const old = kept.get(k);
      if (!old) {
        svg.insertBefore(document.importNode(el, true), cursor);
        continue;
      }
      if (k === "g.people") mergePeople(old, el);
      if (k === "g.laddoo") {
        for (const name of ["path", "now", "do", "place"]) old.dataset[name] = el.dataset[name] ?? "";
      }
      cursor = old.nextSibling;
    }
    for (const [k, old] of kept) if (!fresh.some((el) => keyOf(el) === k)) old.remove();
    scan();
    initDog(keepDog);
    litKey = "";
    lit = undefined;
    litFriends = [];
    showDoings();
  }

  document.addEventListener("house:fresh", (event) => {
    const next = event.detail?.doc?.querySelector(".house-svg");
    if (!next) return;
    event.preventDefault();
    // On the way to another page already.
    if (busy) return;
    swap(next);
  });

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
    const pick = offered[n - 1];
    if (pick) {
      event.preventDefault();
      act(pick[0], pick[1]);
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
    [x, y] = where(me);
    keys.clear();
    letGo();
    me.classList.remove("walking");
    busy = false;
    walking = false;
    initDog(false);
    draw();
  });

  /* ---------- arriving ---------- */

  initDog(false);

  // Back in the whole house after walking out of a room: pick up where you
  // stepped out.
  try {
    const carried = JSON.parse(sessionStorage.getItem(CARRY) ?? "null");
    sessionStorage.removeItem(CARRY);
    if (!current && carried?.person === myId && Date.now() - carried.at < 20000 && walkable([carried.x, carried.y])) {
      [x, y] = [carried.x, carried.y];
      lastX = x;
      if (dog.mine) dog.pos = besideYou();
      // In case the house hadn't heard where you stepped out yet.
      keep();
    }
  } catch {
    // start at your spot
  }
  // Just petted or fed: he gets up from where he was and comes to you.
  try {
    const was = JSON.parse(sessionStorage.getItem(PUP) ?? "null");
    sessionStorage.removeItem(PUP);
    if (dog.mine && was && Date.now() - was.at < 20000) dog.pos = [was.x, was.y];
  } catch {
    // he's already at your heels
  }
  if (dog.mine) {
    trotting = false;
    putDog();
  }
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
