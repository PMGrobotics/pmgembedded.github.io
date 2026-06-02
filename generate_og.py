from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
PAD = 64

img = Image.new("RGB", (W, H), "#0d1b2a")
draw = ImageDraw.Draw(img)

# ── Logo ──────────────────────────────────────────────────────────────────────
logo_src = Image.open("images/logo-white.png").convert("RGBA")
logo_h = 50
ratio = logo_h / logo_src.height
logo_w = int(logo_src.width * ratio)
logo = logo_src.resize((logo_w, logo_h), Image.LANCZOS)
img.paste(logo, (PAD, PAD), logo)

# ── Line under logo ───────────────────────────────────────────────────────────
line_y = PAD + logo_h + 28
draw.line([(PAD, line_y), (W - PAD, line_y)], fill="#1e3a52", width=1)

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

font_tag  = load_font(82, bold=True)
font_sub  = load_font(26, bold=False)

# ── Tagline ───────────────────────────────────────────────────────────────────
lines = [
    ("From concept to",    "#ffffff"),
    ("production-ready",   "#4aad4a"),
    ("hardware.",          "#ffffff"),
]

line_gap = 16
tag_y = line_y + 40

for text, color in lines:
    draw.text((PAD, tag_y), text, font=font_tag, fill=color)
    bbox = draw.textbbox((PAD, tag_y), text, font=font_tag)
    tag_y = bbox[3] + line_gap

# ── Line under tagline ────────────────────────────────────────────────────────
line2_y = tag_y + 20
draw.line([(PAD, line2_y), (W - PAD, line2_y)], fill="#1e3a52", width=1)

# ── Footer text ───────────────────────────────────────────────────────────────
footer = "PCB design  ·  Embedded firmware  ·  Mechanical engineering"
footer_bbox = draw.textbbox((0, 0), footer, font=font_sub)
footer_w = footer_bbox[2] - footer_bbox[0]
footer_x = (W - footer_w) // 2
footer_y = H - PAD - (footer_bbox[3] - footer_bbox[1])
draw.text((footer_x, footer_y), footer, font=font_sub, fill="#64748b")

# ── Save ──────────────────────────────────────────────────────────────────────
img.save("images/og-image.png", "PNG")
print(f"Saved images/og-image.png ({W}x{H})")
