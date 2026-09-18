"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MissionCard } from "@/components/missions/mission-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMissions } from "@/lib/hooks/use-missions";

function MissionGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-64" />
      ))}
    </div>
  );
}

export default function Home() {
  const missionsQuery = useMissions();
  const missions = missionsQuery.data ?? [];
  const categories = [
    ...new Map(
      missions.map((mission) => [mission.category.id, mission.category]),
    ).values(),
  ].slice(0, 4);

  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(hsl(var(--primary)/0.18)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="pointer-events-none absolute -left-24 top-12 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 -z-10 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-primary">
              Le lien entre les talents et les bonnes missions
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Construis ton expérience professionnelle, une mission à la fois.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Des missions concrètes pour apprendre, contribuer et avancer avec
              confiance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/missions">
                  Explorer les missions{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/register">Créer un compte</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div>
          <p className="text-sm font-medium text-primary">À découvrir</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Catégories populaires
          </h2>
        </div>
        {missionsQuery.isLoading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-16" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Aucune catégorie disponible pour le moment.
          </p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/missions?categoryId=${category.id}`}
                className="rounded-lg border border-border bg-card p-4 text-sm font-medium text-card-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <div>
          <p className="text-sm font-medium text-primary">
            Mises en ligne récemment
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Les dernières missions
          </h2>
        </div>
        {missionsQuery.isLoading ? (
          <div className="mt-6">
            <MissionGridSkeleton />
          </div>
        ) : missionsQuery.isError ? (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-800">
              Les missions ne peuvent pas être chargées.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() => void missionsQuery.refetch()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Réessayer
            </Button>
          </div>
        ) : missions.length === 0 ? (
          <p className="mt-6 rounded-lg border border-border p-6 text-sm text-muted-foreground">
            Aucune mission disponible pour le moment.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {missions.slice(0, 3).map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
