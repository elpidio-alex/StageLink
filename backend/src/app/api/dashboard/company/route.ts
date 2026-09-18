import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.COMPANY)
    return NextResponse.json(
      { error: "Accès réservé aux entreprises" },
      { status: 403 },
    );

  const [profile, missions, contracts] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.mission.findMany({
      where: { companyId: session.user.id },
      include: {
        category: true,
        applications: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                studentProfile: { select: { field: true, city: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        contract: { select: { id: true, status: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contract.findMany({
      where: { companyId: session.user.id },
      include: {
        mission: { select: { id: true, title: true } },
        student: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  if (!profile)
    return NextResponse.json(
      { error: "Profil entreprise incomplet" },
      { status: 409 },
    );
  return NextResponse.json({
    profile: {
      legalName: profile.legalName,
      sector: profile.sector,
      city: profile.city,
      verified: profile.verified,
    },
    missions: missions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      status: mission.status,
      budget: mission.budget,
      category: mission.category.name,
      applicationCount: mission.applications.length,
      contract: mission.contract,
    })),
    applications: missions
      .flatMap((mission) =>
        mission.applications.map((application) => ({
          id: application.id,
          status: application.status,
          matchScore: application.matchScore,
          createdAt: application.createdAt,
          mission: { id: mission.id, title: mission.title },
          student: application.student,
        })),
      )
      .slice(0, 8),
    contracts: contracts.map((contract) => ({
      id: contract.id,
      status: contract.status,
      amount: contract.amount,
      mission: contract.mission,
      student: contract.student.name,
    })),
  });
}
