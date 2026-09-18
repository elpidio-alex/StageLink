"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

type LoginValues = z.infer<typeof loginSchema>;

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
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: searchParams.get("callbackUrl") ?? "/",
    });
    if (result?.error)
      setServerError("Identifiants invalides ou compte temporairement bloqué.");
    else window.location.assign(result?.url ?? "/");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold">Connexion à StageLink</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Accédez à votre espace étudiant, entreprise ou médiateur.
      </p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium">
          E-mail
          <input
            className="mt-2 w-full rounded-md border px-3 py-2"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.email.message}
            </span>
          )}
        </label>
        <label className="block text-sm font-medium">
          Mot de passe
          <input
            className="mt-2 w-full rounded-md border px-3 py-2"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.password.message}
            </span>
          )}
        </label>
        {serverError && (
          <p className="text-sm text-red-600" role="alert">
            {serverError}
          </p>
        )}
        <button
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          Chargement...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
