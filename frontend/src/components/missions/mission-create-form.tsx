"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z
    .string()
    .trim()
    .min(20, "La description doit contenir au moins 20 caractères."),
  categoryId: z.string().min(1, "Choisis une catégorie."),
  city: z.string().trim().min(2, "Indique une ville."),
  requiredSkills: z.string().trim().min(2, "Indique au moins une compétence."),
  estimatedHours: z
    .string()
    .regex(/^\d+$/, "Indique un nombre d’heures valide."),
  budget: z.string().regex(/^\d+$/, "Indique un budget valide."),
  deadline: z.string().min(1, "Indique une date limite."),
});

type FormValues = z.infer<typeof formSchema>;

export function MissionCreateForm() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok)
        throw new Error("Impossible de charger les catégories.");
      return (await response.json()) as { id: string; name: string }[];
    },
    enabled: open,
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      city: "",
      requiredSkills: "",
      estimatedHours: "",
      budget: "",
      deadline: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          categoryId: values.categoryId,
          city: values.city,
          requiredSkills: values.requiredSkills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          estimatedHours: Number(values.estimatedHours),
          budget: Number(values.budget),
          deadline: values.deadline,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setServerError(body?.error ?? "Impossible de publier la mission.");
        return;
      }
      form.reset();
      setOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard", "company"] }),
        queryClient.invalidateQueries({ queryKey: ["missions"] }),
      ]);
    } catch {
      setServerError("Le serveur est momentanément indisponible.");
    }
  };

  return (
    <Card className="mt-8 overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            Nouvelle opportunité
          </p>
          <h2 className="mt-1 text-lg font-semibold text-card-foreground">
            Publier une mission
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Elle sera visible immédiatement par les étudiants.
          </p>
        </div>
        <Button
          type="button"
          variant={open ? "outline" : "default"}
          onClick={() => setOpen((value) => !value)}
        >
          <Plus className="size-4" aria-hidden="true" />
          {open ? "Fermer" : "Créer une mission"}
        </Button>
      </div>
      {open && (
        <form
          className="grid gap-5 border-t border-border bg-muted/30 p-5"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="mission-title">Titre de la mission</Label>
              <Input id="mission-title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="mission-description">Description</Label>
              <Textarea
                id="mission-description"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission-category">Catégorie</Label>
              <Select
                value={form.watch("categoryId")}
                onValueChange={(value) =>
                  form.setValue("categoryId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="mission-category">
                  <SelectValue
                    placeholder={
                      categoriesQuery.isLoading
                        ? "Chargement..."
                        : "Choisir une catégorie"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoriesQuery.data?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission-city">Ville</Label>
              <Input id="mission-city" {...form.register("city")} />
              {form.formState.errors.city && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission-skills">Compétences requises</Label>
              <Input
                id="mission-skills"
                placeholder="Ex. React, rédaction"
                {...form.register("requiredSkills")}
              />
              {form.formState.errors.requiredSkills && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.requiredSkills.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission-hours">Heures estimées</Label>
              <Input
                id="mission-hours"
                type="number"
                min="1"
                {...form.register("estimatedHours")}
              />
              {form.formState.errors.estimatedHours && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.estimatedHours.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission-budget">Budget (FCFA)</Label>
              <Input
                id="mission-budget"
                type="number"
                min="1"
                step="1000"
                {...form.register("budget")}
              />
              {form.formState.errors.budget && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.budget.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission-deadline">Date limite</Label>
              <Input
                id="mission-deadline"
                type="date"
                {...form.register("deadline")}
              />
              {form.formState.errors.deadline && (
                <p className="text-sm text-red-700">
                  {form.formState.errors.deadline.message}
                </p>
              )}
            </div>
          </div>
          {serverError && (
            <p className="text-sm text-red-700" role="alert">
              {serverError}
            </p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting || categoriesQuery.isLoading
              }
            >
              <Send className="size-4" aria-hidden="true" />
              {form.formState.isSubmitting
                ? "Publication..."
                : "Publier la mission"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
