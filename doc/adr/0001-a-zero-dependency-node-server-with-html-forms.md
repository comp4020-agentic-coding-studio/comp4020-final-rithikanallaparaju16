# 0001. A zero-dependency Node server with HTML forms

Status: accepted

Made in session 1 and recorded here in session 2, after the fact.

## Context

Five friends visit for a minute at a time, often on phones. The app runs on
one small Fly machine (256 MB), and nothing has to happen in real time. The
course requires a Dockerfile that Fly's remote builder can build, and there is
no Docker on Rithika's machine to try it first.

## Options

- Node 24 running `src/*.ts` directly (type stripping), with `node:http` and
  server-rendered HTML forms that post and redirect. There's nothing to build
  or install at runtime, and every page works without JavaScript. The cost is
  that routing, cookies and form parsing are hand-written.
- A framework (Astro, Next, Express with a template engine). Routing and
  templating come for free, but there's a build step, dependencies to keep
  current, and more for a 256 MB machine to hold.
- A single-page app with a JSON API. It suits real-time features we don't
  need, and it needs a client bundle.

## Decision

Node 24 with erasable TypeScript only, `node:http`, no runtime dependencies and
no build step. Pages are HTML strings rendered on the server. Every change is a
form that posts and redirects.

## Consequences

The Dockerfile only copies files and runs node. Anything a framework would give
us (routing, escaping, the README renderer) is our own code and our own tests.
Adding a runtime dependency needs a reason in `PROCESS.md`. Live updates or a
walkable avatar would need client JavaScript, which the house doesn't have yet.

Revisit if the house needs to change while you're looking at it.
