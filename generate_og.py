from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 627
PAD_X = 80
PAD_Y = 56

img = Image.new("RGB", (W, H), "#0d1b2a")
draw = ImageDraw.Draw(img)

# ── Fonts ─────────────────────────────────────────────────────────────────────
def load_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/Arial Bold.ttf" if bold else "C:/Windows/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

font_tag = load_font(76, bold=True)
font_sub = load_font(24, bold=False)

lines = [
    ("From concept to",  "#ffffff"),
    ("production-ready", "#4aad4a"),
    ("hardware.",        "#ffffff"),
]
line_gap = 10

# ── Logo ──────────────────────────────────────────────────────────────────────
logo_h = 46
logo_src = Image.open("images/logo-white.png").convert("RGBA")
ratio = logo_h / logo_src.height
logo_w = int(logo_src.width * ratio)
logo = logo_src.resize((logo_w, logo_h), Image.LANCZOS)
img.paste(logo, (PAD_X, PAD_Y), logo)

# ── Line under logo ───────────────────────────────────────────────────────────
line1_y = PAD_Y + logo_h + 18
draw.line([(PAD_X, line1_y), (W - PAD_X, line1_y)], fill="#1e3a52", width=1)

# ── Tagline ───────────────────────────────────────────────────────────────────
tag_y = line1_y + 22
for text, color in lines:
    draw.text((PAD_X, tag_y), text, font=font_tag, fill=color)
    bb = draw.textbbox((PAD_X, tag_y), text, font=font_tag)
    tag_y = bb[3] + line_gap

# ── Line under tagline ────────────────────────────────────────────────────────
line2_y = tag_y + 14
draw.line([(PAD_X, line2_y), (W - PAD_X, line2_y)], fill="#1e3a52", width=1)

# ── Footer ────────────────────────────────────────────────────────────────────
footer = "PCB design  ·  Embedded firmware  ·  Mechanical engineering"
footer_bb = draw.textbbox((0, 0), footer, font=font_sub)
footer_w = footer_bb[2] - footer_bb[0]
footer_h = footer_bb[3] - footer_bb[1]
footer_x = (W - footer_w) // 2
footer_y = H - PAD_Y - footer_h
draw.text((footer_x, footer_y), footer, font=font_sub, fill="#64748b")

# ── Save ──────────────────────────────────────────────────────────────────────
img.save("images/og-image.png", "PNG")
print(f"Saved images/og-image.png ({W}x{H})")
