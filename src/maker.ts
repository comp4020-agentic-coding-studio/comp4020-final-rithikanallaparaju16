import type { IncomingMessage, ServerResponse } from "node:http";

// Making a house for any five friends (prototype, branch llm-any-friends).
// GET /make is the form; POST /make asks Claude to turn it into a HouseSpec
// (src/houses.ts), saves it, and sends you to the new house's door.
export async function make(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.writeHead(501, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not built yet.");
}
