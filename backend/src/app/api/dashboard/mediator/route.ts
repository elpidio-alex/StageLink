import { NextResponse } from "next/server";
import { DisputeStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.MEDIATOR)
    return NextResponse.json(
      { error: "Accès réservé aux médiateurs" },
      { status: 403 },
    );
  const disputes = await prisma.dispute.findMany({
    include: {
      contract: {
        include: {
          mission: { select: { id: true, title: true } },
          student: { select: { name: true } },
          company: { select: { name: true } },
        },
      },
      openedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    disputes: disputes.map((dispute) => ({
      id: dispute.id,
      reason: dispute.reason,
      status: dispute.status,
      createdAt: dispute.createdAt,
      studentShare: dispute.studentShare,
      mission: dispute.contract.mission,
      student: dispute.contract.student.name,
      company: dispute.contract.company.name,
      openedBy: dispute.openedBy.name,
    })),
    stats: {
      open: disputes.filter((dispute) => dispute.status === DisputeStatus.OPEN)
        .length,
      inReview: disputes.filter(
        (dispute) => dispute.status === DisputeStatus.IN_REVIEW,
      ).length,
      resolved: disputes.filter(
        (dispute) => dispute.status === DisputeStatus.RESOLVED,
      ).length,
    },
  });
}
