import { NextResponse } from "next/server";
import { LedgerDirection, LedgerEntryType, Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { applyDeposit } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

const depositSchema = z.object({
  amount: z.number().int().positive().max(100000000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.COMPANY)
    return NextResponse.json(
      { error: "Accès réservé aux entreprises" },
      { status: 403 },
    );
  const parsed = depositSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  });
  if (!wallet)
    return NextResponse.json({ error: "Wallet introuvable" }, { status: 404 });
  const entry = await applyDeposit(prisma, {
    walletId: wallet.id,
    userId: session.user.id,
    type: LedgerEntryType.DEPOSIT,
    direction: LedgerDirection.CREDIT,
    amount: parsed.data.amount,
    reference: `deposit:mock:${session.user.id}:${parsed.data.amount}`,
  });
  return NextResponse.json(
    { id: entry.id, amount: entry.amount, provider: "MOCK" },
    { status: 201 },
  );
}
