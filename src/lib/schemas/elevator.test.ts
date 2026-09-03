import { describe, expect, it } from 'vitest';
import { nearbyElevatorSchema } from './elevator';

const base = {
  elevator_id: '00000000-0000-4000-8000-000000000001',
  label: 'North Bank Car 2',
  manufacturer: 'Otis',
  model: 'Gen2',
  floors_served: 14,
  capacity_lb: 2500,
  score_avg: 4.5,
  rating_count: 2,
  current_band: 'EXCELLENT',
  building_id: '00000000-0000-4000-8000-000000000002',
  building_name: 'Promenade Tower',
  address_line: '1230 Peachtree St NE',
  city: 'Atlanta',
  metro_code: 'ATL',
};

describe('elevator rows', () => {
  it('accepts a nearby row, which carries a distance', () => {
    expect(nearbyElevatorSchema.parse({ ...base, distance_m: 41.2 }).distance_m).toBe(41.2);
  });

  it('accepts a search or building row, which has no origin to measure from', () => {
    // search_elevators and building_detail return null here. Requiring a number made
    // every search throw, and the Search screen rendered the parse failure as
    // "NOTHING ON RECORD" — an error disguised as an empty result.
    expect(nearbyElevatorSchema.parse({ ...base, distance_m: null }).distance_m).toBeNull();
  });

  it('coerces the numeric score Postgres returns as a string', () => {
    expect(nearbyElevatorSchema.parse({ ...base, score_avg: '4.5', distance_m: null }).score_avg).toBe(4.5);
  });

  it('accepts an unrated elevator', () => {
    const row = nearbyElevatorSchema.parse({
      ...base, score_avg: null, current_band: null, rating_count: 0, distance_m: null,
    });
    expect(row.score_avg).toBeNull();
    expect(row.current_band).toBeNull();
  });
});
