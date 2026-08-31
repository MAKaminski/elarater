/**
 * THE CERTIFICATE. The single source of every coordinate.
 *
 * Ported from certificate() in brand/v3/_generator_build3.py. Authored in a 900x662
 * space and scaled by transform — never reflowed (CLAUDE.md, rule 1). On a narrow
 * phone the certificate gets smaller, exactly like a real one behind glass.
 *
 * Consumed by:
 *   components/certificate/Certificate.tsx   react-native-svg, iOS + Android + web
 *   lib/certificate/to-svg-string.ts         SVG string -> resvg -> OG PNG on Vercel
 *
 * Nine variables change per certificate. Everything else is fixed chrome.
 */
import { canvas, color } from '@/theme/tokens';
import { bandForScore, formatScore, isCondemned } from './bands';
import { group, n1, n0, type Node } from './scene';
import { layoutArcText, layoutText, measureText } from './text';

export const CW = canvas.width; // 900
export const CH = canvas.height; // 662

/** docs/05-certificate-spec.md, "The nine variables". */
export type CertificateProps = {
  /** LOCATION OF INSTALLATION — 28 ch */
  location: string;
  /** SERIAL NUMBER — 16 ch, server-generated */
  serial: string;
  /** MANUFACTURER / MODEL — 18 ch */
  manufacturer: string;
  /** RATED CAPACITY — 11 ch */
  capacity: string;
  /** FLOORS SERVED — 12 ch */
  floors: string;
  /** 0-5 in half-point steps */
  score: number;
  /** INSPECTOR'S REMARKS — 48 ch each */
  remark1?: string;
  remark2?: string;
  /** YYYY-MM-DD. Absolute, never relative (CLAUDE.md, "Data rules"). */
  inspectedOn: string;
  /** Seal year on the stamp. */
  year?: string;
};

// ----------------------------------------------------------------- type helpers

/** label() — Archivo 700 / wdth 88, tracked caps, the pre-printed form. */
const label = (
  text: string,
  x: number,
  y: number,
  size = 10.5,
  fill: string = color.fade,
  tracking = 2.2,
  anchor: 'start' | 'middle' | 'end' = 'start',
): Node[] => layoutText(text, x, y, { face: 'form', size, tracking, anchor, fill });

/** typed() — Courier, what the inspector filled in later. */
const typed = (
  text: string,
  x: number,
  y: number,
  size = 20,
  fill: string = color.ink,
  bold = true,
  anchor: 'start' | 'middle' | 'end' = 'start',
): Node[] =>
  layoutText(text, x, y, {
    face: bold ? 'typed' : 'typedRegular',
    size,
    tracking: 0,
    anchor,
    fill,
  });

/** A labelled field with its underline rule. */
const field = (
  x: number,
  y: number,
  w: number,
  lab: string,
  val: string,
  size = 19,
): Node[] => [
  ...label(lab, x, y - 26),
  ...typed(val, x + 2, y - 7, size),
  { t: 'rect', x, y, w, h: 1.4, fill: color.ink, op: 0.38 },
];

// ------------------------------------------------------------- fixed chrome bits

/** The security-tint wave pattern. 26 rows of phase-shifted sine. */
function guilloche(
  x: number,
  y: number,
  w: number,
  h: number,
  rows = 26,
  amp = 7,
  per = 58,
  op = 0.5,
): Node[] {
  const out: Node[] = [];
  for (let i = 0; i < rows; i++) {
    const yy = y + (h * i) / (rows - 1);
    const pts: string[] = [];
    for (let j = 0; j <= Math.floor(w / 6); j++) {
      const px = x + j * 6;
      pts.push(`${n0(px)},${n1(yy + amp * Math.sin(px / per + i * 0.55))}`);
    }
    out.push({ t: 'polyline', points: pts.join(' '), fill: 'none', stroke: color.tint, sw: 0.8, op });
  }
  return out;
}

/** The rounded triangle. Seal centre, buttons, list bullets, tab icons. */
export function lantern(cx: number, cy: number, size: number, fill: string, op = 1): Node {
  const r = size / 2;
  const points =
    `${n1(cx)},${n1(cy - r)} ${n1(cx + r * 1.02)},${n1(cy + r * 0.7)} ` +
    `${n1(cx - r * 1.02)},${n1(cy + r * 0.7)}`;
  return {
    t: 'polygon',
    points,
    fill,
    op,
    stroke: fill,
    strokeOp: op,
    sw: Number((size * 0.26).toFixed(1)),
    join: 'round',
  };
}

/**
 * The rubber stamp. Struck slightly crooked, because they always are.
 *
 * CONDEMNED gains a second concentric ring and swaps the bottom arc legend
 * (docs/05-certificate-spec.md).
 */
