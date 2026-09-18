import { NextResponse } from "next/server";
import { MissionStatus, Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { missionInputSchema } from "@/lib/mission-validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId");
  const city = url.searchParams.get("city");
  const missions = await prisma.mission.findMany({
    where: {
      status: MissionStatus.PUBLISHED,
      ...(categoryId ? { categoryId } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    },
    include: {
      category: true,
      company: {
        select: { name: true, companyProfile: { select: { verified: true } } },
      },
    },
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json(missions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.COMPANY)
    return NextResponse.json(
      { error: "Accès réservé aux entreprises" },
      { status: 403 },
    );
  const parsed = missionInputSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  if (parsed.data.deadline <= new Date())
    return NextResponse.json(
      { error: "La date limite doit être future" },
      { status: 400 },
    );
  const mission = await prisma.mission.create({
    data: {
      ...parsed.data,
      companyId: session.user.id,
      status: MissionStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });
  return NextResponse.json(mission, { status: 201 });
}
