from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
PAD = 64

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

font_tag = load_font(80, bold=True)
font_sub = load_font(26, bold=False)

# ── Measure tagline block height ───────────────────────────────────────────────
lines = [
    ("From concept to",  "#ffffff"),
    ("production-ready", "#4aad4a"),
    ("hardware.",        "#ffffff"),
]
line_gap = 14

dummy = Image.new("RGB", (1, 1))
dd = ImageDraw.Draw(dummy)
line_heights = []
for text, _ in lines:
    bb = dd.textbbox((0, 0), text, font=font_tag)
    line_heights.append(bb[3] - bb[1])

logo_h = 44
logo_gap = 20       # gap between logo and line
line_thick = 1
line_gap_v = 24     # gap between line and tagline
tagline_h = sum(line_heights) + line_gap * (len(lines) - 1)
gap_after_tag = 24
footer_bb = dd.textbbox((0, 0), "PCB design", font=font_sub)
footer_h = footer_bb[3] - footer_bb[1]

# total block height
total_h = logo_h + logo_gap + line_thick + line_gap_v + tagline_h + gap_after_tag + line_thick + 24 + footer_h

# center the whole block vertically
block_top = (H - total_h) // 2

# ── Logo ──────────────────────────────────────────────────────────────────────
logo_src = Image.open("images/logo-white.png").convert("RGBA")
ratio = logo_h / logo_src.height
logo_w = int(logo_src.width * ratio)
logo = logo_src.resize((logo_w, logo_h), Image.LANCZOS)
img.paste(logo, (PAD, block_top), logo)

# ── Line under logo ───────────────────────────────────────────────────────────
line1_y = block_top + logo_h + logo_gap
draw.line([(PAD, line1_y), (W - PAD, line1_y)], fill="#1e3a52", width=line_thick)

# ── Tagline ───────────────────────────────────────────────────────────────────
tag_y = line1_y + line_gap_v
for (text, color), lh in zip(lines, line_heights):
    draw.text((PAD, tag_y), text, font=font_tag, fill=color)
    tag_y += lh + line_gap

# ── Line under tagline ────────────────────────────────────────────────────────
line2_y = tag_y - line_gap + gap_after_tag
draw.line([(PAD, line2_y), (W - PAD, line2_y)], fill="#1e3a52", width=line_thick)

# ── Footer text ───────────────────────────────────────────────────────────────
footer = "PCB design  ·  Embedded firmware  ·  Mechanical engineering"
footer_bbox = dd.textbbox((0, 0), footer, font=font_sub)
footer_w = footer_bbox[2] - footer_bbox[0]
footer_x = (W - footer_w) // 2
footer_y = line2_y + 24
draw.text((footer_x, footer_y), footer, font=font_sub, fill="#64748b")

# ── Save ──────────────────────────────────────────────────────────────────────
img.save("images/og-image.png", "PNG")
print(f"Saved images/og-image.png ({W}x{H})")
