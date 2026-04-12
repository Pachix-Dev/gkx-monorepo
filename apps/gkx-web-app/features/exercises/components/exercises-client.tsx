"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import {
  useCreateExerciseMutation,
  useDeleteExerciseMutation,
  useExercisesQuery,
} from "@/features/exercises/hooks/use-exercises";
import {
  createExerciseSchema,
  CreateExerciseFormValues,
} from "@/features/exercises/schemas/exercise-form";
import { useTrainingContentsQuery } from "@/features/training-contents/hooks/use-training-contents";
import { useTrainingLinesQuery } from "@/features/training-lines/hooks/use-training-lines";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

export function ExercisesClient() {
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [contentFilter, setContentFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const exerciseFilters = useMemo(
    () => ({
      trainingContentId: contentFilter || undefined,
      difficulty: difficultyFilter || undefined,
      search: search.trim() || undefined,
    }),
    [contentFilter, difficultyFilter, search],
  );

  const trainingLinesQuery = useTrainingLinesQuery();
  const trainingContentsQuery = useTrainingContentsQuery({});
  const exercisesQuery = useExercisesQuery(exerciseFilters);
  const createMutation = useCreateExerciseMutation();
  const deleteMutation = useDeleteExerciseMutation();

  const createForm = useForm<CreateExerciseFormValues>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: {
      tenantId: tenantId || "",
      trainingContentId: "",
      name: "",
      description: "",
      instructions: "",
      objective: "",      durationMinutes: undefined,
      repetitions: undefined,
      restSeconds: undefined,
      equipment: "",
      videoUrl: "",
      difficulty: "",
    },
  });

  const isSaving = createMutation.isPending;

  const trainingLines = useMemo(() => trainingLinesQuery.data ?? [], [trainingLinesQuery.data]);
  const trainingContents = useMemo(() => trainingContentsQuery.data ?? [], [trainingContentsQuery.data]);
  const exercises = useMemo(() => exercisesQuery.data ?? [], [exercisesQuery.data]);

  const lineById = useMemo(() => {
    return new Map(trainingLines.map((item) => [item.id, item]));
  }, [trainingLines]);

  const contentById = useMemo(() => {
    return new Map(trainingContents.map((item) => [item.id, item]));
  }, [trainingContents]);

  const openCreate = () => {
    createForm.reset({
      tenantId: tenantId || "",
      trainingContentId: contentFilter || "",
      name: "",
      description: "",
      instructions: "",
      objective: "",
      durationMinutes: undefined,
      repetitions: undefined,
      restSeconds: undefined,
      equipment: "",
      videoUrl: "",
      difficulty: difficultyFilter || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const normalizePayload = (values: CreateExerciseFormValues) => ({
    ...values,
    description: values.description || undefined,
    instructions: values.instructions || undefined,
    objective: values.objective || undefined,
    durationMinutes: values.durationMinutes,
    repetitions: values.repetitions,
    restSeconds: values.restSeconds,
    equipment: values.equipment || undefined,
    videoUrl: values.videoUrl || undefined,
    difficulty: values.difficulty || undefined,
  });

  const onCreateSubmit = async (values: CreateExerciseFormValues) => {
    const created = await sileo.promise(createMutation.mutateAsync(normalizePayload(values)), {
      loading: { title: "Creando ejercicio" },
      success: { title: "Ejercicio creado", description: values.name },
      error: (error: unknown) => ({
        title: "Error al crear ejercicio",
        description: error instanceof Error ? error.message : "No se pudo crear el ejercicio.",
      }),
    });

    if (created && typeof created === "object" && "id" in created) {
      router.push(`/exercises/${(created as { id: string }).id}`);
    }
  };

  const onDelete = async (id: string, name: string) => {
    const ok = window.confirm(`Eliminar ejercicio ${name}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando ejercicio" },
      success: { title: "Ejercicio eliminado", description: name },
      error: (error: unknown) => ({
        title: "Error al eliminar ejercicio",
        description: error instanceof Error ? error.message : "No se pudo eliminar el ejercicio.",
      }),
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_260px_180px_auto] md:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre u objetivo"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Training content</span>
            <select
              value={contentFilter}
              onChange={(event) => setContentFilter(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos</option>
              {trainingContents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Difficulty</span>
            <input
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              placeholder="MEDIUM"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Nuevo ejercicio
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">Nuevo ejercicio</h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Organización ID</span>
              <input
                {...createForm.register("tenantId")}
                disabled={Boolean(tenantId)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Training content</span>
              <select
                {...createForm.register("trainingContentId")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona content</option>
                {trainingContents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {lineById.get(item.trainingLineId)?.name || "Linea"} - {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Nombre</span>
              <input
                {...createForm.register("name")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Descripcion</span>
              <input
                {...createForm.register("description")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Instrucciones</span>
              <input
                {...createForm.register("instructions")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Objetivo</span>
              <input
                {...createForm.register("objective")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Duracion (min)</span>
              <input
                type="number"
                {...createForm.register("durationMinutes", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Repeticiones</span>
              <input
                type="number"
                {...createForm.register("repetitions", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Descanso (seg)</span>
              <input
                type="number"
                {...createForm.register("restSeconds", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Equipment</span>
              <input
                {...createForm.register("equipment")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Video URL</span>
              <input
                {...createForm.register("videoUrl")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Difficulty</span>
              <input
                {...createForm.register("difficulty")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
              >
                {isSaving ? "Creando..." : "Crear y diseñar ejercicio →"}
              </button>
            </div>            
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {exercisesQuery.isLoading ? <p className="p-5 text-sm text-muted-foreground">Cargando ejercicios...</p> : null}
        {exercisesQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{exercisesQuery.error.message}</p> : null}
        {trainingContentsQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{trainingContentsQuery.error.message}</p> : null}

        {!exercisesQuery.isLoading && !(exercisesQuery.error instanceof Error) ? (
          exercises.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay ejercicios para los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-foreground">Content</th>
                    <th className="px-4 py-3 font-medium text-foreground">Difficulty</th>
                    <th className="px-4 py-3 font-medium text-foreground">Duracion</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/30 transition">
                      <td className="px-4 py-3">
                        <Link href={`/exercises/${item.id}`} className="font-medium text-foreground hover:text-primary transition">
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{contentById.get(item.trainingContentId)?.name || item.trainingContentId}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.difficulty || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.durationMinutes ?? "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/exercises/${item.id}`}
                            className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted transition"
                          >
                            Abrir
                          </Link>
                          <button
                            type="button"
                            onClick={() => onDelete(item.id, item.name)}
                            className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
