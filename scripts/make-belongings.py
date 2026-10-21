"""Makes the pictures of things a made house's friends can have in their rooms
(src/belongings.ts, ADR 0020), with the course's image endpoint, once.

Dev-only, like cut-art.py, and needs the ANU VPN: the endpoint is on the
course proxy. Reads the key and proxy from ANTHROPIC_AUTH_TOKEN and
ANTHROPIC_BASE_URL, as Claude Code's settings set them, and never prints
the key.

  python3 scripts/make-belongings.py            # every picture not made yet
  python3 scripts/make-belongings.py guitar     # just these, remade

Each picture is $0.10 from the course image budget. The image URLs expire,
so each one is downloaded and saved straight away, as
public/art/thing-<key>.png, its white background cut away.
"""

import io
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "art"
LIST = ROOT / "src" / "belongings.ts"
MODEL = "flux-1.1-pro"
SIZE = 160
STYLE = (
    "cute cosy storybook illustration sticker, soft watercolour and coloured pencil, "
    "warm muted colours, gentle brown outline, white sticker border, seen from slightly above, "
    "centred, one object only, plain white background, no text, no shadow"
)


def belongings() -> list[tuple[str, str]]:
    src = LIST.read_text()
    return re.findall(r'key: "([a-z-]+)", label: "[^"]*", prompt: "([^"]*)"', src)


def curl(*args: str, data: str | None = None) -> bytes:
    """Fetches with curl, which uses the system's certificates (python.org's
    Python on macOS ships without any). The key goes in on stdin's header
    file, never on the command line, where `ps` would show it."""
    header = f"Authorization: Bearer {os.environ['ANTHROPIC_AUTH_TOKEN']}\n" if data is not None else ""
    cmd = ["curl", "-sf", "--max-time", "180", *args]
    if data is not None:
        cmd += ["-H", "@-", "-H", "content-type: application/json", "--data-binary", data]
    return subprocess.run(cmd, input=header.encode(), capture_output=True, check=True).stdout


def post(url: str, body: dict) -> dict:
    return json.loads(curl(url, data=json.dumps(body)))


def cut_out(raw: bytes) -> Image.Image:
    """The white around the sticker, made see-through; the sticker's own white
    border stays, since it's inside the outline."""
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    rgb = img.convert("RGB")
    # Flood the near-white background in from the corners only.
    mask = Image.new("L", img.size, 0)
    w, h = img.size
    seen = bytearray(w * h)
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    px = rgb.load()
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        r, g, b = px[x, y]
        if min(r, g, b) < 236:
            continue
        mask.putpixel((x, y), 255)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    alpha = Image.eval(mask.filter(ImageFilter.GaussianBlur(1.2)), lambda v: 255 - v)
    img.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if box:
        img = img.crop(box)
    side = max(img.size)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
    return shrink(square)


def shrink(img: Image.Image) -> Image.Image:
    """Small enough that the maker's form, which shows every picture five
    times, stays light: 160 px, in at most 256 colours."""
    return img.resize((SIZE, SIZE), Image.LANCZOS).quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert("RGBA")


def save(img: Image.Image, path: Path) -> None:
    img.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(path, optimize=True)


def make(key: str, prompt: str) -> str:
    base = os.environ.get("ANTHROPIC_BASE_URL", "https://strproxy.comp.anu.edu.au").rstrip("/")
    answer = post(f"{base}/api/images/generations", {"model": MODEL, "prompt": f"{prompt}, {STYLE}", "size": "1024x1024"})
    url = (answer.get("data") or [{}])[0].get("url")
    if not url:
        return f"{key}: no image"
    save(cut_out(curl(url)), OUT / f"thing-{key}.png")
    return f"{key}: saved"


if __name__ == "__main__":
    if sys.argv[1:] == ["--shrink"]:
        # Resizes pictures already made, without making new ones.
        for k, _ in belongings():
            path = OUT / f"thing-{k}.png"
            if path.exists():
                save(shrink(Image.open(path).convert("RGBA")), path)
        sys.exit()
    wanted = set(sys.argv[1:])
    todo = [(k, p) for k, p in belongings() if (k in wanted if wanted else not (OUT / f"thing-{k}.png").exists())]
    print(f"making {len(todo)} pictures, ${len(todo) * 0.10:.2f}")
    with ThreadPoolExecutor(max_workers=4) as pool:
        for line in pool.map(lambda kp: make(*kp), todo):
            print(line)
