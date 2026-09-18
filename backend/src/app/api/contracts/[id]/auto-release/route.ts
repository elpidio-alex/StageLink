import { NextResponse } from "next/server";
import { ContractStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { releaseContract } from "@/lib/settlement";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN)
    return NextResponse.json(
      { error: "Accès réservé aux administrateurs" },
      { status: 403 },
    );
  const { id } = await context.params;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (
    !contract ||
    contract.status !== ContractStatus.DELIVERED ||
    !contract.autoReleaseAt ||
    contract.autoReleaseAt > new Date()
  ) {
    return NextResponse.json(
      { error: "Contrat non éligible à l'auto-release" },
      { status: 409 },
    );
  }
  try {
    return NextResponse.json(await releaseContract(prisma, id));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Auto-release impossible",
      },
      { status: 409 },
    );
  }
}