export function seal(
  cx: number,
  cy: number,
  r: number,
  opts: { rot?: number; fill?: string; op?: number; year?: string; condemned?: boolean } = {},
): Node {
  const { rot = -8, fill = color.stamp, op = 0.88, year = '2026', condemned = false } = opts;

  const children: Node[] = [
    { t: 'circle', cx, cy, r, fill: 'none', stroke: fill, sw: Number((r * 0.055).toFixed(1)) },
    {
      t: 'circle',
      cx,
      cy,
      r: Number((r * 0.8).toFixed(1)),
      fill: 'none',
      stroke: fill,
      sw: Number((r * 0.022).toFixed(1)),
    },
  ];

  if (condemned) {
    children.push({
      t: 'circle',
      cx,
      cy,
      r: Number((r * 0.72).toFixed(1)),
      fill: 'none',
      stroke: fill,
      sw: Number((r * 0.018).toFixed(1)),
    });
  }

  children.push(
    ...layoutArcText('ELARATER', cx, cy, r * 0.9, {
      face: 'formWide',
      size: r * 0.155,
      tracking: r * 0.03,
      fill,
    }),
    ...layoutArcText(condemned ? 'CONDEMNED' : 'OFFICE OF RIDE QUALITY', cx, cy, r * 0.9, {
      face: 'formWide',
      size: r * 0.105,
      tracking: r * 0.022,
      fill,
      bottom: true,
    }),
    lantern(cx, cy - r * 0.16, r * 0.44, fill),
    ...layoutText(year, cx, cy + r * 0.5, {
      face: 'formWide',
      size: r * 0.2,
      tracking: r * 0.04,
      anchor: 'middle',
      fill,
    }),
  );

  return group(children, `rotate(${rot} ${cx} ${cy})`, op);
}

/** The inspector's squiggle. Nobody can read a real one either. */
function signature(x: number, y: number, s = 1, stroke: string = color.office): Node {
  const d =
    'M0,0 c14,-26 22,12 34,-6 c9,-13 15,17 29,3 c11,-11 17,10 31,-8 ' +
    'c8,-10 16,12 27,-2 c7,-9 13,6 22,-3';
  return {
    t: 'path',
    d,
    transform: `translate(${x},${y}) scale(${s})`,
    fill: 'none',
    stroke,
    sw: 3.2,
    cap: 'round',
  };
}

/**
 * The CONDEMNED diagonal band. Fill and text share one centre so they stay locked
 * together; -22 degrees across the lower-left corner per docs/05-certificate-spec.md.
 * It crosses the remarks by design — a condemned notice is stamped OVER the document —
 * which is exactly why the fill is only 6%.
 */
const BAND = {
  cx: 232,
  cy: 578,
  w: 620,
  h: 52,
  size: 25,
  rotate: 'rotate(-22 232 578)',
} as const;

// --------------------------------------------------------------- the certificate

