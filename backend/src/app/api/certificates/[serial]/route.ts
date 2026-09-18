import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ serial: string }> },
) {
  const { serial } = await context.params;
  const certificate = await prisma.certificate.findUnique({
    where: { serial },
    include: {
      user: { select: { name: true } },
      contract: { include: { mission: { select: { title: true } } } },
    },
  });
  if (!certificate) return NextResponse.json({ valid: false }, { status: 404 });
  return NextResponse.json({
    valid: true,
    serial: certificate.serial,
    student: certificate.user.name,
    mission: certificate.contract.mission.title,
    issuedAt: certificate.issuedAt,
    verifyUrl: certificate.verifyUrl,
  });
}
