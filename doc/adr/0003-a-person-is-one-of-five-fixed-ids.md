# 0003. A person is one of five fixed ids, picked at the door

Status: accepted

Made in session 1 and recorded here in session 2, after the fact.

## Context

The house is for exactly five people, who already know each other. Strangers
at a crit need to be able to walk in and look around. Everything left in the
house points at whoever left it.

## Options

- Five fixed people in code, picked at the door and remembered in a cookie for
  a year. No passwords. Anyone with the link can be anyone.
- Accounts with passwords or magic links. Real identity, but sign-up and
  recovery are a lot of ceremony for five friends, and crit visitors couldn't
  get in.
- A shared front-door key, then pick who you are. Keeps strangers out, but
  crit visitors would need the key.

## Decision

The five live in `src/people.ts` with ids "1" to "5". Rithika is "1", Neha "2",
Amirdhavarshini "3", Rithanya "4" and Aswathy "5". A `who` cookie holds the id.
Renaming someone means changing `name`, never the id.

## Consequences

Notes, visits and everything else reference these ids forever, so changing one
would orphan what that person left. The privacy of desk notes (only the owner
and the author can read them) is a courtesy, not security, because anyone can
pick anyone at the door.

Revisit before the real five rely on desk notes being private: a shared key is
the likely next step.
