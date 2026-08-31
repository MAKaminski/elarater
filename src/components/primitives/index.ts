/**
 * The eight primitives. Every screen composes from these.
 *
 * Never add a ninth. If a screen needs something these can't express, that's a signal
 * to simplify the screen. CLAUDE.md, "Component discipline".
 */
export { FormLabel } from './FormLabel';
export { TypedValue } from './TypedValue';
export { Rule } from './Rule';
export { StampSeal } from './StampSeal';
export { Lantern } from './Lantern';
export { PaperSurface } from './PaperSurface';
export { WallSurface } from './WallSurface';
export { ScoreDisplay } from './ScoreDisplay';
