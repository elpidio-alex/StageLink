import { useQuery } from "@tanstack/react-query";

export type StudentDashboard = {
  profile: { school: string; field: string; level: string; city: string };
  wallet: { balance: number };
  stats: { activeContracts: number; pendingApplications: number };
  applications: {
    id: string;
    status: string;
    matchScore: number;
    createdAt: string;
    mission: { id: string; title: string; category: string; company: string };
  }[];
  contracts: {
    id: string;
    status: string;
    amount: number;
    mission: { id: string; title: string; city: string };
    deliverableStatus: string | null;
  }[];
};

export function useStudentDashboard() {
  return useQuery({
    queryKey: ["dashboard", "student"],
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const response = await fetch("/api/dashboard/student");
      if (!response.ok) throw new Error("Impossible de charger le dashboard.");
      return (await response.json()) as StudentDashboard;
    },
  });
}
