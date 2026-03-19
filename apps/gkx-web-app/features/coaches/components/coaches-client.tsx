"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import {
  useCoachesQuery,
  useCreateCoachMutation,
  useDeleteCoachMutation,
  useUpdateCoachMutation,
} from "@/features/coaches/hooks/use-coaches";
import { useUsersQuery } from "@/features/users/hooks/use-users";
import {
  createCoachSchema,
  CreateCoachFormValues,
  updateCoachSchema,
  UpdateCoachFormValues,
} from "@/features/coaches/schemas/coach-form";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

type FormMode = "create" | "edit";

export function CoachesClient() {
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;
  const coachesQuery = useCoachesQuery();
  const usersQuery = useUsersQuery();
  const createMutation = useCreateCoachMutation();
  const updateMutation = useUpdateCoachMutation();
  const deleteMutation = useDeleteCoachMutation();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const createForm = useForm<CreateCoachFormValues>({
    resolver: zodResolver(createCoachSchema),
    defaultValues: {
      tenantId: authUser?.tenantId || "",
      userId: "",
      specialty: "",
      licenseLevel: "",
      experienceYears: undefined,
    },
  });

  const editForm = useForm<UpdateCoachFormValues>({
    resolver: zodResolver(updateCoachSchema),
    defaultValues: {
      tenantId: authUser?.tenantId || "",
      userId: "",
      specialty: "",
      licenseLevel: "",
      experienceYears: undefined,
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const coaches = useMemo(() => coachesQuery.data ?? [], [coachesQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const activeForm = formMode === "create" ? createForm : editForm;

  const tenantScopedUsers = useMemo(() => {
    if (!tenantId) return users;
    return users.filter((item) => item.tenantId === tenantId);
  }, [tenantId, users]);

  const tenantScopedCoaches = useMemo(() => {
    if (!tenantId) return coaches;
    return coaches.filter((item) => item.tenantId === tenantId);
  }, [tenantId, coaches]);

  const linkedUserIds = useMemo(() => {
    return new Set(tenantScopedCoaches.map((item) => item.userId));
  }, [tenantScopedCoaches]);

  const editingCoachUserId = useMemo(() => {
    if (!editingId) return null;
    return tenantScopedCoaches.find((item) => item.id === editingId)?.userId ?? null;
  }, [editingId, tenantScopedCoaches]);

  const coachCandidateUsers = useMemo(() => {
    return tenantScopedUsers.filter((item) => item.role === "COACH" || item.role === "ASSISTANT_COACH");
  }, [tenantScopedUsers]);

  const userById = useMemo(() => {
    return new Map(users.map((item) => [item.id, item]));
  }, [users]);

  const filteredCoaches = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return coaches;

    return coaches.filter((item) => {
      const userId = item.userId?.toLowerCase() ?? "";
      const userName = userById.get(item.userId)?.fullName?.toLowerCase() ?? "";
      const email = userById.get(item.userId)?.email?.toLowerCase() ?? "";
      const specialty = item.specialty?.toLowerCase() ?? "";
      const license = item.licenseLevel?.toLowerCase() ?? "";
      return userId.includes(value) || userName.includes(value) || email.includes(value) || specialty.includes(value) || license.includes(value);
    });
  }, [coaches, search, userById]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    createForm.reset({
      tenantId: authUser?.tenantId || "",
      userId: "",
      specialty: "",
      licenseLevel: "",
      experienceYears: undefined,
    });
    setIsFormOpen(true);
  };

  const openEdit = (id: string) => {
    const target = coaches.find((item) => item.id === id);
    if (!target) return;

    setFormMode("edit");
    setEditingId(id);
    editForm.reset({
      tenantId: target.tenantId || authUser?.tenantId || "",
      userId: target.userId || "",
      specialty: target.specialty || "",
      licenseLevel: target.licenseLevel || "",
      experienceYears: target.experienceYears ?? undefined,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const onCreateSubmit = async (values: CreateCoachFormValues) => {
    const payload = {
      ...values,
      specialty: values.specialty || undefined,
      licenseLevel: values.licenseLevel || undefined,
      experienceYears: values.experienceYears,
    };

    await sileo.promise(createMutation.mutateAsync(payload), {
      loading: { title: "Creando coach" },
      success: { title: "Coach creado", description: userById.get(values.userId)?.fullName || values.userId },
      error: (error: unknown) => ({
        title: "Error al crear coach",
        description: error instanceof Error ? error.message : "No se pudo crear el coach.",
      }),
    });
    closeForm();
  };

  const onEditSubmit = async (values: UpdateCoachFormValues) => {
    if (!editingId) return;

    const payload = {
      ...values,
      specialty: values.specialty || undefined,
      licenseLevel: values.licenseLevel || undefined,
      experienceYears: values.experienceYears,
    };

    await sileo.promise(updateMutation.mutateAsync({ id: editingId, payload }), {
      loading: { title: "Actualizando coach" },
      success: { title: "Coach actualizado", description: userById.get(values.userId)?.fullName || values.userId },
      error: (error: unknown) => ({
        title: "Error al actualizar coach",
        description: error instanceof Error ? error.message : "No se pudo actualizar el coach.",
      }),
    });
    closeForm();
  };

  const onSubmitForm = async (values: CreateCoachFormValues) => {
    if (formMode === "create") {
      await onCreateSubmit(values);
      return;
    }

    await onEditSubmit(values);
  };

  const onDelete = async (id: string, userId: string) => {
    const userLabel = userById.get(userId)?.fullName || userId;
    const ok = window.confirm(`Eliminar coach ${userLabel}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando coach" },
      success: { title: "Coach eliminado", description: userLabel },
      error: (error: unknown) => ({
        title: "Error al eliminar coach",
        description: error instanceof Error ? error.message : "No se pudo eliminar el coach.",
      }),
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-55 flex-1 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar por userId, especialidad o licencia"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Nuevo coach
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">{formMode === "edit" ? "Editar coach" : "Crear coach"}</h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
            >
              Cerrar
            </button>
          </div>

          <form
            onSubmit={activeForm.handleSubmit(onSubmitForm)}
            className="grid gap-3 md:grid-cols-2"
          >
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tenant ID</span>
              <input
                {...activeForm.register("tenantId")}
                disabled={Boolean(tenantId)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Usuario</span>
              <select
                {...activeForm.register("userId")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona usuario</option>
                {coachCandidateUsers.map((user) => {
                  const alreadyLinked = linkedUserIds.has(user.id) && user.id !== editingCoachUserId;

                  return (
                    <option key={user.id} value={user.id} disabled={alreadyLinked}>
                      {user.fullName} - {user.email} ({user.role}){alreadyLinked ? " - ya vinculado" : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Especialidad</span>
              <input
                {...activeForm.register("specialty")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Licencia</span>
              <input
                {...activeForm.register("licenseLevel")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Anios experiencia</span>
              <input
                type="number"
                {...activeForm.register("experienceYears", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : formMode === "create" ? "Crear coach" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {coachesQuery.isLoading ? <p className="p-5 text-sm text-muted-foreground">Cargando coaches...</p> : null}
        {coachesQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{coachesQuery.error.message}</p> : null}
        {usersQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{usersQuery.error.message}</p> : null}

        {!coachesQuery.isLoading && !(coachesQuery.error instanceof Error) ? (
          filteredCoaches.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay coaches para los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Usuario</th>
                    <th className="px-4 py-3 font-medium text-foreground">Email</th>
                    <th className="px-4 py-3 font-medium text-foreground">Especialidad</th>
                    <th className="px-4 py-3 font-medium text-foreground">Licencia</th>
                    <th className="px-4 py-3 font-medium text-foreground">Experiencia</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoaches.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3 text-card-foreground">{userById.get(item.userId)?.fullName || item.userId}</td>
                      <td className="px-4 py-3 text-muted-foreground">{userById.get(item.userId)?.email || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.specialty || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.licenseLevel || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.experienceYears ?? "-"}</td>
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
                            onClick={() => onDelete(item.id, item.userId)}
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
