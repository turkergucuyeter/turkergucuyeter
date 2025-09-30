import { prisma } from '../config/prisma';

export const createAuditLog = async (
  userId: number,
  action: string,
  entity: string,
  entityId: number,
  meta: Record<string, unknown> = {},
) => {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      metaJson: JSON.stringify(meta),
    },
  });
};
