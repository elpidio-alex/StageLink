"use client";

import { RefreshCw } from "lucide-react";
import { Check, ExternalLink, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAdminDashboard } from "@/lib/hooks/use-admin-dashboard";

const roleLabels: Record<string, string> = {
  STUDENT: "Étudiant",
  COMPANY: "Entreprise",
  MEDIATOR: "Médiateur",
  ADMIN: "Administrateur",
};
const missionLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  ASSIGNED: "Attribuée",
  DELIVERED: "Livrée",
  COMPLETED: "Terminée",
  DISPUTED: "En litige",
  CANCELLED: "Annulée",
};
const statusClasses: Record<string, string> = {
  PUBLISHED: "bg-blue-100 text-blue-900",
  ASSIGNED: "bg-amber-100 text-amber-900",
  DELIVERED: "bg-violet-100 text-violet-900",
  COMPLETED: "bg-emerald-100 text-emerald-900",
  DISPUTED: "bg-red-100 text-red-900",
  CANCELLED: "bg-zinc-100 text-zinc-600 line-through",
  DRAFT: "bg-zinc-100 text-zinc-700",
};

export default function AdminDashboardPage() {
  const query = useAdminDashboard();
  const [activitySearch, setActivitySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [proofError, setProofError] = useState<string | null>(null);
  const proofsQuery = useQuery({
    queryKey: ["admin", "student-proofs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/student-proofs");
      if (!response.ok) throw new Error("Justificatifs indisponibles");
      return (await response.json()) as {
        id: string;
        studentProofPath: string;
        studentProofStatus: string;
        user: { name: string; email: string };
      }[];
    },
    refetchInterval: 15000,
  });
  const decideProof = async (
    studentProfileId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setProofError(null);
    const response = await fetch("/api/admin/student-proofs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentProfileId, status }),
    });
    if (!response.ok) {
      setProofError("Impossible de traiter le justificatif.");
      return;
    }
    await proofsQuery.refetch();
  };
  if (query.isLoading)
    return (
      <main className="dashboard-shell mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-5 w-80" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-8 h-80" />
      </main>
    );
  if (query.isError || !query.data)
    return (
      <main className="dashboard-shell mx-auto max-w-6xl px-5 py-20 text-center">
        <p className="text-lg font-semibold text-zinc-950">
          Le back-office ne peut pas être chargé.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Connecte-toi avec un compte administrateur pour continuer.
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
  const normalizedSearch = activitySearch.trim().toLowerCase();
  const filteredMissions = dashboard.missions.filter(
    (mission) =>
      !normalizedSearch ||
      mission.title.toLowerCase().includes(normalizedSearch) ||
      mission.company.name.toLowerCase().includes(normalizedSearch),
  );
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = dashboard.users.filter(
    (user) =>
      !normalizedUserSearch ||
      user.name.toLowerCase().includes(normalizedUserSearch) ||
      user.email.toLowerCase().includes(normalizedUserSearch),
  );
  return (
    <main className="dashboard-shell mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div>
        <p className="text-sm font-medium text-teal-700">Back-office</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Vue d’ensemble de StageLink.
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Supervision des comptes, missions, contrats, paiements et litiges.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Utilisateurs suivis</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.users}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {dashboard.stats.students} étudiants · {dashboard.stats.companies}{" "}
            entreprises
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Missions publiées</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.publishedMissions}
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Contrats actifs</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.activeContracts}
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Litiges ouverts</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.openDisputes}
          </p>
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">
            Activité récente
          </h2>
          <Input
            className="mt-4"
            placeholder="Rechercher une mission ou une entreprise"
            value={activitySearch}
            onChange={(event) => setActivitySearch(event.target.value)}
          />
          {filteredMissions.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucune mission enregistrée.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredMissions.map((mission) => (
                <div key={mission.id} className="border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {mission.title}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {mission.company.name} ·{" "}
                        {formatCurrency(mission.budget)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-1 text-xs font-medium ${statusClasses[mission.status] ?? "bg-zinc-100 text-zinc-700"}`}
                    >
                      {missionLabels[mission.status] ?? mission.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Créée le {formatDate(mission.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">
            Comptes récents
          </h2>
          <Input
            className="mt-4"
            placeholder="Rechercher un nom ou un email"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
          />
          {filteredUsers.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucun compte enregistré.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-950">{user.name}</h3>
                      <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
                    </div>
                    <span className="shrink-0 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">
                    Inscrit le {formatDate(user.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-950">
          Justificatifs étudiants
        </h2>
        {proofsQuery.data?.length ? (
          <div className="mt-4 space-y-3">
            {proofsQuery.data.map((proof) => (
              <div key={proof.id} className="border border-zinc-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-zinc-950">
                      {proof.user.name}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {proof.user.email} · {proof.studentProofStatus}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={proof.studentProofPath}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="size-4" />
                        Voir
                      </a>
                    </Button>
                    {proof.studentProofStatus === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => void decideProof(proof.id, "APPROVED")}
                        >
                          <Check className="size-4" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void decideProof(proof.id, "REJECTED")}
                        >
                          <X className="size-4" />
                          Refuser
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
            Aucun justificatif à vérifier.
          </p>
        )}
        {proofError && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {proofError}
          </p>
        )}
      </section>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">Paiements</h2>
          {dashboard.payments.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucun paiement enregistré.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {dashboard.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 border border-zinc-200 p-4"
                >
                  <div>
                    <p className="font-medium text-zinc-950">
                      {payment.provider}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-zinc-950">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-xl font-semibold text-zinc-950">Litiges</h2>
          {dashboard.disputes.length === 0 ? (
            <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
              Aucun litige enregistré.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {dashboard.disputes.map((dispute) => (
                <div key={dispute.id} className="border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-zinc-950">
                      {dispute.contract.mission.title}
                    </h3>
                    <span className="bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                      {dispute.status}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                    {dispute.reason}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatDate(dispute.createdAt)}
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
