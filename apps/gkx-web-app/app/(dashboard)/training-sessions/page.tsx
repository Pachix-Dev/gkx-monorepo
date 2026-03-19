import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function TrainingSessionsPage() {
  return (
    <ModulePlaceholder
      title="Training Sessions"
      description="Base del modulo lista. Siguiente paso: session builder con contenidos y ejercicios."
      endpoint="/api/training-sessions"
    />
  );
}
