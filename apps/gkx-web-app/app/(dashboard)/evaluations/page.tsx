import { EvaluationsClient } from "@/features/evaluations/components/evaluations-client";
import { requireServerRole } from "@/lib/auth/server-guard";

export default async function EvaluationsPage() {
  await requireServerRole(["SUPER_ADMIN", "USER"]);
  return <EvaluationsClient />;
}
