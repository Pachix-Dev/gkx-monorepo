"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";
import { LoginFormValues, loginSchema } from "@/features/auth/schemas/self-service";
import { sileo } from "sileo";

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = useMemo(() => params.get("next") || "/dashboard", [params]);
  const status = useMemo(() => params.get("status") || "", [params]);
  const emailHint = useMemo(() => params.get("email") || "", [params]);
  const { isAuthenticated, login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailHint,
      password: "",
    },
  });

  useEffect(() => {
    if (!emailHint) {
      return;
    }

    form.setValue("email", emailHint);
  }, [emailHint, form]);

  useEffect(() => {
    if (!status) {
      return;
    }

    if (status === "registered") {
      sileo.success({ title: "Registro completado", description: "Ahora puedes iniciar sesion." });
      return;
    }

    if (status === "verified") {
      sileo.success({ title: "Email verificado", description: "Inicia sesion para continuar." });
      return;
    }

    if (status === "password-reset") {
      sileo.success({ title: "Contrasena actualizada", description: "Inicia sesion con tu nueva contrasena." });
      return;
    }

    if (status === "reset-requested") {
      sileo.info({ title: "Revisa tu correo", description: "Usa el token para restablecer tu contrasena." });
    }
  }, [status]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, nextPath, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      await login(values.email, values.password);
      sileo.success({ title: "Sesion iniciada" });
      router.replace(nextPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo iniciar sesion.";
      sileo.error({ title: "Error de autenticacion", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-muted p-6 md:place-items-center">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">GKX</p>
            <h1 className="mt-2 text-2xl font-semibold text-card-foreground">Iniciar sesión</h1>
            <div className="flex items-center justify-center gap-1">
                <p className="text-sm text-muted-foreground">
                    ¿No tienes una cuenta? 
                </p>
                <Link href="/register" className="text-foreground text-sm font-bold hover:text-primary">
                    Regístrate aquí
                </Link>
            </div>
        </div>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block space-y-1">
            <span className="text-sm text-foreground">Email</span>
            <input
              type="email"
              required
              {...form.register("email")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              placeholder="coach@gkacademy.com"
            />
            {form.formState.errors.email ? <p className="text-xs text-red-600">{form.formState.errors.email.message}</p> : null}
          </label>

          <label className="block space-y-1">
            <div className="flex justify-between">
                <span className="text-sm text-foreground">Contraseña</span>
                <Link href="/forgot-password" className="ml-1 text-sm text-primary hover:text-primary/80">
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>
            <input
              type="password"
              required
              {...form.register("password")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none ring-offset-2 transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              placeholder="********"
            />
            {form.formState.errors.password ? <p className="text-xs text-red-600">{form.formState.errors.password.message}</p> : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
          
            <p className="text-xs text-center">Al iniciar sesión, acepta nuestros Términos y Política de privacidad.</p>                       
          
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-muted p-6 text-sm text-muted-foreground">Cargando...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

