import { z } from "zod";

const uuidSchema = z.string().uuid();
const jpegDataUrlSchema = z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, "Invalid JPEG image");
const jpegImageSchema = z.union([jpegDataUrlSchema, z.string().url()]);

export const listingCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  price: z.number().nonnegative(),
  start_date: z.string().date(),
  end_date: z.string().date().nullable().optional(),
  bedrooms: z.number().int().nonnegative().nullable().optional(),
  bathrooms: z.number().nonnegative().nullable().optional(),
  distance: z.number().nonnegative().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  amenities: z.array(z.string().min(1).max(80)).default([]),
  images: z.array(jpegDataUrlSchema).min(1).max(10),
  panorama_image: jpegImageSchema.nullable().optional(),
});

export const listingUpdateSchema = listingCreateSchema.partial().extend({
  id: uuidSchema.optional(),
});

export const listingIdSchema = z.object({
  id: uuidSchema,
});

export const listingIdParamSchema = listingIdSchema;

export const listingListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;
export type ListingListQuery = z.infer<typeof listingListQuerySchema>;
