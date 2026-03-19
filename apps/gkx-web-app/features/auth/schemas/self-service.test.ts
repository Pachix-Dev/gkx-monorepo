import { describe, expect, it } from "vitest";
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./self-service";

describe("auth self-service schemas", () => {
  it("acepta login valido", () => {
    const result = loginSchema.safeParse({
      email: "coach@gkacademy.com",
      password: "supersecure123",
    });

    expect(result.success).toBe(true);
  });

  it("rechaza login con password corta", () => {
    const result = loginSchema.safeParse({
      email: "coach@gkacademy.com",
      password: "123",
    });

    expect(result.success).toBe(false);
  });

  it("acepta register valido", () => {
    const result = registerSchema.safeParse({
      tenantName: "GKX Academy",
      tenantSlug: "gkx-academy",
      fullName: "Coach Admin",
      email: "admin@gkacademy.com",
      password: "securepass123",
    });

    expect(result.success).toBe(true);
  });

  it("requiere token en verify email", () => {
    expect(verifyEmailSchema.safeParse({ token: "" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ token: "raw-token" }).success).toBe(true);
  });

  it("valida email-only schema", () => {
    expect(emailOnlySchema.safeParse({ email: "bad-email" }).success).toBe(false);
    expect(emailOnlySchema.safeParse({ email: "valid@example.com" }).success).toBe(true);
  });

  it("rechaza reset cuando las contraseñas no coinciden", () => {
    const result = resetPasswordSchema.safeParse({
      token: "token-123",
      newPassword: "new-password-123",
      confirmPassword: "other-password",
    });

    expect(result.success).toBe(false);
  });

  it("acepta reset valido", () => {
    const result = resetPasswordSchema.safeParse({
      token: "token-123",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });

    expect(result.success).toBe(true);
  });
});
