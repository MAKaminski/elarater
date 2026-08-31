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
