import { esc } from "./pages.ts";

// Renders README.md for /readme/. Handles only what the README uses: headings,
// paragraphs, lists, blockquotes, fenced code, rules, links, images, bold,
// italic and inline code. Anything else (tables, nested lists) shows as text.

function inline(s: string): string {
  const codes: string[] = [];
  const out = esc(s)
    .replace(/`([^`]+)`/g, (_, c: string) => `\u0000${codes.push(c) - 1}\u0000`)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>");
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => `<code>${codes[Number(i)]}</code>`);
}

const FENCE = /^ {0,3}(```|~~~)/;

export function markdown(src: string): string {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | undefined;
  let quote: string[] = [];

  const flush = (): void => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    if (list) out.push(`<${list.tag}>${list.items.map((it) => `<li>${inline(it)}</li>`).join("")}</${list.tag}>`);
    if (quote.length) out.push(`<blockquote>${markdown(quote.join("\n"))}</blockquote>`);
    para = [];
    list = undefined;
    quote = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;

    if (FENCE.test(line)) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !FENCE.test(lines[i])) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
    } else if ((m = line.match(/^ {0,3}(#{1,6})\s+(.*?)(\s+#+)?\s*$/))) {
      flush();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if (/^\s*$/.test(line)) {
      flush();
    } else if (/^ {0,3}(-{3,}|\*{3,})\s*$/.test(line)) {
      flush();
      out.push("<hr>");
    } else if ((m = line.match(/^ {0,3}>\s?(.*)$/))) {
      if (para.length || list) flush();
      quote.push(m[1]);
    } else if ((m = line.match(/^ {0,3}([-*]|\d+\.)\s+(.*)$/))) {
      const tag = /\d/.test(m[1]) ? "ol" : "ul";
      if (!list || list.tag !== tag) {
        flush();
        list = { tag, items: [] };
      }
      list.items.push(m[2]);
    } else if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      if (list || quote.length) flush();
      para.push(line.trim());
    }
  }
  flush();
  return out.join("\n");
}
