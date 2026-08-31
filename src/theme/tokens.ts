// GENERATED FILE — do not edit.
// Source: brand/tokens/design-tokens.json (ElaRater v3)
// Regenerate: npm run gen:tokens

export const color = {
  /** Certificate paper, primary light surface */
  stock: "#EFE9D8",
  /** Pressed / hovered paper surface */
  stockDeep: "#E4DCC6",
  /** Guilloche security pattern, ~50% opacity only */
  tint: "#B9CCB6",
  /** Typewriter values, primary text on paper */
  ink: "#1E1C17",
  /** Authority ink — score, titles, primary action */
  office: "#0E6B62",
  /** Office ink on dark surfaces */
  officeLight: "#5FC7B8",
  /** Seal, serial number, VOID line, CONDEMNED state */
  stamp: "#B0342C",
  /** Border rules, frame, screws, dividers */
  brass: "#B08A3C",
  /** Form labels, small print, disabled */
  fade: "#7A7565",
  /** App background — the elevator car interior */
  wall: "#17332F",
  /** Raised surface on wall (cards, sheets, tab bar) */
  wallLift: "#1E413C",
  /** Text on wall */
  wallText: "#EFE9D8",
  /** Secondary text on wall */
  wallTextDim: "#A9C4BE",
} as const;

export type ColorToken = keyof typeof color;

/**
 * Font families as registered with expo-font in src/app/_layout.tsx.
 *
 * Archivo ships as a VARIABLE font (wght 100-900, wdth 62-125) whose default
 * instance is SemiBold 600. Consequences, deliberately chosen:
 *
 *   - Tracked-caps form labels are brand-critical and must be wght 700 / wdth 88.
 *     Native cannot select variable axes, so FormLabel renders baked glyph outlines
 *     instead of live text (src/lib/certificate/glyphs.gen.ts). Identical on all
 *     three targets, and identical to the certificate.
 *   - Web resolves "fontWeight" against the variable font correctly, so incidental
 *     UI prose is real selectable text there.
 *   - Native renders incidental UI prose at the 600 default. Accepted: the design
 *     system keeps Archivo prose to labels and short headlines.
 */
export const font = {
  authority: 'AlfaSlabOne',
  form: 'Archivo',
  typed: 'CourierPrime',
  typedBold: 'CourierPrime-Bold',
} as const;

export type FontRole = 'authority' | 'form' | 'typed';

export const type = {
  formLabel: { font: "form", size: 11, weight: 700, tracking: 2.2, case: "upper" },
  formLabelLg: { font: "form", size: 15, weight: 700, tracking: 5.6, case: "upper" },
  certTitle: { font: "form", size: 21, weight: 700, tracking: 7, case: "upper" },
  typedValue: { font: "typed", size: 19, weight: 700, tracking: 0 },
  typedBody: { font: "typed", size: 15, weight: 400, tracking: 0 },
  score: { font: "authority", size: 104, weight: 400, tracking: 0 },
  wordmark: { font: "authority", size: 62, weight: 400, tracking: 0 },
  headline: { font: "form", size: 40, weight: 700, tracking: -0.4 },
  body: { font: "form", size: 17, weight: 500, tracking: 0 },
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const radius = {
  sm: 3,
  md: 8,
  lg: 16,
  icon: 115,
  pill: 999,
} as const;

export const border = {
  hairline: 1.2,
  rule: 1.6,
  frame: 3.5,
} as const;

export const canvas = {
  width: 900,
  height: 662,
} as const;

export type BandLabel =
  | "EXCELLENT"
  | "SATISFACTORY"
  | "ACCEPTABLE"
  | "DEFICIENT"
  | "CONDEMNED";

export const bands = [
  { min: 4.5, max: 5, label: "EXCELLENT", scoreColor: "office", sealColor: "stamp" },
  { min: 3.5, max: 4.4, label: "SATISFACTORY", scoreColor: "office", sealColor: "stamp" },
  { min: 2.5, max: 3.4, label: "ACCEPTABLE", scoreColor: "office", sealColor: "stamp" },
  { min: 1.5, max: 2.4, label: "DEFICIENT", scoreColor: "stamp", sealColor: "stamp" },
  { min: 0, max: 1.4, label: "CONDEMNED", scoreColor: "stamp", sealColor: "stamp" },
] as const;

/** Hard limits. 49 characters overruns the certificate field and breaks the layout. */
export const fieldLimits = {
  location: 28,
  serial: 16,
  manufacturer: 18,
  capacity: 11,
  floors: 12,
  remark1: 48,
  remark2: 48,
} as const;
