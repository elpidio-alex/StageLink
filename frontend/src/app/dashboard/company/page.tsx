"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Check, X } from "lucide-react";
import { Download, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MissionCreateForm } from "@/components/missions/mission-create-form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { useCompanyDashboard } from "@/lib/hooks/use-company-dashboard";

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  ASSIGNED: "Attribuée",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  DISPUTED: "En litige",
  CANCELLED: "Annulée",
};
const statusClasses: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  PUBLISHED: "bg-blue-100 text-blue-900",
  ASSIGNED: "bg-amber-100 text-amber-900",
  DELIVERED: "bg-violet-100 text-violet-900",
  COMPLETED: "bg-emerald-100 text-emerald-900",
  DISPUTED: "bg-red-100 text-red-900",
  CANCELLED: "bg-zinc-100 text-zinc-600 line-through",
};
const applicationLabels: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
};

export default function CompanyDashboardPage() {
  const query = useCompanyDashboard();
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [pendingContract, setPendingContract] = useState<string | null>(null);
  const [applicationSearch, setApplicationSearch] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("ALL");
  const [missionSort, setMissionSort] = useState("recent");
  const decideApplication = async (
    applicationId: string,
    decision: "ACCEPTED" | "REJECTED",
  ) => {
    setDecisionError(null);
    setPendingDecision(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setDecisionError(
          body?.error ?? "Impossible de traiter la candidature.",
        );
        return;
      }
      await query.refetch();
    } catch {
      setDecisionError("Le serveur est momentanément indisponible.");
    } finally {
      setPendingDecision(null);
    }
  };
  const createContract = async (
    applicationId: string,
    missionId: string,
    studentId: string,
  ) => {
    setContractError(null);
    setPendingContract(applicationId);
    try {
      const response = await fetch(`/api/missions/${missionId}/contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setContractError(body?.error ?? "Impossible de créer le contrat.");
        return;
      }
      await query.refetch();
    } catch {
      setContractError("Le serveur est momentanément indisponible.");
    } finally {
      setPendingContract(null);
    }
  };
  if (query.isLoading)
    return (
      <main className="dashboard-shell mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-5 w-80" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="mt-8 h-72" />
      </main>
    );
  if (query.isError || !query.data)
    return (
      <main className="dashboard-shell mx-auto max-w-6xl px-5 py-20 text-center">
        <p className="text-lg font-semibold text-zinc-950">
          Ton dashboard ne peut pas être chargé.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Connecte-toi avec un compte entreprise pour continuer.
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
  const dashboard = query.data;
  const filteredApplications = dashboard.applications.filter((application) => {
    const search = applicationSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      application.student.name.toLowerCase().includes(search) ||
      application.mission.title.toLowerCase().includes(search);
    return (
      matchesSearch &&
      (applicationStatus === "ALL" || application.status === applicationStatus)
    );
  });
  const sortedMissions = [...dashboard.missions].sort((first, second) =>
    missionSort === "budget"
      ? second.budget - first.budget
      : missionSort === "applications"
        ? second.applicationCount - first.applicationCount
        : 0,
  );
  const exportApplications = () => {
    const rows = filteredApplications.map((application) => [
      application.student.name,
      application.student.email,
      application.mission.title,
      application.status,
      `${application.matchScore}%`,
      formatDate(application.createdAt),
    ]);
    const csv = [
      ["Étudiant", "Email", "Mission", "Statut", "Adéquation", "Date"],
      ...rows,
    ]
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "candidatures-stagelink.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const pendingApplications = dashboard.applications.filter(
    (application) => application.status === "PENDING",
  ).length;
  return (
    <main className="dashboard-shell mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Espace entreprise</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Pilote tes missions.
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {dashboard.profile.legalName} · {dashboard.profile.sector} ·{" "}
            {dashboard.profile.city}
          </p>
        </div>
        <Button asChild>
          <Link href="/missions">Voir les missions</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Missions publiées</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {
              dashboard.missions.filter(
                (mission) => mission.status === "PUBLISHED",
              ).length
            }
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Candidatures reçues</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.applications.length}
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">À examiner</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {pendingApplications}
          </p>
        </div>
      </div>
      <MissionCreateForm />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">Mes missions</h2>
          {dashboard.missions.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucune mission créée pour le moment.
            </p>
          ) : (
            <div className="mt-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <select
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  value={missionSort}
                  onChange={(event) => setMissionSort(event.target.value)}
                  aria-label="Trier les missions"
                >
                  <option value="recent">Plus récentes</option>
                  <option value="budget">Budget décroissant</option>
                  <option value="applications">
                    Candidatures décroissantes
                  </option>
                </select>
              </div>
              <div className="space-y-3">
                {sortedMissions.map((mission) => (
                  <div key={mission.id} className="border border-zinc-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-zinc-950">
                          {mission.title}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {mission.category} · {formatCurrency(mission.budget)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-1 text-xs font-medium ${statusClasses[mission.status] ?? "bg-zinc-100 text-zinc-700"}`}
                      >
                        {statusLabels[mission.status] ?? mission.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                      {mission.applicationCount} candidature
                      {mission.applicationCount > 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-zinc-950">
              Candidatures reçues
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportApplications}
              disabled={!filteredApplications.length}
            >
              <Download className="size-4" aria-hidden="true" /> Exporter CSV
            </Button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_11rem]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="pl-9"
                placeholder="Rechercher un étudiant ou une mission"
                value={applicationSearch}
                onChange={(event) => setApplicationSearch(event.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              value={applicationStatus}
              onChange={(event) => setApplicationStatus(event.target.value)}
              aria-label="Filtrer les candidatures"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="ACCEPTED">Acceptées</option>
              <option value="REJECTED">Refusées</option>
            </select>
          </div>
          {filteredApplications.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucune candidature ne correspond aux critères.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="border border-zinc-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {application.student.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {application.mission.title}
                      </p>
                    </div>
                    <span className="shrink-0 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                      {applicationLabels[application.status] ??
                        application.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Adéquation {application.matchScore}% ·{" "}
                    {formatDate(application.createdAt)}
                  </p>
                  {application.status === "PENDING" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        type="button"
                        disabled={pendingDecision === application.id}
                        onClick={() =>
                          void decideApplication(application.id, "ACCEPTED")
                        }
                      >
                        <Check className="size-4" aria-hidden="true" />
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        disabled={pendingDecision === application.id}
                        onClick={() =>
                          void decideApplication(application.id, "REJECTED")
                        }
                      >
                        <X className="size-4" aria-hidden="true" />
                        Refuser
                      </Button>
                    </div>
                  )}
                  {application.status === "ACCEPTED" && (
                    <Button
                      className="mt-4"
                      size="sm"
                      type="button"
                      disabled={pendingContract === application.id}
                      onClick={() =>
                        void createContract(
                          application.id,
                          application.mission.id,
                          application.student.id,
                        )
                      }
                    >
                      {pendingContract === application.id
                        ? "Création..."
                        : "Créer le contrat"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          {decisionError && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {decisionError}
            </p>
          )}
          {contractError && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {contractError}
            </p>
          )}
        </section>
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-950">Mes contrats</h2>
        {dashboard.contracts.length === 0 ? (
          <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
            Aucun contrat pour le moment.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {dashboard.contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="border border-zinc-200 p-4 hover:border-teal-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-zinc-950">
                    {contract.mission.title}
                  </h3>
                  <span className="shrink-0 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                    {contract.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-600">
                  {contract.student} · {formatCurrency(contract.amount)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
