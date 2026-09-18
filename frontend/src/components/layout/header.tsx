"use client";

import Link from "next/link";
import { ArrowRight, LogOut, Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const dashboardPath =
    session?.user?.role === "COMPANY"
      ? "/dashboard/company"
      : session?.user?.role === "MEDIATOR"
        ? "/dashboard/mediator"
        : session?.user?.role === "ADMIN"
          ? "/dashboard/admin"
          : "/dashboard/student";

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Stage<span className="text-primary">Link</span>
        </Link>
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navigation principale"
        >
          <Button asChild variant="ghost" size="sm">
            <Link href="/missions">Trouver une mission</Link>
          </Button>
          {status === "authenticated" ? (
            <>
              <NotificationBell />
              <Button asChild variant="outline" size="sm">
                <Link href={dashboardPath}>Mon espace</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Se déconnecter
              </Button>
            </>
          ) : status === "unauthenticated" ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">
                Se connecter{" "}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          <ThemeToggle />
        </nav>
        <Button
          className="md:hidden"
          variant="ghost"
          size="icon"
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </div>
      {menuOpen && (
        <nav
          className="border-t border-border px-5 py-3 md:hidden"
          aria-label="Menu mobile"
        >
          <Link
            className="block py-2 text-sm font-medium text-foreground"
            href="/missions"
            onClick={() => setMenuOpen(false)}
          >
            Trouver une mission
          </Link>
          {status === "authenticated" ? (
            <>
              <Link
                className="block py-2 text-sm font-medium text-primary"
                href={dashboardPath}
                onClick={() => setMenuOpen(false)}
              >
                Mon espace
              </Link>
              <button
                className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground"
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Se déconnecter
              </button>
            </>
          ) : status === "unauthenticated" ? (
            <Link
              className="block py-2 text-sm font-medium text-primary"
              href="/auth/login"
              onClick={() => setMenuOpen(false)}
            >
              Se connecter
            </Link>
          ) : null}
        </nav>
      )}
    </header>
  );
}
