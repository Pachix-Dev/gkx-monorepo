import { z } from "zod";

const optionalInt = z.number().int().min(0).optional();

export const createTrainingContentSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es obligatorio"),
  trainingLineId: z.string().min(1, "Training line es obligatorio"),
  name: z.string().min(2, "Nombre minimo de 2 caracteres"),
  description: z.string().optional(),
  objective: z.string().optional(),
  level: z.string().optional(),
  estimatedDurationMinutes: optionalInt,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateTrainingContentSchema = createTrainingContentSchema;

export type CreateTrainingContentFormValues = z.infer<typeof createTrainingContentSchema>;
export type UpdateTrainingContentFormValues = z.infer<typeof updateTrainingContentSchema>;
