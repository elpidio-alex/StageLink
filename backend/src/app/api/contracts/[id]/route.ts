import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (
    !session?.user ||
    !([Role.STUDENT, Role.COMPANY, Role.MEDIATOR] as Role[]).includes(
      session.user.role,
    )
  )
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id } = await context.params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      mission: { include: { category: true } },
      student: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      deliverables: { orderBy: { submittedAt: "desc" } },
      messages: {
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      disputes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (
    !contract ||
    (session.user.role !== Role.MEDIATOR &&
      contract.studentId !== session.user.id &&
      contract.companyId !== session.user.id)
  )
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  return NextResponse.json(contract);
}
