import { NextResponse } from "next/server";
import {
  ContractStatus,
  DisputeStatus,
  MissionStatus,
  Role,
} from "@prisma/client";
import { decisionInputSchema } from "@/lib/validations";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applyMovementsInTransaction, disputePlan } from "@/lib/ledger";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.MEDIATOR)
    return NextResponse.json(
      { error: "Accès réservé aux médiateurs" },
      { status: 403 },
    );
  const { id } = await context.params;
  const parsed = decisionInputSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Décision invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: { contract: true },
  });
  if (!dispute || dispute.status === DisputeStatus.RESOLVED)
    return NextResponse.json(
      { error: "Litige introuvable ou déjà résolu" },
      { status: 404 },
    );
  const [escrowWallet, studentWallet, companyWallet] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.wallet.findUnique({ where: { userId: dispute.contract.studentId } }),
    prisma.wallet.findUnique({ where: { userId: dispute.contract.companyId } }),
  ]);
  if (!escrowWallet || !studentWallet || !companyWallet)
    return NextResponse.json(
      { error: "Wallet requis indisponible" },
      { status: 409 },
    );
  const movements = disputePlan(
    escrowWallet.id,
    studentWallet.id,
    companyWallet.id,
    session.user.id,
    dispute.contract.studentId,
    dispute.contract.companyId,
    dispute.contractId,
    dispute.contract.amount,
    parsed.data.studentShare,
  );
  const resolved = await prisma.$transaction(async (tx) => {
    await applyMovementsInTransaction(tx, movements);
    await tx.dispute.update({
      where: { id },
      data: {
        status: DisputeStatus.RESOLVED,
        resolvedById: session.user.id,
        studentShare: parsed.data.studentShare,
        decisionNote: parsed.data.decisionNote,
        resolvedAt: new Date(),
      },
    });
    await tx.mission.update({
      where: { id: dispute.contract.missionId },
      data: { status: MissionStatus.COMPLETED },
    });
    return tx.contract.update({
      where: { id: dispute.contractId },
      data: { status: ContractStatus.COMPLETED, completedAt: new Date() },
    });
  });
  return NextResponse.json(resolved);
}
