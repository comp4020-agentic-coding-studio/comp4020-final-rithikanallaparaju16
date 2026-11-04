// Live updates (ADR 0010). Every page works without this file; it only saves
// a refresh. The house tells open pages when anything changes (`changed`) and
// when a friend walks somewhere (`moved`). On a change the page fetches itself
// again and swaps in the new version of each part marked data-live, unless
// you're typing in it. The house drawing is public/house.js's to update: it
// gets the new page as `house:fresh`, and friends' steps as `house:moved`.
(() => {
  // A note or the README has nothing that changes.
  if (!("EventSource" in window) || document.body.classList.contains("page-plain")) return;

  // ?did= pops something up once; a reload shouldn't pop it again.
  const here = new URL(location.href);
  if (here.searchParams.has("did")) {
    here.searchParams.delete("did");
    history.replaceState(history.state, "", here.pathname + here.search + here.hash);
  }

  const kind = (body) => [...body.classList].find((c) => c.startsWith("page-"));

  // Something you're in the middle of: a field you're typing in, or a form
  // you've started filling in. A button you last pressed doesn't count, or a
  // card you played would keep your hand from ever catching up.
  const typing = (el) =>
    el.isContentEditable || /^(TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === "INPUT" && !/^(button|submit|reset|hidden|checkbox|radio)$/.test(el.type));
  function busy(region) {
    const focused = document.activeElement;
    if (focused && focused !== document.body && region.contains(focused) && typing(focused)) return true;
    for (const field of region.querySelectorAll("input, textarea, select")) {
      if (field.type === "checkbox" || field.type === "radio") {
        if (field.checked !== field.defaultChecked) return true;
      } else if (field.tagName === "SELECT") {
        if ([...field.options].some((o) => o.selected !== o.defaultSelected)) return true;
      } else if (field.value !== field.defaultValue) {
        return true;
      }
    }
    return false;
  }

  // The new version of each live part of the page goes in; the house
  // drawing is handed to public/house.js.
  function apply(doc) {
    for (const fresh of doc.querySelectorAll("[data-live]")) {
      const old = document.querySelector(`[data-live="${CSS.escape(fresh.dataset.live)}"]`);
      if (!old || old.closest("svg") || busy(old)) continue;
      // Whatever you'd opened (a note's stickers, the memory box) stays open.
      const opened = [...old.querySelectorAll("details[open][id]")].map((d) => d.id);
      const next = document.importNode(fresh, true);
      for (const id of opened) next.querySelector(`details#${CSS.escape(id)}`)?.setAttribute("open", "");
      old.replaceWith(next);
    }
    const event = new CustomEvent("house:fresh", { detail: { doc }, cancelable: true });
    if (document.dispatchEvent(event)) {
      const svg = document.querySelector(".house-svg");
      const next = doc.querySelector(".house-svg");
      if (svg && next) svg.replaceWith(document.importNode(next, true));
    }
  }

  let fetching = false;
  let again = false;
  let waiting = false;

  async function refresh() {
    // A page in a background tab catches up when it's looked at again.
    if (document.hidden) {
      waiting = true;
      return;
    }
    if (fetching) {
      again = true;
      return;
    }
    fetching = true;
    try {
      const res = await fetch(location.pathname, { headers: { "x-live": "1" } });
      if (!res.ok) return;
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      // Sent back to the door, or let in from it: a different page altogether.
      if (new URL(res.url).pathname !== location.pathname || kind(doc.body) !== kind(document.body)) {
        location.reload();
        return;
      }
      apply(doc);
    } catch {
      // the next change tries again
    } finally {
      fetching = false;
      if (again) {
        again = false;
        soon();
      }
    }
  }

  // A friend doing something often writes twice (she sat down, so she's in
  // that room now), a few milliseconds apart; one fetch covers both.
  let timer;
  const soon = () => {
    clearTimeout(timer);
    timer = setTimeout(refresh, 150);
  };

  // A form marked data-quick (your UNO hand) posts without leaving the page.
  // The house answers with the page again, and its live parts are swapped
  // in, so a card goes down without a reload. The pressed card lifts and the
  // hand waits meanwhile. Anything unexpected posts the ordinary way.
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    const pressed = event.submitter;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute("data-quick") || !pressed || event.defaultPrevented) return;
    event.preventDefault();
    const data = new URLSearchParams(new FormData(form));
    if (pressed.name) data.append(pressed.name, pressed.value);
    const buttons = [...form.querySelectorAll("button")];
    const was = buttons.map((b) => b.disabled);
    form.classList.add("sending");
    pressed.closest("li")?.classList.add("playing");
    for (const b of buttons) b.disabled = true;
    const ordinary = () => {
      buttons.forEach((b, i) => (b.disabled = was[i]));
      if (pressed.name) {
        const keep = document.createElement("input");
        keep.type = "hidden";
        keep.name = pressed.name;
        keep.value = pressed.value;
        form.append(keep);
      }
      HTMLFormElement.prototype.submit.call(form);
    };
    try {
      const res = await fetch(form.action, { method: "POST", body: data });
      // Turned down: nothing was written, so posting again shows why.
      if (!res.ok) return ordinary();
      // Somewhere else, or with something to pop up (you won): go there.
      const to = new URL(res.url);
      if (to.pathname !== location.pathname || to.searchParams.has("did")) return location.assign(res.url);
      apply(new DOMParser().parseFromString(await res.text(), "text/html"));
    } catch {
      return ordinary();
    }
    // A form that wasn't swapped (nothing live to swap) gets its buttons back.
    if (form.isConnected) {
      form.classList.remove("sending");
      form.querySelector(".playing")?.classList.remove("playing");
      buttons.forEach((b, i) => (b.disabled = was[i]));
    }
  });

  // public/house.js asks for the page again when it can't follow a step on
  // its own: a friend getting up from a seat, or Shinzo's hour running out.
  document.addEventListener("house:refresh", soon);

  // UNO turns last twenty seconds (ADR 0016). The page counts the turn in play
  // down by the house's clock (data-now is when the house drew the page), and
  // when it runs out asks for the page again: the house has played it out by
  // then, and the turn has moved on, without whoever wasn't there. Nothing is
  // written when a turn runs out, so no friend's change would bring it.
  let asked = 0;
  setInterval(() => {
    for (const el of document.querySelectorAll("[data-deadline]")) {
      // Counting from when the page arrived errs late, never early.
      if (!el.dataset.offset) el.dataset.offset = String(Number(el.dataset.now) - Date.now());
      const left = Math.max(0, Math.ceil((Number(el.dataset.deadline) - Date.now() - Number(el.dataset.offset)) / 1000));
      const shown = el.querySelector(".countdown");
      if (shown) {
        shown.textContent = `${left}s`;
        shown.classList.toggle("low", left <= 3);
      }
      if (left === 0 && Date.now() - asked > 1000) {
        asked = Date.now();
        soon();
      }
    }
  }, 250);

  let source;
  function listen() {
    // In a made house (ADR 0017) its own line, under /h/<code>.
    source = new EventSource(`${document.body.dataset.base ?? ""}/live`);
    source.addEventListener("changed", soon);
    source.addEventListener("moved", (event) => {
      try {
        document.dispatchEvent(new CustomEvent("house:moved", { detail: JSON.parse(event.data) }));
      } catch {
        // a garbled step; the next one puts her right
      }
    });
  }
  listen();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && waiting) {
      waiting = false;
      soon();
    }
  });

  // Back to this page with the browser's back button: catch up.
  addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    if (source.readyState === EventSource.CLOSED) listen();
    soon();
  });
})();

