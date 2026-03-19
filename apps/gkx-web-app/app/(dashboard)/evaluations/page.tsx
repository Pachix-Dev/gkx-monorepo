import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export default function EvaluationsPage() {
  return (
    <ModulePlaceholder
      title="Evaluations"
      description="Base del modulo lista. Siguiente paso: formulario tecnico de evaluacion con score 0-10."
      endpoint="/api/evaluations"
    />
  );
}
