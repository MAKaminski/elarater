/**
 * Elevator page: current score, certificate history, and the entry point to the rate
 * flow. Report and block hang off every certificate here — two taps from the content.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { Certificate } from '@/components/certificate/Certificate';
import { FramedCertificate } from '@/components/certificate/Frame';
import { ReportSheet } from '@/components/ReportSheet';
import { FormLabel, PaperSurface, Rule, StampSeal, WallSurface } from '@/components/primitives';
import { getElevatorRatings } from '@/lib/api/elevators';
import { toCertificateProps } from '@/lib/api/certificates';
import { shareCertificate } from '@/lib/share';
import type { VisibleRating } from '@/lib/schemas/rating';
import { color, font, space } from '@/theme/tokens';

export default function ElevatorPage() {
  const { id, issued, queued } = useLocalSearchParams<{
    id: string;
    issued?: string;
    queued?: string;
  }>();
  const router = useRouter();
  const [reporting, setReporting] = useState<VisibleRating | null>(null);
  const frameRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['elevator', id],
    queryFn: () => getElevatorRatings(id),
  });

  const latest = data?.[0];
  // Immediately after issuing, that certificate is the hero and gets the seal stamp.
  const hero = issued ? data?.find((r) => r.id === issued) ?? latest : latest;

  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: space.md, gap: space.lg, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <FormLabel size={10} tone="wallTextDim">BACK</FormLabel>
        </Pressable>

        {queued ? (
          <PaperSurface padding="md" style={{ gap: space.xs }}>
            <FormLabel size={10}>HELD FOR FILING</FormLabel>
            <Text style={{ fontFamily: font.typed, fontSize: 14, color: color.ink }}>
              You were offline. This inspection files itself, and its serial is issued,
              as soon as you have a connection.
            </Text>
          </PaperSurface>
        ) : null}

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
            <StampSeal size={80} animate="spin" opacity={0.5} />
            <FormLabel size={11} tone="wallTextDim">RETRIEVING THE RECORD</FormLabel>
          </View>
        ) : null}

        {hero ? (
          <View style={{ gap: space.md }}>
            <View style={{ gap: space.xs }}>
              <Pressable
                onPress={() => router.push(`/building/${hero.building_id}`)}
                accessibilityRole="button"
                accessibilityLabel={`All elevators at ${hero.building_name}`}
              >
                <FormLabel size={11} tone="wallTextDim">{`${hero.building_name} ›`}</FormLabel>
              </Pressable>
              <FormLabel size={15} tracking={5.6} tone="wallText">{hero.elevator_label}</FormLabel>
            </View>

            {/* The seal stamps down once, on arrival. The one moment of delight. */}
            <View style={{ position: 'relative' }}>
              <PaperSurface padding="xs" guilloche={false}>
                <Certificate {...toCertificateProps(hero)} />
              </PaperSurface>
              {issued ? (
                <View style={{ position: 'absolute', right: -8, top: -8 }} pointerEvents="none">
                  <StampSeal size={72} animate="stamp" condemned={hero.band === 'CONDEMNED'} />
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              <ActionButton
                label="SHARE THIS FINDING"
                lantern
                style={{ flexGrow: 1 }}
                onPress={() => hero.serial && shareCertificate({ serial: hero.serial, viewRef: frameRef })}
              />
              <ActionButton
                label="REPORT"
                tone="quiet"
                onPress={() => setReporting(hero)}
              />
            </View>

            {/* Off-screen 1080x1080 source for the native share capture. */}
            <View style={{ position: 'absolute', left: -10000, width: 1080 }} pointerEvents="none">
              <View ref={frameRef} collapsable={false}>
                <FramedCertificate {...toCertificateProps(hero)} />
              </View>
            </View>
          </View>
        ) : null}

        {!isLoading && !hero ? (
          <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
            <StampSeal size={80} opacity={0.3} />
            <FormLabel size={11} tone="wallTextDim">NO INSPECTIONS ON RECORD</FormLabel>
          </View>
        ) : null}

        <ActionButton label="FILE AN INSPECTION" onPress={() => router.push(`/rate/${id}`)} lantern />

        {data && data.length > 1 ? (
          <View style={{ gap: space.sm }}>
            <Rule tone="brass" opacity={0.35} />
            <FormLabel size={11} tone="wallTextDim">EARLIER FINDINGS</FormLabel>
            {data.slice(1).map((r) => (
              <PaperSurface key={r.id} padding="md" guilloche={false} style={{ gap: space.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <FormLabel size={10}>{r.serial ?? 'PENDING'}</FormLabel>
                  <FormLabel size={10}>{r.inspected_on.slice(0, 10)}</FormLabel>
                </View>
                <Text style={{ fontFamily: font.typed, fontSize: 14, color: color.ink }}>
                  {[r.remark_1, r.remark_2].filter(Boolean).join(' ') || 'No remarks recorded.'}
                </Text>
                <Rule opacity={0.2} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormLabel size={10}>{`${r.score.toFixed(1)} · ${r.band}`}</FormLabel>
                  <Pressable
                    onPress={() => setReporting(r)}
                    accessibilityRole="button"
                    accessibilityLabel="Report this inspection"
                    style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm }}
                  >
                    <FormLabel size={10} tone="stamp">REPORT</FormLabel>
                  </Pressable>
                </View>
              </PaperSurface>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <ReportSheet
        visible={!!reporting}
        onClose={() => setReporting(null)}
        targetType="rating"
        targetId={reporting?.id ?? ''}
        authorId={reporting?.author_id}
        authorName={reporting?.author_display_name ?? reporting?.author_handle}
      />
    </WallSurface>
  );
}
