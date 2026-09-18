"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { useMediatorDashboard } from "@/lib/hooks/use-mediator-dashboard";

const decisionSchema = z.object({
  studentShare: z.coerce.number().int().min(0).max(100),
  decisionNote: z
    .string()
    .trim()
    .min(20, "La décision doit contenir au moins 20 caractères.")
    .max(3000),
});
const statusLabels: Record<string, string> = {
  OPEN: "Ouvert",
  IN_REVIEW: "En examen",
  RESOLVED: "Résolu",
  REJECTED: "Rejeté",
};
const statusClasses: Record<string, string> = {
  OPEN: "bg-red-100 text-red-900",
  IN_REVIEW: "bg-amber-100 text-amber-900",
  RESOLVED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-zinc-100 text-zinc-600 line-through",
};

export default function MediatorDashboardPage() {
  const query = useMediatorDashboard();
  const queryClient = useQueryClient();
  const [activeDispute, setActiveDispute] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof decisionSchema>>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { studentShare: 50 },
  });
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
        <Skeleton className="mt-8 h-80" />
      </main>
    );
  if (query.isError || !query.data)
    return (
      <main className="dashboard-shell mx-auto max-w-6xl px-5 py-20 text-center">
        <p className="text-lg font-semibold text-zinc-950">
          Le dashboard médiateur ne peut pas être chargé.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Vérifie que tu es connecté avec un compte médiateur.
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
  const resolve = async (values: z.infer<typeof decisionSchema>) => {
    if (!activeDispute) return;
    setActionError(null);
    const response = await fetch(`/api/disputes/${activeDispute}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setActionError(body?.error ?? "Décision impossible à enregistrer.");
      return;
    }
    setActiveDispute(null);
    form.reset({ studentShare: 50, decisionNote: "" });
    await queryClient.invalidateQueries({
      queryKey: ["dashboard", "mediator"],
    });
  };
  return (
    <main className="dashboard-shell mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div>
        <p className="text-sm font-medium text-teal-700">Espace médiateur</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Suivre et résoudre les litiges.
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Examine les dossiers ouverts et formalise les décisions.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Litiges ouverts</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.open}
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">En examen</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.inReview}
          </p>
        </div>
        <div className="border border-zinc-200 p-5">
          <p className="text-sm text-zinc-600">Résolus</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {dashboard.stats.resolved}
          </p>
        </div>
      </div>
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-950">
          Dossiers de litige
        </h2>
        {dashboard.disputes.length === 0 ? (
          <p className="mt-4 border border-zinc-200 p-6 text-sm text-zinc-600">
            Aucun litige à traiter.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {dashboard.disputes.map((dispute) => (
              <article key={dispute.id} className="border border-zinc-200 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-950">
                      {dispute.mission.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {dispute.student} · {dispute.company} · ouvert par{" "}
                      {dispute.openedBy}
                    </p>
                  </div>
                  <span
                    className={`w-fit px-2 py-1 text-xs font-medium ${statusClasses[dispute.status] ?? "bg-zinc-100 text-zinc-700"}`}
                  >
                    {statusLabels[dispute.status] ?? dispute.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-700">
                  {dispute.reason}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Ouvert le {formatDate(dispute.createdAt)}
                  {dispute.studentShare !== null
                    ? ` · part étudiant ${dispute.studentShare}%`
                    : ""}
                </p>
                {dispute.status !== "RESOLVED" &&
                  dispute.status !== "REJECTED" && (
                    <>
                      <Button
                        className="mt-4"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setActiveDispute(
                            activeDispute === dispute.id ? null : dispute.id,
                          )
                        }
                      >
                        {" "}
                        {activeDispute === dispute.id
                          ? "Fermer"
                          : "Rendre une décision"}
                      </Button>
                      {activeDispute === dispute.id && (
                        <form
                          className="mt-4 grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
                          onSubmit={form.handleSubmit(resolve)}
                        >
                          <div className="space-y-2">
                            <Label htmlFor="studentShare">
                              Part étudiant (%)
                            </Label>
                            <Input
                              id="studentShare"
                              type="number"
                              min="0"
                              max="100"
                              {...form.register("studentShare")}
                            />
                            {form.formState.errors.studentShare && (
                              <p className="text-sm text-red-700">
                                {form.formState.errors.studentShare.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="decisionNote">
                              Note de décision
                            </Label>
                            <Textarea
                              id="decisionNote"
                              className="min-h-20"
                              {...form.register("decisionNote")}
                            />
                            {form.formState.errors.decisionNote && (
                              <p className="text-sm text-red-700">
                                {form.formState.errors.decisionNote.message}
                              </p>
                            )}
                          </div>
                          <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                          >
                            Valider
                          </Button>
                        </form>
                      )}
                      {actionError && activeDispute === dispute.id && (
                        <p className="mt-2 text-sm text-red-700" role="alert">
                          {actionError}
                        </p>
                      )}
                    </>
                  )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
