import { prisma } from "@/lib/prisma";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { serial },
    include: {
      user: { select: { name: true } },
      contract: { include: { mission: { select: { title: true } } } },
    },
  });
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <p className="text-sm font-medium text-emerald-700">
        {certificate ? "Attestation valide" : "Attestation introuvable"}
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Vérification StageLink</h1>
      {certificate && (
        <dl className="mt-8 space-y-3">
          <div>
            <dt className="font-medium">Étudiant</dt>
            <dd>{certificate.user.name}</dd>
          </div>
          <div>
            <dt className="font-medium">Mission</dt>
            <dd>{certificate.contract.mission.title}</dd>
          </div>
          <div>
            <dt className="font-medium">Numéro de série</dt>
            <dd>{certificate.serial}</dd>
          </div>
        </dl>
      )}
    </main>
  );
}
