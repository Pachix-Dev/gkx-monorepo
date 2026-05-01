import { apiRequest } from "@/lib/api/client";
import { extractArray } from "@/lib/api/response";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "BASIC" | "PRO";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export async function getTenants(): Promise<Tenant[]> {
  const payload = await apiRequest<unknown>("/tenants", {
    method: "GET",
    auth: true,
  });

  return extractArray<Tenant>(payload);
}