// Picking a time for all of you (the planner, src/pages.ts): a clock each,
// and above them a strip of everyone's days you drag through with a thumb
// or a mouse. Whatever moves, every clock, hand and field follows on the
// next frame, each in her own time zone, with a note when it lands in her
// usual sleep. The form only ever sends your own row's field, so without
// this file the rows are plain fields and the house reads yours. Kept apart
// from the live updates above, so it runs even where those don't.
(() => {
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const STEP = 5 * MIN;
  const ZONE = new Map();
  const parts = (tz, at) => {
    let f = ZONE.get(tz);
    if (!f) {
      f = new Intl.DateTimeFormat("en-AU", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short", hourCycle: "h23" });
      ZONE.set(tz, f);
    }
    return Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  };
  // The wall-clock time in `tz` at `at`, read back as if it were UTC
  // (src/time.ts does the same on the server).
  const wall = (tz, at) => {
    const p = parts(tz, at);
    return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute));
  };
  const pad = (n) => String(n).padStart(2, "0");
  const field = (tz, at) => {
    const d = new Date(wall(tz, at));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };
  // A date-and-time field filled in by someone in `tz`, as a moment; the
  // second pass settles it across a daylight-saving change.
  const moment = (value, tz) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!m) return undefined;
    const target = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    let at = target - (wall(tz, target) - target);
    at += target - wall(tz, at);
    return at;
  };
  const hourOf = (tz, at) => {
    const p = parts(tz, at);
    return (Number(p.hour) % 24) + Number(p.minute) / 60;
  };
  const sleeps = (row, h) => {
    const [from, to] = row.dataset.sleep.split(",").map(Number);
    return from > to ? h >= from || h < to : h >= from && h < to;
  };
  const label = (tz, at) => {
    const p = parts(tz, at);
    const h = Number(p.hour) % 24;
    return { time: `${h % 12 || 12}:${p.minute}`, half: h < 12 ? "am" : "pm", day: p.weekday };
  };

  const NS = "http://www.w3.org/2000/svg";
  const svgEl = (name, attrs) => {
    const el = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };

  // A little clock face for each row: its hands turn as the time moves, and
  // its face goes dark in the night.
  function face(row) {
    const svg = svgEl("svg", { class: "when-face", viewBox: "-20 -20 40 40", "aria-hidden": "true" });
    svg.append(svgEl("circle", { class: "rim", r: "18" }));
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      svg.append(svgEl("line", { class: "tick", x1: String(Math.sin(a) * 15), y1: String(-Math.cos(a) * 15), x2: String(Math.sin(a) * (i % 3 ? 13.5 : 12)), y2: String(-Math.cos(a) * (i % 3 ? 13.5 : 12)) }));
    }
    const hour = svgEl("line", { class: "hand hour", x1: "0", y1: "2", x2: "0", y2: "-8" });
    const minute = svgEl("line", { class: "hand minute", x1: "0", y1: "3", x2: "0", y2: "-13" });
    svg.append(hour, minute, svgEl("circle", { class: "pin", r: "1.6" }));
    const readout = document.createElement("span");
    readout.className = "when-readout";
    readout.innerHTML = `<b class="t"></b> <span class="h"></span> <span class="d"></span>`;
    const box = document.createElement("span");
    box.className = "when-clock";
    box.append(svg, readout);
    row.querySelector("label").after(box);
    return { svg, hour, minute, t: readout.querySelector(".t"), h: readout.querySelector(".h"), d: readout.querySelector(".d") };
  }

  function planner(picker) {
    const list = picker.querySelector(".when-rows");
    const rows = [...list.querySelectorAll(".when-row")];
    if (!rows.length || picker.dataset.scrub) return;
    picker.dataset.scrub = "1";
    const mine = rows[0].querySelector("input");
    const faces = new Map(rows.map((row) => [row, face(row)]));

    // The strip: two days either side of now would be too far to drag on a
    // phone, so it's 48 hours from the start of this hour, and it scrolls on
    // past either end if you keep going.
    const strip = document.createElement("div");
    strip.className = "when-strip";
    strip.tabIndex = 0;
    strip.setAttribute("role", "slider");
    strip.setAttribute("aria-label", "Drag through the time for everyone");
    strip.innerHTML = `<div class="when-lanes"></div><div class="when-needle" aria-hidden="true"></div><p class="when-drag">◂ drag through time ▸</p>`;
    list.before(strip);
    const lanes = strip.querySelector(".when-lanes");
    // Whose lane is whose, pinned at the left: each friend's face (her
    // sticker, ringed in her colour), in the same order as the rows below.
    // Two friends can share an initial; nobody shares a face.
    const initials = document.createElement("div");
    initials.className = "when-initials";
    initials.setAttribute("aria-hidden", "true");
    for (const row of rows) {
      const tag = document.createElement("span");
      tag.style.setProperty("--accent", getComputedStyle(row).getPropertyValue("--accent"));
      const name = row.querySelector(".name").textContent.trim();
      tag.title = name;
      if (row.dataset.avatar) {
        const img = document.createElement("img");
        img.src = row.dataset.avatar;
        img.alt = "";
        img.draggable = false;
        tag.append(img);
      } else {
        tag.textContent = [...name][0];
      }
      if (row.classList.contains("you")) {
        tag.classList.add("you");
        const you = document.createElement("b");
        you.textContent = "You";
        tag.append(you);
      }
      initials.append(tag);
    }
    strip.append(initials);
    // And beside the needle, what time that is for each of you, so a phone
    // shows all five at once while you drag, without scrolling to the rows.
    const chips = document.createElement("div");
    chips.className = "when-chips";
    chips.setAttribute("aria-hidden", "true");
    const chipOf = new Map();
    for (const row of rows) {
      const chip = document.createElement("span");
      chips.append(chip);
      chipOf.set(row, chip);
    }
    strip.append(chips);
    const PX = 46; // pixels an hour
    const SPAN = 30; // hours drawn either side of the needle
    const laneOf = new Map();
    for (const row of rows) {
      const lane = document.createElement("div");
      lane.className = "when-lane";
      lane.style.setProperty("--accent", getComputedStyle(row).getPropertyValue("--accent"));
      lane.innerHTML = `<span class="who">${row.querySelector(".name").textContent}</span><div class="band"></div>`;
      lanes.append(lane);
      laneOf.set(row, lane.querySelector(".band"));
    }

    let at = moment(mine.value, rows[0].dataset.tz) ?? Date.now();
    let drawnFrom = NaN;

    // Each lane's hours, day and night, around `centre`: drawn again only
    // when you've dragged far enough to need more, so dragging stays smooth.
    function paint(centre) {
      const from = Math.floor(centre / HOUR) * HOUR - SPAN * HOUR;
      if (Math.abs(from - drawnFrom) < 6 * HOUR) return;
      drawnFrom = from;
      for (const row of rows) {
        const band = laneOf.get(row);
        const tz = row.dataset.tz;
        let html = "";
        for (let i = 0; i < SPAN * 2; i++) {
          const t = from + i * HOUR;
          const h = Math.floor(hourOf(tz, t));
          const cls = sleeps(row, h + 0.5) ? "night" : h < 7 || h >= 20 ? "dusk" : "day";
          const mark = h % 6 === 0 ? `<i>${h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`}</i>` : "";
          html += `<span class="${cls}${h === 0 ? " midnight" : ""}">${mark}</span>`;
        }
        band.innerHTML = html;
      }
    }

    let frame = 0;
    let typed;
    // Everything follows `at`, on the next frame: the strip's position, each
    // clock's hands and words, each row's field and sleep note.
    function show() {
      frame = 0;
      paint(at);
      // The needle is in the middle of the strip: the moment `at` sits under it.
      const offset = strip.clientWidth / 2 - ((at - drawnFrom) / HOUR) * PX;
      lanes.style.transform = `translateX(${offset.toFixed(1)}px)`;
      for (const row of rows) {
        const tz = row.dataset.tz;
        const h = hourOf(tz, at);
        const f = faces.get(row);
        f.hour.setAttribute("transform", `rotate(${(h % 12) * 30})`);
        f.minute.setAttribute("transform", `rotate(${(h % 1) * 360})`);
        const late = sleeps(row, h);
        f.svg.classList.toggle("dark", late || h < 6 || h >= 20);
        const w = label(tz, at);
        f.t.textContent = w.time;
        f.h.textContent = w.half;
        f.d.textContent = w.day;
        const chip = chipOf.get(row);
        chip.textContent = `${w.time} ${w.half}${late ? " 😴" : ""}`;
        chip.classList.toggle("late", late);
        const input = row.querySelector("input");
        if (input !== typed) input.value = field(tz, at);
        row.classList.toggle("late", late);
        const note = row.querySelector(".sleep-note");
        note.textContent = late ? note.dataset.says : "";
      }
      strip.setAttribute("aria-valuetext", rows.map((row) => `${row.querySelector(".name").textContent} ${label(row.dataset.tz, at).time} ${label(row.dataset.tz, at).half}`).join(", "));
    }
    const soon = () => {
      if (!frame) frame = requestAnimationFrame(show);
    };
    const snap = (t) => Math.round(t / STEP) * STEP;

    // Dragging: a finger or a mouse moves time under the needle, an hour for
    // every PX pixels, and lets go with a little glide.
    let drag;
    strip.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      strip.setPointerCapture(event.pointerId);
      drag = { x: event.clientX, at, last: event.clientX, when: performance.now(), v: 0 };
      typed = undefined;
      strip.classList.add("dragging");
    });
    strip.addEventListener("pointermove", (event) => {
      if (!drag || !strip.hasPointerCapture(event.pointerId)) return;
      const now = performance.now();
      drag.v = (event.clientX - drag.last) / Math.max(1, now - drag.when);
      drag.last = event.clientX;
      drag.when = now;
      at = snap(drag.at - ((event.clientX - drag.x) / PX) * HOUR);
      soon();
    });
    const release = () => {
      if (!drag) return;
      let v = drag.v;
      drag = undefined;
      strip.classList.remove("dragging");
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let exact = at;
      const glide = () => {
        if (drag || Math.abs(v) < 0.02) return;
        exact -= (v * 16 / PX) * HOUR;
        at = snap(exact);
        v *= 0.92;
        show();
        requestAnimationFrame(glide);
      };
      requestAnimationFrame(glide);
    };
    strip.addEventListener("pointerup", release);
    strip.addEventListener("pointercancel", release);
    strip.addEventListener("lostpointercapture", release);
    // A trackpad's sideways swipe moves it too, and so does a mouse wheel
    // once you've clicked into the strip; until then the wheel scrolls the
    // page past it, as anywhere else.
    strip.addEventListener("wheel", (event) => {
      const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!sideways && document.activeElement !== strip) return;
      const d = sideways ? event.deltaX : event.deltaY;
      if (!d) return;
      event.preventDefault();
      at = snap(at + (d / PX) * HOUR);
      soon();
    }, { passive: false });
    // Arrow keys: a quarter of an hour; with Shift, an hour.
    strip.addEventListener("keydown", (event) => {
      const way = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
      if (!way) return;
      event.preventDefault();
      at = snap(at + way * (event.shiftKey ? HOUR : 15 * MIN));
      soon();
    });

    // Typing in any row's field moves everyone else too.
    const typedIn = (event) => {
      const input = event.target;
      const row = input instanceof HTMLInputElement && input.closest(".when-row");
      if (!row || !list.contains(row)) return;
      const t = moment(input.value, row.dataset.tz);
      if (t === undefined) return;
      typed = input;
      at = t;
      soon();
    };
    list.addEventListener("input", typedIn);
    list.addEventListener("change", (event) => {
      typedIn(event);
      typed = undefined;
    });
    // "Back to now" puts the fields back; the rest follows them.
    picker.closest("form")?.addEventListener("reset", () => {
      setTimeout(() => {
        typed = undefined;
        at = moment(mine.value, rows[0].dataset.tz) ?? Date.now();
        show();
      });
    });
    show();
    new ResizeObserver(() => show()).observe(strip);
  }

  const all = () => document.querySelectorAll("fieldset.when-picker").forEach(planner);
  all();
  // A live update swaps the planner for a fresh one (public/live.js above),
  // which gets its own strip. A planner you've moved is never swapped: its
  // fields differ from what the page came with, so live.js leaves it be.
  document.addEventListener("house:fresh", all);
})();

// A photo for the memory wall (ADR 0024): a phone's photo is several MB, so
// before it goes, it's drawn again at most 1600 px across and sent as a
// JPEG of a few hundred KB, and you see it as a polaroid while you write
// what it reminds you of. Without this file the form sends the photo as it
// is, which the house takes up to 6 MB.
(() => {
  const EDGE = 1600;
  function photoForm(form) {
    if (form.dataset.shrink) return;
    form.dataset.shrink = "1";
    const file = form.querySelector("input[type=file]");
    let preview;
    let small;
    file.addEventListener("change", async () => {
      small = undefined;
      const picked = file.files?.[0];
      preview?.remove();
      preview = undefined;
      if (!picked || !/^image\//.test(picked.type)) return;
      const url = URL.createObjectURL(picked);
      preview = document.createElement("img");
      preview.className = "preview";
      preview.alt = "The photo you picked";
      preview.src = url;
      file.after(preview);
      try {
        // createImageBitmap turns a phone photo the right way up as it reads it.
        const bitmap = await createImageBitmap(picked, { imageOrientation: "from-image" });
        const scale = Math.min(1, EDGE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise((done) => canvas.toBlob(done, "image/jpeg", 0.85));
        // Only if it's actually smaller: a small PNG can come out bigger.
        if (blob && blob.size < picked.size) small = blob;
      } catch {
        // A photo the browser can't draw (HEIC on some phones) goes as it is,
        // and the house says if it can't pin it.
      }
    });
    form.addEventListener("submit", async (event) => {
      if (!small || !window.fetch || !window.FormData) return;
      event.preventDefault();
      const data = new FormData(form);
      data.set(file.name, small, "photo.jpg");
      const button = form.querySelector("button");
      if (button) button.disabled = true;
      try {
        const res = await fetch(form.action, { method: "POST", body: data });
        // Pinned: the house sent the wall back (a 303 fetch followed), and
        // the photo's there. Not pinned: its page says why, shown as it is.
        if (res.redirected) {
          location.href = `${res.url}#wall`;
        } else {
          const page = await res.text();
          document.open();
          document.write(page);
          document.close();
        }
      } catch {
        if (button) button.disabled = false;
        small = undefined;
        form.requestSubmit();
      }
    });
  }
  const all = () => document.querySelectorAll("form.pin-photo").forEach(photoForm);
  all();
  document.addEventListener("house:fresh", all);
})();

