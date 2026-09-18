import { NextResponse } from "next/server";
import { ContractStatus, DeliverableStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deliverableInputSchema } from "@/lib/contract-validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.STUDENT)
    return NextResponse.json(
      { error: "Accès réservé aux étudiants" },
      { status: 403 },
    );
  const { id: contractId } = await context.params;
  const parsed = deliverableInputSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract || contract.studentId !== session.user.id)
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  if (
    contract.status !== ContractStatus.ACTIVE &&
    contract.status !== ContractStatus.DELIVERED
  )
    return NextResponse.json(
      { error: "Contrat non livrable" },
      { status: 409 },
    );
  const deliverable = await prisma.$transaction(async (tx) => {
    const created = await tx.deliverable.create({
      data: { ...parsed.data, contractId, status: DeliverableStatus.SUBMITTED },
    });
    await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.DELIVERED },
    });
    return created;
  });
  return NextResponse.json(deliverable, { status: 201 });
}
