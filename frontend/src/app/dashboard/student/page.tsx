"use client";

import Link from "next/link";
import { RefreshCw, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { useStudentDashboard } from "@/lib/hooks/use-student-dashboard";

const applicationLabels: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
};
const contractLabels: Record<string, string> = {
  PENDING_PAYMENT: "Paiement en attente",
  ACTIVE: "En cours",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  DISPUTED: "En litige",
  CANCELLED: "Annulée",
};
const contractClasses: Record<string, string> = {
  ACTIVE: "bg-amber-100 text-amber-900",
  DELIVERED: "bg-violet-100 text-violet-900",
  COMPLETED: "bg-emerald-100 text-emerald-900",
  DISPUTED: "bg-red-100 text-red-900",
  CANCELLED: "bg-zinc-100 text-zinc-600 line-through",
  PENDING_PAYMENT: "bg-zinc-100 text-zinc-700",
};

export default function StudentDashboardPage() {
  const query = useStudentDashboard();
  if (query.isLoading)
    return (
      <main className="dashboard-shell mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <Skeleton className="h-9 w-64" />
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
          Connecte-toi avec un compte étudiant pour continuer.
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
  return (
    <main className="dashboard-shell mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Espace étudiant</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Bonjour, voici ton activité.
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {dashboard.profile.field} · {dashboard.profile.school} ·{" "}
            {dashboard.profile.city}
          </p>
        </div>
        <Button asChild>
          <Link href="/missions">Trouver une mission</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Portefeuille disponible</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {formatCurrency(dashboard.wallet.balance)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
            <WalletCards className="size-3.5" aria-hidden="true" />
            Solde calculé depuis le ledger
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Missions en cours</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.activeContracts}
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Candidatures en attente</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.pendingApplications}
          </p>
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">Mes contrats</h2>
          {dashboard.contracts.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucun contrat pour le moment.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {dashboard.contracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="block border border-zinc-200 p-4 hover:border-teal-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-zinc-950">
                      {contract.mission.title}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-1 text-xs font-medium ${contractClasses[contract.status] ?? "bg-zinc-100 text-zinc-700"}`}
                    >
                      {contractLabels[contract.status] ?? contract.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600">
                    {contract.mission.city} · {formatCurrency(contract.amount)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">
            Mes candidatures
          </h2>
          {dashboard.applications.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucune candidature pour le moment.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {dashboard.applications.map((application) => (
                <div
                  key={application.id}
                  className="border border-zinc-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-zinc-950">
                      {application.mission.title}
                    </h3>
                    <span className="shrink-0 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                      {applicationLabels[application.status] ??
                        application.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600">
                    {application.mission.company} · adéquation{" "}
                    {application.matchScore}%
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Envoyée le {formatDate(application.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
