import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';

export interface RecordAuditParams {
  workspaceId: string;
  actorId: string;
  action: string;
  entityType: 'TASK' | 'MEMBERSHIP' | 'WORKSPACE' | 'INVITE';
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async log(params: RecordAuditParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata
            ? (params.metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
    }
  }

  static async listLogs(workspaceId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
      include: {
        actor: {
          select: { id: true, firstName: true, email: true },
        },
      },
    });
  }
}