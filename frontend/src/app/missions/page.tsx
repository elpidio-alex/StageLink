"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MissionCard } from "@/components/missions/mission-card";
import {
  MissionFilters,
  type MissionFilterValues,
} from "@/components/missions/mission-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { useMissions } from "@/lib/hooks/use-missions";

const initialFilters = (params: URLSearchParams): MissionFilterValues => ({
  categoryId: params.get("categoryId") ?? "all",
  city: params.get("city") ?? "",
  minBudget: params.get("minBudget") ?? "",
  maxBudget: params.get("maxBudget") ?? "",
  maxHours: params.get("maxHours") ?? "",
});

function MissionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => initialFilters(searchParams));
  const query = useMissions({
    categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
    city: filters.city || undefined,
  });
  const categories = [
    ...new Map(
      (query.data ?? []).map((mission) => [
        mission.category.id,
        mission.category,
      ]),
    ).values(),
  ];
  const minBudget = Number(filters.minBudget) || 0;
  const maxBudget = Number(filters.maxBudget) || Number.POSITIVE_INFINITY;
  const maxHours = Number(filters.maxHours) || Number.POSITIVE_INFINITY;
  const missions = (query.data ?? []).filter(
    (mission) =>
      mission.budget >= minBudget &&
      mission.budget <= maxBudget &&
      mission.estimatedHours <= maxHours,
  );

  const updateFilters = (nextFilters: MissionFilterValues) => {
    setFilters(nextFilters);
    const params = new URLSearchParams();
    if (nextFilters.categoryId !== "all")
      params.set("categoryId", nextFilters.categoryId);
    if (nextFilters.city) params.set("city", nextFilters.city);
    if (nextFilters.minBudget) params.set("minBudget", nextFilters.minBudget);
    if (nextFilters.maxBudget) params.set("maxBudget", nextFilters.maxBudget);
    if (nextFilters.maxHours) params.set("maxHours", nextFilters.maxHours);
    router.replace(`/missions${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  };
  const resetFilters = () =>
    updateFilters({
      categoryId: "all",
      city: "",
      minBudget: "",
      maxBudget: "",
      maxHours: "",
    });

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">
          Les opportunités du moment
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Trouver une mission
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Explore des missions publiées par des entreprises et trouve celle qui
          correspond à ton parcours.
        </p>
      </div>
      <div className="mt-8">
        <MissionFilters
          values={filters}
          categories={categories}
          onChange={updateFilters}
          onReset={resetFilters}
        />
      </div>
      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          {query.isLoading
            ? "Missions"
            : `${missions.length} mission${missions.length > 1 ? "s" : ""}`}
        </h2>
      </div>
      {query.isLoading ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} className="h-64" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="mt-5 rounded-lg border border-red-300/50 bg-red-500/10 p-5">
          <p className="text-sm text-red-700 dark:text-red-300">
            Les missions ne peuvent pas être chargées.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Réessayer
          </Button>
        </div>
      ) : missions.length === 0 ? (
        <p className="mt-5 rounded-lg border border-border p-8 text-sm text-muted-foreground">
          Aucune mission ne correspond à tes critères.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function MissionsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-5 py-14 text-sm text-zinc-600">
          Chargement...
        </main>
      }
    >
      <MissionsContent />
    </Suspense>
  );
}