export function certificate(p: CertificateProps): Node[] {
  const band = bandForScore(p.score);
  const condemned = isCondemned(p.score);
  const scoreText = formatScore(p.score);
  const scoreColor = condemned ? color.stamp : color[band.scoreColor as 'office' | 'stamp'];
  const year = p.year ?? '2026';

  const b: Node[] = [];

  // ground + guilloche, clipped to the inner card
  b.push({ t: 'rect', x: 0, y: 0, w: CW, h: CH, fill: color.stock });
  b.push({
    t: 'clip',
    id: 'cc',
    children: [{ t: 'rect', x: 30, y: 30, w: CW - 60, h: CH - 60, rx: 4 }],
  });
  b.push({ ...group(guilloche(30, 30, CW - 60, CH - 60)), clipPath: 'cc' } as Node);

  // CONDEMNED: the diagonal band's fill sits BEHIND the form at 6% so the remarks stay
  // readable through it. Only its text is struck at 100%, further down.
  // docs/05-certificate-spec.md.
  if (condemned) {
    b.push({
      ...group(
        [
          {
            t: 'rect',
            x: BAND.cx - BAND.w / 2,
            y: BAND.cy - BAND.h / 2,
            w: BAND.w,
            h: BAND.h,
            fill: color.stamp,
            op: 0.06,
          },
        ],
        BAND.rotate,
      ),
      clipPath: 'cc',
    } as Node);
  }

  // double brass rule + corner diamonds
  b.push({
    t: 'rect',
    x: 17,
    y: 17,
    w: CW - 34,
    h: CH - 34,
    fill: 'none',
    stroke: color.brass,
    sw: 3.5,
  });
  b.push({
    t: 'rect',
    x: 27,
    y: 27,
    w: CW - 54,
    h: CH - 54,
    fill: 'none',
    stroke: color.brass,
    sw: 1.2,
    op: 0.8,
  });
  for (const [dx, dy] of [
    [27, 27],
    [CW - 27, 27],
    [27, CH - 27],
    [CW - 27, CH - 27],
  ] as const) {
    b.push({
      t: 'rect',
      x: dx - 5,
      y: dy - 5,
      w: 10,
      h: 10,
      fill: color.brass,
      transform: `rotate(45 ${dx} ${dy})`,
    });
  }

  // masthead
  b.push(...label('OFFICE OF RIDE QUALITY', CW / 2, 84, 13, color.fade, 6.5, 'middle'));

  // wordmark — two-tone, Ela in ink, Rater in office teal. Never flat (CLAUDE.md rule 4).
  const wa = measureText('Ela', 'authority', 62);
  const wb = measureText('Rater', 'authority', 62);
  const sx = CW / 2 - (wa + wb) / 2;
  b.push(...layoutText('Ela', sx, 140, { face: 'authority', size: 62, fill: color.ink }));
  b.push(
    ...layoutText('Rater', sx + wa, 140, { face: 'authority', size: 62, fill: color.office }),
  );

  b.push({ t: 'rect', x: 60, y: 162, w: CW - 120, h: 1.6, fill: color.ink, op: 0.5 });
  b.push(...label('CERTIFICATE OF RIDE QUALITY', CW / 2, 196, 21, color.office, 7, 'middle'));
  b.push(
    ...label(
      'ISSUED UNDER THE VERTICAL TRANSPORT ACT OF 2026',
      CW / 2,
      218,
      10,
      color.fade,
      2.6,
      'middle',
    ),
  );
  b.push(...typed(`No. ${p.serial}`, CW - 60, 84, 16, color.stamp, true, 'end'));
  b.push(...label(`INSPECTED ${p.inspectedOn}`, CW - 60, 106, 10, color.fade, 2.2, 'end'));
  b.push({ t: 'rect', x: 60, y: 238, w: CW - 120, h: 1.2, fill: color.ink, op: 0.3 });

  // the five typed fields
  b.push(...field(60, 300, 470, 'LOCATION OF INSTALLATION', p.location));
  b.push(...field(566, 300, 274, 'SERIAL NUMBER', p.serial));
  b.push(...field(60, 372, 300, 'MANUFACTURER / MODEL', p.manufacturer));
  b.push(...field(396, 372, 190, 'RATED CAPACITY', p.capacity));
  b.push(...field(622, 372, 218, 'FLOORS SERVED', p.floors));

  // the finding
  b.push(...label('FINDING OF THE INSPECTOR', 60, 424, 10.5, color.fade, 2.2));
  b.push(...layoutText(scoreText, 58, 512, { face: 'authority', size: 104, fill: scoreColor }));
  const sw = measureText(scoreText, 'authority', 104);
  b.push(...label('OUT OF FIVE', 68 + sw, 486, 15, condemned ? color.stamp : color.ink, 4));
  b.push(...label(`RIDE QUALITY: ${band.label}`, 68 + sw, 512, 11, color.fade, 2.4));
  b.push(seal(724, 470, 92, { year, condemned }));

  // remarks — where the personality lives, and the main reason anyone shares this
  b.push({ t: 'rect', x: 60, y: 540, w: CW - 120, h: 1.2, fill: color.ink, op: 0.3 });
  b.push(...label("INSPECTOR'S REMARKS", 60, 564, 10.5, color.fade, 2.2));
  if (p.remark1) b.push(...typed(p.remark1, 60, 588, 15, color.ink, false));
  if (p.remark2) b.push(...typed(p.remark2, 60, 608, 15, color.ink, false));

  // sign-off
  b.push(signature(596, 584, 1));
  b.push({ t: 'rect', x: 590, y: 594, w: 250, h: 1.2, fill: color.ink, op: 0.38 });
  b.push(...label('AUTHORIZED INSPECTOR', 590, 610, 9.5, color.fade, 2));

  // the CONDEMNED band text, struck at 100% over its own 6% fill. Clipped to the card
  // so it never escapes onto the brass frame.
  if (condemned) {
    b.push({
      ...group(
        label('OUT OF SERVICE', BAND.cx, BAND.cy + BAND.size * 0.36, BAND.size, color.stamp, 6.5, 'middle'),
        BAND.rotate,
      ),
      clipPath: 'cc',
    } as Node);
  }

  // the tell. Appears on every certificate (CLAUDE.md rule 5).
  b.push(
    ...label(
      condemned ? 'VOID IF REMOVED FROM CAR · NOTICE POSTED BY ORDER' : 'VOID IF REMOVED FROM CAR',
      CW / 2,
      CH - 22,
      10,
      color.stamp,
      4.5,
      'middle',
    ),
  );

  return b;
}

/**
 * Screen-reader text. docs/04-design-system.md requires the full finding read aloud:
 * "Certificate ATL-004572. Otis Gen2 at 1180 Peachtree Street. Rated 4.5 out of 5,
 * excellent."
 */
export function certificateLabel(p: CertificateProps): string {
  const band = bandForScore(p.score);
  const remarks = [p.remark1, p.remark2].filter(Boolean).join(' ');
  return (
    `Certificate ${p.serial}. ${p.manufacturer} at ${p.location}. ` +
    `Rated ${formatScore(p.score)} out of 5, ${band.label.toLowerCase()}. ` +
    `Inspected ${p.inspectedOn}.${remarks ? ` Remarks: ${remarks}` : ''}`
  );
}
