import { NextResponse } from "next/server";
import {
  ApplicationStatus,
  ContractStatus,
  LedgerDirection,
  Role,
} from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.STUDENT)
    return NextResponse.json(
      { error: "Accès réservé aux étudiants" },
      { status: 403 },
    );

  const [profile, applications, contracts, wallet] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.application.findMany({
      where: { studentId: session.user.id },
      include: {
        mission: {
          include: { category: true, company: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.contract.findMany({
      where: { studentId: session.user.id },
      include: {
        mission: { select: { id: true, title: true, city: true } },
        deliverables: { orderBy: { submittedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
  ]);

  if (!profile)
    return NextResponse.json(
      { error: "Profil étudiant incomplet" },
      { status: 409 },
    );
  let balance = 0;
  if (wallet) {
    const [credits, debits] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, direction: LedgerDirection.CREDIT },
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { walletId: wallet.id, direction: LedgerDirection.DEBIT },
        _sum: { amount: true },
      }),
    ]);
    balance = (credits._sum.amount ?? 0) - (debits._sum.amount ?? 0);
  }

  return NextResponse.json({
    profile: {
      school: profile.school,
      field: profile.field,
      level: profile.level,
      city: profile.city,
    },
    wallet: { balance },
    applications: applications.map((application) => ({
      id: application.id,
      status: application.status,
      matchScore: application.matchScore,
      createdAt: application.createdAt,
      mission: {
        id: application.mission.id,
        title: application.mission.title,
        category: application.mission.category.name,
        company: application.mission.company.name,
      },
    })),
    contracts: contracts.map((contract) => ({
      id: contract.id,
      status: contract.status,
      amount: contract.amount,
      mission: contract.mission,
      deliverableStatus: contract.deliverables[0]?.status ?? null,
    })),
    stats: {
      activeContracts: contracts.filter((contract) =>
        (
          [
            ContractStatus.ACTIVE,
            ContractStatus.DELIVERED,
            ContractStatus.DISPUTED,
          ] as ContractStatus[]
        ).includes(contract.status),
      ).length,
      pendingApplications: applications.filter(
        (application) => application.status === ApplicationStatus.PENDING,
      ).length,
    },
  });
}
