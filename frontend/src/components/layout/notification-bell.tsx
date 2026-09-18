"use client";

import { Bell, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Notifications indisponibles");
      return (await response.json()) as {
        id: string;
        title: string;
        body: string;
        readAt: string | null;
        createdAt: string;
      }[];
    },
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  const unread = (query.data ?? []).filter((item) => !item.readAt).length;

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="group relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}`}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
        )}
      </Button>
      <div className="invisible absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-border bg-card p-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <p className="px-3 py-2 text-sm font-semibold text-card-foreground">
          Notifications
        </p>
        {query.data?.length ? (
          query.data.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-start gap-2 rounded-md p-3 text-left hover:bg-muted"
              onClick={() => void markRead(item.id)}
            >
              {item.readAt ? (
                <Check className="mt-0.5 size-4 text-muted-foreground" />
              ) : (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              )}
              <span>
                <span className="block text-sm font-medium text-card-foreground">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.body}
                </span>
              </span>
            </button>
          ))
        ) : (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            Aucune notification.
          </p>
        )}
      </div>
    </div>
  );
}
