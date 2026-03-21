import { z } from "zod";

export const createTrainingLineSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es obligatorio"),
  name: z.string().min(2, "Nombre minimo de 2 caracteres"),
  description: z.string().optional(),
});

export const updateTrainingLineSchema = createTrainingLineSchema;

export type CreateTrainingLineFormValues = z.infer<typeof createTrainingLineSchema>;
export type UpdateTrainingLineFormValues = z.infer<typeof updateTrainingLineSchema>;
