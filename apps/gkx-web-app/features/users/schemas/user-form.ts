import { z } from "zod";

export const createUserSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es obligatorio"),
  fullName: z.string().min(2, "Nombre minimo de 2 caracteres"),
  email: z.email("Email invalido"),
  password: z.string().min(8, "Password minimo de 8 caracteres"),
  role: z.enum(["SUPER_ADMIN", "TENANT_ADMIN", "COACH", "ASSISTANT_COACH", "GOALKEEPER", "PARENT", "READONLY"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const updateUserSchema = createUserSchema.omit({ password: true }).extend({
  password: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
