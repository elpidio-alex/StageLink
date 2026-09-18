import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Mission } from "@/lib/hooks/use-missions";

export function MissionCard({ mission }: { mission: Mission }) {
  return (
    <Card className="flex h-full flex-col p-5 transition-transform hover:-translate-y-0.5 hover:border-primary/60">
      <div className="flex items-start justify-between gap-4">
        <p className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {mission.category.name}
        </p>
        <span className="text-xs text-muted-foreground">Publié</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-card-foreground">
        {mission.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
        {mission.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden="true" />
          {mission.city}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {mission.estimatedHours} h
        </span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-4 border-t border-border pt-5">
        <div>
          <p className="text-lg font-semibold text-primary">
            {formatCurrency(mission.budget)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Échéance {formatDate(mission.deadline)}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link
            href={`/missions/${mission.id}`}
            aria-label={`Voir la mission ${mission.title}`}
          >
            Voir <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
