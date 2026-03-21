import { z } from 'zod';

const optionalInt = z.number().int().min(0).optional();

export const createExerciseSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID es obligatorio'),
  trainingContentId: z.string().min(1, 'Training content es obligatorio'),
  name: z.string().min(2, 'Nombre minimo de 2 caracteres'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  objective: z.string().optional(),
  durationMinutes: optionalInt,
  repetitions: optionalInt,
  restSeconds: optionalInt,
  equipment: z.string().optional(),
  videoUrl: z.string().url('Video URL invalida').or(z.literal('')).optional(),
  difficulty: z.string().optional(),
});

export const updateExerciseSchema = createExerciseSchema;

export type CreateExerciseFormValues = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseFormValues = z.infer<typeof updateExerciseSchema>;

// Tactical design schema
export const tacticalDesignStateSchema = z.object({
  activePanel: z.enum(['backgrounds', 'text', 'elements', 'layers']),
  isMenuCollapsed: z.boolean(),
  backgroundSrc: z.string(),
  elements: z.array(z.record(z.string(), z.unknown())),
  textDraft: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  fontColor: z.string(),
});

export const updateTacticalDesignSchema = z.object({
  state: z.record(z.string(), z.unknown()),
  stateVersion: z.number().int().min(1).optional(),
  previewUrl: z.string().url().optional().nullable(),
  previewHash: z.string().optional().nullable(),
});

export type UpdateTacticalDesignFormValues = z.infer<
  typeof updateTacticalDesignSchema
>;
