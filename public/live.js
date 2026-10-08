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

  // Something you're in the middle of: what you're focused on, or a form
  // you've started filling in.
  function busy(region) {
    const focused = document.activeElement;
    if (focused && focused !== document.body && region.contains(focused)) return true;
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
      for (const fresh of doc.querySelectorAll("[data-live]")) {
        const old = document.querySelector(`[data-live="${CSS.escape(fresh.dataset.live)}"]`);
        if (!old || old.closest("svg") || busy(old)) continue;
        old.replaceWith(document.importNode(fresh, true));
      }
      const fresh = new CustomEvent("house:fresh", { detail: { doc }, cancelable: true });
      if (document.dispatchEvent(fresh)) {
        const svg = document.querySelector(".house-svg");
        const next = doc.querySelector(".house-svg");
        if (svg && next) svg.replaceWith(document.importNode(next, true));
      }
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
  // that room now); one fetch covers both.
  let timer;
  const soon = () => {
    clearTimeout(timer);
    timer = setTimeout(refresh, 250);
  };

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
