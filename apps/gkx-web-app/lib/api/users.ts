import { apiRequest } from "@/lib/api/client";
import { extractArray, extractData } from "@/lib/api/response";
import { UserRole } from "@/lib/auth/types";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type UserEntity = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tenantId?: string | null;
  createdAt?: string;
};

export type CreateUserInput = {
  tenantId: string;
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
};

export type UpdateUserInput = Partial<Pick<CreateUserInput, "fullName" | "email" | "role" | "status">>;

export async function getUsers() {
  const payload = await apiRequest<unknown>("/users", {
    method: "GET",
    auth: true,
  });

  return extractArray<UserEntity>(payload);
}

export async function createUser(input: CreateUserInput) {
  const payload = await apiRequest<unknown>("/users", {
    method: "POST",
    auth: true,
    body: input,
  });

  return extractData<UserEntity>(payload);
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const payload = await apiRequest<unknown>(`/users/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });

  return extractData<UserEntity>(payload);
}

export async function deleteUser(id: string) {
  await apiRequest<unknown>(`/users/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
