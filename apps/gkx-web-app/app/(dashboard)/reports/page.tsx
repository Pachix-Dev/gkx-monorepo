import { ReportsClient } from "@/features/reports/components/reports-client";
import { requireServerRole } from "@/lib/auth/server-guard";

export default async function ReportsPage() {
  await requireServerRole(["SUPER_ADMIN", "USER"]);
  return <ReportsClient />;
}
