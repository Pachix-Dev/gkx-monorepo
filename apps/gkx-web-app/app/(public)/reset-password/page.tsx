"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { resetPasswordRequest } from "@/lib/api/auth";
import { ResetPasswordFormValues, resetPasswordSchema } from "@/features/auth/schemas/self-service";
import { sileo } from "sileo";

function ResetPasswordPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";
  const emailFromUrl = params.get("email") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      form.setValue("token", tokenFromUrl);
    }
  }, [form, tokenFromUrl]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await resetPasswordRequest({ token: values.token, newPassword: values.newPassword });
      sileo.success({ title: "Contrasena restablecida" });
      form.reset({ token: "", newPassword: "", confirmPassword: "" });
      router.push(`/login?status=password-reset&email=${encodeURIComponent(emailFromUrl)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo restablecer la contrasena.";
      sileo.error({ title: "Error de reseteo", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-muted p-6 md:place-items-center">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-card-foreground">Restablecer contrasena</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ingresa tu token y define una nueva contrasena.</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block space-y-1">
            <span className="text-sm text-foreground">Token</span>
            <input
              {...form.register("token")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            {form.formState.errors.token ? <p className="text-xs text-red-600">{form.formState.errors.token.message}</p> : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-foreground">Nueva contrasena</span>
            <input
              type="password"
              {...form.register("newPassword")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            {form.formState.errors.newPassword ? (
              <p className="text-xs text-red-600">{form.formState.errors.newPassword.message}</p>
            ) : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-foreground">Confirmar contrasena</span>
            <input
              type="password"
              {...form.register("confirmPassword")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
          >
            {isSubmitting ? "Restableciendo..." : "Restablecer"}
          </button>
        </form>

        <p className="mt-5 text-xs text-muted-foreground">
          Volver a{" "}
          <Link href="/login" className="text-foreground hover:underline">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-muted p-6 text-sm text-muted-foreground">Cargando...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}