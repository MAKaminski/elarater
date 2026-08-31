"""ElaRater v3 — "Office of Ride Quality".

Every elevator carries a framed inspection certificate behind plexiglass. Nobody
reads it. Everybody has looked at it. The whole identity becomes that document,
with ElaRater as the issuing authority and the score as the official finding.
"""
import math
import os
import lib
from lib import text_svg, text_path, svg

OUT = "/mnt/user-data/outputs/elarater-v3"
os.makedirs(OUT, exist_ok=True)

SLAB = "AlfaSlabOne-Regular.ttf"      # the authority wordmark
FORM = "archivo.ttf"                  # form labels, condensed caps
TYPED = "CourierPrime-Regular.ttf"    # filled-in by the inspector
TYPEDB = "CourierPrime-Bold.ttf"

STOCK = "#EFE9D8"   # manila card stock
TINT = "#B9CCB6"   # security-tint guilloche
INK = "#1E1C17"   # typewriter black
OFFICE = "#0E6B62"   # official teal ink
STAMP = "#B0342C"   # oxblood rubber stamp
BRASS = "#B08A3C"   # frame + border rule
FADE = "#7A7565"   # small print
WALL = "#17332F"   # elevator car wall

CW, CH = 900, 662   # canonical certificate size


def write(n, c):
    open(f"{OUT}/{n}", "w").write(c)
    print("wrote", n)


def label(t, x, y, size=10.5, fill=FADE, tr=2.2, anchor="start"):
    s, _ = text_svg(t, size, x, y, fill, weight=700, tracking=tr, anchor=anchor,
                    width=88, font=FORM)
    return s


def typed(t, x, y, size=20, fill=INK, bold=True, anchor="start"):
    s, _ = text_svg(t, size, x, y, fill, tracking=0, anchor=anchor,
                    font=TYPEDB if bold else TYPED)
    return s


def field(x, y, w, lab, val, size=19):
    return (label(lab, x, y - 26) + typed(val, x + 2, y - 7, size) +
            f'<rect x="{x}" y="{y}" width="{w}" height="1.4" fill="{INK}" opacity="0.38"/>')


def guilloche(x, y, w, h, rows=26, amp=7, per=58, op=0.5):
    out = []
    for i in range(rows):
        yy = y + h * i / (rows - 1)
        pts = " ".join(f"{x+j*6:.0f},{yy + amp*math.sin((x+j*6)/per + i*0.55):.1f}"
                       for j in range(int(w / 6) + 1))
        out.append(f'<polyline points="{pts}" fill="none" stroke="{TINT}" '
                   f'stroke-width="0.8" opacity="{op}"/>')
    return "".join(out)


def arc_text(text, cx, cy, r, size, fill, font, weight=700, tracking=0, bottom=False):
    widths = [text_path(c, size, weight, 0, font=font)[1] + tracking for c in text]
    total = sum(widths)
    out, run = [], 0.0
    for ch, w in zip(text, widths):
        th = (run + w / 2 - total / 2) / r
        deg = math.degrees(th)
        d, gw = text_path(ch, size, weight, 0, font=font)
        if bottom:
            t = (f'translate({cx},{cy}) rotate({-deg:.2f}) translate(0,{r:.2f}) '
                 f'translate({-gw/2:.2f},0)')
        else:
            t = (f'translate({cx},{cy}) rotate({deg:.2f}) translate(0,{-(r-size*0.74):.2f}) '
                 f'translate({-gw/2:.2f},0)')
        out.append(f'<g transform="{t}"><path d="{d}" fill="{fill}"/></g>')
        run += w
    return "".join(out)


def lantern(cx, cy, size, color, opacity=1.0):
    r = size / 2
    pts = f"{cx:.1f},{cy-r:.1f} {cx+r*1.02:.1f},{cy+r*0.70:.1f} {cx-r*1.02:.1f},{cy+r*0.70:.1f}"
    return (f'<polygon points="{pts}" fill="{color}" opacity="{opacity}" stroke="{color}" '
            f'stroke-opacity="{opacity}" stroke-width="{size*0.26:.1f}" stroke-linejoin="round"/>')


def seal(cx, cy, r, rot=-8, color=STAMP, op=0.88, year="2026"):
    """The rubber stamp. Struck slightly crooked, because they always are."""
    b = [f'<circle cx="{cx}" cy="{cy}" r="{r:.1f}" fill="none" stroke="{color}" stroke-width="{r*0.055:.1f}"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{r*0.80:.1f}" fill="none" stroke="{color}" stroke-width="{r*0.022:.1f}"/>',
         arc_text("ELARATER", cx, cy, r * 0.90, r * 0.155, color, FORM, 700, r * 0.030),
         arc_text("OFFICE OF RIDE QUALITY", cx, cy, r * 0.90, r * 0.105, color, FORM, 700,
                  r * 0.022, bottom=True),
         lantern(cx, cy - r * 0.16, r * 0.44, color)]
    t, _ = text_svg(year, r * 0.20, cx, cy + r * 0.50, color, weight=700, tracking=r * 0.04,
                    anchor="middle", font=FORM)
    b.append(t)
    return (f'<g transform="rotate({rot} {cx} {cy})" opacity="{op}">' + "".join(b) + '</g>')


