"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import {
  useCreateTrainingContentMutation,
  useDeleteTrainingContentMutation,
  useTrainingContentsQuery,
  useUpdateTrainingContentMutation,
} from "@/features/training-contents/hooks/use-training-contents";
import {
  createTrainingContentSchema,
  CreateTrainingContentFormValues,
  updateTrainingContentSchema,
  UpdateTrainingContentFormValues,
} from "@/features/training-contents/schemas/training-content-form";
import { useTrainingLinesQuery } from "@/features/training-lines/hooks/use-training-lines";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

type FormMode = "create" | "edit";

export function TrainingContentsClient() {
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;
  const [search, setSearch] = useState("");
  const [lineFilter, setLineFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      trainingLineId: lineFilter || undefined,
      search: search.trim() || undefined,
    }),
    [lineFilter, search],
  );

  const trainingContentsQuery = useTrainingContentsQuery(filters);
  const trainingLinesQuery = useTrainingLinesQuery();
  const createMutation = useCreateTrainingContentMutation();
  const updateMutation = useUpdateTrainingContentMutation();
  const deleteMutation = useDeleteTrainingContentMutation();

  const createForm = useForm<CreateTrainingContentFormValues>({
    resolver: zodResolver(createTrainingContentSchema),
    defaultValues: {
      tenantId: tenantId || "",
      trainingLineId: "",
      name: "",
      description: "",
    },
  });

  const editForm = useForm<UpdateTrainingContentFormValues>({
    resolver: zodResolver(updateTrainingContentSchema),
    defaultValues: {
      tenantId: tenantId || "",
      trainingLineId: "",
      name: "",
      description: "",
    },
  });

  const activeForm = formMode === "create" ? createForm : editForm;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const trainingContents = useMemo(() => trainingContentsQuery.data ?? [], [trainingContentsQuery.data]);
  const trainingLines = useMemo(() => trainingLinesQuery.data ?? [], [trainingLinesQuery.data]);

  const lineById = useMemo(() => {
    return new Map(trainingLines.map((item) => [item.id, item]));
  }, [trainingLines]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    createForm.reset({
      tenantId: tenantId || "",
      trainingLineId: lineFilter || "",
      name: "",
      description: "",
    });
    setIsFormOpen(true);
  };

  const openEdit = (id: string) => {
    const target = trainingContents.find((item) => item.id === id);
    if (!target) return;

    setFormMode("edit");
    setEditingId(id);
    editForm.reset({
      tenantId: target.tenantId || tenantId || "",
      trainingLineId: target.trainingLineId,
      name: target.name,
      description: target.description || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const normalizePayload = (values: CreateTrainingContentFormValues | UpdateTrainingContentFormValues) => ({
    ...values,
    description: values.description || undefined,
  });

  const onCreateSubmit = async (values: CreateTrainingContentFormValues) => {
    await sileo.promise(createMutation.mutateAsync(normalizePayload(values)), {
      loading: { title: "Creando training content" },
      success: { title: "Training content creado", description: values.name },
      error: (error: unknown) => ({
        title: "Error al crear training content",
        description: error instanceof Error ? error.message : "No se pudo crear el training content.",
      }),
    });

    closeForm();
  };

  const onEditSubmit = async (values: UpdateTrainingContentFormValues) => {
    if (!editingId) return;

    await sileo.promise(updateMutation.mutateAsync({ id: editingId, payload: normalizePayload(values) }), {
      loading: { title: "Actualizando training content" },
      success: { title: "Training content actualizado", description: values.name },
      error: (error: unknown) => ({
        title: "Error al actualizar training content",
        description: error instanceof Error ? error.message : "No se pudo actualizar el training content.",
      }),
    });

    closeForm();
  };

  const onSubmitForm = async (values: CreateTrainingContentFormValues) => {
    if (formMode === "create") {
      await onCreateSubmit(values);
      return;
    }

    await onEditSubmit(values);
  };

  const onDelete = async (id: string, name: string) => {
    const ok = window.confirm(`Eliminar training content ${name}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando training content" },
      success: { title: "Training content eliminado", description: name },
      error: (error: unknown) => ({
        title: "Error al eliminar training content",
        description: error instanceof Error ? error.message : "No se pudo eliminar el training content.",
      }),
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Training line</span>
            <select
              value={lineFilter}
              onChange={(event) => setLineFilter(event.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todas</option>
              {trainingLines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Nuevo content
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">{formMode === "edit" ? "Editar training content" : "Crear training content"}</h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
            >
              Cerrar
            </button>
          </div>

          <form onSubmit={activeForm.handleSubmit(onSubmitForm)} className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Organización ID</span>
              <input
                {...activeForm.register("tenantId")}
                disabled={Boolean(tenantId)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Training line</span>
              <select
                {...activeForm.register("trainingLineId")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona training line</option>
                {trainingLines.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Nombre</span>
              <input
                {...activeForm.register("name")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Descripcion</span>
              <input
                {...activeForm.register("description")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : formMode === "create" ? "Crear content" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {trainingContentsQuery.isLoading ? <p className="p-5 text-sm text-muted-foreground">Cargando training contents...</p> : null}
        {trainingContentsQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{trainingContentsQuery.error.message}</p> : null}
        {trainingLinesQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{trainingLinesQuery.error.message}</p> : null}

        {!trainingContentsQuery.isLoading && !(trainingContentsQuery.error instanceof Error) ? (
          trainingContents.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay training contents para los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-foreground">Training line</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingContents.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3 text-card-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lineById.get(item.trainingLineId)?.name || item.trainingLineId}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item.id)}
                            className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
                          >
                            Editar
                          </button>
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
