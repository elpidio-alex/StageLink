"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type RegisterValues = {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "COMPANY";
  city: string;
  school?: string;
  field?: string;
  legalName?: string;
  sector?: string;
};

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [studentProof, setStudentProof] = useState<File | null>(null);
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "STUDENT" },
  });
  const role = watch("role");

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    if (values.role === "STUDENT" && !studentProof) {
      setServerError("Ajoute un justificatif étudiant pour continuer.");
      return;
    }
    try {
      const body = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined) body.append(key, value);
      });
      if (studentProof) body.append("studentProof", studentProof);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setServerError(body?.error ?? "Impossible de créer le compte.");
        return;
      }
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: dashboardPathForRole(values.role),
      });
      if (result?.error) {
        setServerError(
          "Compte créé, mais la connexion automatique a échoué. Connecte-toi manuellement.",
        );
        return;
      }
      window.location.assign(result?.url ?? dashboardPathForRole(values.role));
    } catch {
      setServerError(
        "Le serveur est momentanément indisponible. Réessaie dans un instant.",
      );
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <section>
        <p className="text-sm font-medium text-primary">Rejoins StageLink</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Créer un compte
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choisis ton profil pour recevoir les informations adaptées à ton
          activité.
        </p>
        <form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              Je suis
            </legend>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted p-1">
              <Button
                type="button"
                variant={role === "STUDENT" ? "default" : "ghost"}
                onClick={() =>
                  setValue("role", "STUDENT", { shouldValidate: true })
                }
              >
                Étudiant
              </Button>
              <Button
                type="button"
                variant={role === "COMPANY" ? "default" : "ghost"}
                onClick={() =>
                  setValue("role", "COMPANY", { shouldValidate: true })
                }
              >
                Entreprise
              </Button>
            </div>
            <input type="hidden" value={role} {...register("role")} />
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-700" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-700" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.city)}
              {...register("city")}
            />
            {errors.city && (
              <p className="text-sm text-red-700" role="alert">
                {errors.city.message}
              </p>
            )}
          </div>
          {role === "STUDENT" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="school">Établissement</Label>
                <Input
                  id="school"
                  aria-invalid={Boolean(errors.school)}
                  {...register("school")}
                />
                {errors.school && (
                  <p className="text-sm text-red-700" role="alert">
                    {errors.school.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="field">Filière</Label>
                <Input
                  id="field"
                  aria-invalid={Boolean(errors.field)}
                  {...register("field")}
                />
                {errors.field && (
                  <p className="text-sm text-red-700" role="alert">
                    {errors.field.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legalName">Raison sociale</Label>
                <Input
                  id="legalName"
                  aria-invalid={Boolean(errors.legalName)}
                  {...register("legalName")}
                />
                {errors.legalName && (
                  <p className="text-sm text-red-700" role="alert">
                    {errors.legalName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Secteur</Label>
                <Input
                  id="sector"
                  aria-invalid={Boolean(errors.sector)}
                  {...register("sector")}
                />
                {errors.sector && (
                  <p className="text-sm text-red-700" role="alert">
                    {errors.sector.message}
                  </p>
                )}
              </div>
            </div>
          )}
          {role === "STUDENT" && (
            <div className="space-y-2">
              <Label htmlFor="studentProof">Justificatif étudiant</Label>
              <Input
                id="studentProof"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) =>
                  setStudentProof(event.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-muted-foreground">
                PDF, JPG ou PNG, 5 Mo maximum.
              </p>
            </div>
          )}
          {serverError && (
            <p className="text-sm text-red-700" role="alert">
              {serverError}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="sm:order-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Création en cours..." : "Créer mon compte"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Déjà inscrit ?{" "}
              <Link className="text-primary hover:underline" href="/auth/login">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}

function dashboardPathForRole(role: RegisterValues["role"]) {
  return role === "COMPANY" ? "/dashboard/company" : "/dashboard/student";
}