def signature(x, y, s=1.0, color=OFFICE):
    d = ("M0,0 c14,-26 22,12 34,-6 c9,-13 15,17 29,3 c11,-11 17,10 31,-8 "
         "c8,-10 16,12 27,-2 c7,-9 13,6 22,-3")
    return (f'<g transform="translate({x},{y}) scale({s})">'
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="3.2" '
            f'stroke-linecap="round"/></g>')


# ------------------------------------------------------- the certificate itself
def certificate(score="4.5", loc="1180 PEACHTREE ST NE",
                serial="ATL-004572", maker="OTIS GEN2",
                cap="2500 LB", flrs="14",
                remark1="Rides like butter. Doors close like they are",
                remark2="mad at you. Plays smooth jazz, inexplicably."):
    b = [f'<rect width="{CW}" height="{CH}" fill="{STOCK}"/>']
    b.append(f'<g clip-path="url(#cc)">{guilloche(30, 30, CW-60, CH-60)}</g>')
    b.insert(0, f'<defs><clipPath id="cc"><rect x="30" y="30" width="{CW-60}" '
                f'height="{CH-60}" rx="4"/></clipPath></defs>')
    # double rule border + corner diamonds
    b.append(f'<rect x="17" y="17" width="{CW-34}" height="{CH-34}" fill="none" '
             f'stroke="{BRASS}" stroke-width="3.5"/>')
    b.append(f'<rect x="27" y="27" width="{CW-54}" height="{CH-54}" fill="none" '
             f'stroke="{BRASS}" stroke-width="1.2" opacity="0.8"/>')
    for dx, dy in ((27, 27), (CW - 27, 27), (27, CH - 27), (CW - 27, CH - 27)):
        b.append(f'<rect x="{dx-5}" y="{dy-5}" width="10" height="10" fill="{BRASS}" '
                 f'transform="rotate(45 {dx} {dy})"/>')

    b.append(label("OFFICE OF RIDE QUALITY", CW / 2, 84, 13, FADE, 6.5, "middle"))
    _, wa = text_path("Ela", 62, 400, 0, font=SLAB)
    _, wb = text_path("Rater", 62, 400, 0, font=SLAB)
    sx = CW / 2 - (wa + wb) / 2
    e, _ = text_svg("Ela", 62, sx, 140, INK, font=SLAB)
    r, _ = text_svg("Rater", 62, sx + wa, 140, OFFICE, font=SLAB)
    b += [e, r]
    b.append(f'<rect x="60" y="162" width="{CW-120}" height="1.6" fill="{INK}" opacity="0.5"/>')

    b.append(label("CERTIFICATE OF RIDE QUALITY", CW / 2, 196, 21, OFFICE, 7, "middle"))
    b.append(label("ISSUED UNDER THE VERTICAL TRANSPORT ACT OF 2026", CW / 2, 218, 10,
                   FADE, 2.6, "middle"))
    b.append(typed(f"No. {serial}", CW - 60, 84, 16, STAMP, anchor="end"))
    b.append(label("INSPECTED 2026-08-29", CW - 60, 106, 10, FADE, 2.2, "end"))
    b.append(f'<rect x="60" y="238" width="{CW-120}" height="1.2" fill="{INK}" opacity="0.3"/>')

    b.append(field(60, 300, 470, "LOCATION OF INSTALLATION", loc))
    b.append(field(566, 300, 274, "SERIAL NUMBER", serial))
    b.append(field(60, 372, 300, "MANUFACTURER / MODEL", maker))
    b.append(field(396, 372, 190, "RATED CAPACITY", cap))
    b.append(field(622, 372, 218, "FLOORS SERVED", flrs))

    # finding
    b.append(label("FINDING OF THE INSPECTOR", 60, 424, 10.5, FADE, 2.2))
    sc, _ = text_svg(score, 104, 58, 512, OFFICE, font=SLAB)
    b.append(sc)
    _, sw = text_path(score, 104, 400, 0, font=SLAB)
    b.append(label("OUT OF FIVE", 68 + sw, 486, 15, INK, 4))
    b.append(label("RIDE QUALITY: EXCELLENT", 68 + sw, 512, 11, FADE, 2.4))
    b.append(seal(724, 470, 92))

    b.append(f'<rect x="60" y="540" width="{CW-120}" height="1.2" fill="{INK}" opacity="0.3"/>')
    b.append(label("INSPECTOR'S REMARKS", 60, 564, 10.5, FADE, 2.2))
    b.append(typed(remark1, 60, 588, 15, INK, bold=False))
    b.append(typed(remark2, 60, 608, 15, INK, bold=False))

    b.append(signature(596, 584, 1.0))
    b.append(f'<rect x="590" y="594" width="250" height="1.2" fill="{INK}" opacity="0.38"/>')
    b.append(label("AUTHORIZED INSPECTOR", 590, 610, 9.5, FADE, 2))
    b.append(label("VOID IF REMOVED FROM CAR", CW / 2, CH - 22, 10, STAMP, 4.5, "middle"))
    return "".join(b)


