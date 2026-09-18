import { ContractWorkspace } from "@/components/contracts/contract-workspace";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContractWorkspace id={id} />;
}
