"use client";

import {
  useAttendanceBySessionQuery,
  useCreateAttendanceBulkMutation,
} from "@/features/attendance/hooks/use-attendance";
import { useGoalkeepersQuery } from "@/features/goalkeepers/hooks/use-goalkeepers";
import { AttendanceStatus } from "@/lib/api/attendance";
import { useMemo, useState } from "react";
import { sileo } from "sileo";

type AttendanceDraft = {
  status: AttendanceStatus;
  notes: string;
};

const STATUS_OPTIONS: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "JUSTIFIED",
];

export function SessionAttendancePanel({
  sessionId,
  tenantId,
  teamId,
}: {
  sessionId: string;
  tenantId: string;
  teamId?: string | null;
}) {
  const attendanceQuery = useAttendanceBySessionQuery(sessionId);
  const goalkeepersQuery = useGoalkeepersQuery();
  const saveBulkMutation = useCreateAttendanceBulkMutation(sessionId);

  const goalkeepers = useMemo(
    () => goalkeepersQuery.data ?? [],
    [goalkeepersQuery.data],
  );
  const attendance = useMemo(
    () => attendanceQuery.data ?? [],
    [attendanceQuery.data],
  );

  const scopedGoalkeepers = useMemo(() => {
    const tenantScoped = goalkeepers.filter((item) => item.tenantId === tenantId);
    if (!teamId) return tenantScoped;
    return tenantScoped.filter((item) => item.teamId === teamId);
  }, [goalkeepers, teamId, tenantId]);

  const [draftByGoalkeeper, setDraftByGoalkeeper] = useState<
    Record<string, AttendanceDraft>
  >({});

  const attendanceByGoalkeeper = useMemo(
    () => new Map(attendance.map((item) => [item.goalkeeperId, item])),
    [attendance],
  );

  const getDraft = (goalkeeperId: string): AttendanceDraft => {
    const override = draftByGoalkeeper[goalkeeperId];
    if (override) return override;

    const existing = attendanceByGoalkeeper.get(goalkeeperId);
    return {
      status: existing?.status ?? "PRESENT",
      notes: existing?.notes ?? "",
    };
  };

  const onChangeStatus = (goalkeeperId: string, status: AttendanceStatus) => {
    setDraftByGoalkeeper((current) => ({
      ...current,
      [goalkeeperId]: {
        ...(current[goalkeeperId] ?? { status: "PRESENT", notes: "" }),
        status,
      },
    }));
  };

  const onChangeNotes = (goalkeeperId: string, notes: string) => {
    setDraftByGoalkeeper((current) => ({
      ...current,
      [goalkeeperId]: {
        ...(current[goalkeeperId] ?? { status: "PRESENT", notes: "" }),
        notes,
      },
    }));
  };

  const onSaveBulk = async () => {
    if (!tenantId || !sessionId || scopedGoalkeepers.length === 0) return;

    const items = scopedGoalkeepers.map((goalkeeper) => ({
      goalkeeperId: goalkeeper.id,
      status: getDraft(goalkeeper.id).status,
      notes: getDraft(goalkeeper.id).notes || undefined,
    }));

    await sileo.promise(
      saveBulkMutation.mutateAsync({
        tenantId,
        trainingSessionId: sessionId,
        items,
      }),
      {
        loading: { title: "Guardando asistencia" },
        success: { title: "Asistencia actualizada" },
        error: (error: unknown) => ({
          title: "Error al guardar asistencia",
          description:
            error instanceof Error
              ? error.message
              : "No se pudo guardar la asistencia.",
        }),
      },
    );
  };

  if (goalkeepersQuery.isLoading || attendanceQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando asistencia...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-card-foreground">
          Registro de asistencia
        </h3>
        <button
          type="button"
          onClick={onSaveBulk}
          disabled={saveBulkMutation.isPending || scopedGoalkeepers.length === 0}
          className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {saveBulkMutation.isPending ? "Guardando..." : "Guardar asistencia"}
        </button>
      </div>

      {scopedGoalkeepers.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          No hay porteros disponibles para esta sesión.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 font-medium text-foreground">Portero</th>
                <th className="px-3 py-2 font-medium text-foreground">Estado</th>
                <th className="px-3 py-2 font-medium text-foreground">Notas</th>
              </tr>
            </thead>
            <tbody>
              {scopedGoalkeepers.map((goalkeeper) => (
                <tr key={goalkeeper.id} className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">
                    {goalkeeper.name || goalkeeper.id}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={getDraft(goalkeeper.id).status}
                      onChange={(event) =>
                        onChangeStatus(
                          goalkeeper.id,
                          event.target.value as AttendanceStatus,
                        )
                      }
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={getDraft(goalkeeper.id).notes}
                      onChange={(event) =>
                        onChangeNotes(goalkeeper.id, event.target.value)
                      }
                      placeholder="Opcional"
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
