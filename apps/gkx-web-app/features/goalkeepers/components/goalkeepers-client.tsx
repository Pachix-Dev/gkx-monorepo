"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import { useTeamsQuery } from "@/features/teams/hooks/use-teams";
import { useUsersQuery } from "@/features/users/hooks/use-users";
import {
  useCreateGoalkeeperMutation,
  useDeleteGoalkeeperMutation,
  useGoalkeepersQuery,
  useUpdateGoalkeeperMutation,
} from "@/features/goalkeepers/hooks/use-goalkeepers";
import {
  createGoalkeeperSchema,
  CreateGoalkeeperFormValues,
  updateGoalkeeperSchema,
  UpdateGoalkeeperFormValues,
} from "@/features/goalkeepers/schemas/goalkeeper-form";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

type FormMode = "create" | "edit";

export function GoalkeepersClient() {
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;
  const goalkeepersQuery = useGoalkeepersQuery();
  const usersQuery = useUsersQuery();
  const teamsQuery = useTeamsQuery();
  const createMutation = useCreateGoalkeeperMutation();
  const updateMutation = useUpdateGoalkeeperMutation();
  const deleteMutation = useDeleteGoalkeeperMutation();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const createForm = useForm<CreateGoalkeeperFormValues>({
    resolver: zodResolver(createGoalkeeperSchema),
    defaultValues: {
      tenantId: tenantId || "",
      userId: "",
      dateOfBirth: "",
      dominantHand: "",
      dominantFoot: "",
      height: undefined,
      weight: undefined,
      category: "",
      teamId: "",
      medicalNotes: "",
      parentContact: "",
    },
  });

  const editForm = useForm<UpdateGoalkeeperFormValues>({
    resolver: zodResolver(updateGoalkeeperSchema),
    defaultValues: {
      tenantId: tenantId || "",
      userId: "",
      dateOfBirth: "",
      dominantHand: "",
      dominantFoot: "",
      height: undefined,
      weight: undefined,
      category: "",
      teamId: "",
      medicalNotes: "",
      parentContact: "",
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const goalkeepers = useMemo(() => goalkeepersQuery.data ?? [], [goalkeepersQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const activeForm = formMode === "create" ? createForm : editForm;

  const tenantScopedGoalkeepers = useMemo(() => {
    if (!tenantId) return goalkeepers;
    return goalkeepers.filter((item) => item.tenantId === tenantId);
  }, [goalkeepers, tenantId]);

  const tenantScopedUsers = useMemo(() => {
    if (!tenantId) return users;
    return users.filter((item) => item.tenantId === tenantId);
  }, [tenantId, users]);

  const tenantScopedTeams = useMemo(() => {
    if (!tenantId) return teams;
    return teams.filter((item) => item.tenantId === tenantId);
  }, [teams, tenantId]);

  const goalkeeperCandidateUsers = useMemo(() => {
    return tenantScopedUsers.filter((item) => item.role === "GOALKEEPER");
  }, [tenantScopedUsers]);

  const linkedUserIds = useMemo(() => {
    return new Set(tenantScopedGoalkeepers.map((item) => item.userId));
  }, [tenantScopedGoalkeepers]);

  const editingGoalkeeperUserId = useMemo(() => {
    if (!editingId) return null;
    return tenantScopedGoalkeepers.find((item) => item.id === editingId)?.userId ?? null;
  }, [editingId, tenantScopedGoalkeepers]);

  const userById = useMemo(() => {
    return new Map(tenantScopedUsers.map((item) => [item.id, item]));
  }, [tenantScopedUsers]);

  const teamById = useMemo(() => {
    return new Map(tenantScopedTeams.map((item) => [item.id, item]));
  }, [tenantScopedTeams]);

  const filteredGoalkeepers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return goalkeepers;

    return goalkeepers.filter((item) => {
      const userId = item.userId.toLowerCase();
      const userName = userById.get(item.userId)?.fullName?.toLowerCase() ?? "";
      const email = userById.get(item.userId)?.email?.toLowerCase() ?? "";
      const category = item.category?.toLowerCase() ?? "";
      const teamName = item.teamId ? teamById.get(item.teamId)?.name?.toLowerCase() ?? "" : "";

      return userId.includes(value) || userName.includes(value) || email.includes(value) || category.includes(value) || teamName.includes(value);
    });
  }, [goalkeepers, search, teamById, userById]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    createForm.reset({
      tenantId: tenantId || "",
      userId: "",
      dateOfBirth: "",
      dominantHand: "",
      dominantFoot: "",
      height: undefined,
      weight: undefined,
      category: "",
      teamId: "",
      medicalNotes: "",
      parentContact: "",
    });
    setIsFormOpen(true);
  };

  const openEdit = (id: string) => {
    const target = goalkeepers.find((item) => item.id === id);
    if (!target) return;

    setFormMode("edit");
    setEditingId(id);
    editForm.reset({
      tenantId: target.tenantId || tenantId || "",
      userId: target.userId || "",
      dateOfBirth: target.dateOfBirth || "",
      dominantHand: target.dominantHand || "",
      dominantFoot: target.dominantFoot || "",
      height: target.height ?? undefined,
      weight: target.weight ?? undefined,
      category: target.category || "",
      teamId: target.teamId || "",
      medicalNotes: target.medicalNotes || "",
      parentContact: target.parentContact || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const normalizePayload = (values: CreateGoalkeeperFormValues | UpdateGoalkeeperFormValues) => {
    return {
      ...values,
      dateOfBirth: values.dateOfBirth || undefined,
      dominantHand: values.dominantHand || undefined,
      dominantFoot: values.dominantFoot || undefined,
      height: values.height,
      weight: values.weight,
      category: values.category || undefined,
      teamId: values.teamId || undefined,
      medicalNotes: values.medicalNotes || undefined,
      parentContact: values.parentContact || undefined,
    };
  };

  const onCreateSubmit = async (values: CreateGoalkeeperFormValues) => {
    await sileo.promise(createMutation.mutateAsync(normalizePayload(values)), {
      loading: { title: "Creando portero" },
      success: { title: "Portero creado", description: values.userId },
      error: (error: unknown) => ({
        title: "Error al crear portero",
        description: error instanceof Error ? error.message : "No se pudo crear el portero.",
      }),
    });
    closeForm();
  };

  const onEditSubmit = async (values: UpdateGoalkeeperFormValues) => {
    if (!editingId) return;

    await sileo.promise(updateMutation.mutateAsync({ id: editingId, payload: normalizePayload(values) }), {
      loading: { title: "Actualizando portero" },
      success: { title: "Portero actualizado", description: values.userId },
      error: (error: unknown) => ({
        title: "Error al actualizar portero",
        description: error instanceof Error ? error.message : "No se pudo actualizar el portero.",
      }),
    });
    closeForm();
  };

  const onSubmitForm = async (values: CreateGoalkeeperFormValues) => {
    if (formMode === "create") {
      await onCreateSubmit(values);
      return;
    }

    await onEditSubmit(values);
  };

  const onDelete = async (id: string, userId: string) => {
    const ok = window.confirm(`Eliminar portero ${userId}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando portero" },
      success: { title: "Portero eliminado", description: userId },
      error: (error: unknown) => ({
        title: "Error al eliminar portero",
        description: error instanceof Error ? error.message : "No se pudo eliminar el portero.",
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
              placeholder="Filtrar por usuario, equipo o categoria"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Nuevo portero
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">{formMode === "edit" ? "Editar portero" : "Crear portero"}</h3>
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
            <label className="flex flex-col gap-1">
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
                {goalkeeperCandidateUsers.map((user) => {
                  const alreadyLinked = linkedUserIds.has(user.id) && user.id !== editingGoalkeeperUserId;

                  return (
                    <option key={user.id} value={user.id} disabled={alreadyLinked}>
                      {user.fullName} - {user.email}{alreadyLinked ? " - ya vinculado" : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Categoria</span>
              <input
                {...activeForm.register("category")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Equipo</span>
              <select
                {...activeForm.register("teamId")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin equipo</option>
                {tenantScopedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Fecha de nacimiento</span>
              <input
                {...activeForm.register("dateOfBirth")}
                placeholder="YYYY-MM-DD"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Dominant hand</span>
              <input
                {...activeForm.register("dominantHand")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Dominant foot</span>
              <input
                {...activeForm.register("dominantFoot")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Height</span>
              <input
                type="number"
                {...activeForm.register("height", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Weight</span>
              <input
                type="number"
                {...activeForm.register("weight", {
                  setValueAs: (value) => (value === "" ? undefined : Number(value)),
                })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Medical notes</span>
              <input
                {...activeForm.register("medicalNotes")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Parent contact</span>
              <input
                {...activeForm.register("parentContact")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : formMode === "create" ? "Crear portero" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {goalkeepersQuery.isLoading ? <p className="p-5 text-sm text-muted-foreground">Cargando goalkeepers...</p> : null}
        {goalkeepersQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{goalkeepersQuery.error.message}</p> : null}
        {usersQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{usersQuery.error.message}</p> : null}
        {teamsQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{teamsQuery.error.message}</p> : null}

        {!goalkeepersQuery.isLoading && !(goalkeepersQuery.error instanceof Error) ? (
          filteredGoalkeepers.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay goalkeepers con los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Usuario</th>
                    <th className="px-4 py-3 font-medium text-foreground">Categoria</th>
                    <th className="px-4 py-3 font-medium text-foreground">Equipo</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoalkeepers.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3 text-card-foreground">{userById.get(item.userId)?.fullName || item.userId}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.category || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.teamId ? teamById.get(item.teamId)?.name || item.teamId : "-"}</td>
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
