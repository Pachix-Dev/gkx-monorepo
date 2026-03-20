"use client";

import { useAuth } from "@/features/auth/use-auth";
import { useExercisesQuery } from "@/features/exercises/hooks/use-exercises";
import {
  useCreateSessionExerciseMutation,
  useCreateSessionTaskMutation,
  useDeleteSessionExerciseMutation,
  useDeleteSessionTaskMutation,
  useDeleteTrainingSessionMutation,
  useSessionExercisesQuery,
  useSessionTasksQuery,
  useTrainingSessionQuery,
  useUpdateTrainingSessionMutation,
} from "@/features/training-sessions/hooks/use-training-sessions";
import { useTrainingContentsQuery } from "@/features/training-contents/hooks/use-training-contents";
import { getAccessToken } from "@/lib/auth/token-storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { sileo } from "sileo";

// vercel-react-best-practices:
// - js-index-maps: Map for O(1) lookups
// - rerender-memo: memoize all derived state
// - rendering-conditional-render: ternary instead of &&

type Tab = "info" | "tasks" | "structure";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-gray-100 text-gray-600" },
  PLANNED: { label: "Planificada", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Completada", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelada", className: "bg-red-100 text-red-600" },
};

// rendering-hoist-jsx: static styles hoisted outside component
const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "flex flex-col gap-1";
const labelTextClass = "text-xs font-medium text-muted-foreground";

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TrainingSessionDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const tenantId = user?.tenantId ?? "";

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [taskName, setTaskName] = useState("");
  const [taskDuration, setTaskDuration] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [exerciseTaskId, setExerciseTaskId] = useState("");
  const [exerciseContentId, setExerciseContentId] = useState("");
  const [exerciseId, setExerciseId] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"DRAFT" | "PLANNED" | "COMPLETED" | "CANCELLED">("DRAFT");
  const [editContentIds, setEditContentIds] = useState<string[]>([]);

  const sessionQuery = useTrainingSessionQuery(id);
  const tasksQuery = useSessionTasksQuery(id);
  const sessionExercisesQuery = useSessionExercisesQuery(id);
  const contentsQuery = useTrainingContentsQuery({});
  const exercisesQuery = useExercisesQuery({});

  const deleteSessionMutation = useDeleteTrainingSessionMutation();
  const updateSessionMutation = useUpdateTrainingSessionMutation();
  const createTaskMutation = useCreateSessionTaskMutation(id);
  const deleteTaskMutation = useDeleteSessionTaskMutation(id);
  const createSessionExerciseMutation = useCreateSessionExerciseMutation(id);
  const deleteSessionExerciseMutation = useDeleteSessionExerciseMutation(id);

  const session = sessionQuery.data ?? null;

  // rerender-memo: memoize all derived lists
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const assignedExercises = useMemo(() => sessionExercisesQuery.data ?? [], [sessionExercisesQuery.data]);
  const contents = useMemo(() => contentsQuery.data ?? [], [contentsQuery.data]);
  const exercises = useMemo(() => exercisesQuery.data ?? [], [exercisesQuery.data]);

  const assignedContentIds = useMemo(() => session?.trainingContentIds ?? [], [session?.trainingContentIds]);
  const assignedContentIdSet = useMemo(() => new Set(assignedContentIds), [assignedContentIds]);
  const availableContents = useMemo(
    () => contents.filter((content) => assignedContentIdSet.has(content.id)),
    [contents, assignedContentIdSet],
  );
  const availableExercises = useMemo(() => {
    if (!exerciseContentId) return [];
    return exercises.filter((exercise) => exercise.trainingContentId === exerciseContentId);
  }, [exercises, exerciseContentId]);

  // js-index-maps: O(1) lookups
  const exerciseById = useMemo(
    () => new Map(exercises.map((ex) => [ex.id, ex])),
    [exercises],
  );
  const contentById = useMemo(
    () => new Map(contents.map((c) => [c.id, c])),
    [contents],
  );

  const exercisesByTask = useMemo(() => {
    const grouped = new Map<string, typeof assignedExercises>();
    for (const item of assignedExercises) {
      const current = grouped.get(item.sessionContentId) ?? [];
      current.push(item);
      grouped.set(item.sessionContentId, current);
    }
    return grouped;
  }, [assignedExercises]);

  const onCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId || !taskName) return;

    await sileo.promise(
      createTaskMutation.mutateAsync({
        tenantId,
        sessionId: id,
        taskName,
        notes: taskNotes || undefined,
        customDurationMinutes: taskDuration ? Number(taskDuration) : undefined,
      }),
      {
        loading: { title: "Creando tarea" },
        success: { title: "Tarea creada" },
        error: (error: unknown) => ({
          title: "Error al crear tarea",
          description: error instanceof Error ? error.message : "No se pudo crear la tarea.",
        }),
      },
    );

    setTaskName("");
    setTaskDuration("");
    setTaskNotes("");
  };

  const onAssignExercise = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId || !exerciseTaskId || !exerciseId) return;

    await sileo.promise(
      createSessionExerciseMutation.mutateAsync({
        tenantId,
        sessionId: id,
        sessionContentId: exerciseTaskId,
        exerciseId,
      }),
      {
        loading: { title: "Agregando ejercicio" },
        success: { title: "Ejercicio agregado" },
        error: (error: unknown) => ({
          title: "Error al agregar ejercicio",
          description: error instanceof Error ? error.message : "No se pudo agregar el ejercicio.",
        }),
      },
    );

    setExerciseContentId("");
    setExerciseId("");
  };

  const onDownloadFieldSheet = async () => {
    if (!API_BASE_URL) return;
    const token = getAccessToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/api/training-sessions/${id}/field-sheet.pdf`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      sileo.error({ title: "No se pudo exportar PDF" });
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hoja-campo-${session?.date ?? "sesion"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const onDeleteSession = async () => {
    const ok = window.confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.");
    if (!ok) return;

    await sileo.promise(deleteSessionMutation.mutateAsync(id), {
      loading: { title: "Eliminando sesión" },
      success: { title: "Sesión eliminada" },
      error: (error: unknown) => ({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : undefined,
      }),
    });

    router.push("/training-sessions");
  };

  const onStartEditInfo = () => {
    if (!session) return;
    setEditTitle(session.title ?? "");
    setEditDate(toDateInputValue(session.date));
    setEditStartTime(toDateTimeLocalValue(session.startTime));
    setEditEndTime(toDateTimeLocalValue(session.endTime));
    setEditLocation(session.location ?? "");
    setEditNotes(session.notes ?? "");
    setEditStatus(session.status ?? "DRAFT");
    setEditContentIds(session.trainingContentIds ?? []);
    setIsEditingInfo(true);
  };

  const toggleEditContent = (contentId: string) => {
    setEditContentIds((current) =>
      current.includes(contentId)
        ? current.filter((id) => id !== contentId)
        : [...current, contentId],
    );
  };

  const onSaveInfo = async (event: FormEvent) => {
    event.preventDefault();

    if (!editTitle || !editDate || !editStartTime || !editEndTime) {
      sileo.error({
        title: "Faltan datos",
        description: "Completa título, fecha, hora de inicio y hora de fin.",
      });
      return;
    }

    if (editContentIds.length === 0) {
      sileo.error({
        title: "Faltan contenidos",
        description: "Selecciona al menos un contenido para la sesión.",
      });
      return;
    }

    await sileo.promise(
      updateSessionMutation.mutateAsync({
        id,
        payload: {
          title: editTitle,
          trainingContentIds: editContentIds,
          date: editDate,
          startTime: new Date(editStartTime).toISOString(),
          endTime: new Date(editEndTime).toISOString(),
          location: editLocation || undefined,
          notes: editNotes || undefined,
          status: editStatus,
        },
      }),
      {
        loading: { title: "Actualizando sesión" },
        success: { title: "Sesión actualizada" },
        error: (error: unknown) => ({
          title: "Error al actualizar",
          description: error instanceof Error ? error.message : "No se pudo actualizar la sesión.",
        }),
      },
    );

    setIsEditingInfo(false);
  };

  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Cargando sesión...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>No se encontró la sesión.</p>
        <Link href="/training-sessions" className="text-primary underline-offset-4 hover:underline">
          Volver a sesiones
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[session.status ?? "DRAFT"] ?? STATUS_LABELS.DRAFT;

  const tabs: { id: Tab; label: string }[] = [
    { id: "info", label: "Información" },
    { id: "tasks", label: `Tareas${tasks.length > 0 ? ` (${tasks.length})` : ""}` },
    { id: "structure", label: "Estructura" },
  ];

  return (
    <section className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav aria-label="Ruta de navegación" className="mb-1.5">
            <Link
              href="/training-sessions"
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              ← Sesiones de entrenamiento
            </Link>
          </nav>
          <h1 className="text-2xl font-semibold text-foreground">{session.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={session.date}>
              {new Date(session.date).toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden>·</span>
            <span>
              {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(session.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {session.location ? (
              <>
                <span aria-hidden>·</span>
                <span>{session.location}</span>
              </>
            ) : null}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDownloadFieldSheet}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            Exportar hoja de campo (PDF)
          </button>
          <button
            type="button"
            onClick={onDeleteSession}
            disabled={deleteSessionMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            {deleteSessionMutation.isPending ? "Eliminando..." : "Eliminar sesión"}
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Pestañas de la sesión" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Información */}
      {activeTab === "info" ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">Detalles de la sesión</h2>
            {isEditingInfo ? (
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartEditInfo}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
              >
                Editar información
              </button>
            )}
          </div>

          {isEditingInfo ? (
            <form onSubmit={onSaveInfo} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelTextClass}>Título <span className="text-red-500">*</span></span>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Fecha <span className="text-red-500">*</span></span>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <div className="sm:col-span-2">
                  <span className={`${labelTextClass} mb-2 block`}>
                    Contenidos de la sesión <span className="text-red-500">*</span>
                  </span>
                  {contents.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                      No hay contenidos disponibles para asignar.
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {contents.map((content) => {
                        const checked = editContentIds.includes(content.id);
                        return (
                          <label
                            key={content.id}
                            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                              checked
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEditContent(content.id)}
                              className="h-4 w-4"
                            />
                            <span className="truncate">{content.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <label className={labelClass}>
                  <span className={labelTextClass}>Hora de inicio <span className="text-red-500">*</span></span>
                  <input
                    type="datetime-local"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Hora de fin <span className="text-red-500">*</span></span>
                  <input
                    type="datetime-local"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Ubicación</span>
                  <input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Estado</span>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "DRAFT" | "PLANNED" | "COMPLETED" | "CANCELLED")}
                    className={inputClass}
                  >
                    <option value="DRAFT">Borrador</option>
                    <option value="PLANNED">Planificada</option>
                    <option value="COMPLETED">Completada</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  <span className={labelTextClass}>Notas</span>
                  <input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateSessionMutation.isPending}
                  className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {updateSessionMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Fecha</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {new Date(session.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Horario</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" – "}
                  {new Date(session.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </dd>
              </div>
              {session.location ? (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Ubicación</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{session.location}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Estado</dt>
                <dd className="mt-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Tareas planificadas</dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {tasks.length} {tasks.length === 1 ? "tarea" : "tareas"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Contenidos asignados a la sesión</dt>
                <dd className="mt-1 flex flex-wrap gap-2 text-sm text-foreground">
                  {assignedContentIds.length === 0
                    ? "Sin contenidos asignados"
                    : assignedContentIds.map((contentId) => (
                        <span
                          key={contentId}
                          className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs"
                        >
                          {contentById.get(contentId)?.name ?? "Contenido"}
                        </span>
                      ))}
                </dd>
              </div>
              {session.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Notas</dt>
                  <dd className="mt-0.5 text-sm text-foreground">{session.notes}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>
      ) : null}

      {/* Tab: Tareas */}
      {activeTab === "tasks" ? (
        <div className="space-y-4">
          {/* Formulario nueva tarea */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-card-foreground">Agregar tarea</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Las tareas organizan los ejercicios de la sesión (ej: Calentamiento, Bloque técnico, Vuelta a la calma).
            </p>
            <form onSubmit={onCreateTask} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className={labelClass}>
                  <span className={labelTextClass}>
                    Nombre de la tarea <span className="text-red-500" aria-label="obligatorio">*</span>
                  </span>
                  <input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="Ej: Calentamiento"
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Duración (minutos)</span>
                  <input
                    type="number"
                    min={0}
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(e.target.value)}
                    placeholder="Ej: 20"
                    className={inputClass}
                  />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>Notas</span>
                  <input
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder="Ej: Enfocarse en velocidad de reacción"
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {createTaskMutation.isPending ? "Guardando..." : "Agregar tarea"}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de tareas */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-card-foreground">Tareas de la sesión</h2>
            {tasks.length === 0 ? (
              <div className="mt-4 flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                No hay tareas aún. Agrega la primera arriba.
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {tasks.map((task, idx) => {
                  const contentName = contentById.get(task.trainingContentId ?? "")?.name;
                  return (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{task.taskName}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.customDurationMinutes ? `${task.customDurationMinutes} min` : "Sin duración"}
                            {contentName ? ` · ${contentName}` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = window.confirm(`¿Eliminar la tarea "${task.taskName}"?`);
                          if (!ok) return;
                          await deleteTaskMutation.mutateAsync(task.id);
                        }}
                        className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {/* Tab: Estructura */}
      {activeTab === "structure" ? (
        <div className="space-y-4">
          {/* Asignar ejercicio a tarea */}
          {tasks.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-card-foreground">Asignar ejercicio a tarea</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Elige una tarea y el ejercicio que deseas agregarle.
              </p>
              <form onSubmit={onAssignExercise} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className={labelClass}>
                    <span className={labelTextClass}>
                      Tarea <span className="text-red-500" aria-label="obligatorio">*</span>
                    </span>
                    <select
                      value={exerciseTaskId}
                      onChange={(e) => {
                        setExerciseTaskId(e.target.value);
                        setExerciseContentId("");
                        setExerciseId("");
                      }}
                      className={inputClass}
                    >
                      <option value="">Selecciona una tarea</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.taskName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className={labelTextClass}>
                      Contenido <span className="text-red-500" aria-label="obligatorio">*</span>
                    </span>
                    <select
                      value={exerciseContentId}
                      onChange={(e) => {
                        setExerciseContentId(e.target.value);
                        setExerciseId("");
                      }}
                      disabled={!exerciseTaskId}
                      className={inputClass}
                    >
                      <option value="">Selecciona un contenido</option>
                      {availableContents.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className={labelTextClass}>
                      Ejercicio <span className="text-red-500" aria-label="obligatorio">*</span>
                    </span>
                    <select
                      value={exerciseId}
                      onChange={(e) => setExerciseId(e.target.value)}
                      disabled={!exerciseContentId}
                      className={inputClass}
                    >
                      <option value="">Selecciona un ejercicio</option>
                      {availableExercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={createSessionExerciseMutation.isPending}
                    className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {createSessionExerciseMutation.isPending ? "Asignando..." : "Asignar ejercicio"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Primero agrega tareas en la pestaña{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Tareas
                </button>{" "}
                para poder asignar ejercicios.
              </p>
            </div>
          )}

          {/* Builder visual */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-card-foreground">Estructura de la sesión</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Vista completa con tareas y ejercicios asignados.
                </p>
              </div>
              {tasks.length > 0 ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {tasks.length} {tasks.length === 1 ? "tarea" : "tareas"}
                </span>
              ) : null}
            </div>

            {tasks.length === 0 ? (
              <div className="mt-4 flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                Agrega tareas para comenzar a construir la estructura.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {tasks.map((task, idx) => {
                  const taskExercises = exercisesByTask.get(task.id) ?? [];
                  const contentName = contentById.get(task.trainingContentId ?? "")?.name;

                  return (
                    <div key={task.id} className="rounded-lg border border-border bg-background">
                      {/* Cabecera de tarea */}
                      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{task.taskName}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.customDurationMinutes ? `${task.customDurationMinutes} min` : "Sin duración"}
                              {contentName ? ` · ${contentName}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {taskExercises.length} {taskExercises.length === 1 ? "ejercicio" : "ejercicios"}
                        </span>
                      </div>

                      {/* Ejercicios de la tarea */}
                      <div className="p-3">
                        {taskExercises.length === 0 ? (
                          <p className="py-2 text-center text-xs text-muted-foreground">
                            Sin ejercicios asignados a esta tarea.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {taskExercises.map((assignment) => {
                              const exercise = exerciseById.get(assignment.exerciseId);
                              return (
                                <li
                                  key={assignment.id}
                                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                      {exercise?.name ?? "Ejercicio"}
                                    </p>
                                    {assignment.tacticalPreviewUrlSnapshot ? (
                                      <p className="mt-0.5 text-xs text-muted-foreground">Vista previa disponible</p>
                                    ) : (
                                      <p className="mt-0.5 text-xs text-muted-foreground">Sin vista previa táctica</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await deleteSessionExerciseMutation.mutateAsync(assignment.id);
                                    }}
                                    className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                  >
                                    Quitar
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
