import { expect, it } from "vitest";
import { drawingSvg, tidyDrawings } from "../src/drawings.ts";

// Claude's drawings reach the page as SVG, so only numbers, known shapes and
// hex colours may survive, whatever came back (src/drawings.ts, ADR 0018).
it("keeps nothing from a drawing but shapes, numbers and colours", () => {
  const raw = [{
    shapes: [
      { kind: "circle", fill: "#ff0000", stroke: "#4a3426", nums: [50, 50, 40] },
      { kind: "script", fill: "#ff0000", stroke: "#000000", nums: [1, 2, 3] },
      { kind: "rect", fill: "red\" onload=\"alert(1)", stroke: "#000000", nums: [10, 10, 20, 20] },
      { kind: "polygon", fill: "#00ff00", stroke: "none", nums: [0, 0, 500, -40, 30, "<b>", 7] },
      { kind: "line", fill: "#123456", stroke: "none", nums: [0, 0, 10, 10] },
    ],
  }];
  const [drawing] = tidyDrawings(raw, ["a <b>teapot</b>"]);
  const svg = drawingSvg(drawing);

  expect(drawing.shapes.map((s) => s.kind)).toEqual(["circle", "rect", "polygon"]);
  expect(svg).not.toMatch(/script|onload|alert|<b>/);
  expect(svg).toContain(`points="0 0 100 0 30 0"`);
  expect(svg).toContain(`fill="none" stroke="#000000"`);
});

it("draws only the friend's own things, and drops an empty drawing", () => {
  const drawn = tidyDrawings([
    { shapes: [] },
    { shapes: [{ kind: "circle", fill: "#ffffff", stroke: "none", nums: [5, 5, 5] }] },
    { shapes: [{ kind: "circle", fill: "#ffffff", stroke: "none", nums: [5, 5, 5] }] },
  ], ["a guitar", "fairy lights"]);
  expect(drawn.map((d) => d.thing)).toEqual(["fairy lights"]);
});
