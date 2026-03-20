export type UserRole =
  | "SUPER_ADMIN"
  | "USER";

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
