import { NextResponse } from "next/server";
import { ApplicationStatus, MissionStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  applicationInputSchema,
  calculateMatchScore,
} from "@/lib/mission-validation";

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
  const { id: missionId } = await context.params;
  const parsed = applicationInputSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      applications: { where: { studentId: session.user.id } },
      category: true,
    },
  });
  if (!mission || mission.status !== MissionStatus.PUBLISHED)
    return NextResponse.json(
      { error: "Mission indisponible" },
      { status: 404 },
    );
  if (mission.applications.length)
    return NextResponse.json(
      { error: "Vous avez déjà candidaté" },
      { status: 409 },
    );
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { availability: true },
  });
  if (!profile)
    return NextResponse.json(
      { error: "Profil étudiant incomplet" },
      { status: 400 },
    );
  const availableHours = profile.availability.reduce(
    (total, slot) => total + Math.max(0, slot.endHour - slot.startHour),
    0,
  );
  const matchScore = calculateMatchScore(
    mission.requiredSkills,
    profile.skills,
    mission.estimatedHours,
    availableHours,
  );
  const application = await prisma.application.create({
    data: {
      missionId,
      studentId: session.user.id,
      coverLetter: parsed.data.coverLetter,
      matchScore,
      status: ApplicationStatus.PENDING,
    },
  });
  await createNotification(
    prisma,
    mission.companyId,
    "Nouvelle candidature",
    `Une nouvelle candidature a été reçue pour « ${mission.title} ».`,
  );
  return NextResponse.json(application, { status: 201 });
}
