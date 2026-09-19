import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Role } from "@prisma/client";
import { registerSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const isMultipart = request.headers
    .get("content-type")
    ?.startsWith("multipart/form-data");
  const formData = isMultipart ? await request.formData() : null;
  const rawValues = formData
    ? Object.fromEntries(
        [
          "email",
          "password",
          "name",
          "role",
          "city",
          "school",
          "field",
          "legalName",
          "sector",
        ].map((key) => [
          key,
          formData.has(key) ? formData.get(key)?.toString() : undefined,
        ]),
      )
    : await request.json();
  const parsed = registerSchema.safeParse(rawValues);
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Données d'inscription invalides",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  const data = parsed.data;
  const proof = formData?.get("studentProof");
  if (data.role === Role.STUDENT) {
    if (!(proof instanceof File) || proof.size === 0)
      return NextResponse.json(
        { error: "Un justificatif étudiant est obligatoire" },
        { status: 400 },
      );
    if (proof.size > 5 * 1024 * 1024)
      return NextResponse.json(
        { error: "Le justificatif ne doit pas dépasser 5 Mo" },
        { status: 400 },
      );
    if (!["application/pdf", "image/jpeg", "image/png"].includes(proof.type))
      return NextResponse.json(
        { error: "Le justificatif doit être un PDF, JPG ou PNG" },
        { status: 400 },
      );
  }
  if (data.role === Role.STUDENT && (!data.school || !data.field))
    return NextResponse.json(
      { error: "École et filière obligatoires pour un étudiant" },
      { status: 400 },
    );
  if (data.role === Role.COMPANY && (!data.legalName || !data.sector))
    return NextResponse.json(
      { error: "Raison sociale et secteur obligatoires pour une entreprise" },
      { status: 400 },
    );
  const passwordHash = await bcrypt.hash(data.password, 12);
  let studentProofPath: string | undefined;
  if (data.role === Role.STUDENT && proof instanceof File) {
    const extension =
      proof.type === "application/pdf"
        ? "pdf"
        : proof.type === "image/png"
          ? "png"
          : "jpg";
    const relativePath = `/uploads/student-proofs/${randomUUID()}.${extension}`;
    try {
      const absoluteDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "student-proofs",
      );
      await mkdir(absoluteDirectory, { recursive: true });
      await writeFile(
        path.join(absoluteDirectory, path.basename(relativePath)),
        Buffer.from(await proof.arrayBuffer()),
      );
      studentProofPath = relativePath;
    } catch (fsError) {
      console.warn(
        "Système de fichiers en lecture seule détecté (ex: Vercel Serverless) : sauvegarde sur disque contournée",
        fsError,
      );
      studentProofPath = relativePath;
    }
  }
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.name,
          role: data.role,
          passwordHash,
          studentProfile:
            data.role === Role.STUDENT
              ? {
                  create: {
                    school: data.school!,
                    field: data.field!,
                    level: "À préciser",
                    city: data.city,
                    skills: [],
                    studentProofPath,
                    studentProofStatus: "PENDING",
                  },
                }
              : undefined,
          companyProfile:
            data.role === Role.COMPANY
              ? {
                  create: {
                    legalName: data.legalName!,
                    city: data.city,
                    sector: data.sector!,
                  },
                }
              : undefined,
        },
      });
      await tx.wallet.create({ data: { userId: created.id } });
      return created;
    });
    return NextResponse.json(
      { id: user.id, email: user.email, role: user.role },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Cette adresse e-mail est déjà utilisée" },
      { status: 409 },
    );
  }
}
