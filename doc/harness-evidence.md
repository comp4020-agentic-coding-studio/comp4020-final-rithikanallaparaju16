# Where each correction landed

A reference for writing `PROCESS.md`, not a replacement for it. The final
project's top band for process asks for "failures diagnosed and fixed at the
harness level rather than retried, judgement visible in what was thrown
away". Each row is one thing that went wrong, where the fix landed (a rule in
`CLAUDE.md`, a check in `spec/`, a decision record), and the commit that put
it there. Every hash was checked to exist and to carry the change named.
Log numbers point at entries in [process-log.md](process-log.md).

## Corrections that became rules or checks

| What went wrong | Where the fix landed | Commit |
| --- | --- | --- |
| Asked for a box of KitKats in Rithanya's room, the agent drew a box of cats from the Stitch art | `CLAUDE.md`: details about the five come from Rithika; ask before inventing (the KitKats are named in the rule) | [`df979fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df979fe) |
| A `pointer-events: none` meant for the drawing's `g.people` also matched the door's `ul.people`; the deployed door stopped letting anyone in | `CLAUDE.md`: scope SVG rules to the element; tap buttons for real with `scripts/shot.ts`, never `element.click()` | [`df979fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df979fe) |
| A new server that failed to bind its port had already migrated Rithika's local database under the old one | `CLAUDE.md`: never kill her server; use another port and a copy of `./data` | [`205b1d8`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/205b1d8) |
| "the uno game is lagging": a friend's move only showed after a reload, because the UNO page's list had no `data-live` key | Fixed in [`fdd9f94`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/fdd9f94); `CLAUDE.md`: a new card or list needs a `data-live` key | [`2b110a0`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/2b110a0) |
| Spec runs from the agent's shell would have made houses with real Claude calls on the course key | `CLAUDE.md`: a spec server started from the agent's shell runs `HOUSE_MAKER=fake` | [`1e762fe`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/1e762fe) |
| The widget's first version used `new URL`, which Scriptable doesn't have; it would never have loaded on an iPhone | A spec that runs the widget in a bare `node:vm` sandbox with Scriptable's objects stood in; `CLAUDE.md` names the trap | [`74c44de`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/74c44de) |
| A phone kept yesterday's `house.js` and ran old walking under today's page | Fingerprinted `own()` assets; a spec that no page asks for an unfingerprinted script; `CLAUDE.md` rule | [`8323d30`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8323d30) |
| A four-agent test sweep left 21 tests failing on real bugs; fixing them all first would have held up every deploy | Each bug a failing test, skipped by title so CI deploys, and a RICE row to rank it (log 66 onward) | [`b0daaf5`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/b0daaf5) |
| A full-screen "Turn your phone sideways" hid every page inside the house at the marking phone viewport (390 × 844), unnoticed for two days because every screenshot was of a phone on its side | ADR 0035 supersedes the cover; the spec promises nothing covers an upright phone's page; `CLAUDE.md` names both marking viewports | [`df68a9c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df68a9c) |
| A live page whose connection dropped didn't catch up, and no spec could see a page's own script | `public/live.js` fetches on reopen; a spec runs the served script in jsdom, and was seen to fail on the old script; `CLAUDE.md`: see a new check fail first | [`df68a9c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df68a9c) |

## Changing your mind on the record

| What changed | How | Commit |
| --- | --- | --- |
| Walking your own avatar, which ADR 0007 had turned down | A new record, ADR 0008, superseding it rather than editing 0007 | [`3e04bde`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/3e04bde) |
| UNO turns: ten seconds, then twenty after friends tried it ("10 sec was too less") | The turn length changed, with the reason in the log and the prompts | [`0095db4`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/0095db4) |
| Manual `flyctl deploy` steps, once CI deployed every push | Cut from `CLAUDE.md` so a second deploy couldn't race CI's | [`4dd46d7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/4dd46d7) |
| The sideways cover Rithika asked for (ADR 0032) | Superseded by ADR 0035 once it was seen at the marking viewport | [`df68a9c`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/df68a9c) |

## Thrown away

| What | Why | Where |
| --- | --- | --- |
| Claude drawing each room's things as flat shapes (ADR 0018) | It never ran on the live site: the course key only answers the ANU network, so every live house got paper tags. Replaced by 42 pictures made once and picked from (ADR 0020) | [`8f71174`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-rithikanallaparaju16/commit/8f71174) |
| A TestFlight app and an Android store app | Needed paid developer accounts; "nvm, lets j do website for now" | log 94 |
| A keepsake box for saved cards and notes | "noo lets skip that, omnly a good, well designed website"; the branch was deleted with nothing on it | log 94 |
| Diwali lights and "found your note" | Offered on 5 November; Rithika didn't pick them (the second is too close to a read receipt) | log 92 |

## How results were known to be right

- The spec runs against the running app over HTTP, in CI against the image
  that deploys; a red run blocks the deploy.
- Every UI change looked at in headless Chrome at 390 px and a laptop width,
  and an iPad from session 4 on, with real taps for anything touched
  (`scripts/shot.ts`).
- After each deploy: the door and `/readme/` load, and the read-only spec
  passes against the live URL.
- Friends used it: UNO's turn length came from them; the widget's first
  real run was on Rithika's iPhone (log 88).
