import { z } from "zod";

const optionalNumber = z.number().optional();

export const createGoalkeeperSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es obligatorio"),
  name: z.string().min(1, "Nombre es obligatorio"),
  dateOfBirth: z.string().optional(),
  dominantHand: z.string().optional(),
  dominantFoot: z.string().optional(),
  height: optionalNumber,
  weight: optionalNumber,
  category: z.string().optional(),
  teamId: z.string().optional(),
  medicalNotes: z.string().optional(),
  parentContact: z.string().optional(),
});

export const updateGoalkeeperSchema = createGoalkeeperSchema;

export type CreateGoalkeeperFormValues = z.infer<typeof createGoalkeeperSchema>;
export type UpdateGoalkeeperFormValues = z.infer<typeof updateGoalkeeperSchema>;
