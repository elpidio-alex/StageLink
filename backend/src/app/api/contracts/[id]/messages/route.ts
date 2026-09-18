import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { messageInputSchema } from "@stagelink/shared";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== Role.STUDENT &&
      session.user.role !== Role.COMPANY &&
      session.user.role !== Role.MEDIATOR)
  )
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id: contractId } = await context.params;
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (
    !contract ||
    (session.user.role !== Role.MEDIATOR &&
      contract.studentId !== session.user.id &&
      contract.companyId !== session.user.id)
  )
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  return NextResponse.json(
    await prisma.message.findMany({
      where: { contractId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    }),
  );
}

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
      { error: "Accès réservé aux parties" },
      { status: 403 },
    );
  const { id: contractId } = await context.params;
  const parsed = messageInputSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (
    !contract ||
    (contract.studentId !== session.user.id &&
      contract.companyId !== session.user.id)
  )
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  return NextResponse.json(
    await prisma.message.create({
      data: { contractId, senderId: session.user.id, body: parsed.data.body },
    }),
    { status: 201 },
  );
}
