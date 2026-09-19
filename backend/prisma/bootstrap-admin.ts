import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function ensurePlatformUser(
  email: string,
  password: string,
  role: Role,
  name: string,
) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, name, role, passwordHash },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
}

async function main() {
  const adminEmail =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "admin@stagelink.tg";
  const adminPassword = process.env.ADMIN_PASSWORD;
  const mediatorEmail =
    process.env.MEDIATOR_EMAIL?.trim().toLowerCase() ??
    "mediateur@stagelink.tg";
  const mediatorPassword = process.env.MEDIATOR_PASSWORD;

  if (!adminPassword || !mediatorPassword) {
    throw new Error(
      "ADMIN_PASSWORD and MEDIATOR_PASSWORD must be set",
    );
  }
  if (adminPassword.length < 8 || mediatorPassword.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD and MEDIATOR_PASSWORD must contain at least 8 characters",
    );
  }

  await ensurePlatformUser(
    adminEmail,
    adminPassword,
    Role.ADMIN,
    "Administrateur StageLink",
  );
  await ensurePlatformUser(
    mediatorEmail,
    mediatorPassword,
    Role.MEDIATOR,
    "Médiateur StageLink",
  );

  console.log(`Comptes plateforme prêts : ${adminEmail}, ${mediatorEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
