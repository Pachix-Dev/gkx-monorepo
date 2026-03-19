"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordRequest } from "@/lib/api/auth";
import { EmailOnlyFormValues, emailOnlySchema } from "@/features/auth/schemas/self-service";
import { sileo } from "sileo";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmailOnlyFormValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: EmailOnlyFormValues) => {
    setIsSubmitting(true);
    try {
      await forgotPasswordRequest(values);
      sileo.success({ title: "Solicitud enviada", description: "Si el email existe, recibiras instrucciones." });
      form.reset();
      router.push(`/login?status=reset-requested&email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo procesar la solicitud.";
      sileo.error({ title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-muted p-6 md:place-items-center">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-card-foreground">Recuperar contrasena</h1>
        <p className="mt-1 text-sm text-muted-foreground">Te enviaremos un correo con el token de reseteo.</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block space-y-1">
            <span className="text-sm text-foreground">Email</span>
            <input
              {...form.register("email")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            {form.formState.errors.email ? <p className="text-xs text-red-600">{form.formState.errors.email.message}</p> : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>

        <p className="mt-5 text-xs text-muted-foreground">
          Ya tienes token?{" "}
          <Link href="/reset-password" className="text-foreground hover:underline">
            Restablecer ahora
          </Link>
        </p>
      </div>
    </div>
  );
}
