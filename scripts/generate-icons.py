"""
Generates the app icon set from one vector-like mark: a detector coil seen
from above (three concentric rings with crosshair ticks) in brass on ink.
Same mark as the website logo. Re-run after changing colours:

    python3 scripts/generate-icons.py

Output (in ./assets): icon.png, android-icon-foreground.png,
android-icon-background.png, android-icon-monochrome.png, splash-icon.png,
favicon.png.
"""
from pathlib import Path

from PIL import Image, ImageDraw

INK = (21, 19, 15, 255)
BRASS = (201, 164, 101, 255)
BRASS_SOFT = (201, 164, 101, 150)
IVORY = (243, 239, 231, 255)
WHITE = (255, 255, 255, 255)
CLEAR = (0, 0, 0, 0)

SS = 4  # supersampling factor for smooth edges
ASSETS = Path(__file__).resolve().parent.parent / "assets"


def ring(draw, c, r, w, color):
    draw.ellipse([c - r, c - r, c + r, c + r], outline=color, width=w)


def mark(size, scale, colors, background=CLEAR):
    """Draw the coil mark centred on a square canvas.

    scale: share of the canvas the outer ring's diameter takes.
    colors: (outer, middle, inner, ticks)
    """
    S = size * SS
    img = Image.new("RGBA", (S, S), background)
    d = ImageDraw.Draw(img)
    c = S / 2
    R = S * scale / 2
    w = max(2, round(R * 0.055))
    outer, middle, inner, ticks = colors

    # The whole mark (coil + shaft) is shifted down-left so it stays centred.
    k = R * 0.18
    cx, cy = c - k, c + k
    # Shaft: leaves the coil towards the upper right, like a detector seen from above.
    import math

    a = math.radians(-45)
    sx, sy = cx + math.cos(a) * R, cy + math.sin(a) * R
    ex, ey = cx + math.cos(a) * R * 1.55, cy + math.sin(a) * R * 1.55
    d.line([sx, sy, ex, ey], fill=ticks, width=round(w * 1.4))
    # Coil: a heavy outer ring, a lighter winding inside.
    ring_r = R
    d.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r], outline=outer, width=round(w * 1.6))
    ring2 = R * 0.66
    d.ellipse([cx - ring2, cy - ring2, cx + ring2, cy + ring2], outline=middle, width=w)
    # Target below the coil: a filled point with a soft echo ring.
    ring3 = R * 0.3
    d.ellipse([cx - ring3, cy - ring3, cx + ring3, cy + ring3], outline=inner, width=w)
    dot = R * 0.11
    d.ellipse([cx - dot, cy - dot, cx + dot, cy + dot], fill=inner)
    return img.resize((size, size), Image.LANCZOS)


def save(img, name):
    img.save(ASSETS / name)
    print("wrote", name, img.size)


def main():
    brass = (BRASS, BRASS_SOFT, BRASS, BRASS)

    # iOS / store icon: full-bleed ink, no transparency.
    save(mark(1024, 0.56, brass, INK), "icon.png")

    # Android adaptive icon: the mark must sit inside the central safe zone (~66%).
    save(mark(1024, 0.42, brass), "android-icon-foreground.png")
    save(Image.new("RGBA", (1024, 1024), INK), "android-icon-background.png")
    save(mark(1024, 0.42, (WHITE, WHITE, WHITE, WHITE)), "android-icon-monochrome.png")

    # Splash: ink mark on the ivory splash background (background colour comes from app.json).
    save(mark(1024, 0.62, (INK, INK, (122, 92, 46, 255), INK)), "splash-icon.png")

    save(mark(48, 0.7, brass, INK), "favicon.png")


if __name__ == "__main__":
    main()
