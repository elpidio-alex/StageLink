import { PrismaClient } from "@prisma/client";

export function createNotification(
  client: PrismaClient,
  userId: string,
  title: string,
  body: string,
) {
  return client.notification.create({ data: { userId, title, body } });
}
// Ceci est un commentaire sur une ligne
// Ceci est un commentaire sur une ligne
// Ceci est un commentaire sur une ligne

