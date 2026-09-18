import { NextResponse } from "next/server";
import { ApplicationStatus, Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const decisionSchema = z.object({
  decision: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.COMPANY)
    return NextResponse.json(
      { error: "Accès réservé aux entreprises" },
      { status: 403 },
    );

  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Décision invalide" }, { status: 400 });

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: { mission: { select: { companyId: true, title: true } } },
  });
  if (!application || application.mission.companyId !== session.user.id)
    return NextResponse.json(
      { error: "Candidature introuvable" },
      { status: 404 },
    );
  if (application.status !== ApplicationStatus.PENDING)
    return NextResponse.json(
      { error: "Cette candidature a déjà été traitée" },
      { status: 409 },
    );

  const updated = await prisma.application.update({
    where: { id },
    data: { status: parsed.data.decision as ApplicationStatus },
  });
  await createNotification(
    prisma,
    application.studentId,
    parsed.data.decision === "ACCEPTED"
      ? "Candidature acceptée"
      : "Candidature refusée",
    `Ta candidature pour « ${application.mission.title} » a été ${parsed.data.decision === "ACCEPTED" ? "acceptée" : "refusée"}.`,
  );
  return NextResponse.json({ id: updated.id, status: updated.status });
}
