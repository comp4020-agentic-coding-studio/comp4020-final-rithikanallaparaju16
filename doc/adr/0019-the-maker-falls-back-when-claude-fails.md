# 0019. The house maker falls back when Claude fails

Status: accepted. Built on 21 October 2026 at Rithika's asking. Supersedes
one line of 0017's Decision (below); 0017 and 0018 otherwise stand.

## Context

0017 has a Claude failure (a refusal, a cut-off answer, one that won't parse,
a rate limit, an unreachable API) show "a friendly line on the form, with the
answers kept". No house is made.

On 20 October Rithika's course key went on Fly so the live maker would use
Claude. The key goes through the course's proxy, strproxy, which the course
says "is only reachable from the ANU network: that's a university-wide
network rule". Fly is outside it, so every house on the live site failed:
"The house maker couldn't be reached", after 33 seconds of retries.

## Options

- Take the key off Fly. The live maker works again, but this only fixes Fly:
  any other failure still leaves the visitor with no house.
- Use a key that calls Anthropic directly. Claude works live, paid from
  Rithika's own account.
- Make the house from the answers whenever Claude fails, as the maker already
  does without a key.

Rithika chose the third ("do 3").

## Decision

Any failure from Claude when writing the house is logged as
`claude failed in <ms>ms, making it offline: <why>`, with no names or answers,
and the house is made from the answers, with paper tags (`src/maker.ts`). The
visitor gets a house either way, and its ready page says it was built from
what they wrote.

Nothing is drawn (0018) for a house Claude didn't write, so an unreachable
Claude is waited on once, not again for the drawings.

Claude gets 20 seconds a try and one retry to write the house (it takes about
12), and 45 seconds and one retry to draw (about 23), down from 90 seconds and
two retries. The worst wait before a fallback is about 40 seconds.

## Consequences

`/make` always makes a house. While the live site holds the course key, every
live house is made from the answers, after the wait for Claude to time out.

A visitor isn't told Claude was tried and failed; the log says why.

Revisit if Claude failing silently hides a problem worth showing, or when the
live site has a key Fly can reach.
