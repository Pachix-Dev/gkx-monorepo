export type UserRole =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "COACH"
  | "ASSISTANT_COACH"
  | "GOALKEEPER"
  | "PARENT"
  | "READONLY";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};
