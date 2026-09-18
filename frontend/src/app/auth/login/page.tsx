"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema } from "@stagelink/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type LoginValues = { email: string; password: string };

function LoginForm() {
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const callbackUrl = searchParams.get("callbackUrl") ?? "/";
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setServerError(
          "Identifiants invalides ou compte temporairement bloqué.",
        );
        return;
      }
      window.location.assign(result?.url ?? callbackUrl);
    } catch {
      setServerError(
        "Le serveur est momentanément indisponible. Réessaie dans un instant.",
      );
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center px-5 py-12">
      <section className="w-full">
        <p className="text-sm font-medium text-primary">
          Bienvenue sur StageLink
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Se connecter
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Retrouve tes missions, tes candidatures et tes contrats au même
          endroit.
        </p>
        <form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-700" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/auth/register"
                className="text-sm text-primary hover:underline"
              >
                Créer un compte
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-700" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          {serverError && (
            <p className="text-sm text-red-700" role="alert">
              {serverError}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-9rem)] items-center justify-center text-sm text-muted-foreground">
          Chargement...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
