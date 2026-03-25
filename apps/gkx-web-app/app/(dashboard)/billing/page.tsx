import { BillingClient } from "@/features/billing/components/billing-client";
import { requireServerRole } from "@/lib/auth/server-guard";

export default async function BillingPage() {
  await requireServerRole(["SUPER_ADMIN", "USER"]);
  return <BillingClient />;
}
