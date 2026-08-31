/**
 * Phase 1 acceptance surface: every primitive in every state, on all three targets
 * (docs/07-scaffold-plan.md).
 *
 * Kept in the shipped tree deliberately — it is the fastest way to see a regression
 * in the design system, and it is the only screen allowed to show a primitive out of
 * context.
 */
import { ScrollView, View } from 'react-native';
import {
  FormLabel,
  Lantern,
  PaperSurface,
  Rule,
  ScoreDisplay,
  StampSeal,
  TypedValue,
  WallSurface,
} from '@/components/primitives';
import { color, space } from '@/theme/tokens';

function Case({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <FormLabel size={10} tracking={2.2} tone="wallTextDim">{name}</FormLabel>
      <View style={{ gap: space.sm }}>{children}</View>
      <Rule tone="brass" opacity={0.25} />
    </View>
  );
}

export default function Primitives() {
  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <FormLabel size={15} tracking={5.6} tone="wallText">DESIGN SYSTEM</FormLabel>

        <Case name="FORMLABEL — BAKED OUTLINES, NOT LIVE TEXT">
          <FormLabel size={15} tracking={5.6} tone="wallText">LARGE ON WALL</FormLabel>
          <FormLabel size={11} tone="wallTextDim">DEFAULT ON WALL</FormLabel>
          <PaperSurface padding="sm">
            <FormLabel size={11} tone="fade">DEFAULT ON PAPER</FormLabel>
          </PaperSurface>
        </Case>

        <Case name="TYPEDVALUE">
          <PaperSurface padding="sm" style={{ gap: space.xs }}>
            <TypedValue size={19}>1180 PEACHTREE ST NE</TypedValue>
            <TypedValue size={15} bold={false}>Rides like butter. Doors close like they are</TypedValue>
            <TypedValue size={15} tone="stamp">ATL-004572</TypedValue>
          </PaperSurface>
        </Case>

        <Case name="RULE">
          <PaperSurface padding="sm" style={{ gap: space.sm }}>
            <Rule />
            <Rule tone="brass" opacity={0.6} />
          </PaperSurface>
        </Case>

        <Case name="STAMPSEAL — DEFAULT · EMPTY · ERROR · CONDEMNED · LOADING · STAMPING">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'center' }}>
            <StampSeal size={72} />
            <StampSeal size={72} opacity={0.3} />
            <StampSeal size={72} tone="stamp" opacity={0.7} />
            <StampSeal size={72} condemned />
            <StampSeal size={72} animate="spin" opacity={0.5} />
            <StampSeal size={72} animate="stamp" />
          </View>
        </Case>

        <Case name="LANTERN — FILLED VS 40% (THE TAB BAR STATES)">
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Lantern size={24} tone="officeLight" />
            <Lantern size={24} tone="wallTextDim" opacity={0.4} />
            <Lantern size={40} tone="stamp" />
            <Lantern size={16} tone="stock" />
          </View>
        </Case>

        <Case name="PAPERSURFACE — GUILLOCHE · PLAIN · PRESSED">
          <PaperSurface padding="md"><TypedValue size={15}>With security tint</TypedValue></PaperSurface>
          <PaperSurface padding="md" guilloche={false}><TypedValue size={15}>Without</TypedValue></PaperSurface>
          <PaperSurface padding="md" pressed guilloche={false}><TypedValue size={15}>Pressed</TypedValue></PaperSurface>
        </Case>

        <Case name="WALLSURFACE — BASE VS LIFTED">
          <WallSurface lifted style={{ flex: 0, height: 64, borderRadius: 8, borderWidth: 1, borderColor: color.brass }} />
        </Case>

        <Case name="SCOREDISPLAY — EVERY BAND, COMPACT AND FULL">
          <PaperSurface padding="md" style={{ gap: space.md }}>
            {[5, 4, 3, 2, 1].map((s) => (
              <ScoreDisplay key={s} score={s} size={30} />
            ))}
            <Rule opacity={0.2} />
            <ScoreDisplay score={4.5} size={64} variant="full" />
            <ScoreDisplay score={1} size={64} variant="full" />
          </PaperSurface>
          <View style={{ gap: space.sm }}>
            <ScoreDisplay score={4.5} size={30} onWall />
            <ScoreDisplay score={1} size={30} onWall />
          </View>
        </Case>
      </ScrollView>
    </WallSurface>
  );
}
