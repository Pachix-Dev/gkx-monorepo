import { UsersClient } from "@/features/users/components/users-client";
import { requireServerRole } from "@/lib/auth/server-guard";

export default async function UsersPage() {
  await requireServerRole(["SUPER_ADMIN"]);

  return <UsersClient />;
}
