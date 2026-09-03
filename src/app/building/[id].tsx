/**
 * Building page: every elevator in the building, and the building's own average.
 * v1 scope, docs/01-product-spec.md.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, View } from 'react-native';
import { ElevatorRow } from '@/components/ElevatorRow';
import { FormLabel, PaperSurface, Rule, ScoreDisplay, StampSeal, TypedValue, WallSurface } from '@/components/primitives';
import { getBuildingDetail } from '@/lib/api/elevators';
import { space } from '@/theme/tokens';

export default function BuildingPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['building', id],
    queryFn: () => getBuildingDetail(id),
  });

  return (
    <WallSurface>
      <View style={{ flex: 1, padding: space.md, gap: space.md, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <FormLabel size={10} tone="wallTextDim">BACK</FormLabel>
        </Pressable>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
            <StampSeal size={80} animate="spin" opacity={0.5} />
            <FormLabel size={11} tone="wallTextDim">RETRIEVING THE RECORD</FormLabel>
          </View>
        ) : null}

        {!isLoading && !data ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
            <StampSeal size={80} opacity={0.3} />
            <FormLabel size={11} tone="wallTextDim">NO BUILDING ON RECORD</FormLabel>
          </View>
        ) : null}

        {data ? (
          <>
            <PaperSurface padding="md" style={{ gap: space.xs }}>
              <FormLabel size={10}>{`${data.building.city.toUpperCase()} · ${data.building.metroCode}`}</FormLabel>
              <TypedValue size={19}>{data.building.name}</TypedValue>
              <Rule opacity={0.2} />
              <FormLabel size={10}>{data.building.addressLine.toUpperCase()}</FormLabel>
              {data.building.average !== null ? (
                <>
                  <Rule opacity={0.2} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormLabel size={10}>BUILDING AVERAGE</FormLabel>
                    <ScoreDisplay score={data.building.average} size={34} />
                  </View>
                </>
              ) : null}
            </PaperSurface>

            <FormLabel size={11} tone="wallTextDim">
              {`${data.elevators.length} ELEVATOR${data.elevators.length === 1 ? '' : 'S'} ON RECORD`}
            </FormLabel>

            <FlatList
              data={data.elevators}
              keyExtractor={(item) => item.elevator_id}
              ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
              renderItem={({ item }) => (
                <ElevatorRow
                  elevator={item}
                  onPress={() => router.push(`/elevator/${item.elevator_id}`)}
                />
              )}
            />
          </>
        ) : null}
      </View>
    </WallSurface>
  );
}
