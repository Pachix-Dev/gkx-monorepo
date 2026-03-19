import { z } from "zod";

export const createTeamSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es obligatorio"),
  name: z.string().min(2, "Nombre minimo de 2 caracteres"),
  category: z.string().optional(),
  season: z.string().optional(),
  coachId: z.string().optional(),
});

export const updateTeamSchema = createTeamSchema;

export const assignGoalkeeperSchema = z.object({
  teamId: z.string().min(1, "Team ID es obligatorio"),
  goalkeeperId: z.string().min(1, "Goalkeeper ID es obligatorio"),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;
export type UpdateTeamFormValues = z.infer<typeof updateTeamSchema>;
export type AssignGoalkeeperFormValues = z.infer<typeof assignGoalkeeperSchema>;
