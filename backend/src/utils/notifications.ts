import { prisma } from "../config/prisma";
import { NotificationChannel } from "@prisma/client";

interface NotificationInput {
  userId: string;
  title: string;
  body: string;
  allowWebPush?: boolean;
}

export const createNotification = async ({ userId, title, body, allowWebPush }: NotificationInput) => {
  const channel = allowWebPush ? NotificationChannel.webpush : NotificationChannel.inapp;
  return prisma.notification.create({
    data: {
      userId,
      channel,
      title,
      body,
    },
  });
};
