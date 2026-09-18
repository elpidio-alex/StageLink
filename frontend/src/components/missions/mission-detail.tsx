"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { useMission } from "@/lib/hooks/use-missions";

const applicationSchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .min(20, "Ta présentation doit contenir au moins 20 caractères.")
    .max(3000, "Ta présentation ne peut pas dépasser 3 000 caractères."),
});

type ApplicationValues = z.infer<typeof applicationSchema>;

export function MissionDetail({ id }: { id: string }) {
  const query = useMission(id);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationValues>({ resolver: zodResolver(applicationSchema) });

  const onSubmit = async (values: ApplicationValues) => {
    setServerError(null);
    const response = await fetch(`/api/missions/${id}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setServerError(body?.error ?? "Impossible d’envoyer ta candidature.");
      return;
    }
    setSubmitted(true);
  };

  if (query.isLoading)
    return (
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-5 w-1/3" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  if (query.isError || !query.data)
    return (
      <main className="mx-auto max-w-6xl px-5 py-20 text-center">
        <p className="text-lg font-semibold text-foreground">
          Cette mission est introuvable.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Elle a peut-être été retirée ou n’est plus publiée.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => void query.refetch()}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Réessayer
        </Button>
      </main>
    );

  const mission = query.data;
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <Link
        href="/missions"
        className="text-sm font-medium text-primary hover:underline"
      >
        Retour aux missions
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <article>
          <p className="text-sm font-medium text-primary">
            {mission.category.name}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {mission.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Proposée par {mission.company.name}
            {mission.company.companyProfile?.verified
              ? " · entreprise vérifiée"
              : ""}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-4 text-sm text-muted-foreground">
            <span>{mission.city}</span>
            <span>{mission.estimatedHours} heures estimées</span>
            <span>Échéance {formatDate(mission.deadline)}</span>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">
              À propos de la mission
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-muted-foreground">
              {mission.description}
            </p>
          </div>
        </article>
        <Card className="h-fit p-5">
          <p className="text-sm text-muted-foreground">Budget proposé</p>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {formatCurrency(mission.budget)}
          </p>
          {submitted ? (
            <div className="mt-6 rounded-md border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-medium text-primary">
                Ta candidature a bien été envoyée.
              </p>
              <Link
                href="/missions"
                className="mt-2 block text-sm text-primary hover:underline"
              >
                Voir d’autres missions
              </Link>
            </div>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="coverLetter">
                  Présente-toi pour cette mission
                </Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Explique pourquoi ton profil correspond..."
                  aria-invalid={Boolean(errors.coverLetter)}
                  {...register("coverLetter")}
                />
                {errors.coverLetter && (
                  <p className="text-sm text-red-700" role="alert">
                    {errors.coverLetter.message}
                  </p>
                )}
              </div>
              {serverError && (
                <p className="text-sm text-red-700" role="alert">
                  {serverError}
                </p>
              )}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Envoi en cours..." : "Candidater"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
