"use client";

import { useGoalkeepersQuery } from "@/features/goalkeepers/hooks/use-goalkeepers";
import {
  useCreateEvaluationMutation,
  useDeleteEvaluationMutation,
  useEvaluationsBySessionQuery,
} from "@/features/evaluations/hooks/use-evaluations";
import { FormEvent, useMemo, useState } from "react";
import { sileo } from "sileo";

const DEFAULT_CRITERIA = [
  { code: "handling", label: "Handling" },
  { code: "diving", label: "Diving" },
  { code: "positioning", label: "Positioning" },
  { code: "reflexes", label: "Reflexes" },
  { code: "communication", label: "Communication" },
  { code: "footwork", label: "Footwork" },
  { code: "distribution", label: "Distribution" },
  { code: "aerial_play", label: "Aerial Play" },
  { code: "one_vs_one", label: "One vs One" },
  { code: "mentality", label: "Mentality" },
] as const;

export function SessionEvaluationsPanel({
  sessionId,
  tenantId,
  teamId,
}: {
  sessionId: string;
  tenantId: string;
  teamId?: string | null;
}) {
  const goalkeepersQuery = useGoalkeepersQuery();
  const evaluationsQuery = useEvaluationsBySessionQuery(sessionId);
  const createMutation = useCreateEvaluationMutation(sessionId);
  const deleteMutation = useDeleteEvaluationMutation(sessionId);

  const [goalkeeperId, setGoalkeeperId] = useState("");
  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [generalComment, setGeneralComment] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_CRITERIA.map((item) => [item.code, 0])),
  );

  const goalkeepers = useMemo(() => goalkeepersQuery.data ?? [], [goalkeepersQuery.data]);
  const evaluations = useMemo(() => evaluationsQuery.data ?? [], [evaluationsQuery.data]);

  const scopedGoalkeepers = useMemo(() => {
    const tenantScoped = goalkeepers.filter((item) => item.tenantId === tenantId);
    if (!teamId) return tenantScoped;
    return tenantScoped.filter((item) => item.teamId === teamId);
  }, [goalkeepers, teamId, tenantId]);

  const goalkeeperById = useMemo(
    () => new Map(scopedGoalkeepers.map((item) => [item.id, item])),
    [scopedGoalkeepers],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!goalkeeperId || !sessionId || !tenantId) return;

    const items = DEFAULT_CRITERIA.map((criterion) => ({
      criterionCode: criterion.code,
      criterionLabel: criterion.label,
      score: Number(scores[criterion.code] ?? 0),
    }));

    await sileo.promise(
      createMutation.mutateAsync({
        tenantId,
        trainingSessionId: sessionId,
        goalkeeperId,
        evaluationDate,
        generalComment: generalComment || undefined,
        items,
      }),
      {
        loading: { title: "Guardando evaluación" },
        success: { title: "Evaluación registrada" },
        error: (error: unknown) => ({
          title: "Error al guardar evaluación",
          description: error instanceof Error ? error.message : "No se pudo guardar la evaluación.",
        }),
      },
    );

    setGoalkeeperId("");
    setGeneralComment("");
    setScores(Object.fromEntries(DEFAULT_CRITERIA.map((item) => [item.code, 0])));
  };

  const onDelete = async (id: string) => {
    const ok = window.confirm("¿Eliminar esta evaluación?");
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando evaluación" },
      success: { title: "Evaluación eliminada" },
      error: (error: unknown) => ({
        title: "Error al eliminar evaluación",
        description: error instanceof Error ? error.message : "No se pudo eliminar la evaluación.",
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-card-foreground">Nueva evaluación</h3>
        <form onSubmit={onSubmit} className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Portero</span>
            <select
              value={goalkeeperId}
              onChange={(event) => setGoalkeeperId(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Selecciona portero</option>
              {scopedGoalkeepers.map((goalkeeper) => (
                <option key={goalkeeper.id} value={goalkeeper.id}>
                  {goalkeeper.name || goalkeeper.id}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Fecha</span>
            <input
              type="date"
              value={evaluationDate}
              onChange={(event) => setEvaluationDate(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          {DEFAULT_CRITERIA.map((criterion) => (
            <label key={criterion.code} className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{criterion.label}</span>
              <input
                type="number"
                min={0}
                max={10}
                value={scores[criterion.code] ?? 0}
                onChange={(event) =>
                  setScores((current) => ({
                    ...current,
                    [criterion.code]: Number(event.target.value),
                  }))
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          ))}

          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Comentario general</span>
            <textarea
              value={generalComment}
              onChange={(event) => setGeneralComment(event.target.value)}
              rows={3}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {createMutation.isPending ? "Guardando..." : "Registrar evaluación"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-card-foreground">Evaluaciones registradas</h3>
        {evaluations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No hay evaluaciones para esta sesión.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {goalkeeperById.get(evaluation.goalkeeperId)?.name || evaluation.goalkeeperId}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDelete(evaluation.id)}
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {evaluation.evaluationDate} - Score general: {evaluation.overallScore}
                </p>
                {evaluation.generalComment ? (
                  <p className="mt-2 text-sm text-foreground">{evaluation.generalComment}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
