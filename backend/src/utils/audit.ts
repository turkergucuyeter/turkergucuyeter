import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";

interface AuditParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
}

export const createAuditLog = (params: AuditParams) => {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metaJson: (params.meta ?? {}) as Prisma.InputJsonValue,
    },
  });
};
