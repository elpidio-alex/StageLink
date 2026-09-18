import { PrismaClient } from "@prisma/client";

export function createNotification(
  client: PrismaClient,
  userId: string,
  title: string,
  body: string,
) {
  return client.notification.create({ data: { userId, title, body } });
}
