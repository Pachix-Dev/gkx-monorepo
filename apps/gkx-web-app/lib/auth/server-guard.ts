import { UserRole } from "@/lib/auth/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export type ServerAuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId?: string | null;
};

function extractUser(payload: unknown): ServerAuthUser | null {
  const root = payload as {
    id?: string;
    email?: string;
    fullName?: string;
    role?: UserRole;
    tenantId?: string | null;
    data?: {
      id?: string;
      email?: string;
      fullName?: string;
      role?: UserRole;
      tenantId?: string | null;
      user?: {
        id?: string;
        email?: string;
        fullName?: string;
        role?: UserRole;
        tenantId?: string | null;
      };
    };
  };

  const source = root.data?.user ?? root.data ?? root;

  if (!source.id || !source.email || !source.fullName || !source.role) {
    return null;
  }

  return {
    id: source.id,
    email: source.email,
    fullName: source.fullName,
    role: source.role,
    tenantId: source.tenantId ?? null,
  };
}

export async function getServerAuthUser(): Promise<ServerAuthUser | null> {
  const token = (await cookies()).get("gkx_access_token")?.value;

  if (!API_BASE_URL || !token) {
    return null;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  try {
    const payload = (await response.json()) as unknown;
    return extractUser(payload);
  } catch {
    return null;
  }
}

export async function requireServerRole(
  allowedRoles: UserRole[],
  redirectTo = "/dashboard",
): Promise<ServerAuthUser> {
  const user = await getServerAuthUser();

  if (!user || !allowedRoles.includes(user.role)) {
    redirect(redirectTo);
  }

  return user;
}
