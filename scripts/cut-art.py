#!/usr/bin/env python3
"""Turns the Google Stitch exports in stitch_virtual_shared_house/ into the
house's art in public/art/. A dev-time tool (needs Pillow); the app itself only
serves the files this writes.

  python3 scripts/cut-art.py

- house.jpg: the cutaway house, with Laddoo and his blanket lifted out and the
  lawn filled back in from the tree's shade around it
- laddoo.png: Laddoo on his blanket, so the blanket goes wherever he does
- avatar-<id>.png: each sticker from the lineup on a transparent background,
  all on the same canvas size so they line up feet-first
"""
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent.parent
STITCH = ROOT / "stitch_virtual_shared_house"
OUT = ROOT / "public" / "art"
HOUSE = STITCH / "expansive_panoramic_top_down_cutaway_architectural_dollhouse_isometric" / "screen.png"
LINEUP = STITCH / "a_character_lineup_of_5_ultra_cute_chibi_avatar_stickers_displayed_side_by_side" / "screen.png"

# Laddoo and his blanket, in house-image pixels. src/scene.ts puts him back
# at LADDOO_AT when he's in the garden.
LADDOO_POLY = [(1172, 108), (1205, 96), (1206, 85), (1222, 79), (1241, 82), (1247, 86), (1255, 83), (1325, 128), (1243, 164)]

# Left edges of each sticker in the lineup, left to right, and whose it is.
LINEUP_CUTS = [22, 315, 550, 814, 1063, 1344]
LINEUP_IDS = ["5", "2", "4", "3", "1"]  # Aswathy, Neha, Rithanya, Amirdhavarshini, Rithika
AVATAR_CANVAS = (300, 404)
AVATAR_SIZE = (180, 242)


def house() -> None:
    src = Image.open(HOUSE).convert("RGB")
    mask = Image.new("L", src.size, 0)
    ImageDraw.Draw(mask).polygon(LADDOO_POLY, fill=255)

    sprite = src.convert("RGBA")
    sprite.putalpha(mask.filter(ImageFilter.GaussianBlur(1.2)))
    l, t, r, b = mask.getbbox()
    box = (l - 3, t - 3, r + 3, b + 3)
    sprite.crop(box).save(OUT / "laddoo.png", optimize=True)
    print("laddoo.png at", box[:2], "size", (box[2] - box[0], box[3] - box[1]))

    grow = mask.filter(ImageFilter.MaxFilter(9))
    ring = ImageChops.subtract(grow.filter(ImageFilter.MaxFilter(15)), grow)
    shade = tuple(int(v) for v in ImageStat.Stat(src, ring).mean)
    img = Image.composite(Image.new("RGB", src.size, shade), src, grow)
    for radius, times in [(24, 6), (14, 8), (8, 10), (4, 12), (2, 10)]:
        for _ in range(times):
            img = Image.composite(img.filter(ImageFilter.GaussianBlur(radius)), src, grow)
    random.seed(4)
    grain = ImageChops.add(img, Image.effect_noise(src.size, 10).convert("RGB"), scale=1.0, offset=-128)
    img = Image.composite(grain, img, grow.filter(ImageFilter.GaussianBlur(3)))
    img = Image.composite(img, src, grow.filter(ImageFilter.GaussianBlur(2)))
    img.save(OUT / "house.jpg", quality=86, optimize=True, progressive=True)
    print("house.jpg", img.size)


def avatars() -> None:
    src = Image.open(LINEUP).convert("RGBA")
    w = src.size[0]
    im = src.crop((0, 0, w, 595))  # above the handwritten names
    seeds = [(x, 0) for x in range(0, w, 40)] + [(x, 594) for x in range(0, w, 40)] + [(0, 300), (w - 1, 300)]
    for s in seeds:
        if im.getpixel(s)[3]:
            ImageDraw.floodfill(im, s, (0, 0, 0, 0), thresh=30)
    for i, pid in enumerate(LINEUP_IDS):
        piece = im.crop((LINEUP_CUTS[i], 0, LINEUP_CUTS[i + 1], 595))
        pw, ph = piece.size
        # Neighbouring stickers touch at the hands; keep only this one's blob.
        blob = piece.getchannel("A").point(lambda v: 255 if v else 0)
        ImageDraw.floodfill(blob, (pw // 2, 300), 128, thresh=0)
        alpha = Image.composite(piece.getchannel("A"), Image.new("L", piece.size, 0), blob.point(lambda v: 255 if v == 128 else 0))
        piece.putalpha(alpha)
        piece = piece.crop(alpha.getbbox())
        canvas = Image.new("RGBA", AVATAR_CANVAS, (0, 0, 0, 0))
        canvas.alpha_composite(piece, ((AVATAR_CANVAS[0] - piece.size[0]) // 2, AVATAR_CANVAS[1] - piece.size[1]))
        canvas.resize(AVATAR_SIZE, Image.LANCZOS).save(OUT / f"avatar-{pid}.png", optimize=True)
        print(f"avatar-{pid}.png from a {piece.size} sticker")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    house()
    avatars()
