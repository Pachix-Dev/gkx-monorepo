"use client";

import { useAuth } from "@/features/auth/use-auth";
import {
  useCreateTrainingSessionMutation,
  useTrainingSessionsQuery,
} from "@/features/training-sessions/hooks/use-training-sessions";
import { useTrainingContentsQuery } from "@/features/training-contents/hooks/use-training-contents";
import { DatePickerInput, DateTimePickerInput, formatDateYMD } from "@/components/ui/date-picker";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { sileo } from "sileo";

// vercel-react-best-practices:
// - rendering-hoist-jsx: static styles outside component
// - rerender-memo: memoize derived lists
// - rendering-conditional-render: ternary instead of &&

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-gray-100 text-gray-600" },
  PLANNED: { label: "Planificada", className: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Completada", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelada", className: "bg-red-100 text-red-600" },
};

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "flex flex-col gap-1";
const labelTextClass = "text-xs font-medium text-muted-foreground";

export function TrainingSessionsClient() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? "";

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDateValue, setSessionDateValue] = useState<Date | undefined>(undefined);
  const [startDateValue, setStartDateValue] = useState<Date | undefined>(undefined);
  const [startHour, setStartHour] = useState("");
  const [endDateValue, setEndDateValue] = useState<Date | undefined>(undefined);
  const [endHour, setEndHour] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);

  const sessionsQuery = useTrainingSessionsQuery();
  const contentsQuery = useTrainingContentsQuery({});
  const createSessionMutation = useCreateTrainingSessionMutation();

  // rerender-memo: memoize derived list
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data]);
  const contents = useMemo(() => contentsQuery.data ?? [], [contentsQuery.data]);

  const toggleContent = (contentId: string) => {
    setSelectedContentIds((current) =>
      current.includes(contentId)
        ? current.filter((id) => id !== contentId)
        : [...current, contentId],
    );
  };

  const onCreateSession = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !tenantId ||
      !sessionTitle ||
      !sessionDateValue ||
      !startDateValue ||
      !startHour ||
      !endDateValue ||
      !endHour ||
      selectedContentIds.length === 0
    ) {
      sileo.error({
        title: "Faltan datos",
        description: "Completa título, contenidos, fecha, hora inicio y hora fin.",
      });
      return;
    }

    const sessionDate = formatDateYMD(sessionDateValue);
    const startIso = new Date(`${formatDateYMD(startDateValue)}T${startHour}:00`).toISOString();
    const endIso = new Date(`${formatDateYMD(endDateValue)}T${endHour}:00`).toISOString();

    await sileo.promise(
      createSessionMutation.mutateAsync({
        tenantId,
        title: sessionTitle,
        trainingContentIds: selectedContentIds,
        date: sessionDate,
        startTime: startIso,
        endTime: endIso,
        location: sessionLocation || undefined,
        notes: sessionNotes || undefined,
        status: "DRAFT",
      }),
      {
        loading: { title: "Creando sesión" },
        success: { title: "Sesión creada" },
        error: (error: unknown) => ({
          title: "Error al crear sesión",
          description: error instanceof Error ? error.message : "No se pudo crear la sesión.",
        }),
      },
    );

    setSessionTitle("");
    setSessionDateValue(undefined);
    setStartDateValue(undefined);
    setStartHour("");
    setEndDateValue(undefined);
    setEndHour("");
    setSessionLocation("");
    setSessionNotes("");
    setSelectedContentIds([]);
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sesiones de entrenamiento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea y gestiona sesiones. Haz clic en una sesión para ver su detalle y configurar tareas y ejercicios.
        </p>
      </div>

      {/* Formulario nueva sesión */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-card-foreground">Nueva sesión</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Completa los datos básicos de la sesión de entrenamiento.</p>
        <form onSubmit={onCreateSession} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelTextClass}>Título <span className="text-red-500">*</span></span>
              <input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Ej: Entrenamiento porteros U15"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Fecha <span className="text-red-500">*</span></span>
              <DatePickerInput
                value={sessionDateValue}
                onChange={setSessionDateValue}
                placeholder="Selecciona la fecha"
              />
            </label>
            <div className="sm:col-span-2">
              <span className={`${labelTextClass} mb-2 block`}>
                Contenidos de la sesión <span className="text-red-500">*</span>
              </span>
              {contents.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  No hay contenidos disponibles. Crea contenidos antes de crear la sesión.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {contents.map((content) => {
                    const checked = selectedContentIds.includes(content.id);
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
                          onChange={() => toggleContent(content.id)}
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
              <DateTimePickerInput
                dateValue={startDateValue}
                timeValue={startHour}
                onDateChange={setStartDateValue}
                onTimeChange={setStartHour}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Hora de fin <span className="text-red-500">*</span></span>
              <DateTimePickerInput
                dateValue={endDateValue}
                timeValue={endHour}
                onDateChange={setEndDateValue}
                onTimeChange={setEndHour}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Ubicación</span>
              <input
                value={sessionLocation}
                onChange={(e) => setSessionLocation(e.target.value)}
                placeholder="Ej: Cancha principal"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Notas</span>
              <input
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Ej: Llevar conos y mallas"
                className={inputClass}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createSessionMutation.isPending}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {createSessionMutation.isPending ? "Guardando..." : "Crear sesión"}
            </button>
          </div>
        </form>
      </div>

      {/* Grid de sesiones */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Sesiones creadas</h2>
        {sessions.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            No hay sesiones aún. Crea la primera arriba.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => {
              const statusInfo = STATUS_LABELS[session.status ?? "DRAFT"] ?? STATUS_LABELS.DRAFT;
              return (
                <li key={session.id}>
                  <Link
                    href={`/training-sessions/${session.id}`}
                    className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-card-foreground transition group-hover:text-primary">
                        {session.title}
                      </h3>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>
                        {new Date(session.date).toLocaleDateString("es-ES", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p>
                        {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" – "}
                        {new Date(session.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {session.location ? <p>{session.location}</p> : null}
                    </div>
                    <div className="mt-auto pt-3">
                      <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Ver detalle →
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
