import { useQuery } from "@tanstack/react-query";

export type Mission = {
  id: string;
  title: string;
  description: string;
  city: string;
  estimatedHours: number;
  budget: number;
  deadline: string;
  category: { id: string; name: string };
  company: { name: string; companyProfile: { verified: boolean } | null };
};

export type MissionFilters = { categoryId?: string; city?: string };

async function fetchMissions(filters: MissionFilters) {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.city) params.set("city", filters.city);
  const response = await fetch(
    `/api/missions${params.size ? `?${params}` : ""}`,
  );
  if (!response.ok) throw new Error("Impossible de charger les missions.");
  return (await response.json()) as Mission[];
}

export function useMissions(filters: MissionFilters = {}) {
  return useQuery({
    queryKey: ["missions", filters],
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: () => fetchMissions(filters),
  });
}

export function useMission(id: string) {
  return useQuery({
    queryKey: ["missions", "detail", id],
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const response = await fetch("/api/missions");
      if (!response.ok) throw new Error("Impossible de charger la mission.");
      const missions = (await response.json()) as Mission[];
      const mission = missions.find((item) => item.id === id);
      if (!mission) throw new Error("Mission introuvable.");
      return mission;
    },
    enabled: Boolean(id),
  });
}
