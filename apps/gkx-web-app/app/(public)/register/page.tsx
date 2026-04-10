"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerTenantRequest } from "@/lib/api/auth";
import { RegisterFormValues, registerSchema } from "@/features/auth/schemas/self-service";
import { sileo } from "sileo";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantName: "",
      tenantSlug: "",
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await registerTenantRequest(values);
      sileo.success({
        title: "Registro completado",
        description: result.verificationRequired ? "Revisa tu correo para verificar tu cuenta." : "Cuenta creada exitosamente.",
      });
      form.reset();
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo completar el registro.";
      sileo.error({ title: "Error de registro", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-muted p-6 md:place-items-center">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">GKX</p>
        <h1 className="mt-2 text-2xl font-semibold text-card-foreground">Registro self-service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Crea tu tenant y usuario administrador inicial.</p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm text-foreground">Tenant name</span>
            <input {...form.register("tenantName")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
            {form.formState.errors.tenantName ? <p className="text-xs text-red-600">{form.formState.errors.tenantName.message}</p> : null}
          </label>

          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm text-foreground">Tenant slug (opcional)</span>
            <input {...form.register("tenantSlug")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <label className="block space-y-1 md:col-span-2">
            <span className="text-sm text-foreground">Nombre completo</span>
            <input {...form.register("fullName")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
            {form.formState.errors.fullName ? <p className="text-xs text-red-600">{form.formState.errors.fullName.message}</p> : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-foreground">Email</span>
            <input {...form.register("email")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
            {form.formState.errors.email ? <p className="text-xs text-red-600">{form.formState.errors.email.message}</p> : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-foreground">Contrasena</span>
            <input type="password" {...form.register("password")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
            {form.formState.errors.password ? <p className="text-xs text-red-600">{form.formState.errors.password.message}</p> : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="md:col-span-2 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
          >
            {isSubmitting ? "Registrando..." : "Registrar"}
          </button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
