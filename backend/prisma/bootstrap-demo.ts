import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const companies = [
  ["contact@kora.tg", "Kora Services", "Kora Services SARL", "Services numériques"],
  ["bonjour@agroplus.tg", "AgroPlus Togo", "AgroPlus Togo", "Agroalimentaire"],
  ["hello@ateliermono.tg", "Atelier Mono", "Atelier Mono", "Création et culture"],
] as const;

const students = [
  ["amina.ayele@etu.tg", "Amina Ayélé", "Marketing"],
  ["kodjo.adje@etu.tg", "Kodjo Adje", "Développement web"],
  ["mariam.kossi@etu.tg", "Mariam Kossi", "Design graphique"],
  ["yawo.folly@etu.tg", "Yawo Folly", "Économie"],
  ["sena.bakali@etu.tg", "Sena Bakali", "Communication"],
  ["elom.koffi@etu.tg", "Elom Koffi", "Data"],
  ["espoir.togbe@etu.tg", "Espoir Togbé", "Développement web"],
  ["afia.amouzou@etu.tg", "Afia Amouzou", "Sociologie"],
] as const;

async function main() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("DEMO_PASSWORD must contain at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  for (const [email, name, legalName, sector] of companies) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: Role.COMPANY },
      create: { email, name, role: Role.COMPANY, passwordHash },
    });
    await prisma.companyProfile.upsert({
      where: { userId: user.id },
      update: { legalName, sector },
      create: {
        userId: user.id,
        legalName,
        sector,
        city: "Lomé",
        verified: true,
      },
    });
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  for (const [email, name, field] of students) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: Role.STUDENT },
      create: { email, name, role: Role.STUDENT, passwordHash },
    });
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: { school: "Université de Lomé", field },
      create: {
        userId: user.id,
        school: "Université de Lomé",
        field,
        level: "Licence 3",
        city: "Lomé",
        skills: [],
      },
    });
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  console.log("Comptes étudiants et entreprises prêts");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
