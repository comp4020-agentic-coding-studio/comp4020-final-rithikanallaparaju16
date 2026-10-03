// The house works without this file: rooms are links and everything else is a
// form. This only makes it nicer. On a phone the house is wider than the
// screen, so it starts with you in view; and tapping a room walks you there
// before the room opens.
(() => {
  const svg = document.querySelector(".house-svg");
  const me = svg?.querySelector(".walker.me");
  if (!svg || !me) return;

  const map = svg.closest(".map");
  if (map && map.scrollWidth > map.clientWidth) {
    const you = me.getBoundingClientRect();
    const view = map.getBoundingClientRect();
    map.scrollLeft += you.left + you.width / 2 - (view.left + view.width / 2);
  }

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Coming back with the browser's back button can restore the page mid-walk.
  const wandering = me.getAttribute("style");
  addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    me.setAttribute("style", wandering);
    me.classList.remove("walking");
  });

  svg.addEventListener("click", (event) => {
    const link = event.target.closest("a.room-link");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute("href");
    if (link.dataset.place === me.dataset.place) return;
    event.preventDefault();

    const [x, y] = link.dataset.walk.split(",").map(Number);
    const from = new DOMMatrix(getComputedStyle(me).transform);
    const ms = Math.min(1100, Math.max(450, Math.hypot(x - from.e, y - from.f) * 1.4));
    me.style.animation = "none";
    me.style.transform = `translate(${from.e}px, ${from.f}px)`;
    me.getBoundingClientRect();
    me.classList.add("walking");
    me.style.transition = `transform ${ms}ms ease-in-out`;
    me.style.transform = `translate(${x}px, ${y}px)`;
    setTimeout(() => location.assign(href), ms);
  });
})();
