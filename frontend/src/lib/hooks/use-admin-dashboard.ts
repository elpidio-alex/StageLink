import { useQuery } from "@tanstack/react-query";

export type AdminDashboard = {
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
  missions: {
    id: string;
    title: string;
    status: string;
    budget: number;
    createdAt: string;
    company: { name: string };
  }[];
  contracts: {
    id: string;
    status: string;
    amount: number;
    createdAt: string;
    mission: { title: string };
    student: { name: string };
    company: { name: string };
  }[];
  payments: {
    id: string;
    amount: number;
    status: string;
    provider: string;
    createdAt: string;
  }[];
  disputes: {
    id: string;
    status: string;
    reason: string;
    createdAt: string;
    contract: { mission: { title: string } };
  }[];
  stats: {
    users: number;
    students: number;
    companies: number;
    publishedMissions: number;
    activeContracts: number;
    openDisputes: number;
    successfulPayments: number;
  };
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const response = await fetch("/api/dashboard/admin");
      if (!response.ok)
        throw new Error("Impossible de charger le back-office.");
      return (await response.json()) as AdminDashboard;
    },
  });
}
