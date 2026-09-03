/**
 * Nearby. Real GPS-based discovery backed by a PostGIS geography index — not a search
 * box, which is one of the four things defending against an Apple 4.2 rejection
 * (docs/06-store-compliance.md).
 *
 * Coarse location only. We never ask for fine location or background location.
 *
 * When location is off, or granted but nothing is within range, this falls back to
 * the most recent findings anywhere. An empty screen reads as a broken app.
 */
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ElevatorRow } from '@/components/ElevatorRow';
import { FormLabel, PaperSurface, Rule, ScoreDisplay, StampSeal, TypedValue, WallSurface } from '@/components/primitives';
import { recentCertificates, searchNearby } from '@/lib/api/elevators';
import { useOfflineQueue } from '@/lib/offline/useOfflineQueue';
import { color, font, space } from '@/theme/tokens';

type Coords = { lat: number; lng: number };

export default function Nearby() {
  const router = useRouter();
  const { queued } = useOfflineQueue();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  async function locate() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setPermission('denied');
      setPermission('granted');
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // coarse is enough to identify a building
      });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setPermission('denied');
    }
  }

  useEffect(() => {
    void locate();
  }, []);

  const nearby = useQuery({
    queryKey: ['nearby', coords?.lat, coords?.lng],
    queryFn: () => searchNearby(coords!.lat, coords!.lng, 400),
    enabled: !!coords,
  });

  const recent = useQuery({
    queryKey: ['recent-certificates'],
    queryFn: () => recentCertificates(20),
  });

  const hasNearby = (nearby.data?.length ?? 0) > 0;
  const showingRecent = permission === 'denied' || (nearby.isFetched && !hasNearby);

  return (
    <WallSurface>
      <View style={{ flex: 1, padding: space.md, gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <FormLabel size={13} tracking={5} tone="wallText">
            {showingRecent ? 'LATEST FINDINGS' : 'NEARBY'}
          </FormLabel>
          <Pressable onPress={() => router.push('/settings')} accessibilityRole="button">
            <FormLabel size={10} tone="wallTextDim">SETTINGS</FormLabel>
          </Pressable>
        </View>

        {queued.length > 0 ? (
          <PaperSurface padding="sm">
            <FormLabel size={10}>
              {`${queued.length} INSPECTION${queued.length > 1 ? 'S' : ''} WAITING TO FILE`}
            </FormLabel>
          </PaperSurface>
        ) : null}

        {showingRecent ? (
          <PaperSurface padding="sm" style={{ gap: space.xs }}>
            <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.ink }}>
              {permission === 'denied'
                ? 'Location is off, so here is what has been inspected elsewhere.'
                : 'Nothing rated within 400 m. Here is what has been inspected elsewhere.'}
            </Text>
            <ActionButton
              label={permission === 'denied' ? 'USE MY LOCATION' : 'LOOK AGAIN'}
              tone="quiet"
              onPress={locate}
            />
          </PaperSurface>
        ) : null}

        {nearby.isLoading && !showingRecent ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
            <StampSeal size={80} animate="spin" opacity={0.5} />
            <FormLabel size={11} tone="wallTextDim">SURVEYING THE BUILDING</FormLabel>
          </View>
        ) : null}

        {showingRecent ? (
          <FlatList
            data={recent.data ?? []}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
                <StampSeal size={80} opacity={0.3} />
                <FormLabel size={11} tone="wallTextDim">NO INSPECTIONS ON RECORD</FormLabel>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/elevator/${item.elevator_id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${item.serial}, ${item.elevator_label} at ${item.building_name}`}
              >
                <PaperSurface padding="md" guilloche={false} style={{ gap: space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <FormLabel size={10}>{item.serial ?? 'PENDING'}</FormLabel>
                      <TypedValue size={17}>{item.elevator_label}</TypedValue>
                    </View>
                    <ScoreDisplay score={item.score} size={34} />
                  </View>
                  <Rule opacity={0.2} />
                  <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.ink }}>
                    {[item.remark_1, item.remark_2].filter(Boolean).join(' ') || 'No remarks recorded.'}
                  </Text>
                  <Rule opacity={0.2} />
                  <FormLabel size={10}>{`${item.building_name} · ${item.city}`}</FormLabel>
                </PaperSurface>
              </Pressable>
            )}
          />
        ) : (
          <FlatList
            data={nearby.data ?? []}
            keyExtractor={(item) => item.elevator_id}
            ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
            renderItem={({ item }) => (
              <ElevatorRow
                elevator={item}
                context="distance"
                onPress={() => router.push(`/elevator/${item.elevator_id}`)}
              />
            )}
          />
        )}
      </View>
    </WallSurface>
  );
}
