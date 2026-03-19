import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function AttendancePage() {
  return (
    <ModulePlaceholder
      title="Attendance"
      description="Base del modulo lista. Siguiente paso: registro bulk por sesion y estados de asistencia."
      endpoint="/api/attendance"
    />
  );
}
