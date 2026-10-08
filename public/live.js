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
      old.replaceWith(document.importNode(fresh, true));
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

  // UNO turns last ten seconds (ADR 0016). The page counts the turn in play
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
    source = new EventSource("/live");
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
