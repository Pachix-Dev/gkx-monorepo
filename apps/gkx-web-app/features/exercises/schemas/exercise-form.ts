import { z } from "zod";

const optionalInt = z.number().int().min(0).optional();

export const createExerciseSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es obligatorio"),
  trainingContentId: z.string().min(1, "Training content es obligatorio"),
  name: z.string().min(2, "Nombre minimo de 2 caracteres"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  objective: z.string().optional(),
  durationMinutes: optionalInt,
  repetitions: optionalInt,
  restSeconds: optionalInt,
  equipment: z.string().optional(),
  videoUrl: z.string().url("Video URL invalida").or(z.literal("")).optional(),
  difficulty: z.string().optional(),
});

export const updateExerciseSchema = createExerciseSchema;

export type CreateExerciseFormValues = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseFormValues = z.infer<typeof updateExerciseSchema>;
