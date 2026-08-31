/**
 * Landing. Public, server-rendered, and the first thing a shared link lands on.
 * Assembled from the same primitives as every other screen.
 */
import { Link } from 'expo-router';
import { ScrollView, View, Text } from 'react-native';
import { useResponsive } from '@/lib/useResponsive';
import { Certificate } from '@/components/certificate/Certificate';
import { FormLabel, Lantern, PaperSurface, Rule, WallSurface } from '@/components/primitives';
import { color, font, space } from '@/theme/tokens';

const SAMPLE = {
  location: '1180 PEACHTREE ST NE',
  serial: 'ATL-004572',
  manufacturer: 'OTIS GEN2',
  capacity: '2500 LB',
  floors: '14',
  score: 4.5,
  remark1: 'Rides like butter. Doors close like they are',
  remark2: 'mad at you. Plays smooth jazz, inexplicably.',
  inspectedOn: '2026-08-29',
};

export default function Landing() {
  const { isWide: wide } = useResponsive();

  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: wide ? space.xxl : space.lg, gap: space.xl }}>
        <View style={{ gap: space.md, maxWidth: 720 }}>
          <FormLabel size={13} tracking={6.5} tone="wallTextDim">
            OFFICE OF RIDE QUALITY
          </FormLabel>
          <Text style={{ fontFamily: font.authority, fontSize: wide ? 64 : 40, color: color.stock }}>
            Ela<Text style={{ color: color.officeLight }}>Rater</Text>
          </Text>
          <Text
            style={{
              fontFamily: font.form,
              fontWeight: '500',
              fontSize: wide ? 22 : 17,
              lineHeight: wide ? 32 : 26,
              color: color.wallTextDim,
              maxWidth: 560,
            }}
          >
            Rate the elevator you are standing in. Get back an official-looking inspection
            certificate you actually want to post.
          </Text>

          <Link href="/(tabs)" style={{ marginTop: space.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                backgroundColor: color.office,
                paddingVertical: 14,
                paddingHorizontal: space.lg,
                borderRadius: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Lantern size={16} tone="stock" />
              <FormLabel size={12} tracking={2.6} tone="stock">
                START AN INSPECTION
              </FormLabel>
            </View>
          </Link>
        </View>

        <Rule tone="brass" opacity={0.4} />

        <View style={{ maxWidth: 980, width: '100%', alignSelf: 'center', gap: space.md }}>
          <FormLabel size={11} tracking={2.2} tone="wallTextDim">
            SPECIMEN CERTIFICATE
          </FormLabel>
          <PaperSurface padding="xs" guilloche={false}>
            <Certificate {...SAMPLE} />
          </PaperSurface>
        </View>
      </ScrollView>
    </WallSurface>
  );
}
