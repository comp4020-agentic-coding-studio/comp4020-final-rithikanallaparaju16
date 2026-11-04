// The house on your home screen (Scriptable, free on the App Store).
// Paste all of this into a new script, then add a Scriptable widget to your
// home screen and pick this script. Your own link is filled in below, so
// keep it to yourself. The widget itself comes from the house and updates
// on its own; you never need to paste again.
const LINK = "__LINK__";

const fm = FileManager.local();
const DIR = fm.joinPath(fm.libraryDirectory(), `house-${LINK.replace(/[^A-Za-z0-9]/g, "").slice(-24)}`);
if (!fm.fileExists(DIR)) fm.createDirectory(DIR, true);
const KEPT = fm.joinPath(DIR, "widget.js");

let code = fm.fileExists(KEPT) ? fm.readString(KEPT) : "";
if (!code) {
  try {
    const req = new Request(`${LINK}widget.js`);
    req.timeoutInterval = 20;
    code = await req.loadString();
    if (code.includes("const VERSION")) fm.writeString(KEPT, code);
    else code = "";
  } catch {
    code = "";
  }
}

try {
  if (!code) throw new Error("not yet");
  await new Function("LINK", "DIR", "KEPT", `return (async () => {\n${code}\n})();`)(LINK, DIR, KEPT);
} catch {
  // A copy that won't run is fetched fresh next time.
  if (fm.fileExists(KEPT)) fm.remove(KEPT);
  const w = new ListWidget();
  w.backgroundColor = new Color("#fff8ec");
  const t = w.addText("The house couldn't be reached. It'll try again soon.");
  t.font = Font.mediumSystemFont(13);
  t.textColor = new Color("#7a6150");
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  if (config.runsInWidget) Script.setWidget(w);
  else await w.presentMedium();
  Script.complete();
}
