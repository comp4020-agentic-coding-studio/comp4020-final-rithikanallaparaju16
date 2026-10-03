#!/usr/bin/env python3
"""Turns the Google Stitch exports in stitch_virtual_shared_house/ into the
house's art in public/art/. A dev-time tool (needs Pillow); the app itself only
serves the files this writes.

  python3 scripts/cut-art.py

- house.jpg: the cutaway house, with Laddoo and his blanket lifted out and the
  lawn filled back in from the tree's shade around it, and one study table
  each in Amirdhavarshini's and Aswathy's rooms (the picture gave them two)
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
    img = one_desk_each(img)
    img.save(OUT / "house.jpg", quality=86, optimize=True, progressive=True)
    print("house.jpg", img.size)


def fill(img: Image.Image, poly: list, affine: tuple, feather: float = 1.2) -> Image.Image:
    """Paints over `poly` with another part of the picture. `affine` maps each
    pixel in the polygon to where it's copied from, as PIL's (a, b, c, d, e, f):
    from (a*x + b*y + c, d*x + e*y + f)."""
    moved = img.transform(img.size, Image.AFFINE, affine, resample=Image.BICUBIC)
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    return Image.composite(moved, img, mask.filter(ImageFilter.GaussianBlur(feather)))


def one_desk_each(img: Image.Image) -> Image.Image:
    """Rithika asked for one study table each in Amirdhavarshini's and Aswathy's
    rooms. Amirdhavarshini keeps the one under her pictures, and the laptop
    table by the wall goes. Aswathy keeps the one at the foot of her bed, with
    its chair to work on; the one in the corner by the door goes, but its
    chair, with her clothes on it, stays."""
    # Amirdhavarshini's floorboards run straight down the picture, so the
    # strip of floor between the bed and the table stretches down over the
    # table and its chair.
    img = fill(img, [(38, 320), (139, 320), (139, 429), (38, 429)], (1, 0, 0, 0, 20 / 109, 301 - 320 * 20 / 109))

    # Aswathy's table stands in the corner where the back wall meets the
    # beam along the wall to Neha's room. The floor where it stood comes from
    # the open boards between her door and the chair, in the same light; the
    # back wall comes down from the cream above it.
    beam = lambda y: 967 + 0.28 * (y - 432)  # the beam's left edge
    base = 528  # where the back wall meets the floor
    img = fill(img, [(939, base), (970, base), (970, 607), (939, 607)], (1, 0, -90, 0, 1, 8))
    img = fill(img, [(970, base), (beam(base) - 1, base), (1000, 556), (1000, 607), (970, 607)], (1, 0, -120, 0, 1, 8))
    # Above the clothes on her chair, the wall comes straight down; by the
    # beam it slides down along the beam, so the beam's own edges line up.
    down = 26 / 82  # rows 418-444, clear of the ceiling beam, stretched over 446-528
    top = 418 - 446 * down
    img = fill(img, [(912, 446), (951, 446), (951, base), (939, base), (939, 517), (912, 517)], (1, 0, 0, 0, down, top))
    # From (x, y), go up to row down*y + top, and back along the beam's slope.
    slide = (1, -0.28 * (1 - down), 0.28 * top, 0, down, top)
    img = fill(img, [(950, 446), (beam(446) + 6, 446), (beam(560) + 6, 560), (beam(560) - 1, 560), (beam(base) - 1, base), (950, base)], slide)
    # The wall's foot casts a soft line on the floor.
    shade = Image.new("L", img.size, 0)
    ImageDraw.Draw(shade).line([(939, base + 1), (beam(base) - 2, base + 1)], fill=70, width=3)
    return Image.composite(Image.new("RGB", img.size, (92, 58, 34)), img, shade.filter(ImageFilter.GaussianBlur(2)))


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