// Copying your widget's script (src/pages.ts, the Everyone tab) in one tap,
// for pasting into Scriptable. Without this the page says to select it by
// hand; the button only shows where a browser lets a page copy.
(() => {
  function copyButtons() {
    if (!navigator.clipboard?.writeText) return;
    for (const button of document.querySelectorAll("button[data-copy]")) {
      const from = document.getElementById(button.dataset.copy);
      if (!from || button.dataset.ready) continue;
      button.dataset.ready = "1";
      button.hidden = false;
      button.nextElementSibling?.classList.contains("widget-copy-by-hand") && button.nextElementSibling.remove();
      const label = button.textContent;
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(from.value);
          button.textContent = "Copied. Now open Scriptable";
        } catch {
          from.focus();
          from.select();
          button.textContent = "Select All, then Copy";
        }
        setTimeout(() => (button.textContent = label), 4000);
      });
    }
  }
  copyButtons();
  document.addEventListener("house:fresh", copyButtons);
})();

// The widget's page opens the steps for the phone it's on (src/server.ts
// reads that from the browser). An iPad's Safari says it's a Mac, so a Mac
// with a touch screen is an iPad: its steps go first instead.
(() => {
  if (!document.body.classList.contains("page-home-screen")) return;
  if (!/Macintosh/.test(navigator.userAgent) || navigator.maxTouchPoints < 2) return;
  const ipad = document.getElementById("on-ipad");
  const mac = document.getElementById("on-mac");
  const first = document.querySelector("details.widget-way");
  if (!ipad || !mac || !first) return;
  mac.open = false;
  ipad.open = true;
  first.before(ipad);
})();

