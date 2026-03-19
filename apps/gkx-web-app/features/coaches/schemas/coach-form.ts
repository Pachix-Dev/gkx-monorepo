import { z } from "zod";

const optionalInt = z.number().int().min(0).optional();

export const createCoachSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es obligatorio"),
  userId: z.string().min(1, "User ID es obligatorio"),
  specialty: z.string().optional(),
  licenseLevel: z.string().optional(),
  experienceYears: optionalInt,
});

export const updateCoachSchema = createCoachSchema;

export type CreateCoachFormValues = z.infer<typeof createCoachSchema>;
export type UpdateCoachFormValues = z.infer<typeof updateCoachSchema>;
