"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { useAuth } from "@/features/auth/use-auth";
import {
  useExerciseQuery,
  useUpdateExerciseMutation,
} from "@/features/exercises/hooks/use-exercises";
import {
  updateExerciseSchema,
  UpdateExerciseFormValues,
} from "@/features/exercises/schemas/exercise-form";
import { useTrainingContentsQuery } from "@/features/training-contents/hooks/use-training-contents";
import { useTrainingLinesQuery } from "@/features/training-lines/hooks/use-training-lines";
import { TacticalEditorClient } from "@/features/tactical-editor/components/tactical-editor-client";
import type { EditorBackground, EditorShapeGroup } from "@/features/tactical-editor/server/get-editor-assets";

type Tab = "info" | "design";

type ExerciseDetailClientProps = {
  exerciseId: string;
  backgrounds: EditorBackground[];
  shapeGroups: EditorShapeGroup[];
};

export function ExerciseDetailClient({ exerciseId, backgrounds, shapeGroups }: ExerciseDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;

  const exerciseQuery = useExerciseQuery(exerciseId);
  const trainingLinesQuery = useTrainingLinesQuery();
  const trainingContentsQuery = useTrainingContentsQuery({});
  const updateMutation = useUpdateExerciseMutation();

  const exercise = exerciseQuery.data;
  const trainingLines = useMemo(() => trainingLinesQuery.data ?? [], [trainingLinesQuery.data]);
  const trainingContents = useMemo(() => trainingContentsQuery.data ?? [], [trainingContentsQuery.data]);

  const lineById = useMemo(() => {
    return new Map(trainingLines.map((item) => [item.id, item]));
  }, [trainingLines]);

  const form = useForm<UpdateExerciseFormValues>({
    resolver: zodResolver(updateExerciseSchema),
    values: exercise
      ? {
          tenantId: exercise.tenantId,
          trainingContentId: exercise.trainingContentId,
          name: exercise.name,
          description: exercise.description ?? "",
          instructions: exercise.instructions ?? "",
          objective: exercise.objective ?? "",
          durationMinutes: exercise.durationMinutes ?? undefined,
          repetitions: exercise.repetitions ?? undefined,
          restSeconds: exercise.restSeconds ?? undefined,
          equipment: exercise.equipment ?? "",
          videoUrl: exercise.videoUrl ?? "",
          difficulty: exercise.difficulty ?? "",
          order: exercise.order ?? undefined,
          status: exercise.status ?? "ACTIVE",
        }
      : undefined,
  });

  const onSave = async (values: UpdateExerciseFormValues) => {
    await sileo.promise(
      updateMutation.mutateAsync({ id: exerciseId, payload: values }),
      {
        loading: { title: "Guardando cambios" },
        success: { title: "Ejercicio actualizado", description: values.name },
        error: (error: unknown) => ({
          title: "Error al guardar",
          description: error instanceof Error ? error.message : "No se pudo actualizar el ejercicio.",
        }),
      },
    );
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Ejercicios
        </Link>

        <div className="flex-1 min-w-0">
          {exercise ? (
            <h1 className="text-xl font-semibold text-foreground truncate">{exercise.name}</h1>
          ) : (
            <div className="h-6 w-52 animate-pulse rounded-full bg-muted" />
          )}
        </div>

        {exercise?.status ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              exercise.status === "ACTIVE"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {exercise.status}
          </span>
        ) : null}
      </div>

      {/* Tabs */}      
      <div className="flex gap-1 rounded-xl border border-border bg-card p-1 w-fit shadow-sm">
          <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`rounded-lg px-3 py-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "info"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          >
          Información
          </button>
          <button
          type="button"
          onClick={() => setActiveTab("design")}
          className={`rounded-lg px-3 py-1 text-sm font-medium transition cursor-pointer ${
              activeTab === "design"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          >
          Diseño táctico
          </button>
      </div>        
      

      {/* Tab: Información */}
      {activeTab === "info" ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          {exerciseQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : exerciseQuery.error instanceof Error ? (
            <p className="text-sm text-red-600">{exerciseQuery.error.message}</p>
          ) : (
            <form onSubmit={form.handleSubmit(onSave)} className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Nombre *</span>
                <input
                  {...form.register("name")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
                {form.formState.errors.name ? (
                  <span className="text-xs text-red-500">{form.formState.errors.name.message}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Training Content</span>
                <select
                  {...form.register("trainingContentId")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary truncate w-full"
                >
                  <option value="">Selecciona content</option>
                  {trainingContents.map((item) => (
                    <option className="truncate whitespace-normal" key={item.id} value={item.id}>
                      {lineById.get(item.trainingLineId)?.name || "Linea"} — {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Descripción</span>
                <input
                  {...form.register("description")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Instrucciones</span>
                <textarea
                  {...form.register("instructions")}
                  rows={3}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Objetivo</span>
                <input
                  {...form.register("objective")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Duración (min)</span>
                <input
                  type="number"
                  {...form.register("durationMinutes", {
                    setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  })}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Repeticiones</span>
                <input
                  type="number"
                  {...form.register("repetitions", {
                    setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  })}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Descanso (seg)</span>
                <input
                  type="number"
                  {...form.register("restSeconds", {
                    setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  })}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Dificultad</span>
                <input
                  {...form.register("difficulty")}
                  placeholder="EASY / MEDIUM / HARD"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Equipment</span>
                <input
                  {...form.register("equipment")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Orden</span>
                <input
                  type="number"
                  {...form.register("order", {
                    setValueAs: (value) => (value === "" ? undefined : Number(value)),
                  })}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Video URL</span>
                <input
                  {...form.register("videoUrl")}
                  type="url"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Estado</span>
                <select
                  {...form.register("status")}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>

              <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="rounded-md bg-primary px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60 cursor-pointer"
                >
                    {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
  
              {tenantId ? (
                <input type="hidden" {...form.register("tenantId")} value={tenantId} />
              ) : null}              
            </form>
          )}
        </div>
      ) : null}

      {/* Tab: Diseño táctico */}
      {activeTab === "design" ? (
        <TacticalEditorClient
          backgrounds={backgrounds}
          shapeGroups={shapeGroups}
          exerciseId={exerciseId}
        />
      ) : null}
    </section>
  );
}
