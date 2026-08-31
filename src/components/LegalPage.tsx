/**
 * Shared shell for the three public legal routes. Composed from existing primitives;
 * introduces no new visual idea.
 */
import { ScrollView, Text, View } from 'react-native';
import { useResponsive } from '@/lib/useResponsive';
import { FormLabel, PaperSurface, Rule, WallSurface } from './primitives';
import { color, font, space } from '@/theme/tokens';

export type Section = { heading: string; body: string[] };

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: Section[];
}) {
  const { isWide: wide } = useResponsive();

  return (
    <WallSurface>
      <ScrollView
        contentContainerStyle={{
          padding: wide ? space.xl : space.lg,
          gap: space.lg,
          maxWidth: 760,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ gap: space.sm }}>
          <FormLabel size={11} tracking={5} tone="wallTextDim">
            OFFICE OF RIDE QUALITY
          </FormLabel>
          <Text style={{ fontFamily: font.authority, fontSize: wide ? 40 : 30, color: color.stock }}>
            {title}
          </Text>
          <FormLabel size={10} tone="wallTextDim">{`LAST UPDATED ${updated}`}</FormLabel>
        </View>

        <PaperSurface padding="lg" style={{ gap: space.lg }}>
          {sections.map((s, i) => (
            <View key={s.heading} style={{ gap: space.sm }}>
              <FormLabel size={11} tone="fade">{s.heading}</FormLabel>
              {s.body.map((p, j) => (
                <Text
                  key={j}
                  style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 23, color: color.ink }}
                >
                  {p}
                </Text>
              ))}
              {i < sections.length - 1 ? <Rule opacity={0.2} /> : null}
            </View>
          ))}
        </PaperSurface>
      </ScrollView>
    </WallSurface>
  );
}
