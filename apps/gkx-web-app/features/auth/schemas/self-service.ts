import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
});

export const registerSchema = z.object({
  tenantName: z.string().min(2, "Nombre de tenant requerido"),
  tenantSlug: z.string().optional(),
  fullName: z.string().min(2, "Nombre completo requerido"),
  email: z.email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
});

export const emailOnlySchema = z.object({
  email: z.email("Email invalido"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token requerido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token requerido"),
    newPassword: z.string().min(8, "Minimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Minimo 8 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden",
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type EmailOnlyFormValues = z.infer<typeof emailOnlySchema>;
export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
