"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/features/auth/use-auth";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/hooks/use-users";
import { createUserSchema, CreateUserFormValues, updateUserSchema, UpdateUserFormValues } from "@/features/users/schemas/user-form";
import { UserRole } from "@/lib/auth/types";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { sileo } from "sileo";

const roleOptions: UserRole[] = [  
  "TENANT_ADMIN",
  "COACH",
  "ASSISTANT_COACH",
  "GOALKEEPER",
  "PARENT",
  "READONLY",
];

const statusOptions = ["ACTIVE", "INACTIVE"] as const;

type FormMode = "create" | "edit";

export function UsersClient() {
  const { user: authUser } = useAuth();
  const usersQuery = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"fullName" | "email" | "role" | "status">("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      tenantId: authUser?.tenantId || "",
      fullName: "",
      email: "",
      password: "",
      role: "COACH",
      status: "ACTIVE",
    },
  });

  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      tenantId: authUser?.tenantId || "",
      fullName: "",
      email: "",
      role: "COACH",
      status: "ACTIVE",
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((item) => {
      const fullName = item.fullName?.toLowerCase() ?? "";
      const email = item.email?.toLowerCase() ?? "";

      const bySearch = normalizedSearch.length === 0 || fullName.includes(normalizedSearch) || email.includes(normalizedSearch);
      const byRole = roleFilter === "ALL" || item.role === roleFilter;
      const byStatus = statusFilter === "ALL" || item.status === statusFilter;

      return bySearch && byRole && byStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const sortedUsers = useMemo(() => {
    const items = [...filteredUsers];
    items.sort((a, b) => {
      const left = (a[sortBy] || "").toString().toLowerCase();
      const right = (b[sortBy] || "").toString().toLowerCase();
      const compare = left.localeCompare(right);
      return sortDirection === "asc" ? compare : -compare;
    });
    return items;
  }, [filteredUsers, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedUsers]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    createForm.reset({
      tenantId: authUser?.tenantId || "",
      fullName: "",
      email: "",
      password: "",
      role: "COACH",
      status: "ACTIVE",
    });
    setIsFormOpen(true);
  };

  const openEdit = (id: string) => {
    const target = users.find((item) => item.id === id);
    if (!target) return;

    setFormMode("edit");
    setEditingId(id);
    editForm.reset({
      tenantId: target.tenantId || authUser?.tenantId || "",
      fullName: target.fullName || "",
      email: target.email || "",
      role: target.role || "COACH",
      status: target.status || "ACTIVE",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const onCreateSubmit = async (values: CreateUserFormValues) => {
    await sileo.promise(createMutation.mutateAsync(values), {
      loading: { title: "Creando usuario" },
      success: { title: "Usuario creado", description: values.fullName },
      error: (err: unknown) => ({
        title: "Error al crear usuario",
        description: (err as Error).message,
      }),
    });
    closeForm();
  };

  const onEditSubmit = async (values: UpdateUserFormValues) => {
    if (!editingId) return;

    await sileo.promise(updateMutation.mutateAsync({ id: editingId, payload: values }), {
      loading: { title: "Actualizando usuario" },
      success: { title: "Usuario actualizado", description: values.fullName },
      error: (error: unknown) => ({
        title: "Error al actualizar usuario",
        description: error instanceof Error ? error.message : "No se pudo actualizar usuario.",
      }),
    });
    closeForm();
  };

  const onDelete = async (id: string, name: string) => {
    const ok = window.confirm(`Eliminar a ${name}?`);
    if (!ok) return;

    await sileo.promise(deleteMutation.mutateAsync(id), {
      loading: { title: "Eliminando usuario" },
      success: { title: "Usuario eliminado", description: name },
      error: (error: unknown) => ({
        title: "Error al eliminar usuario",
        description: error instanceof Error ? error.message : "No se pudo eliminar usuario.",
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
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Nombre o email"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="flex min-w-45 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Role</span>
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-45 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-45 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Orden</span>
            <select
              value={`${sortBy}:${sortDirection}`}
              onChange={(event) => {
                const [nextSortBy, nextSortDirection] = event.target.value.split(":");
                setSortBy(nextSortBy as "fullName" | "email" | "role" | "status");
                setSortDirection(nextSortDirection as "asc" | "desc");
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition focus:ring-2 focus:ring-primary"
            >
              <option value="fullName:asc">Nombre A-Z</option>
              <option value="fullName:desc">Nombre Z-A</option>
              <option value="email:asc">Email A-Z</option>
              <option value="email:desc">Email Z-A</option>
              <option value="role:asc">Role A-Z</option>
              <option value="status:asc">Status A-Z</option>
            </select>
          </label>

          <label className="flex min-w-30 flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Por pagina</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-2 transition focus:ring-2 focus:ring-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Nuevo usuario
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-card-foreground">{formMode === "edit" ? "Editar usuario" : "Crear usuario"}</h3>
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
            {formMode === "create" ? (
              <>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tenant ID</span>
                  <input {...createForm.register("tenantId")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  {createForm.formState.errors.tenantId ? (
                    <span className="text-xs text-red-600">{createForm.formState.errors.tenantId.message}</span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Full name</span>
                  <input {...createForm.register("fullName")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  {createForm.formState.errors.fullName ? (
                    <span className="text-xs text-red-600">{createForm.formState.errors.fullName.message}</span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Email</span>
                  <input {...createForm.register("email")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  {createForm.formState.errors.email ? (
                    <span className="text-xs text-red-600">{createForm.formState.errors.email.message}</span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Password</span>
                  <input type="password" {...createForm.register("password")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  {createForm.formState.errors.password ? (
                    <span className="text-xs text-red-600">{createForm.formState.errors.password.message}</span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Role</span>
                  <select {...createForm.register("role")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Status</span>
                  <select {...createForm.register("status")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Tenant ID</span>
                  <input {...editForm.register("tenantId")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Full name</span>
                  <input {...editForm.register("fullName")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  {editForm.formState.errors.fullName ? (
                    <span className="text-xs text-red-600">{editForm.formState.errors.fullName.message}</span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Email</span>
                  <input {...editForm.register("email")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                  {editForm.formState.errors.email ? (
                    <span className="text-xs text-red-600">{editForm.formState.errors.email.message}</span>
                  ) : null}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Role</span>
                  <select {...editForm.register("role")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Status</span>
                  <select {...editForm.register("status")} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
              >
                {isSaving ? "Guardando..." : formMode === "create" ? "Crear usuario" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {usersQuery.isLoading ? <p className="p-5 text-sm text-muted-foreground">Cargando users...</p> : null}
        {usersQuery.error instanceof Error ? <p className="p-5 text-sm text-red-600">{usersQuery.error.message}</p> : null}

        {!usersQuery.isLoading && !(usersQuery.error instanceof Error) ? (
          sortedUsers.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No hay resultados para los filtros actuales.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium text-foreground">Full name</th>
                    <th className="px-4 py-3 font-medium text-foreground">Email</th>
                    <th className="px-4 py-3 font-medium text-foreground">Role</th>
                    <th className="px-4 py-3 font-medium text-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((item) => (
                    <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-4 py-3 text-card-foreground">{item.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">{item.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">{item.status}</span>
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
                            onClick={() => onDelete(item.id, item.fullName)}
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

        {!usersQuery.isLoading && sortedUsers.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <p>
              Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedUsers.length)} de {sortedUsers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                className="rounded-md border border-border px-2 py-1 text-foreground disabled:opacity-50"
              >
                Anterior
              </button>
              <span>
                Pagina {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-border px-2 py-1 text-foreground disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
