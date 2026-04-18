"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import { useTeamsQuery } from "@/features/teams/hooks/use-teams";
import {
  useCreateGoalkeeperMutation,
  useDeleteGoalkeeperMutation,
  useGoalkeepersQuery,
  useUpdateGoalkeeperMutation,
  useUploadGoalkeeperAvatarMutation,
} from "@/features/goalkeepers/hooks/use-goalkeepers";
import {
  createGoalkeeperSchema,
  CreateGoalkeeperFormValues,
  updateGoalkeeperSchema,
  UpdateGoalkeeperFormValues,
} from "@/features/goalkeepers/schemas/goalkeeper-form";
import Image from "next/image";
import { useRef, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

type FormMode = "create" | "edit";

export function GoalkeepersClient() {
  const { user: authUser } = useAuth();
  const tenantId = authUser?.tenantId;
  const goalkeepersQuery = useGoalkeepersQuery();
  const teamsQuery = useTeamsQuery();
  const createMutation = useCreateGoalkeeperMutation();
  const updateMutation = useUpdateGoalkeeperMutation();
  const deleteMutation = useDeleteGoalkeeperMutation();
  const avatarMutation = useUploadGoalkeeperAvatarMutation();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploadId, setAvatarUploadId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const createForm = useForm<CreateGoalkeeperFormValues>({
    resolver: zodResolver(createGoalkeeperSchema),
    defaultValues: {
      tenantId: tenantId || "",
      name: "",
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
      name: "",
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
  const teams = useMemo(() => teamsQuery.data ?? [], [teamsQuery.data]);
  const activeForm = formMode === "create" ? createForm : editForm;

  const tenantScopedGoalkeepers = useMemo(() => {
    if (!tenantId) return goalkeepers;
    return goalkeepers.filter((item) => item.tenantId === tenantId);
  }, [goalkeepers, tenantId]);

  const tenantScopedTeams = useMemo(() => {
    if (!tenantId) return teams;
    return teams.filter((item) => item.tenantId === tenantId);
  }, [teams, tenantId]);

  const teamById = useMemo(() => {
    return new Map(tenantScopedTeams.map((item) => [item.id, item]));
  }, [tenantScopedTeams]);

  const filteredGoalkeepers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return tenantScopedGoalkeepers;

    return tenantScopedGoalkeepers.filter((item) => {
      const userId = item.userId.toLowerCase();
      const name = item.name?.toLowerCase() ?? "";
      const category = item.category?.toLowerCase() ?? "";
      const teamName = item.teamId ? teamById.get(item.teamId)?.name?.toLowerCase() ?? "" : "";

      return userId.includes(value) || name.includes(value) || category.includes(value) || teamName.includes(value);
    });
  }, [search, teamById, tenantScopedGoalkeepers]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    createForm.reset({
      tenantId: tenantId || "",
      name: "",
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
    setAvatarUploadId(id);
    editForm.reset({
      tenantId: target.tenantId || tenantId || "",
      name: target.name || "",
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
    setAvatarUploadId(null);
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

  const onAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !avatarUploadId) return;

    await sileo.promise(
      avatarMutation.mutateAsync({ id: avatarUploadId, file }),
      {
        loading: { title: "Subiendo avatar" },
        success: { title: "Avatar actualizado" },
        error: (error: unknown) => ({
          title: "Error al subir avatar",
          description:
            error instanceof Error ? error.message : "No se pudo subir el avatar.",
        }),
      },
    );
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const onCreateSubmit = async (values: CreateGoalkeeperFormValues) => {
    await sileo.promise(createMutation.mutateAsync(normalizePayload(values)), {
      loading: { title: "Creando portero" },
      success: { title: "Portero creado", description: values.name },
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
      success: { title: "Portero actualizado", description: values.name },
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

  const onDelete = async (id: string, goalkeeperName: string) => {
    const ok = window.confirm(`Eliminar portero ${goalkeeperName}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando portero" },
      success: { title: "Portero eliminado", description: goalkeeperName },
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
              placeholder="Filtrar por nombre, equipo o categoria"
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
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Nombre</span>
              <input
                {...activeForm.register("name")}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
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

            {formMode === "edit" && avatarUploadId ? (
              <div className="md:col-span-2 flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-4">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Avatar</span>
                {goalkeepers.find((g) => g.id === avatarUploadId)?.avatarUrl ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}${goalkeepers.find((g) => g.id === avatarUploadId)?.avatarUrl}`}
                    alt="Avatar"
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border text-xs text-muted-foreground">
                    Sin foto
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/webp,image/png,image/jpeg"
                  onChange={onAvatarChange}
                  disabled={avatarMutation.isPending}
                  className="text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground disabled:opacity-60"
                />
                {avatarMutation.isPending ? (
                  <p className="text-xs text-muted-foreground">Subiendo...</p>
                ) : null}
              </div>
            ) : null}

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
        {teamsQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{teamsQuery.error.message}</p> : null}

        {!goalkeepersQuery.isLoading && !(goalkeepersQuery.error instanceof Error) ? (
          filteredGoalkeepers.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay goalkeepers con los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-foreground">Categoria</th>
                    <th className="px-4 py-3 font-medium text-foreground">Equipo</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoalkeepers.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.avatarUrl ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_URL}${item.avatarUrl}`}
                              alt={item.name ?? "Avatar"}
                              width={32}
                              height={32}
                              unoptimized
                              className="h-8 w-8 rounded-full object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-xs text-muted-foreground">
                              {(item.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-card-foreground">{item.name || "-"}</span>
                        </div>
                      </td>
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
                            onClick={() => onDelete(item.id, item.name || item.userId)}
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
