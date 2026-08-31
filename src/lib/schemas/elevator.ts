import { z } from 'zod';
import { bandSchema } from './rating';

export const nearbyElevatorSchema = z.object({
  elevator_id: z.uuid(),
  label: z.string(),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  floors_served: z.number().int().nullable(),
  capacity_lb: z.number().int().nullable(),
  score_avg: z.coerce.number().nullable(),
  rating_count: z.number().int(),
  current_band: bandSchema.nullable(),
  building_id: z.uuid(),
  building_name: z.string(),
  address_line: z.string(),
  city: z.string(),
  metro_code: z.string(),
  distance_m: z.number(),
});

export type NearbyElevator = z.infer<typeof nearbyElevatorSchema>;

export const createElevatorSchema = z.object({
  buildingId: z.uuid(),
  label: z.string().trim().min(1).max(60),
  manufacturer: z.string().trim().max(40).optional(),
  model: z.string().trim().max(40).optional(),
  capacityLb: z.number().int().min(100).max(20000).optional(),
  floorsServed: z.number().int().min(1).max(200).optional(),
  installYear: z.string().regex(/^\d{4}$/).optional(),
});

export type CreateElevatorInput = z.infer<typeof createElevatorSchema>;

export const createBuildingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  addressLine: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(80),
  region: z.string().trim().max(40).optional(),
  country: z.string().length(2).default('US'),
  postalCode: z.string().trim().max(16).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  metroCode: z.string().regex(/^[A-Z]{2,4}$/),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
