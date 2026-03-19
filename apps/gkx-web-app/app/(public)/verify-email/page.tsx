"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { confirmEmailVerification, requestEmailVerification } from "@/lib/api/auth";
import { EmailOnlyFormValues, emailOnlySchema, VerifyEmailFormValues, verifyEmailSchema } from "@/features/auth/schemas/self-service";
import { sileo } from "sileo";

function VerifyEmailPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";
  const emailFromUrl = params.get("email") || "";

  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const confirmForm = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { token: tokenFromUrl },
  });

  const requestForm = useForm<EmailOnlyFormValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: emailFromUrl },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      confirmForm.setValue("token", tokenFromUrl);
    }
  }, [confirmForm, tokenFromUrl]);

  useEffect(() => {
    if (emailFromUrl) {
      requestForm.setValue("email", emailFromUrl);
    }
  }, [emailFromUrl, requestForm]);

  const onConfirm = async (values: VerifyEmailFormValues) => {
    setIsConfirming(true);
    try {
      await confirmEmailVerification(values);
      sileo.success({ title: "Email verificado" });
      router.push(`/login?status=verified&email=${encodeURIComponent(requestForm.getValues("email") || "")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo verificar el email.";
      sileo.error({ title: "Error de verificacion", description: message });
    } finally {
      setIsConfirming(false);
    }
  };

  const onRequest = async (values: EmailOnlyFormValues) => {
    setIsRequesting(true);
    try {
      await requestEmailVerification(values);
      sileo.success({ title: "Solicitud enviada", description: "Revisa tu correo" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo enviar la solicitud.";
      sileo.error({ title: "Error al solicitar verificacion", description: message });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-muted p-6 md:place-items-center">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-card-foreground">Verificar email</h1>
        <p className="mt-1 text-sm text-muted-foreground">Confirma tu token o solicita un nuevo correo de verificacion.</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <form className="space-y-3" onSubmit={confirmForm.handleSubmit(onConfirm)}>
            <h2 className="text-sm font-semibold text-foreground">Confirmar token</h2>
            <input
              {...confirmForm.register("token")}
              placeholder="raw-email-verification-token"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            {confirmForm.formState.errors.token ? <p className="text-xs text-red-600">{confirmForm.formState.errors.token.message}</p> : null}
            <button
              type="submit"
              disabled={isConfirming}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
            >
              {isConfirming ? "Verificando..." : "Confirmar verificacion"}
            </button>
          </form>

          <form className="space-y-3" onSubmit={requestForm.handleSubmit(onRequest)}>
            <h2 className="text-sm font-semibold text-foreground">Solicitar reenvio</h2>
            <input
              {...requestForm.register("email")}
              placeholder="tu-email@dominio.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            {requestForm.formState.errors.email ? <p className="text-xs text-red-600">{requestForm.formState.errors.email.message}</p> : null}
            <button
              type="submit"
              disabled={isRequesting}
              className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {isRequesting ? "Enviando..." : "Enviar verificacion"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Volver a{" "}
          <Link href="/login" className="text-foreground hover:underline">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-muted p-6 text-sm text-muted-foreground">Cargando...</div>}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
