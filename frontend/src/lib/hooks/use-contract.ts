import { useQuery } from "@tanstack/react-query";

export type Contract = {
  id: string;
  amount: number;
  status: string;
  startedAt: string | null;
  autoReleaseAt: string | null;
  mission: {
    title: string;
    description: string;
    city: string;
    category: { name: string };
  };
  student: { id: string; name: string };
  company: { id: string; name: string };
  deliverables: {
    id: string;
    title: string;
    description: string;
    url: string | null;
    status: string;
    submittedAt: string;
  }[];
  messages: {
    id: string;
    body: string;
    createdAt: string;
    sender: { id: string; name: string; role: string };
  }[];
  disputes: { id: string; reason: string; status: string; createdAt: string }[];
};

export function useContract(id: string) {
  return useQuery({
    queryKey: ["contracts", id],
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${id}`);
      if (!response.ok) throw new Error("Impossible de charger le contrat.");
      return (await response.json()) as Contract;
    },
    enabled: Boolean(id),
  });
}
