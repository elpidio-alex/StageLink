import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await context.params;
  const result = await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { readAt: new Date() },
  });
  if (!result.count)
    return NextResponse.json(
      { error: "Notification introuvable" },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