// Tell them you were here (src/pages.ts tellThem, ADR 0031): the phone's own
// share sheet where there is one, copying otherwise. The house sends
// nothing; she picks where it goes. Without this, the words are there to
// select by hand.
(() => {
  function tellButtons() {
    for (const button of document.querySelectorAll("button[data-share]")) {
      const from = document.getElementById(button.dataset.share);
      if (!from || button.dataset.ready || !navigator.share) continue;
      button.dataset.ready = "1";
      button.hidden = false;
      button.addEventListener("click", async () => {
        try {
          await navigator.share({ text: from.value, url: new URL(from.dataset.link || "/", location.href).href });
        } catch {
          // she closed the sheet
        }
      });
    }
    for (const button of document.querySelectorAll("button[data-copy-text]")) {
      const from = document.getElementById(button.dataset.copyText);
      if (!from || button.dataset.ready || !navigator.clipboard?.writeText) continue;
      button.dataset.ready = "1";
      button.hidden = false;
      const label = button.textContent;
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(`${from.value} ${new URL(from.dataset.link || "/", location.href).href}`);
          button.textContent = "Copied";
        } catch {
          from.focus();
          from.select();
        }
        setTimeout(() => (button.textContent = label), 3000);
      });
    }
  }
  tellButtons();
  document.addEventListener("house:fresh", tellButtons);
})();

