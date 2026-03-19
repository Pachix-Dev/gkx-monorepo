"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import { useCoachesQuery } from "@/features/coaches/hooks/use-coaches";
import { useUsersQuery } from "@/features/users/hooks/use-users";
import {
  useAssignGoalkeeperMutation,
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useTeamsQuery,
  useUpdateTeamMutation,
} from "@/features/teams/hooks/use-teams";
import {
  assignGoalkeeperSchema,
  AssignGoalkeeperFormValues,
  createTeamSchema,
  CreateTeamFormValues,
  updateTeamSchema,
  UpdateTeamFormValues,
} from "@/features/teams/schemas/team-form";
import { getGoalkeepers } from "@/lib/api/goalkeepers";
import { queryKeys } from "@/lib/query/keys";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

type FormMode = "create" | "edit";

export function TeamsClient() {
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;
  const teamsQuery = useTeamsQuery();
  const coachesQuery = useCoachesQuery();
  const usersQuery = useUsersQuery();
  const goalkeepersQuery = useQuery({
    queryKey: queryKeys.goalkeepers,
    queryFn: getGoalkeepers,
  });
  const createMutation = useCreateTeamMutation();
  const updateMutation = useUpdateTeamMutation();
  const deleteMutation = useDeleteTeamMutation();
  const assignMutation = useAssignGoalkeeperMutation();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const createForm = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      tenantId: authUser?.tenantId || "",
      name: "",
      category: "",
      season: "",
      coachId: "",
    },
  });

  const editForm = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      tenantId: authUser?.tenantId || "",
      name: "",
      category: "",
      season: "",
      coachId: "",
    },
  });

  const assignForm = useForm<AssignGoalkeeperFormValues>({
    resolver: zodResolver(assignGoalkeeperSchema),
    defaultValues: {
      teamId: "",
      goalkeeperId: "",
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const coaches = useMemo(() => coachesQuery.data ?? [], [coachesQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const goalkeepers = useMemo(() => goalkeepersQuery.data ?? [], [goalkeepersQuery.data]);

  const tenantScopedUsers = useMemo(() => {
    if (!tenantId) return users;
    return users.filter((item) => item.tenantId === tenantId);
  }, [tenantId, users]);

  const tenantScopedCoaches = useMemo(() => {
    if (!tenantId) return coaches;
    return coaches.filter((item) => item.tenantId === tenantId);
  }, [tenantId, coaches]);

  const userById = useMemo(() => {
    return new Map(tenantScopedUsers.map((item) => [item.id, item]));
  }, [tenantScopedUsers]);

  const coachById = useMemo(() => {
    return new Map(tenantScopedCoaches.map((item) => [item.id, item]));
  }, [tenantScopedCoaches]);

  const tenantScopedGoalkeepers = useMemo(() => {
    if (!tenantId) return goalkeepers;
    return goalkeepers.filter((item) => item.tenantId === tenantId);
  }, [tenantId, goalkeepers]);

  const tenantScopedTeams = useMemo(() => {
    if (!tenantId) return teams;
    return teams.filter((item) => item.tenantId === tenantId);
  }, [tenantId, teams]);

  const filteredTeams = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return teams;

    return teams.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const category = item.category?.toLowerCase() ?? "";
      const season = item.season?.toLowerCase() ?? "";
      const coachId = item.coachId?.toLowerCase() ?? "";
      const coachProfile = item.coachId ? coachById.get(item.coachId) : undefined;
      const coachUser = coachProfile?.userId ? userById.get(coachProfile.userId) : undefined;
      const coachName = coachUser?.fullName?.toLowerCase() ?? "";
      return name.includes(value) || category.includes(value) || season.includes(value) || coachId.includes(value) || coachName.includes(value);
    });
  }, [search, teams, coachById, userById]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    createForm.reset({
      tenantId: authUser?.tenantId || "",
      name: "",
      category: "",
      season: "",
      coachId: "",
    });
    setIsFormOpen(true);
  };

  const openEdit = (id: string) => {
    const target = teams.find((item) => item.id === id);
    if (!target) return;

    setFormMode("edit");
    setEditingId(id);
    editForm.reset({
      tenantId: target.tenantId || authUser?.tenantId || "",
      name: target.name || "",
      category: target.category || "",
      season: target.season || "",
      coachId: target.coachId || "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const onCreateSubmit = async (values: CreateTeamFormValues) => {
    const payload = {
      ...values,
      category: values.category || undefined,
      season: values.season || undefined,
      coachId: values.coachId || undefined,
    };

    await sileo.promise(createMutation.mutateAsync(payload), {
      loading: { title: "Creando equipo" },
      success: { title: "Equipo creado", description: values.name },
      error: (error: unknown) => ({
        title: "Error al crear equipo",
        description: error instanceof Error ? error.message : "No se pudo crear el equipo.",
      }),
    });
    closeForm();
  };

  const onEditSubmit = async (values: UpdateTeamFormValues) => {
    if (!editingId) return;

    const payload = {
      ...values,
      category: values.category || undefined,
      season: values.season || undefined,
      coachId: values.coachId || undefined,
    };

    await sileo.promise(updateMutation.mutateAsync({ id: editingId, payload }), {
      loading: { title: "Actualizando equipo" },
      success: { title: "Equipo actualizado", description: values.name },
      error: (error: unknown) => ({
        title: "Error al actualizar equipo",
        description: error instanceof Error ? error.message : "No se pudo actualizar el equipo.",
      }),
    });
    closeForm();
  };

  const onDelete = async (id: string, name: string) => {
    const ok = window.confirm(`Eliminar equipo ${name}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando equipo" },
      success: { title: "Equipo eliminado", description: name },
      error: (error: unknown) => ({
        title: "Error al eliminar equipo",
        description: error instanceof Error ? error.message : "No se pudo eliminar el equipo.",
      }),
    });
  };

  const onAssignSubmit = async (values: AssignGoalkeeperFormValues) => {
    await sileo.promise(assignMutation.mutateAsync(values), {
      loading: { title: "Asignando portero" },
      success: { title: "Portero asignado", description: `Team ${values.teamId}` },
      error: (error: unknown) => ({
        title: "Error al asignar portero",
        description: error instanceof Error ? error.message : "No se pudo asignar el portero.",
      }),
    });
    assignForm.reset({ teamId: values.teamId, goalkeeperId: "" });
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
              placeholder="Filtrar por nombre, categoria, temporada o coachId"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Nuevo equipo
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">{formMode === "edit" ? "Editar equipo" : "Crear equipo"}</h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
            >
              Cerrar
            </button>
          </div>

          <form
            onSubmit={formMode === "create" ? createForm.handleSubmit(onCreateSubmit) : editForm.handleSubmit(onEditSubmit)}
            className="grid gap-3 md:grid-cols-2"
          >
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tenant ID</span>
              <input
                {...(formMode === "create" ? createForm.register("tenantId") : editForm.register("tenantId"))}
                disabled={Boolean(authUser?.tenantId)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Nombre</span>
              <input
                {...(formMode === "create" ? createForm.register("name") : editForm.register("name"))}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Coach ID</span>
              <select
                {...(formMode === "create" ? createForm.register("coachId") : editForm.register("coachId"))}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin coach</option>
                {tenantScopedCoaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {userById.get(coach.userId)?.fullName || coach.userId}
                    {coach.specialty ? ` - ${coach.specialty}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Categoria</span>
              <input
                {...(formMode === "create" ? createForm.register("category") : editForm.register("category"))}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Temporada</span>
              <input
                {...(formMode === "create" ? createForm.register("season") : editForm.register("season"))}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : formMode === "create" ? "Crear equipo" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Asignar portero a equipo</h3>
        <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            {...assignForm.register("teamId")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecciona equipo</option>
            {tenantScopedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            {...assignForm.register("goalkeeperId")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecciona portero</option>
            {tenantScopedGoalkeepers.map((goalkeeper) => (
              <option key={goalkeeper.id} value={goalkeeper.id}>
                {userById.get(goalkeeper.userId)?.fullName || goalkeeper.userId}
                {goalkeeper.category ? ` - ${goalkeeper.category}` : ""}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={assignMutation.isPending || goalkeepersQuery.isLoading || teamsQuery.isLoading}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-60"
          >
            {assignMutation.isPending ? "Asignando..." : "Asignar"}
          </button>
        </form>
        {coachesQuery.error instanceof Error ? <p className="mt-2 text-xs text-red-600">{coachesQuery.error.message}</p> : null}
        {usersQuery.error instanceof Error ? <p className="mt-2 text-xs text-red-600">{usersQuery.error.message}</p> : null}
        {goalkeepersQuery.error instanceof Error ? <p className="mt-2 text-xs text-red-600">{goalkeepersQuery.error.message}</p> : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {teamsQuery.isLoading ? <p className="p-5 text-sm text-muted-foreground">Cargando teams...</p> : null}
        {teamsQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{teamsQuery.error.message}</p> : null}

        {!teamsQuery.isLoading && !(teamsQuery.error instanceof Error) ? (
          filteredTeams.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay equipos para los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-foreground">Categoria</th>
                    <th className="px-4 py-3 font-medium text-foreground">Temporada</th>
                    <th className="px-4 py-3 font-medium text-foreground">Coach ID</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3 text-card-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.category || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.season || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.coachId
                          ? userById.get(coachById.get(item.coachId)?.userId || "")?.fullName || item.coachId
                          : "-"}
                      </td>
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
