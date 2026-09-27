#!/usr/bin/env python3
"""Генерация промо-изображений для карточки AMO.

Запуск: python3 scripts/make_promo.py
Результат: amo/promo-1280x800.png, amo/promo-440x280.png
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "amo")

BG = (14, 16, 21)
SURFACE = (22, 26, 33)
SURFACE2 = (29, 34, 43)
TEXT = (231, 233, 239)
DIM = (150, 156, 168)
ACCENT = (124, 148, 255)
ACCENT2 = (91, 115, 230)

FONT_BOLD = "/usr/share/fonts/liberation/LiberationSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/liberation/LiberationSans-Regular.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default(size)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_moon(size: int) -> Image.Image:
    """Иконка-луна на прозрачном фоне (тот же мотив, что и у иконок)."""
    ss = 4
    s = size * ss
    layer = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    grad = Image.new("RGB", (s, s))
    px = grad.load()
    for y in range(s):
        for x in range(s):
            t = (x + y) / (2 * (s - 1))
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(ACCENT, ACCENT2))

    mask = Image.new("L", (s, s), 0)
    md = ImageDraw.Draw(mask)
    r = s * 0.27
    cx, cy = s * 0.575, s * 0.55
    md.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    r2 = s * 0.255
    ox, oy = s * 0.46, s * 0.43
    md.ellipse([ox - r2, oy - r2, ox + r2, oy + r2], fill=0)

    bg = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bg.paste(grad.convert("RGBA"), (0, 0), mask)
    layer.alpha_composite(bg)

    r3 = int(s * 0.22)
    corner = Image.new("L", (s, s), 0)
    ImageDraw.Draw(corner).rounded_rectangle([0, 0, s - 1, s - 1], radius=r3, fill=255)
    layer.putalpha(corner)
    return layer.resize((size, size), Image.LANCZOS)


def make_wide() -> None:
    W, H = 1280, 800
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    for y in range(H):
        t = y / H
        c = tuple(round(a + (b - a) * t) for a, b in zip(BG, (18, 20, 27)))
        d.line([(0, y), (W, y)], fill=c)

    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    for i in range(400, 0, -2):
        a = int(40 * (i / 400) ** 2)
        gd.ellipse([W - 520 - i, -i, W - 520 + i, i], fill=(BG[0] + a, BG[1] + a, BG[2] + a))
    img = Image.blend(img, glow, 0.35)
    d = ImageDraw.Draw(img)

    moon = draw_moon(160)
    img.paste(moon, (96, 96), moon)

    d.text((300, 108), "МЭШ · Тёмная тема", font=font(FONT_BOLD, 64), fill=TEXT)
    d.text((302, 190), "school.mos.ru", font=font(FONT_REG, 34), fill=ACCENT)

    subtitle = "Тёмное оформление интерфейса на токенах Lemma"
    d.text((98, 300), subtitle, font=font(FONT_REG, 30), fill=DIM)

    chips = [
        ("3 режима", ACCENT),
        ("5 акцентов", (70, 207, 98)),
        ("Автокоррекция", (255, 159, 74)),
        ("Без мигания", (255, 90, 168)),
        ("Без сбора данных", (42, 212, 207)),
    ]
    x, y = 98, 370
    chip_font = font(FONT_REG, 26)
    for label, color in chips:
        tw = d.textlength(label, font=chip_font)
        pad = 22
        box = [x, y, x + tw + pad * 2, y + 56]
        rounded(d, box, 28, SURFACE, outline=color, width=2)
        d.ellipse([x + 16, y + 22, x + 28, y + 34], fill=color)
        d.text((x + 40, y + 15), label, font=chip_font, fill=TEXT)
        x += tw + pad * 2 + 16

    card = [98, 480, W - 98, 742]
    rounded(d, card, 24, SURFACE)
    d.text((146, 522), "Дневник", font=font(FONT_BOLD, 36), fill=TEXT)
    d.text((146, 576), "Понедельник, 27 сентября · обновлено 5 минут назад",
           font=font(FONT_REG, 24), fill=DIM)

    rows = [("Математика", "Зачтено", (70, 207, 98)),
            ("Русский язык", "Срок сегодня", (255, 159, 74)),
            ("Физика", "Пропуск", (255, 107, 115))]
    ry = 646
    for i, (name, status, color) in enumerate(rows):
        rx = 146 + i * 330
        rounded(d, [rx, ry, rx + 300, ry + 72], 16, SURFACE2)
        d.text((rx + 22, ry + 22), name, font=font(FONT_REG, 26), fill=TEXT)
        tw = d.textlength(status, font=font(FONT_REG, 20))
        bx = rx + 300 - tw - 44
        rounded(d, [bx, ry + 20, rx + 278, ry + 52], 16,
                tuple(int(c * 0.22) for c in color))
        d.text((bx + 14, ry + 25), status, font=font(FONT_REG, 20), fill=color)

    out = os.path.join(OUT, "promo-1280x800.png")
    img.save(out)
    print("Готово:", out)


def make_tile() -> None:
    W, H = 440, 280
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        c = tuple(round(a + (b - a) * t) for a, b in zip(BG, (20, 23, 31)))
        d.line([(0, y), (W, y)], fill=c)

    moon = draw_moon(96)
    img.paste(moon, (32, 32), moon)
    d.text((152, 44), "МЭШ", font=font(FONT_BOLD, 46), fill=TEXT)
    d.text((152, 98), "Тёмная тема", font=font(FONT_REG, 30), fill=ACCENT)
    d.text((32, 168), "school.mos.ru", font=font(FONT_REG, 24), fill=DIM)
    d.text((32, 210), "3 режима · 5 акцентов", font=font(FONT_REG, 22), fill=DIM)
    d.text((32, 240), "без сбора данных", font=font(FONT_REG, 22), fill=DIM)

    out = os.path.join(OUT, "promo-440x280.png")
    img.save(out)
    print("Готово:", out)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    make_wide()
    make_tile()
