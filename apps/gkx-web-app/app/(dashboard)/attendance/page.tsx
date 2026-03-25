import { AttendanceClient } from "@/features/attendance/components/attendance-client";
import { requireServerRole } from "@/lib/auth/server-guard";

export default async function AttendancePage() {
  await requireServerRole(["SUPER_ADMIN", "USER"]);
  return <AttendanceClient />;
}
