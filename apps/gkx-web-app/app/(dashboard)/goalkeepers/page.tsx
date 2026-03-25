import { GoalkeepersClient } from "@/features/goalkeepers/components/goalkeepers-client";
import { requireServerRole } from "@/lib/auth/server-guard";

export default async function GoalkeepersPage() {
  await requireServerRole(["SUPER_ADMIN", "USER"]);
  return <GoalkeepersClient />;
}
