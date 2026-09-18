import {
  ContractStatus,
  DeliverableStatus,
  MissionStatus,
  PrismaClient,
} from "@prisma/client";
import { applyMovementsInTransaction, releasePlan } from "@/lib/ledger";

export async function releaseContract(
  client: PrismaClient,
  contractId: string,
) {
  const [contract, escrowUser, platformUser] = await Promise.all([
    client.contract.findUnique({
      where: { id: contractId },
      include: {
        deliverables: { orderBy: { submittedAt: "desc" }, take: 1 },
        mission: { include: { category: true } },
      },
    }),
    client.user.findUnique({ where: { email: "mediateur@stagelink.tg" } }),
    client.user.findUnique({ where: { email: "admin@stagelink.tg" } }),
  ]);
  if (!contract) throw new Error("Contrat introuvable");
  if (contract.status === ContractStatus.COMPLETED) return contract;
  if (
    contract.status !== ContractStatus.DELIVERED ||
    contract.deliverables[0]?.status !== DeliverableStatus.SUBMITTED
  )
    throw new Error("Contrat non éligible à la libération");
  const [escrowWallet, studentWallet, platformWallet] = await Promise.all([
    escrowUser
      ? client.wallet.findUnique({ where: { userId: escrowUser.id } })
      : null,
    client.wallet.findUnique({ where: { userId: contract.studentId } }),
    platformUser
      ? client.wallet.findUnique({ where: { userId: platformUser.id } })
      : null,
  ]);
  if (
    !escrowUser ||
    !platformUser ||
    !escrowWallet ||
    !studentWallet ||
    !platformWallet
  )
    throw new Error("Wallet technique indisponible");
  const movements = releasePlan(
    escrowWallet.id,
    studentWallet.id,
    platformWallet.id,
    escrowUser.id,
    contract.studentId,
    platformUser.id,
    contractId,
    contract.amount,
  );
  return client.$transaction(async (tx) => {
    await applyMovementsInTransaction(tx, movements);
    if (contract.deliverables[0])
      await tx.deliverable.update({
        where: { id: contract.deliverables[0].id },
        data: { status: DeliverableStatus.ACCEPTED, reviewedAt: new Date() },
      });
    await tx.mission.update({
      where: { id: contract.missionId },
      data: { status: MissionStatus.COMPLETED },
    });
    const completed = await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.COMPLETED, completedAt: new Date() },
    });
    const certificateCount = await tx.certificate.count();
    const serial = `SL-${new Date().getFullYear()}-${String(certificateCount + 1).padStart(4, "0")}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    await tx.certificate.create({
      data: {
        userId: contract.studentId,
        contractId,
        serial,
        title: contract.mission.title,
        verifyUrl: `/verify/${serial}`,
      },
    });
    const completedInCategory = await tx.contract.count({
      where: {
        studentId: contract.studentId,
        status: ContractStatus.COMPLETED,
        mission: { categoryId: contract.mission.categoryId },
      },
    });
    if (completedInCategory >= 3)
      await tx.badge.upsert({
        where: {
          userId_name: {
            userId: contract.studentId,
            name: `Expert ${contract.mission.category.name}`,
          },
        },
        update: {},
        create: {
          userId: contract.studentId,
          name: `Expert ${contract.mission.category.name}`,
          description: "Trois missions réussies dans cette catégorie.",
        },
      });
    return completed;
  });
}
