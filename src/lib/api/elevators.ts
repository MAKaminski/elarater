import { getSupabase } from '../supabase';
import {
  createBuildingSchema,
  createElevatorSchema,
  nearbyElevatorSchema,
  type CreateBuildingInput,
  type CreateElevatorInput,
  type NearbyElevator,
} from '../schemas/elevator';
import { visibleRatingSchema, type VisibleRating } from '../schemas/rating';

/**
 * PostGIS-backed nearby discovery — a geography index, not a client-side filter.
 * Coarse location is enough to identify a building; we never request fine location
 * (docs/06-store-compliance.md).
 */
export async function searchNearby(
  lat: number,
  lng: number,
  radiusM = 250,
): Promise<NearbyElevator[]> {
  const { data, error } = await getSupabase().rpc('search_nearby_elevators', {
    lat,
    lng,
    radius_m: radiusM,
  });
  if (error) throw new Error(`search_nearby_elevators: ${error.message}`);
  return nearbyElevatorSchema.array().parse(data ?? []);
}

export async function getElevatorRatings(elevatorId: string): Promise<VisibleRating[]> {
  const { data, error } = await getSupabase()
    .from('visible_ratings')
    .select('*')
    .eq('elevator_id', elevatorId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`visible_ratings(${elevatorId}): ${error.message}`);
  return visibleRatingSchema.array().parse(data ?? []);
}

export async function createBuilding(input: CreateBuildingInput, userId: string) {
  const v = createBuildingSchema.parse(input);
  const { data, error } = await getSupabase()
    .from('buildings')
    .insert({
      name: v.name,
      address_line: v.addressLine,
      city: v.city,
      region: v.region ?? null,
      country: v.country,
      postal_code: v.postalCode ?? null,
      metro_code: v.metroCode,
      created_by: userId,
      location: `SRID=4326;POINT(${v.lng} ${v.lat})`,
    })
    .select('id')
    .single();
  if (error) throw new Error(`createBuilding: ${error.message}`);
  return data.id;
}

export async function createElevator(input: CreateElevatorInput, userId: string) {
  const v = createElevatorSchema.parse(input);
  const { data, error } = await getSupabase()
    .from('elevators')
    .insert({
      building_id: v.buildingId,
      label: v.label,
      manufacturer: v.manufacturer ?? null,
      model: v.model ?? null,
      capacity_lb: v.capacityLb ?? null,
      floors_served: v.floorsServed ?? null,
      install_year: v.installYear ?? null,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) throw new Error(`createElevator: ${error.message}`);
  return data.id;
}

/**
 * Text search across building name, address, city and elevator label. The path in
 * when location is off, when nothing is nearby, or when the user is at a desk.
 */
export async function searchElevators(query: string, limit = 50): Promise<NearbyElevator[]> {
  const { data, error } = await getSupabase()
    .rpc('search_elevators', { q: query, limit_n: limit });
  if (error) throw new Error(`search_elevators: ${error.message}`);
  return nearbyElevatorSchema.array().parse(data ?? []);
}

/**
 * The most recent findings. Shown instead of an empty nearby list — an empty screen
 * reads as a broken app, a wall of certificates does not.
 */
export async function recentCertificates(limit = 20): Promise<VisibleRating[]> {
  const { data, error } = await getSupabase().rpc('recent_certificates', { limit_n: limit });
  if (error) throw new Error(`recent_certificates: ${error.message}`);
  return visibleRatingSchema.array().parse(data ?? []);
}

export type BuildingDetail = {
  building: {
    id: string;
    name: string;
    addressLine: string;
    city: string;
    region: string | null;
    metroCode: string;
    average: number | null;
  };
  elevators: NearbyElevator[];
};

/** Every elevator in a building, plus the building's own average. */
export async function getBuildingDetail(buildingId: string): Promise<BuildingDetail | null> {
  const { data, error } = await getSupabase()
    .rpc('building_detail', { p_building_id: buildingId });
  if (error) throw new Error(`building_detail: ${error.message}`);

  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return null;

  const first = rows[0];
  return {
    building: {
      id: String(first.building_id),
      name: String(first.building_name),
      addressLine: String(first.address_line),
      city: String(first.city),
      region: (first.region as string) ?? null,
      metroCode: String(first.metro_code),
      average: first.building_avg === null ? null : Number(first.building_avg),
    },
    elevators: nearbyElevatorSchema.array().parse(
      rows.map((r) => ({ ...r, distance_m: null })),
    ),
  };
}
