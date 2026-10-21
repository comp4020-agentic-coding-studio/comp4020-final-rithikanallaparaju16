#!/usr/bin/env python3
"""Turns the house layouts in layouts/ into the pictures a made house for 2,
3, 4, 6 or 7 friends is drawn on (ADR 0021): public/art/house-<n>.jpg, the
same size as Rithika's house.jpg (1376 x 768), so the page lays them out the
same way. A dev-time tool (needs Pillow); the app only serves what it writes.

  python3 -I scripts/make-layouts.py

Each layout (layouts/<n>-friends.png, from the course's image endpoint) is a
house on white; the garden (layouts/garden.png) is a strip of lawn, a tree and
sunflowers on beige. Both are lifted off their backgrounds and set on a lawn:
the house on the left, the garden down the right, as in Rithika's house.
"""
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "layouts"
OUT = ROOT / "public" / "art"
W, H = 1376, 768
COUNTS = [2, 3, 4, 6, 7]

# Where things go on the canvas: the garden's strip down the right, the house
# in what's left, with a margin of lawn round both.
GARDEN_W = 270
MARGIN = 8
GAP = 14

# The lawn, matched to the garden's own grass.
LAWN = (146, 178, 96)


def lift(img: Image.Image, thresh: int) -> tuple[Image.Image, bool]:
    """The picture with its plain background made transparent, flooding in
    from the edges so nothing inside the outlines goes, cropped to what's
    left; and whether the house runs off the bottom of its picture. Only
    edge pixels the colour of the corner start a flood, so a floor that
    runs off the edge stays."""
    im = img.convert("RGBA")
    w, h = im.size
    bg = im.getpixel((2, 2))
    near = lambda p: p[3] and max(abs(p[i] - bg[i]) for i in range(3)) <= thresh
    edge = [(x, y) for x in range(0, w, 8) for y in (0, h - 1)] + [(x, y) for y in range(0, h, 8) for x in (0, w - 1)]
    for p in edge:
        if near(im.getpixel(p)):
            ImageDraw.floodfill(im, p, (0, 0, 0, 0), thresh=thresh)
    # Specks of paper texture the flood didn't reach: keep only the one big
    # shape in the middle, found on a coarsened copy so thin gaps don't split it.
    solid = im.getchannel("A").point(lambda v: 255 if v else 0)
    blob = solid.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(9))
    ImageDraw.floodfill(blob, (w // 2, h // 2), 128, thresh=0)
    keep = blob.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5))
    # A soft edge, so the outline doesn't sit on the lawn with a white fringe.
    alpha = ImageChops.multiply(solid, keep).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(alpha)
    box = alpha.getbbox()
    return im.crop(box), box[3] >= h - 2


def lawn() -> Image.Image:
    """Even grass with the soft mottling of a watercolour wash, and the little
    ink ticks the garden's own lawn has."""
    random.seed(21)
    base = Image.new("RGB", (W, H), LAWN)
    for size, strength in [(6, 26), (24, 18)]:
        noise = Image.effect_noise((W // size, H // size), 64).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(size))
        tint = Image.merge("RGB", [noise.point(lambda v: 128 + (v - 128) * strength // 64)] * 3)
        base = ImageChops.add(base, tint, scale=1.0, offset=-128)
    draw = ImageDraw.Draw(base)
    for _ in range(420):
        x, y = random.randrange(W), random.randrange(H)
        for dx in (0, 4):
            draw.line([(x + dx, y), (x + dx + random.choice((-1, 0, 1)), y - random.randint(4, 7))], fill=(86, 112, 58), width=1)
    return base


def shadow(canvas: Image.Image, piece: Image.Image, at: tuple) -> None:
    """A soft shadow on the lawn under `piece`, down and to the right."""
    sh = Image.new("L", canvas.size, 0)
    sh.paste(piece.getchannel("A"), (at[0] + 6, at[1] + 8))
    sh = sh.filter(ImageFilter.GaussianBlur(9)).point(lambda v: v * 45 // 255)
    canvas.paste(Image.new("RGB", canvas.size, (52, 70, 30)), (0, 0), sh)


def fit(piece: Image.Image, w: int, h: int) -> Image.Image:
    k = min(w / piece.width, h / piece.height)
    return piece.resize((round(piece.width * k), round(piece.height * k)), Image.LANCZOS)


def main() -> None:
    garden = fit(lift(Image.open(SRC / "garden.png"), 34)[0], GARDEN_W, H - 2 * MARGIN)
    gx, gy = W - MARGIN - garden.width, (H - garden.height) // 2
    print("garden at", (gx, gy), "size", garden.size)
    for n in COUNTS:
        house, cut = lift(Image.open(SRC / f"{n}-friends.png"), 14)
        # A house that runs off the bottom of its picture runs off the bottom
        # of this one too, rather than stopping short on the lawn.
        house = fit(house, gx - GAP - MARGIN, H - (MARGIN if cut else 2 * MARGIN))
        hx, hy = MARGIN, H - house.height if cut else (H - house.height) // 2
        canvas = lawn()
        shadow(canvas, garden, (gx, gy))
        shadow(canvas, house, (hx, hy))
        canvas.paste(garden, (gx, gy), garden)
        canvas.paste(house, (hx, hy), house)
        canvas.save(OUT / f"house-{n}.jpg", quality=86, optimize=True, progressive=True)
        print(f"house-{n}.jpg: house at", (hx, hy), "size", house.size)


if __name__ == "__main__":
    main()
