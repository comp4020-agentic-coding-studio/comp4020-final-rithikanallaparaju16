# 0029. The wall reaches widgets only when its writer says, and what's new goes first

Status: accepted. Built on 4 November 2026 at Rithika's asking: "when
amirdha puts a note on my desk, i want a small preview. if theres an
update on the mermory wall i want a small preview on my widget / if amirdha
leaves a note on nehas desk, i dont need a preview, but if food is left on
the counter for me i need to see, but if its a note, it could be private,
so dont read it / but memory wall wont be private. so maybe ask if it can
be shown on the widget before you show. because if its like a nice
motivational thing id love to see it". Adds to 0025 and 0027.

## Context

The widget (0027) already showed the words of the newest note on her own
desk and a plate saved for her, and never a note on anyone else's desk.
But it showed every photo and note on the wall, and its cards took turns,
so something new could wait behind five other cards before she saw it.

The wall is for everyone in the house; a home screen isn't. A phone on a
table, a lock screen on a bus, a Mac in a meeting: what's on a widget is
out in the world.

## Options

How the wall gets onto widgets:

- Everything, as before. The writer never knew it would leave the house.
- Nothing from the wall. Loses the "nice motivational thing" Rithika wants
  to see.
- Asked when pinning, unticked, and changeable later by the writer only.

How something new is shown:

- Wait for its turn. Up to six redraws, which iOS spaces out.
- Jump the queue once: the first draw after it arrives shows it, then the
  turns carry on where they were.

## Decision

- Both of the wall's forms ask "Show it on friends' home-screen widgets
  too", unticked. Ticking it leaves an `onwidget` row (place `note:<id>`,
  item `yes`) after the note. On her own notes the writer gets a switch
  (`POST /wall/widget`), which leaves another `onwidget` row, `yes` or
  `""`; her newest one counts (`onWidget()` in `src/house.ts`). Nobody
  else's counts. Friends see a quiet "📱 on widgets" on a shared note.
- The widget's wall card, its `latest`, and the widget's photo route show
  only notes and photos their writers said yes to, including her own.
- Desk cards stay hers alone: only notes on her own desk, never a friend's.
  Plates show only when saved for her. Food left out for everyone isn't a
  card.
- The JSON says when the newest thing on her desk, plate or wall cards was
  left (`newest`, each card's `at`, her own wall notes not counted). The
  widget keeps what it last showed; a newer one is drawn first, once,
  without using a turn. A widget's first draw starts from now.
- Saying where your note shows is housekeeping: not news, not a visit, not
  the Updates dot.

## Consequences

Notes pinned before today are off widgets until their writer turns them on.
That's on purpose: nobody said yes to them.

"Something new shows first" is as quick as iOS redraws it plus the four
minutes the widget keeps the house's answer (0027), so usually within a
quarter of an hour, never instantly. The widget still never buzzes.
