import { NextResponse } from "next/server";
import { ContractStatus, DisputeStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { disputeInputSchema } from "@/lib/contract-validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== Role.STUDENT && session.user.role !== Role.COMPANY)
  )
    return NextResponse.json(
      { error: "Accès réservé aux parties du contrat" },
      { status: 403 },
    );
  const { id: contractId } = await context.params;
  const parsed = disputeInputSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (
    !contract ||
    (contract.studentId !== session.user.id &&
      contract.companyId !== session.user.id)
  )
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  if (contract.status === ContractStatus.COMPLETED)
    return NextResponse.json(
      { error: "Un contrat terminé ne peut plus être contesté" },
      { status: 409 },
    );
  const dispute = await prisma.$transaction(async (tx) => {
    const created = await tx.dispute.create({
      data: {
        contractId,
        openedById: session.user.id,
        reason: parsed.data.reason,
        status: DisputeStatus.OPEN,
      },
    });
    await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.DISPUTED },
    });
    await tx.mission.update({
      where: { id: contract.missionId },
      data: { status: "DISPUTED" },
    });
    return created;
  });
  return NextResponse.json(dispute, { status: 201 });
}
