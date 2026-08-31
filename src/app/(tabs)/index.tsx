/**
 * Nearby. Real GPS-based discovery backed by a PostGIS geography index — not a search
 * box, which is one of the four things defending against an Apple 4.2 rejection
 * (docs/06-store-compliance.md).
 *
 * Coarse location only. We never ask for fine location or background location.
 */
import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, ScoreDisplay, StampSeal, TypedValue, WallSurface } from '@/components/primitives';
import { searchNearby } from '@/lib/api/elevators';
import { useOfflineQueue } from '@/lib/offline/useOfflineQueue';
import { color, font, space } from '@/theme/tokens';

type Coords = { lat: number; lng: number };

export default function Nearby() {
  const router = useRouter();
  const { queued } = useOfflineQueue();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  async function locate() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermission('denied');
      return;
    }
    setPermission('granted');
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // coarse is enough to identify a building
    });
    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  }

  useEffect(() => {
    void locate();
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['nearby', coords?.lat, coords?.lng],
    queryFn: () => searchNearby(coords!.lat, coords!.lng, 400),
    enabled: !!coords,
  });

  return (
    <WallSurface>
      <View style={{ flex: 1, padding: space.md, gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <FormLabel size={13} tracking={5} tone="wallText">NEARBY</FormLabel>
          <Link href="/settings">
            <FormLabel size={10} tone="wallTextDim">SETTINGS</FormLabel>
          </Link>
        </View>

        {queued.length > 0 ? (
          <PaperSurface padding="sm">
            <FormLabel size={10}>
              {`${queued.length} INSPECTION${queued.length > 1 ? 'S' : ''} WAITING TO FILE`}
            </FormLabel>
          </PaperSurface>
        ) : null}

        {permission === 'denied' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
            <StampSeal size={80} opacity={0.3} />
            <FormLabel size={11} tone="wallTextDim">LOCATION IS OFF</FormLabel>
            <Text style={{ fontFamily: font.typed, fontSize: 14, color: color.wallTextDim, textAlign: 'center', maxWidth: 320 }}>
              ElaRater uses your approximate location to find elevators in the building
              you are standing in.
            </Text>
            <ActionButton label="TRY AGAIN" tone="quiet" onPress={locate} />
          </View>
        ) : null}

        {isLoading && permission === 'granted' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
            <StampSeal size={80} animate="spin" opacity={0.5} />
            <FormLabel size={11} tone="wallTextDim">SURVEYING THE BUILDING</FormLabel>
          </View>
        ) : null}

        {isError ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
            <StampSeal size={80} tone="stamp" opacity={0.6} />
            <FormLabel size={11} tone="wallTextDim">INSPECTION FAILED</FormLabel>
            <ActionButton label="RETRY" tone="quiet" onPress={() => refetch()} />
          </View>
        ) : null}

        {data ? (
          <FlatList
            data={data}
            keyExtractor={(item) => item.elevator_id}
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
                accessibilityLabel={`${item.label} at ${item.building_name}`}
              >
                <PaperSurface padding="md" guilloche={false} style={{ gap: space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <FormLabel size={10}>{item.building_name}</FormLabel>
                      <TypedValue size={17}>{item.label}</TypedValue>
                    </View>
                    {item.score_avg !== null ? (
                      <ScoreDisplay score={item.score_avg} size={34} />
                    ) : (
                      <FormLabel size={10}>UNRATED</FormLabel>
                    )}
                  </View>
                  <Rule opacity={0.2} />
                  <FormLabel size={10}>
                    {`${Math.round(item.distance_m)} M AWAY · ${item.rating_count} ON RECORD`}
                  </FormLabel>
                </PaperSurface>
              </Pressable>
            )}
          />
        ) : null}
      </View>
    </WallSurface>
  );
}