def cert_group(x, y, w, rot=0):
    s = w / CW
    r = f' rotate({rot} {x+w/2:.0f} {y+CH*s/2:.0f})' if rot else ""
    return (f'<g transform="translate({x},{y}) scale({s:.4f})"{"" if not rot else ""}>'
            f'{certificate()}</g>') if not rot else (
        f'<g transform="rotate({rot} {x+w/2:.0f} {y+CH*s/2:.0f}) translate({x},{y}) '
        f'scale({s:.4f})">{certificate()}</g>')


def wall(w, h):
    """Brushed elevator-car wall the certificate hangs on."""
    lines = "".join(f'<rect x="{i*13}" y="0" width="1" height="{h}" fill="#FFFFFF" '
                    f'opacity="{0.020 if i % 3 else 0.038}"/>' for i in range(int(w / 13) + 1))
    return f'<rect width="{w}" height="{h}" fill="{WALL}"/>{lines}'


def frame(x, y, w, h, pad=17):
    """Brass frame with four screws — how the certificate is actually mounted."""
    b = [f'<rect x="{x-pad}" y="{y-pad}" width="{w+pad*2}" height="{h+pad*2}" rx="3" '
         f'fill="{BRASS}"/>',
         f'<rect x="{x-pad}" y="{y-pad}" width="{w+pad*2}" height="{h+pad*2}" rx="3" '
         f'fill="none" stroke="#000000" stroke-width="1" opacity="0.25"/>']
    for sx, sy in ((x - pad / 2, y - pad / 2), (x + w + pad / 2, y - pad / 2),
                   (x - pad / 2, y + h + pad / 2), (x + w + pad / 2, y + h + pad / 2)):
        b.append(f'<circle cx="{sx:.0f}" cy="{sy:.0f}" r="{pad*0.34:.1f}" fill="#8E6D2A"/>'
                 f'<rect x="{sx-pad*0.24:.1f}" y="{sy-1:.1f}" width="{pad*0.48:.1f}" '
                 f'height="2" fill="#5E4718"/>')
    return "".join(b)


# ------------------------------------------------------------------ 1. app icon
def icon(size=512):
    s = size / 512
    b = [f'<rect width="{size}" height="{size}" rx="{115*s:.1f}" fill="{STOCK}"/>',
         f'<g clip-path="url(#ic)">{guilloche(0, 40*s, size, size-80*s, 14, 5*s, 40*s, 0.65)}</g>',
         seal(256 * s, 252 * s, 172 * s, rot=-7, op=0.92)]
    b.insert(0, f'<defs><clipPath id="ic"><rect width="{size}" height="{size}" '
                f'rx="{115*s:.1f}"/></clipPath></defs>')
    return svg(size, size, "".join(b), bg="none")


def favicon(size=64):
    s = size / 64
    b = [f'<rect width="{size}" height="{size}" rx="{15*s:.1f}" fill="{STAMP}"/>',
         f'<circle cx="{32*s}" cy="{32*s}" r="{23*s:.1f}" fill="none" stroke="{STOCK}" '
         f'stroke-width="{3.4*s:.1f}"/>',
         lantern(32 * s, 30 * s, 22 * s, STOCK),
         f'<rect x="{22*s:.1f}" y="{40*s:.1f}" width="{20*s:.1f}" height="{4.4*s:.1f}" '
         f'rx="{2.2*s:.1f}" fill="{STOCK}"/>']
    return svg(size, size, "".join(b), bg="none")


