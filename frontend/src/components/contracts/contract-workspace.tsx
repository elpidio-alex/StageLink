"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  deliverableInputSchema,
  disputeInputSchema,
  messageInputSchema,
} from "@stagelink/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { useContract } from "@/lib/hooks/use-contract";

const messageSchema = messageInputSchema;
const deliverableSchema = deliverableInputSchema.extend({
  url: deliverableInputSchema.shape.url.or(z.literal("")),
});
const disputeSchema = disputeInputSchema;

type FormState = { error: string | null; success: string | null };

async function postAction(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (!response.ok) throw new Error(payload?.error ?? "Action impossible.");
}

export function ContractWorkspace({ id }: { id: string }) {
  const query = useContract(id);
  const queryClient = useQueryClient();
  const [messageState, setMessageState] = useState<FormState>({
    error: null,
    success: null,
  });
  const [deliverableState, setDeliverableState] = useState<FormState>({
    error: null,
    success: null,
  });
  const [disputeState, setDisputeState] = useState<FormState>({
    error: null,
    success: null,
  });
  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });
  const deliverableForm = useForm<z.infer<typeof deliverableSchema>>({
    resolver: zodResolver(deliverableSchema),
  });
  const disputeForm = useForm<z.infer<typeof disputeSchema>>({
    resolver: zodResolver(disputeSchema),
  });
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ["contracts", id] });

  if (query.isLoading)
    return (
      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="mt-3 h-5 w-1/3" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  if (query.isError || !query.data)
    return (
      <main className="mx-auto max-w-6xl px-5 py-20 text-center">
        <p className="text-lg font-semibold text-zinc-950">
          Ce contrat est introuvable.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Vérifie tes droits d’accès ou réessaie plus tard.
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
  const contract = query.data;
  const onMessage = async (values: z.infer<typeof messageSchema>) => {
    setMessageState({ error: null, success: null });
    try {
      await postAction(`/api/contracts/${id}/messages`, values);
      messageForm.reset();
      setMessageState({ error: null, success: "Message envoyé." });
      refresh();
    } catch (error) {
      setMessageState({
        error:
          error instanceof Error
            ? error.message
            : "Message impossible à envoyer.",
        success: null,
      });
    }
  };
  const onDeliverable = async (values: z.infer<typeof deliverableSchema>) => {
    setDeliverableState({ error: null, success: null });
    try {
      await postAction(`/api/contracts/${id}/deliverables`, values);
      deliverableForm.reset();
      setDeliverableState({ error: null, success: "Livrable envoyé." });
      refresh();
    } catch (error) {
      setDeliverableState({
        error:
          error instanceof Error
            ? error.message
            : "Livrable impossible à envoyer.",
        success: null,
      });
    }
  };
  const onDispute = async (values: z.infer<typeof disputeSchema>) => {
    setDisputeState({ error: null, success: null });
    try {
      await postAction(`/api/contracts/${id}/dispute`, values);
      disputeForm.reset();
      setDisputeState({ error: null, success: "Litige ouvert." });
      refresh();
    } catch (error) {
      setDisputeState({
        error:
          error instanceof Error
            ? error.message
            : "Litige impossible à ouvrir.",
        success: null,
      });
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <Link
        href="/dashboard/student"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        Retour au dashboard
      </Link>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Contrat · {contract.mission.category.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {contract.mission.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {contract.company.name} · {contract.student.name}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold text-zinc-950">
            {formatCurrency(contract.amount)}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Statut : {contract.status}
          </p>
        </div>
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-zinc-950">
              Suivi du contrat
            </h2>
            <div className="mt-4 border-l border-zinc-200 pl-5">
              <div className="relative pb-6">
                <span className="absolute -left-[25px] top-1 size-2 rounded-full bg-teal-700" />
                <p className="text-sm font-medium text-zinc-950">
                  Contrat créé
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {contract.startedAt
                    ? formatDate(contract.startedAt)
                    : "Date non disponible"}
                </p>
              </div>
              <div className="relative">
                <span className="absolute -left-[25px] top-1 size-2 rounded-full bg-zinc-300" />
                <p className="text-sm font-medium text-zinc-950">
                  {contract.deliverables.length
                    ? "Livrable soumis"
                    : "Livrable attendu"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {contract.deliverables[0]?.status ?? "En attente"}
                </p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-zinc-950">Livrables</h2>
            {contract.deliverables.length === 0 ? (
              <p className="mt-4 border border-zinc-200 p-5 text-sm text-zinc-600">
                Aucun livrable envoyé.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {contract.deliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="border border-zinc-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-zinc-950">
                        {deliverable.title}
                      </h3>
                      <span className="bg-violet-100 px-2 py-1 text-xs text-violet-900">
                        {deliverable.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {deliverable.description}
                    </p>
                    {deliverable.url && (
                      <a
                        className="mt-2 block text-sm text-teal-700 hover:underline"
                        href={deliverable.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ouvrir le lien
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="text-xl font-semibold text-zinc-950">Messages</h2>
            <div className="mt-4 space-y-3">
              {contract.messages.length === 0 ? (
                <p className="border border-zinc-200 p-5 text-sm text-zinc-600">
                  Aucun message pour le moment.
                </p>
              ) : (
                contract.messages.map((message) => (
                  <div key={message.id} className="border border-zinc-200 p-4">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-950">
                        {message.sender.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                      {message.body}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form
              className="mt-4 flex gap-2"
              onSubmit={messageForm.handleSubmit(onMessage)}
            >
              <Textarea
                className="min-h-20"
                aria-label="Nouveau message"
                placeholder="Écrire un message..."
                {...messageForm.register("body")}
              />
              <Button
                className="self-end"
                size="icon"
                type="submit"
                disabled={messageForm.formState.isSubmitting}
                aria-label="Envoyer le message"
              >
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </form>
            {messageForm.formState.errors.body && (
              <p className="mt-1 text-sm text-red-700">
                {messageForm.formState.errors.body.message}
              </p>
            )}
            {messageState.error && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {messageState.error}
              </p>
            )}
            {messageState.success && (
              <p className="mt-2 text-sm text-teal-700" role="status">
                {messageState.success}
              </p>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="border border-zinc-200 p-5">
            <h2 className="text-lg font-semibold text-zinc-950">
              Déposer un livrable
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={deliverableForm.handleSubmit(onDeliverable)}
            >
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" {...deliverableForm.register("title")} />
                {deliverableForm.formState.errors.title && (
                  <p className="text-sm text-red-700">
                    {deliverableForm.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...deliverableForm.register("description")}
                />
                {deliverableForm.formState.errors.description && (
                  <p className="text-sm text-red-700">
                    {deliverableForm.formState.errors.description.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Lien (facultatif)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  {...deliverableForm.register("url")}
                />
              </div>
              <Button
                className="w-full"
                type="submit"
                disabled={deliverableForm.formState.isSubmitting}
              >
                Envoyer le livrable
              </Button>
              {deliverableState.error && (
                <p className="text-sm text-red-700" role="alert">
                  {deliverableState.error}
                </p>
              )}
              {deliverableState.success && (
                <p className="text-sm text-teal-700" role="status">
                  {deliverableState.success}
                </p>
              )}
            </form>
          </section>
          <section className="border border-red-200 p-5">
            <h2 className="text-lg font-semibold text-zinc-950">
              Ouvrir un litige
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={disputeForm.handleSubmit(onDispute)}
            >
              <div className="space-y-2">
                <Label htmlFor="reason">Motif</Label>
                <Textarea id="reason" {...disputeForm.register("reason")} />
                {disputeForm.formState.errors.reason && (
                  <p className="text-sm text-red-700">
                    {disputeForm.formState.errors.reason.message}
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                variant="outline"
                type="submit"
                disabled={disputeForm.formState.isSubmitting}
              >
                Ouvrir le litige
              </Button>
              {disputeState.error && (
                <p className="text-sm text-red-700" role="alert">
                  {disputeState.error}
                </p>
              )}
              {disputeState.success && (
                <p className="text-sm text-teal-700" role="status">
                  {disputeState.success}
                </p>
              )}
            </form>
          </section>
        </aside>
      </div>
    </main>
  );
}
