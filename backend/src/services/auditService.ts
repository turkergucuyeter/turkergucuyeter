import prisma from './prisma.js';

class AuditService {
  async log(params: {
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    meta?: unknown;
  }) {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metaJson: JSON.stringify(params.meta ?? {})
      }
    });
  }
}

const auditService = new AuditService();

export default auditService;
