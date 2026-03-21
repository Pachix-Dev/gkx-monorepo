"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import {
  useCreateTrainingLineMutation,
  useDeleteTrainingLineMutation,
  useTrainingLinesQuery,
  useUpdateTrainingLineMutation,
} from "@/features/training-lines/hooks/use-training-lines";
import {
  createTrainingLineSchema,
  CreateTrainingLineFormValues,
  updateTrainingLineSchema,
  UpdateTrainingLineFormValues,
} from "@/features/training-lines/schemas/training-line-form";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

type FormMode = "create" | "edit";

export function TrainingLinesClient() {
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;
  const trainingLinesQuery = useTrainingLinesQuery();
  const createMutation = useCreateTrainingLineMutation();
  const updateMutation = useUpdateTrainingLineMutation();
  const deleteMutation = useDeleteTrainingLineMutation();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const createForm = useForm<CreateTrainingLineFormValues>({
    resolver: zodResolver(createTrainingLineSchema),
    defaultValues: {
      tenantId: tenantId || "",
      name: "",
      description: "",
    },
  });

  const editForm = useForm<UpdateTrainingLineFormValues>({
    resolver: zodResolver(updateTrainingLineSchema),
    defaultValues: {
      tenantId: tenantId || "",
      name: "",
      description: "",
    },
  });

  const activeForm = formMode === "create" ? createForm : editForm;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const trainingLines = useMemo(() => trainingLinesQuery.data ?? [], [trainingLinesQuery.data]);

  const filteredTrainingLines = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return trainingLines;

    return trainingLines.filter((item) => {
      const name = item.name.toLowerCase();
      const description = item.description?.toLowerCase() ?? "";
      return name.includes(value) || description.includes(value);
    });
  }, [search, trainingLines]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    createForm.reset({
      tenantId: tenantId || "",
      name: "",
      description: "",
    });
    setIsFormOpen(true);
  };

  const openEdit = (id: string) => {
    const target = trainingLines.find((item) => item.id === id);
    if (!target) return;

    setFormMode("edit");
    setEditingId(id);
    editForm.reset({
      tenantId: target.tenantId || tenantId || "",
      name: target.name,
      description: target.description || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const normalizePayload = (values: CreateTrainingLineFormValues | UpdateTrainingLineFormValues) => ({
    ...values,
    description: values.description || undefined,
  });

  const onCreateSubmit = async (values: CreateTrainingLineFormValues) => {
    await sileo.promise(createMutation.mutateAsync(normalizePayload(values)), {
      loading: { title: "Creando training line" },
      success: { title: "Training line creada", description: values.name },
      error: (error: unknown) => ({
        title: "Error al crear training line",
        description: error instanceof Error ? error.message : "No se pudo crear la training line.",
      }),
    });

    closeForm();
  };

  const onEditSubmit = async (values: UpdateTrainingLineFormValues) => {
    if (!editingId) return;

    await sileo.promise(updateMutation.mutateAsync({ id: editingId, payload: normalizePayload(values) }), {
      loading: { title: "Actualizando training line" },
      success: { title: "Training line actualizada", description: values.name },
      error: (error: unknown) => ({
        title: "Error al actualizar training line",
        description: error instanceof Error ? error.message : "No se pudo actualizar la training line.",
      }),
    });

    closeForm();
  };

  const onSubmitForm = async (values: CreateTrainingLineFormValues) => {
    if (formMode === "create") {
      await onCreateSubmit(values);
      return;
    }

    await onEditSubmit(values);
  };

  const onDelete = async (id: string, name: string) => {
    const ok = window.confirm(`Eliminar training line ${name}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando training line" },
      success: { title: "Training line eliminada", description: name },
      error: (error: unknown) => ({
        title: "Error al eliminar training line",
        description: error instanceof Error ? error.message : "No se pudo eliminar la training line.",
      }),
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-70 flex-1 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar por nombre o descripcion"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Nueva training line
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">{formMode === "edit" ? "Editar training line" : "Crear training line"}</h3>
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
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tenant ID</span>
              <input
                {...activeForm.register("tenantId")}
                disabled={Boolean(tenantId)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
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
                {isSaving ? "Guardando..." : formMode === "create" ? "Crear training line" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {trainingLinesQuery.isLoading ? <p className="p-5 text-sm text-muted-foreground">Cargando training lines...</p> : null}
        {trainingLinesQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{trainingLinesQuery.error.message}</p> : null}

        {!trainingLinesQuery.isLoading && !(trainingLinesQuery.error instanceof Error) ? (
          filteredTrainingLines.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay training lines para los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-foreground">Descripcion</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrainingLines.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3 text-card-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.description || "-"}</td>
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
