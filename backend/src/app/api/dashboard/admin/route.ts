import { NextResponse } from "next/server";
import {
  ContractStatus,
  DisputeStatus,
  MissionStatus,
  PaymentStatus,
  Role,
} from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN)
    return NextResponse.json(
      { error: "Accès réservé aux administrateurs" },
      { status: 403 },
    );

  const [users, missions, contracts, payments, disputes] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.mission.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        createdAt: true,
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.contract.findMany({
      select: {
        id: true,
        status: true,
        amount: true,
        createdAt: true,
        mission: { select: { title: true } },
        student: { select: { name: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        provider: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.dispute.findMany({
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        contract: { select: { mission: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return NextResponse.json({
    users,
    missions,
    contracts,
    payments,
    disputes,
    stats: {
      users: users.length,
      students: users.filter((user) => user.role === Role.STUDENT).length,
      companies: users.filter((user) => user.role === Role.COMPANY).length,
      publishedMissions: missions.filter(
        (mission) => mission.status === MissionStatus.PUBLISHED,
      ).length,
      activeContracts: contracts.filter((contract) =>
        (
          [
            ContractStatus.ACTIVE,
            ContractStatus.DELIVERED,
            ContractStatus.DISPUTED,
          ] as ContractStatus[]
        ).includes(contract.status),
      ).length,
      openDisputes: disputes.filter((dispute) =>
        (
          [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW] as DisputeStatus[]
        ).includes(dispute.status),
      ).length,
      successfulPayments: payments.filter(
        (payment) => payment.status === PaymentStatus.SUCCEEDED,
      ).length,
    },
  });
}