// The house as an app (ADR 0033): the service worker, at this house's own
// address, which is what lets a browser offer to install it; the Install
// button, shown only when the browser has offered; and sharing the house's
// address from the app page. Every page works without any of it.
(() => {
  const base = document.body.dataset.base || "";
  if ("serviceWorker" in navigator) {
    addEventListener("load", () => {
      navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
    });
  }
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (standalone) document.documentElement.classList.add("as-app");

  const install = document.querySelector(".app-install");
  const installed = document.querySelector(".app-installed");
  if (standalone && installed) installed.hidden = false;
  let offer;
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    offer = event;
    if (install) install.hidden = false;
  });
  install?.addEventListener("click", async () => {
    if (!offer) return;
    offer.prompt();
    const { outcome } = await offer.userChoice.catch(() => ({ outcome: "dismissed" }));
    offer = undefined;
    install.hidden = true;
    if (outcome === "accepted" && installed) installed.hidden = false;
  });
  addEventListener("appinstalled", () => {
    if (install) install.hidden = true;
    if (installed) installed.hidden = false;
  });

  for (const button of document.querySelectorAll("button[data-share-link]")) {
    if (!navigator.share) continue;
    button.hidden = false;
    button.addEventListener("click", () => {
      navigator.share({ title: button.dataset.shareTitle || document.title, text: `Come into ${button.dataset.shareTitle || "the house"} with me`, url: button.dataset.shareLink }).catch(() => {});
    });
  }
  for (const button of document.querySelectorAll("button[data-copy-link]")) {
    if (!navigator.clipboard?.writeText) continue;
    button.hidden = false;
    const label = button.textContent;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copyLink);
        button.textContent = "Copied";
      } catch {
        // the address is on the page to copy by hand
      }
      setTimeout(() => (button.textContent = label), 3000);
    });
  }
})();

// Who you are, on coming in (ADR 0034): the "Hi Rithika" card goes by
// itself after a few seconds, or sooner if it's tapped, and the address
// loses its ?hi so a reload doesn't say it again. Tapping "Change" still
// goes to the door.
(() => {
  const hi = document.querySelector(".hi-there");
  if (!hi) return;
  try {
    const url = new URL(location.href);
    url.searchParams.delete("hi");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  } catch {
    // the address keeps it; a reload would greet again, which is harmless
  }
  const go = () => {
    if (hi.classList.contains("going")) return;
    hi.classList.add("going");
    setTimeout(() => hi.remove(), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 400);
  };
  const timer = setTimeout(go, 4500);
  hi.addEventListener("click", (event) => {
    if (event.target.closest("form, button")) return;
    clearTimeout(timer);
    go();
  });
})();
