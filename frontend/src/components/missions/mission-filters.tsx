import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MissionFilterValues = {
  categoryId: string;
  city: string;
  minBudget: string;
  maxBudget: string;
  maxHours: string;
};

export function MissionFilters({
  values,
  categories,
  onChange,
  onReset,
}: {
  values: MissionFilterValues;
  categories: { id: string; name: string }[];
  onChange: (values: MissionFilterValues) => void;
  onReset: () => void;
}) {
  const update = (key: keyof MissionFilterValues, value: string) =>
    onChange({ ...values, [key]: value });
  return (
    <div className="glass rounded-lg p-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-base font-semibold text-card-foreground">
          Filtrer les missions
        </h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={values.categoryId}
            onValueChange={(value) => update("categoryId", value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={values.city}
            onChange={(event) => update("city", event.target.value)}
            placeholder="Ex. Lomé"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minBudget">Budget minimum</Label>
          <Input
            id="minBudget"
            type="number"
            min="0"
            step="1000"
            value={values.minBudget}
            onChange={(event) => update("minBudget", event.target.value)}
            placeholder="FCFA"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxBudget">Budget maximum</Label>
          <Input
            id="maxBudget"
            type="number"
            min="0"
            step="1000"
            value={values.maxBudget}
            onChange={(event) => update("maxBudget", event.target.value)}
            placeholder="FCFA"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxHours">Durée maximum</Label>
          <Input
            id="maxHours"
            type="number"
            min="1"
            value={values.maxHours}
            onChange={(event) => update("maxHours", event.target.value)}
            placeholder="Heures"
          />
        </div>
      </div>
      <Button
        className="mt-5"
        type="button"
        variant="outline"
        size="sm"
        onClick={onReset}
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );
}
