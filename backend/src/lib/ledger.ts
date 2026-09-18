import {
  LedgerDirection,
  LedgerEntryType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

export type LedgerMovement = {
  walletId: string;
  userId: string;
  contractId?: string;
  type: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  reference: string;
  description?: string;
};

export const commissionFor = (amount: number, rate = 8) => {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new Error("Le montant doit être un entier positif");
  if (!Number.isInteger(rate) || rate < 0 || rate > 100)
    throw new Error("Le taux de commission est invalide");
  return Math.floor((amount * rate) / 100);
};

export const signedAmount = (
  movement: Pick<LedgerMovement, "direction" | "amount">,
) =>
  movement.direction === LedgerDirection.CREDIT
    ? movement.amount
    : -movement.amount;

export const assertBalanced = (movements: LedgerMovement[]) => {
  const total = movements.reduce(
    (sum, movement) => sum + signedAmount(movement),
    0,
  );
  if (total !== 0) throw new Error(`Mouvements déséquilibrés: ${total}`);
};

export function depositPlan(
  walletId: string,
  userId: string,
  amount: number,
  reference: string,
): LedgerMovement[] {
  if (!reference) throw new Error("La référence est obligatoire");
  const movements = [
    {
      walletId,
      userId,
      type: LedgerEntryType.DEPOSIT,
      direction: LedgerDirection.CREDIT,
      amount,
      reference,
    },
  ];
  assertBalanced([
    { ...movements[0], direction: LedgerDirection.CREDIT },
    {
      ...movements[0],
      direction: LedgerDirection.DEBIT,
      reference: `${reference}:counterpart`,
      type: LedgerEntryType.DEPOSIT,
    },
  ]);
  return movements;
}

export function holdPlan(
  companyWalletId: string,
  escrowWalletId: string,
  companyId: string,
  escrowUserId: string,
  contractId: string,
  amount: number,
): LedgerMovement[] {
  const movements: LedgerMovement[] = [
    {
      walletId: companyWalletId,
      userId: companyId,
      contractId,
      type: LedgerEntryType.ESCROW_HOLD,
      direction: LedgerDirection.DEBIT,
      amount,
      reference: `hold:${contractId}:company`,
    },
    {
      walletId: escrowWalletId,
      userId: escrowUserId,
      contractId,
      type: LedgerEntryType.ESCROW_HOLD,
      direction: LedgerDirection.CREDIT,
      amount,
      reference: `hold:${contractId}:escrow`,
    },
  ];
  assertBalanced(movements);
  return movements;
}

export function releasePlan(
  escrowWalletId: string,
  studentWalletId: string,
  platformWalletId: string,
  escrowUserId: string,
  studentId: string,
  platformId: string,
  contractId: string,
  amount: number,
  rate = 8,
): LedgerMovement[] {
  const commission = commissionFor(amount, rate);
  const movements: LedgerMovement[] = [
    {
      walletId: escrowWalletId,
      userId: escrowUserId,
      contractId,
      type: LedgerEntryType.ESCROW_RELEASE,
      direction: LedgerDirection.DEBIT,
      amount,
      reference: `release:${contractId}:escrow`,
    },
    {
      walletId: studentWalletId,
      userId: studentId,
      contractId,
      type: LedgerEntryType.ESCROW_RELEASE,
      direction: LedgerDirection.CREDIT,
      amount: amount - commission,
      reference: `release:${contractId}:student`,
    },
    {
      walletId: platformWalletId,
      userId: platformId,
      contractId,
      type: LedgerEntryType.COMMISSION,
      direction: LedgerDirection.CREDIT,
      amount: commission,
      reference: `release:${contractId}:platform`,
    },
  ];
  assertBalanced(movements);
  return movements;
}

export function refundPlan(
  escrowWalletId: string,
  companyWalletId: string,
  escrowUserId: string,
  companyId: string,
  contractId: string,
  amount: number,
): LedgerMovement[] {
  const movements: LedgerMovement[] = [
    {
      walletId: escrowWalletId,
      userId: escrowUserId,
      contractId,
      type: LedgerEntryType.REFUND,
      direction: LedgerDirection.DEBIT,
      amount,
      reference: `refund:${contractId}:escrow`,
    },
    {
      walletId: companyWalletId,
      userId: companyId,
      contractId,
      type: LedgerEntryType.REFUND,
      direction: LedgerDirection.CREDIT,
      amount,
      reference: `refund:${contractId}:company`,
    },
  ];
  assertBalanced(movements);
  return movements;
}

async function appendMovement(
  tx: Prisma.TransactionClient,
  movement: LedgerMovement,
) {
  if (!Number.isSafeInteger(movement.amount) || movement.amount <= 0)
    throw new Error("Le montant doit être un entier positif");
  const existing = await tx.ledgerEntry.findUnique({
    where: { reference: movement.reference },
  });
  if (existing) return existing;
  const [credits, debits] = await Promise.all([
    tx.ledgerEntry.aggregate({
      where: { walletId: movement.walletId, direction: LedgerDirection.CREDIT },
      _sum: { amount: true },
    }),
    tx.ledgerEntry.aggregate({
      where: { walletId: movement.walletId, direction: LedgerDirection.DEBIT },
      _sum: { amount: true },
    }),
  ]);
  const currentBalance = (credits._sum.amount ?? 0) - (debits._sum.amount ?? 0);
  if (currentBalance + signedAmount(movement) < 0)
    throw new Error("Solde disponible insuffisant");
  return tx.ledgerEntry.create({ data: movement });
}

export async function applyDeposit(
  client: PrismaClient,
  movement: LedgerMovement,
) {
  if (
    movement.direction !== LedgerDirection.CREDIT ||
    movement.type !== LedgerEntryType.DEPOSIT
  )
    throw new Error("Écriture de dépôt invalide");
  return client.$transaction(async (tx) => appendMovement(tx, movement));
}

export async function applyMovementsInTransaction(
  tx: Prisma.TransactionClient,
  movements: LedgerMovement[],
) {
  assertBalanced(movements);
  const applied = [];
  for (const movement of movements)
    applied.push(await appendMovement(tx, movement));
  return applied;
}

export async function applyMovements(
  client: PrismaClient,
  movements: LedgerMovement[],
) {
  assertBalanced(movements);
  return client.$transaction(async (tx) => {
    return applyMovementsInTransaction(tx, movements);
  });
}

export async function walletBalance(client: PrismaClient, walletId: string) {
  const [credits, debits] = await Promise.all([
    client.ledgerEntry.aggregate({
      where: { walletId, direction: LedgerDirection.CREDIT },
      _sum: { amount: true },
    }),
    client.ledgerEntry.aggregate({
      where: { walletId, direction: LedgerDirection.DEBIT },
      _sum: { amount: true },
    }),
  ]);
  return (credits._sum.amount ?? 0) - (debits._sum.amount ?? 0);
}
export function disputePlan(
  escrowWalletId: string,
  studentWalletId: string,
  companyWalletId: string,
  escrowUserId: string,
  studentId: string,
  companyId: string,
  contractId: string,
  amount: number,
  studentShare: number,
): LedgerMovement[] {
  if (!Number.isInteger(studentShare) || studentShare < 0 || studentShare > 100)
    throw new Error("La part étudiant doit être comprise entre 0 et 100");
  const studentAmount = Math.floor((amount * studentShare) / 100);
  const movements: LedgerMovement[] = [
    {
      walletId: escrowWalletId,
      userId: escrowUserId,
      contractId,
      type: LedgerEntryType.DISPUTE_PAYOUT,
      direction: LedgerDirection.DEBIT,
      amount,
      reference: `dispute:${contractId}:escrow`,
    },
    {
      walletId: studentWalletId,
      userId: studentId,
      contractId,
      type: LedgerEntryType.DISPUTE_PAYOUT,
      direction: LedgerDirection.CREDIT,
      amount: studentAmount,
      reference: `dispute:${contractId}:student`,
    },
    {
      walletId: companyWalletId,
      userId: companyId,
      contractId,
      type: LedgerEntryType.DISPUTE_PAYOUT,
      direction: LedgerDirection.CREDIT,
      amount: amount - studentAmount,
      reference: `dispute:${contractId}:company`,
    },
  ];
  assertBalanced(movements);
  return movements;
}
