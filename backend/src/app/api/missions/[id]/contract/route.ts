import { NextResponse } from "next/server";
import {
  ApplicationStatus,
  ContractStatus,
  MissionStatus,
  Role,
} from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import {
  applyMovementsInTransaction,
  holdPlan,
  walletBalance,
} from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

const contractSchema = z.object({ studentId: z.string().cuid() });

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
  const { id: missionId } = await context.params;
  const parsed = contractSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Candidat invalide" }, { status: 400 });
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { contract: true },
  });
  const application = await prisma.application.findUnique({
    where: {
      missionId_studentId: { missionId, studentId: parsed.data.studentId },
    },
  });
  const [companyWallet, escrowWallet] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.user.id } }),
    prisma.wallet.findUnique({
      where: {
        userId: (
          await prisma.user.findUniqueOrThrow({
            where: { email: "mediateur@stagelink.tg" },
          })
        ).id,
      },
    }),
  ]);
  if (
    !mission ||
    mission.companyId !== session.user.id ||
    mission.status !== MissionStatus.PUBLISHED ||
    mission.contract
  )
    return NextResponse.json(
      { error: "Mission indisponible" },
      { status: 409 },
    );
  if (!application || application.status !== ApplicationStatus.ACCEPTED)
    return NextResponse.json(
      { error: "Candidature non acceptée" },
      { status: 409 },
    );
  if (
    !companyWallet ||
    !escrowWallet ||
    (await walletBalance(prisma, companyWallet.id)) < mission.budget
  )
    return NextResponse.json(
      { error: "Solde entreprise insuffisant" },
      { status: 409 },
    );
  const contract = await prisma.$transaction(async (tx) => {
    const created = await tx.contract.create({
      data: {
        missionId,
        studentId: parsed.data.studentId,
        companyId: session.user.id,
        amount: mission.budget,
        status: ContractStatus.ACTIVE,
        startedAt: new Date(),
        autoReleaseAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    await applyMovementsInTransaction(
      tx,
      holdPlan(
        companyWallet.id,
        escrowWallet.id,
        session.user.id,
        escrowWallet.userId,
        created.id,
        mission.budget,
      ),
    );
    await tx.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.ACCEPTED },
    });
    await tx.mission.update({
      where: { id: missionId },
      data: { status: MissionStatus.ASSIGNED },
    });
    return created;
  });
  return NextResponse.json(contract, { status: 201 });
}