# -------------------------------------------------------------------- 2. lockup
def lockup(light=True, w=1080, h=280):
    bg = STOCK if light else WALL
    c1 = INK if light else STOCK
    c2 = OFFICE if light else "#5FC7B8"
    sub = FADE if light else "#93A9A4"
    b = [f'<g transform="translate(38,50) scale({180/512:.4f})">'
         f'{icon(512).split(">", 1)[1].rsplit("</svg>", 1)[0]}</g>']
    _, wa = text_path("Ela", 84, 400, 0, font=SLAB)
    e, _ = text_svg("Ela", 84, 262, 158, c1, font=SLAB)
    r, _ = text_svg("Rater", 84, 262 + wa, 158, c2, font=SLAB)
    b += [e, r]
    b.append(f'<rect x="264" y="180" width="470" height="1.6" fill="{sub}" opacity="0.7"/>')
    b.append(label("OFFICE OF RIDE QUALITY", 266, 214, 15, sub, 5.6))
    return svg(w, h, "".join(b), bg=bg)


# --------------------------------------------------------- 3. link preview OG
def og():
    W, H = 1200, 630
    cw = 690
    b = [wall(W, H), frame(56, 74, cw, CH * cw / CW),
         f'<g transform="translate(56,74) scale({cw/CW:.4f})">{certificate()}</g>']
    x = 826
    b.append(label("OFFICE OF RIDE QUALITY", x, 132, 13, "#8FB3AC", 5.2))
    _, wa = text_path("Ela", 56, 400, 0, font=SLAB)
    e, _ = text_svg("Ela", 56, x, 196, STOCK, font=SLAB)
    r, _ = text_svg("Rater", 56, x + wa, 196, "#5FC7B8", font=SLAB)
    b += [e, r]
    b.append(f'<rect x="{x}" y="222" width="290" height="2" fill="{BRASS}"/>')
    for i, ln in enumerate(["Every elevator", "gets a certificate."]):
        t, _ = text_svg(ln, 40, x, 296 + i * 48, STOCK, weight=700, tracking=-0.4,
                        width=92, font=FORM)
        b.append(t)
    for i, ln in enumerate(["Rate the ride. Issue the finding.", "Post the certificate."]):
        t, _ = text_svg(ln, 20, x, 412 + i * 28, "#A9C4BE", weight=500, font=FORM)
        b.append(t)
    b.append(label("VOID IF REMOVED FROM CAR", x, 512, 11, "#E08078", 3.6))
    return svg(W, H, "".join(b))


# ------------------------------------------------------- 4. square social 1080
def square():
    S = 1080
    cw = 900
    ch = CH * cw / CW
    b = [wall(S, S), frame(90, 132, cw, ch),
         f'<g transform="translate(90,132) scale({cw/CW:.4f})">{certificate()}</g>']
    t, _ = text_svg("Every elevator gets a certificate.", 46, S / 2, 872, STOCK,
                    weight=700, tracking=-0.4, anchor="middle", width=92, font=FORM)
    b.append(t)
    b.append(label("OFFICE OF RIDE QUALITY  ·  ELARATER", S / 2, 926, 17, "#8FB3AC",
                   5.4, "middle"))
    return svg(S, S, "".join(b))


# ----------------------------------------------------------- 5. story 1080x1920
def story():
    W, H = 1080, 1920
    cw = 860
    ch = CH * cw / CW
    b = [wall(W, H)]
    b.append(label("OFFICE OF RIDE QUALITY", W / 2, 300, 19, "#8FB3AC", 6.4, "middle"))
    _, wa = text_path("Ela", 74, 400, 0, font=SLAB)
    _, wb = text_path("Rater", 74, 400, 0, font=SLAB)
    sx = W / 2 - (wa + wb) / 2
    e, _ = text_svg("Ela", 74, sx, 386, STOCK, font=SLAB)
    r, _ = text_svg("Rater", 74, sx + wa, 386, "#5FC7B8", font=SLAB)
    b += [e, r]
    b.append(frame(110, 620, cw, ch))
    b.append(f'<g transform="translate(110,620) scale({cw/CW:.4f})">{certificate()}</g>')
    for i, ln in enumerate(["Every elevator", "gets a certificate."]):
        t, _ = text_svg(ln, 74, W / 2, 1400 + i * 88, STOCK, weight=700, tracking=-1,
                        anchor="middle", width=92, font=FORM)
        b.append(t)
    b.append(label("RATE THE RIDE  ·  ISSUE THE FINDING", W / 2, 1560, 20, "#A9C4BE",
                   5.6, "middle"))
    return svg(W, H, "".join(b))


write("certificate-hero.svg", svg(CW, CH, certificate()))
write("icon-512.svg", icon(512))
write("favicon.svg", favicon(64))
write("logo-lockup-light.svg", lockup(True))
write("logo-lockup-dark.svg", lockup(False))
write("og-1200x630.svg", og())
write("social-square-1080.svg", square())
write("social-story-1080x1920.svg", story())
