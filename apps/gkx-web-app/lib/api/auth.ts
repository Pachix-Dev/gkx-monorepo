import { AuthTokens, AuthUser, LoginRequest } from "@/lib/auth/types";
import { apiRequest, extractTokens } from "@/lib/api/client";
import { extractData } from "@/lib/api/response";

export type RegisterTenantInput = {
  tenantName: string;
  fullName: string;
  email: string;
  password: string;
};

export type EmailRequestInput = {
  email: string;
};

export type VerifyEmailInput = {
  token: string;
};

export type ResetPasswordInput = {
  token: string;
  newPassword: string;
};

function extractUser(payload: unknown): AuthUser {
  const root = payload as {
    id?: string;
    email?: string;
    fullName?: string;
    role?: AuthUser["role"];
    tenantId?: string | null;
    data?: {
      id?: string;
      email?: string;
      fullName?: string;
      role?: AuthUser["role"];
      tenantId?: string | null;
      user?: {
        id?: string;
        email?: string;
        fullName?: string;
        role?: AuthUser["role"];
        tenantId?: string | null;
      };
    };
  };

  const source = root.data?.user ?? root.data ?? root;

  if (!source.id || !source.email || !source.fullName || !source.role) {
    throw new Error("Invalid user payload from /auth/me.");
  }

  return {
    id: source.id,
    email: source.email,
    fullName: source.fullName,
    role: source.role,
    tenantId: source.tenantId ?? null,
  };
}

export async function loginRequest(credentials: LoginRequest): Promise<AuthTokens> {
  const payload = await apiRequest<unknown>("/auth/login", {
    method: "POST",
    body: credentials,
  });
  return extractTokens(payload);
}

export async function registerTenantRequest(payload: RegisterTenantInput) {
  const response = await apiRequest<unknown>("/auth/register-tenant", {
    method: "POST",
    body: payload,
  });

  return extractData<{
    verificationRequired?: boolean;
  }>(response);
}

export async function requestEmailVerification(payload: EmailRequestInput) {
  const response = await apiRequest<unknown>("/auth/verify-email/request", {
    method: "POST",
    body: payload,
  });

  return extractData<{ sent: boolean }>(response);
}

export async function confirmEmailVerification(payload: VerifyEmailInput) {
  const response = await apiRequest<unknown>("/auth/verify-email/confirm", {
    method: "POST",
    body: payload,
  });

  return extractData<{ verified: boolean }>(response);
}

export async function forgotPasswordRequest(payload: EmailRequestInput) {
  const response = await apiRequest<unknown>("/auth/forgot-password", {
    method: "POST",
    body: payload,
  });

  return extractData<{ sent: boolean }>(response);
}

export async function resetPasswordRequest(payload: ResetPasswordInput) {
  const response = await apiRequest<unknown>("/auth/reset-password", {
    method: "POST",
    body: payload,
  });

  return extractData<{ reset: boolean }>(response);
}

export async function meRequest() {
  const payload = await apiRequest<unknown>("/auth/me", { method: "GET", auth: true });
  return extractUser(payload);
}

export function logoutRequest() {
  return apiRequest<void>("/auth/logout", { method: "POST", auth: true });
}
