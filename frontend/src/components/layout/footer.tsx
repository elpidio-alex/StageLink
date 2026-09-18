import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/60 text-muted-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Des missions utiles, des parcours qui avancent.
          </p>
          <div className="flex gap-5 text-sm">
            <Link className="hover:text-foreground" href="/missions">
              Missions
            </Link>
            <Link className="hover:text-foreground" href="/auth/login">
              Connexion
            </Link>
          </div>
        </div>
        <Separator className="my-6 bg-border" />
        <p className="text-xs text-muted-foreground">
          © 2026 StageLink. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
