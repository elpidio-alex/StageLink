import bcrypt from "bcryptjs";
import {
  ApplicationStatus,
  ContractStatus,
  MissionStatus,
  PaymentStatus,
  PrismaClient,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();
const fromNow = (days: number) => new Date(Date.now() + days * 86400000);

async function main() {
  await prisma.$transaction(
    async (tx) => {
      await tx.notification.deleteMany();
      await tx.badge.deleteMany();
      await tx.certificate.deleteMany();
      await tx.review.deleteMany();
      await tx.dispute.deleteMany();
      await tx.payment.deleteMany();
      await tx.ledgerEntry.deleteMany();
      await tx.wallet.deleteMany();
      await tx.message.deleteMany();
      await tx.deliverable.deleteMany();
      await tx.contract.deleteMany();
      await tx.application.deleteMany();
      await tx.mission.deleteMany();
      await tx.availability.deleteMany();
      await tx.studentProfile.deleteMany();
      await tx.companyProfile.deleteMany();
      await tx.category.deleteMany();
      await tx.session.deleteMany();
      await tx.account.deleteMany();
      await tx.user.deleteMany();

      const passwordHash = await bcrypt.hash("StageLink2026!", 12);
      await tx.user.createMany({
        data: [
          {
            email: "mediateur@stagelink.tg",
            name: "Médiateur StageLink",
            role: Role.MEDIATOR,
            passwordHash,
          },
          {
            email: "admin@stagelink.tg",
            name: "Administrateur StageLink",
            role: Role.ADMIN,
            passwordHash,
          },
        ],
      });
      const mediator = await tx.user.findUniqueOrThrow({
        where: { email: "mediateur@stagelink.tg" },
      });
      const admin = await tx.user.findUniqueOrThrow({
        where: { email: "admin@stagelink.tg" },
      });
      await tx.wallet.create({ data: { userId: mediator.id } });
      await tx.wallet.create({ data: { userId: admin.id } });

      const categories = await Promise.all([
        tx.category.create({
          data: {
            name: "Communication digitale",
            description: "Réseaux sociaux et visibilité locale.",
          },
        }),
        tx.category.create({
          data: {
            name: "Développement web",
            description: "Sites, outils et automatisation.",
          },
        }),
        tx.category.create({
          data: {
            name: "Design et création",
            description: "Identité visuelle et supports.",
          },
        }),
        tx.category.create({
          data: {
            name: "Études et terrain",
            description: "Enquêtes et analyse opérationnelle.",
          },
        }),
      ]);

      const companies = await Promise.all([
        tx.user.create({
          data: {
            email: "contact@kora.tg",
            name: "Kora Services",
            role: Role.COMPANY,
            passwordHash,
            companyProfile: {
              create: {
                legalName: "Kora Services SARL",
                city: "Lomé",
                sector: "Services numériques",
                verified: true,
                description: "Accompagnement numérique des PME togolaises.",
              },
            },
          },
        }),
        tx.user.create({
          data: {
            email: "bonjour@agroplus.tg",
            name: "AgroPlus Togo",
            role: Role.COMPANY,
            passwordHash,
            companyProfile: {
              create: {
                legalName: "AgroPlus Togo",
                city: "Kara",
                sector: "Agroalimentaire",
                verified: true,
                description: "Valorisation des produits agricoles locaux.",
              },
            },
          },
        }),
        tx.user.create({
          data: {
            email: "hello@ateliermono.tg",
            name: "Atelier Mono",
            role: Role.COMPANY,
            passwordHash,
            companyProfile: {
              create: {
                legalName: "Atelier Mono",
                city: "Lomé",
                sector: "Création et culture",
                verified: false,
                description: "Studio créatif pour marques et événements.",
              },
            },
          },
        }),
      ]);

      const studentRows = [
        [
          "amina.ayele@etu.tg",
          "Amina Ayélé",
          "Marketing",
          ["Canva", "Community management"],
        ],
        [
          "kodjo.adje@etu.tg",
          "Kodjo Adje",
          "Développement web",
          ["React", "Node.js"],
        ],
        [
          "mariam.kossi@etu.tg",
          "Mariam Kossi",
          "Design graphique",
          ["Figma", "Illustrator"],
        ],
        [
          "yawo.folly@etu.tg",
          "Yawo Folly",
          "Économie",
          ["Excel", "Enquête terrain"],
        ],
        [
          "sena.bakali@etu.tg",
          "Sena Bakali",
          "Communication",
          ["Rédaction", "Instagram"],
        ],
        ["elom.koffi@etu.tg", "Elom Koffi", "Data", ["Python", "Excel"]],
        [
          "espoir.togbe@etu.tg",
          "Espoir Togbé",
          "Développement web",
          ["TypeScript", "PostgreSQL"],
        ],
        [
          "afia.amouzou@etu.tg",
          "Afia Amouzou",
          "Sociologie",
          ["Entretien", "Synthèse"],
        ],
      ] as const;
      const students = [];
      for (let index = 0; index < studentRows.length; index += 1) {
        const [email, name, field, skills] = studentRows[index];
        const user = await tx.user.create({
          data: {
            email,
            name,
            role: Role.STUDENT,
            passwordHash,
            studentProfile: {
              create: {
                school: index % 2 ? "IAI Togo" : "Université de Lomé",
                field,
                level: index % 3 ? "Licence 3" : "Master 1",
                city: "Lomé",
                skills: [...skills],
                bio: `Étudiant(e) motivé(e) en ${field}.`,
              },
            },
          },
        });
        students.push(user);
        const profile = await tx.studentProfile.findUniqueOrThrow({
          where: { userId: user.id },
        });
        await tx.availability.createMany({
          data: [
            { studentId: profile.id, dayOfWeek: 2, startHour: 17, endHour: 20 },
            { studentId: profile.id, dayOfWeek: 6, startHour: 9, endHour: 16 },
          ],
        });
        await tx.wallet.create({ data: { userId: user.id } });
      }
      for (const company of companies)
        await tx.wallet.create({ data: { userId: company.id } });

      const specs = [
        [
          "Calendrier éditorial de rentrée",
          0,
          0,
          12,
          75000,
          MissionStatus.PUBLISHED,
          0,
        ],
        [
          "Mini-site vitrine pour une PME",
          0,
          1,
          25,
          180000,
          MissionStatus.ASSIGNED,
          1,
        ],
        ["Refonte du logo Kora", 0, 2, 15, 100000, MissionStatus.DELIVERED, 2],
        [
          "Audit des réseaux sociaux",
          0,
          0,
          10,
          65000,
          MissionStatus.COMPLETED,
          3,
        ],
        [
          "Formulaire de commande en ligne",
          1,
          1,
          20,
          140000,
          MissionStatus.PUBLISHED,
          4,
        ],
        [
          "Photos produits marché de Kara",
          1,
          2,
          8,
          50000,
          MissionStatus.ASSIGNED,
          5,
        ],
        [
          "Enquête clients producteurs",
          1,
          3,
          18,
          90000,
          MissionStatus.COMPLETED,
          6,
        ],
        [
          "Tableau de suivi des ventes",
          1,
          1,
          16,
          110000,
          MissionStatus.DISPUTED,
          7,
        ],
        [
          "Affiche événement culturel",
          2,
          2,
          6,
          40000,
          MissionStatus.PUBLISHED,
          0,
        ],
        [
          "Stratégie TikTok Atelier Mono",
          2,
          0,
          14,
          85000,
          MissionStatus.COMPLETED,
          1,
        ],
        [
          "Catalogue numérique des créations",
          2,
          1,
          22,
          155000,
          MissionStatus.DRAFT,
          2,
        ],
        [
          "Étude de fréquentation boutique",
          2,
          3,
          9,
          55000,
          MissionStatus.DISPUTED,
          3,
        ],
      ] as const;
      const missions = [];
      for (const [
        title,
        companyIndex,
        categoryIndex,
        estimatedHours,
        budget,
        status,
        studentIndex,
      ] of specs) {
        const mission = await tx.mission.create({
          data: {
            title,
            companyId: companies[companyIndex].id,
            categoryId: categories[categoryIndex].id,
            description: `Mission courte et concrète pour accompagner le développement de ${companies[companyIndex].name}.`,
            city: companyIndex === 1 ? "Kara" : "Lomé",
            requiredSkills:
              categoryIndex === 1
                ? ["React", "TypeScript"]
                : ["Communication", "Organisation"],
            estimatedHours,
            budget,
            status,
            publishedAt: status === MissionStatus.DRAFT ? null : fromNow(-10),
            deadline: fromNow(20),
          },
        });
        missions.push(mission);
        const hasContract =
          status === MissionStatus.ASSIGNED ||
          status === MissionStatus.DELIVERED ||
          status === MissionStatus.COMPLETED ||
          status === MissionStatus.DISPUTED;
        await tx.application.create({
          data: {
            missionId: mission.id,
            studentId: students[studentIndex].id,
            coverLetter:
              "Je souhaite mettre mes compétences au service de cette mission.",
            matchScore: 72 + (studentIndex % 4) * 6,
            status: hasContract
              ? ApplicationStatus.ACCEPTED
              : ApplicationStatus.PENDING,
          },
        });
      }
      for (const index of [1, 2, 3, 5, 6, 7, 9, 11]) {
        const mission = missions[index];
        const application = await tx.application.findFirstOrThrow({
          where: { missionId: mission.id, status: ApplicationStatus.ACCEPTED },
        });
        const contract = await tx.contract.create({
          data: {
            missionId: mission.id,
            studentId: application.studentId,
            companyId: mission.companyId,
            amount: mission.budget,
            status:
              mission.status === MissionStatus.COMPLETED
                ? ContractStatus.COMPLETED
                : mission.status === MissionStatus.DISPUTED
                  ? ContractStatus.DISPUTED
                  : mission.status === MissionStatus.DELIVERED
                    ? ContractStatus.DELIVERED
                    : ContractStatus.ACTIVE,
            startedAt: fromNow(-7),
            autoReleaseAt: fromNow(7),
            completedAt:
              mission.status === MissionStatus.COMPLETED ? fromNow(-2) : null,
          },
        });
        await tx.payment.create({
          data: {
            contractId: contract.id,
            provider: "MOCK",
            amount: mission.budget,
            status:
              mission.status === MissionStatus.COMPLETED
                ? PaymentStatus.SUCCEEDED
                : PaymentStatus.PENDING,
          },
        });
        const hasDeliverable =
          mission.status === MissionStatus.DELIVERED ||
          mission.status === MissionStatus.COMPLETED;
        if (hasDeliverable)
          await tx.deliverable.create({
            data: {
              contractId: contract.id,
              title: "Livrable principal",
              description: "Livrable de démonstration fourni par l'étudiant.",
              status:
                mission.status === MissionStatus.COMPLETED
                  ? "ACCEPTED"
                  : "SUBMITTED",
            },
          });
      }
    },
    { timeout: 30000 },
  );
  console.log(
    "Seed StageLink terminé : 3 entreprises, 8 étudiants, 12 missions, 2 comptes administration.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
