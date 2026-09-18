import { useQuery } from "@tanstack/react-query";

export type CompanyDashboard = {
  profile: {
    legalName: string;
    sector: string;
    city: string;
    verified: boolean;
  };
  missions: {
    id: string;
    title: string;
    status: string;
    budget: number;
    category: string;
    applicationCount: number;
    contract: { id: string; status: string; amount: number } | null;
  }[];
  applications: {
    id: string;
    status: string;
    matchScore: number;
    createdAt: string;
    mission: { id: string; title: string };
    student: {
      id: string;
      name: string;
      email: string;
      studentProfile: { field: string; city: string } | null;
    };
  }[];
  contracts: {
    id: string;
    status: string;
    amount: number;
    mission: { id: string; title: string };
    student: string;
  }[];
};

export function useCompanyDashboard() {
  return useQuery({
    queryKey: ["dashboard", "company"],
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const response = await fetch("/api/dashboard/company");
      if (!response.ok) throw new Error("Impossible de charger le dashboard.");
      return (await response.json()) as CompanyDashboard;
    },
  });
}
