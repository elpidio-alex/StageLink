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
  if (!certificate)
    return new Response("Attestation introuvable", { status: 404 });
  const escapePdf = (value: string) =>
    value
      .replaceAll("\\", "\\\\")
      .replaceAll("(", "\\(")
      .replaceAll(")", "\\)");
  const lines = [
    `StageLink - Attestation de réussite`,
    `Étudiant : ${certificate.user.name}`,
    `Mission : ${certificate.contract.mission.title}`,
    `Série : ${certificate.serial}`,
    `Vérification : /verify/${certificate.serial}`,
  ];
  const stream = `BT /F1 16 Tf 72 720 Td (${escapePdf(lines[0])}) Tj 0 -36 Td /F1 11 Tf ${lines
    .slice(1)
    .map((line) => `(${escapePdf(line)}) Tj 0 -24 Td`)
    .join(" ")} ET`;
  const objects = [
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,
    `4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n `)
    .join(
      "\n",
    )}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Response(new TextEncoder().encode(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${certificate.serial}.pdf"`,
    },
  });
}
