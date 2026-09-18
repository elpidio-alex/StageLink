import { useQuery } from "@tanstack/react-query";

export type MediatorDashboard = {
  disputes: {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    studentShare: number | null;
    mission: { id: string; title: string };
    student: string;
    company: string;
    openedBy: string;
  }[];
  stats: { open: number; inReview: number; resolved: number };
};

export function useMediatorDashboard() {
  return useQuery({
    queryKey: ["dashboard", "mediator"],
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const response = await fetch("/api/dashboard/mediator");
      if (!response.ok) throw new Error("Impossible de charger le dashboard.");
      return (await response.json()) as MediatorDashboard;
    },
  });
}
