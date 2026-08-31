"""ElaRater brand asset primitives: outlined type + seven-segment floor readout."""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

# ---------- palette ----------
SHAFT   = "#0B0C0E"   # hoistway black
PANEL   = "#15181C"   # indicator bezel face
RAIL    = "#2A3037"   # hairlines / guide rails
AMBER   = "#FFB020"   # lantern amber (lit)
STEEL   = "#C3CAD2"   # brushed steel type
DOWNRED = "#E5484D"   # down lantern (used once)

_cache = {}

FONT = "archivo.ttf"

def load(weight=700, width=100, font=None):
    font = font or FONT
    key = (font, weight, width)
    if key not in _cache:
        f = TTFont(font)
        if "fvar" in f:
            axes = {a.axisTag for a in f["fvar"].axes}
            loc = {k: v for k, v in {"wght": weight, "wdth": width}.items() if k in axes}
            f = instancer.instantiateVariableFont(f, loc)
        _cache[key] = f
    return _cache[key]


def text_path(text, size, weight=700, tracking=0.0, width=100, font=None):
    """Return (svg path d, advance width in px) for text on a y=0 baseline."""
    font = load(weight, width, font)
    upem = font["head"].unitsPerEm
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / upem
    d, x = [], 0.0
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            x += size * 0.4 + tracking
            continue
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, x, 0))
        gs[gname].draw(tpen)
        seg = pen.getCommands()
        if seg:
            d.append(seg)
        x += gs[gname].width * scale + tracking
    return " ".join(d), x - tracking


def text_svg(text, size, x, y, fill, weight=700, tracking=0.0, anchor="start", width=100, opacity=1.0, font=None):
    d, w = text_path(text, size, weight, tracking, width, font)
    if anchor == "middle":
        x -= w / 2
    elif anchor == "end":
        x -= w
    op = "" if opacity == 1.0 else f' opacity="{opacity}"'
    return f'<g transform="translate({x:.2f},{y:.2f})"><path d="{d}" fill="{fill}"{op}/></g>', w


# ---------- seven-segment floor readout ----------
SEGMAP = {
    "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
    "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg",
    "-": "g", " ": "",
}


def _h(x, y, L, t):
    return (f"M{x:.1f},{y:.1f} L{x+t/2:.1f},{y-t/2:.1f} L{x+L-t/2:.1f},{y-t/2:.1f} "
            f"L{x+L:.1f},{y:.1f} L{x+L-t/2:.1f},{y+t/2:.1f} L{x+t/2:.1f},{y+t/2:.1f} Z")


def _v(x, y, L, t):
    return (f"M{x:.1f},{y:.1f} L{x+t/2:.1f},{y+t/2:.1f} L{x+t/2:.1f},{y+L-t/2:.1f} "
            f"L{x:.1f},{y+L:.1f} L{x-t/2:.1f},{y+L-t/2:.1f} L{x-t/2:.1f},{y+t/2:.1f} Z")


def digit(ch, x, y, w, h, t, gap, lit=AMBER, off=RAIL, off_op=0.55):
    """Draw one seven-segment digit; unlit segments stay faintly visible (real hardware does)."""
    half = h / 2
    segs = {
        "a": _h(x + gap, y, w - 2 * gap, t),
        "g": _h(x + gap, y + half, w - 2 * gap, t),
        "d": _h(x + gap, y + h, w - 2 * gap, t),
        "f": _v(x, y + gap, half - 2 * gap, t),
        "b": _v(x + w, y + gap, half - 2 * gap, t),
        "e": _v(x, y + half + gap, half - 2 * gap, t),
        "c": _v(x + w, y + half + gap, half - 2 * gap, t),
    }
    on = SEGMAP.get(ch, "")
    out = []
    for k, d in segs.items():
        if k in on:
            out.append(f'<path d="{d}" fill="{lit}"/>')
        else:
            out.append(f'<path d="{d}" fill="{off}" opacity="{off_op}"/>')
    return "".join(out)


def readout(text, x, y, h, t=None, lit=AMBER, off=RAIL, off_op=0.55):
    """Seven-segment string. '.' becomes a lit square point. Returns (svg, total width)."""
    t = t or h * 0.15
    w = h * 0.58
    gap = t * 0.30
    adv = w + t * 2.1
    out, cx = [], x
    for ch in text:
        if ch == ".":
            s = t * 1.05
            out.append(f'<rect x="{cx:.1f}" y="{y+h-s:.1f}" width="{s:.1f}" height="{s:.1f}" fill="{lit}"/>')
            cx += s + t * 0.8
        else:
            out.append(digit(ch, cx, y, w, h, t, gap, lit, off, off_op))
            cx += adv
    return "".join(out), cx - x - t * 2.1 + w


def lantern(cx, cy, size, color=AMBER, direction="up", opacity=1.0):
    """Hall-lantern triangle — the single most recognizable elevator glyph."""
    r = size / 2
    if direction == "up":
        pts = f"{cx:.1f},{cy-r:.1f} {cx+r*1.05:.1f},{cy+r*0.72:.1f} {cx-r*1.05:.1f},{cy+r*0.72:.1f}"
    else:
        pts = f"{cx:.1f},{cy+r:.1f} {cx+r*1.05:.1f},{cy-r*0.72:.1f} {cx-r*1.05:.1f},{cy-r*0.72:.1f}"
    return (f'<polygon points="{pts}" fill="{color}" opacity="{opacity}" '
            f'stroke="{color}" stroke-width="{size*0.09:.1f}" stroke-linejoin="round"/>')


def svg(w, h, body, bg=SHAFT):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>')
