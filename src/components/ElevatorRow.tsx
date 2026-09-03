/**
 * One elevator in a list. Used by nearby, search, and the building page so all three
 * render the identical row. Composed from existing primitives.
 */
import { Pressable, View } from 'react-native';
import { FormLabel, PaperSurface, Rule, ScoreDisplay, TypedValue } from './primitives';
import type { NearbyElevator } from '@/lib/schemas/elevator';
import { space } from '@/theme/tokens';

export function ElevatorRow({
  elevator,
  onPress,
  /** Nearby shows distance; search and the building page show the city instead. */
  context = 'place',
}: {
  elevator: NearbyElevator;
  onPress: () => void;
  context?: 'distance' | 'place';
}) {
  const meta =
    context === 'distance' && elevator.distance_m !== null
      ? `${Math.round(elevator.distance_m)} M AWAY · ${elevator.rating_count} ON RECORD`
      : `${elevator.city.toUpperCase()} · ${elevator.rating_count} ON RECORD`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${elevator.label} at ${elevator.building_name}`}
    >
      <PaperSurface padding="md" guilloche={false} style={{ gap: space.xs }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <FormLabel size={10}>{elevator.building_name}</FormLabel>
            <TypedValue size={17}>{elevator.label}</TypedValue>
          </View>
          {elevator.score_avg !== null ? (
            <ScoreDisplay score={elevator.score_avg} size={34} />
          ) : (
            <FormLabel size={10}>UNRATED</FormLabel>
          )}
        </View>
        <Rule opacity={0.2} />
        <FormLabel size={10}>{meta}</FormLabel>
      </PaperSurface>
    </Pressable>
  );
}
