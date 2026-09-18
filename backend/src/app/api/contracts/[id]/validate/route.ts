import { NextResponse } from "next/server";
import { ContractStatus, DeliverableStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { releaseContract } from "@/lib/settlement";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.COMPANY)
    return NextResponse.json(
      { error: "Accès réservé aux entreprises" },
      { status: 403 },
    );
  const { id: contractId } = await context.params;
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { deliverables: { orderBy: { submittedAt: "desc" }, take: 1 } },
  });
  if (!contract || contract.companyId !== session.user.id)
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  if (
    contract.status !== ContractStatus.DELIVERED ||
    contract.deliverables[0]?.status !== DeliverableStatus.SUBMITTED
  )
    return NextResponse.json(
      { error: "Aucun livrable en attente" },
      { status: 409 },
    );
  try {
    return NextResponse.json(await releaseContract(prisma, contractId));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Libération impossible",
      },
      { status: 409 },
    );
  }
}
