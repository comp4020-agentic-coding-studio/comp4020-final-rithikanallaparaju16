import type { IncomingMessage } from "node:http";

// A photo pinned on the memory wall (ADR 0024): "this reminds me of you
// guys". Read from the form a browser sends with a file in it
// (multipart/form-data), with nothing but node, and kept in the house's own
// SQLite file next to everything else, so it survives a redeploy (src/store.ts).

// The script shrinks a phone's photo to 1600 px before sending it (public/
// live.js), so it's usually a few hundred KB. Without the script the photo
// goes as it is, so the house takes up to this much: the machine has 256 MB.
export const MAX_PHOTO = 6 * 1024 * 1024;
const MAX_UPLOAD = MAX_PHOTO + 64 * 1024;

export type Upload = { fields: URLSearchParams; file?: { type: string; data: Buffer } };

// What a picture is, from its first bytes; never from its name or what the
// browser says it is. Only these three are ever served back.
export function pictureType(data: Buffer): string | undefined {
  if (data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.length > 12 && data.toString("latin1", 0, 4) === "RIFF" && data.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  return undefined;
}

// The form's fields and its one file, or undefined if it's too big or isn't
// a form with a file in it. `too` says it was the size.
export async function readUpload(req: IncomingMessage): Promise<Upload | "too big" | undefined> {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(req.headers["content-type"] ?? "");
  if (!/^multipart\/form-data/i.test(req.headers["content-type"] ?? "") || !boundary) return undefined;
  if (Number(req.headers["content-length"] ?? 0) > MAX_UPLOAD) return "too big";
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_UPLOAD) return "too big";
    chunks.push(chunk);
  }
  return parts(Buffer.concat(chunks), `--${boundary[1] ?? boundary[2]}`);
}

function parts(body: Buffer, boundary: string): Upload | undefined {
  const fields = new URLSearchParams();
  let file: Upload["file"];
  const sep = Buffer.from(boundary);
  let at = body.indexOf(sep);
  if (at < 0) return undefined;
  for (;;) {
    at += sep.length;
    // "--" after the boundary ends the form.
    if (body.toString("latin1", at, at + 2) === "--") break;
    at += 2; // \r\n
    const headEnd = body.indexOf("\r\n\r\n", at);
    if (headEnd < 0) return undefined;
    const head = body.toString("utf8", at, headEnd);
    const next = body.indexOf(sep, headEnd + 4);
    if (next < 0) return undefined;
    // The part's contents end with the \r\n before the next boundary.
    const data = body.subarray(headEnd + 4, next - 2);
    const name = /name="([^"]*)"/i.exec(head)?.[1];
    const isFile = /filename="/i.test(head);
    if (name && isFile) {
      if (data.length && !file) file = { type: pictureType(data) ?? "", data: Buffer.from(data) };
    } else if (name) {
      fields.append(name, data.toString("utf8"));
    }
    at = next;
  }
  return { fields, file };
}
