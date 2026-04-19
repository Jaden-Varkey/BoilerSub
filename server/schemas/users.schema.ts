import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateMeSchema = z.object({
  full_name: z.string().min(1).max(120).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  phone: z.string().regex(/^\+1\d{10}$/, 'Phone must be a US +1 number').nullable().optional(),
});
