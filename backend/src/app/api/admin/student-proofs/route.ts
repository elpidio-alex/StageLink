import { NextResponse } from "next/server";
import { Role, StudentProofStatus } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const decisionSchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN)
    return NextResponse.json(
      { error: "Accès réservé aux administrateurs" },
      { status: 403 },
    );
  const proofs = await prisma.studentProfile.findMany({
    where: { studentProofPath: { not: null } },
    select: {
      id: true,
      studentProofPath: true,
      studentProofStatus: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { createdAt: "desc" } },
  });
  return NextResponse.json(proofs);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN)
    return NextResponse.json(
      { error: "Accès réservé aux administrateurs" },
      { status: 403 },
    );
  const body = await request.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  const studentProfileId =
    typeof body?.studentProfileId === "string" ? body.studentProfileId : null;
  if (!parsed.success || !studentProfileId)
    return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
  const profile = await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { studentProofStatus: parsed.data.status as StudentProofStatus },
    select: { userId: true, studentProofStatus: true },
  });
  await createNotification(
    prisma,
    profile.userId,
    parsed.data.status === "APPROVED"
      ? "Justificatif approuvé"
      : "Justificatif refusé",
    parsed.data.status === "APPROVED"
      ? "Ton statut étudiant a été vérifié."
      : "Ton justificatif étudiant doit être remplacé.",
  );
  return NextResponse.json(profile);
}
