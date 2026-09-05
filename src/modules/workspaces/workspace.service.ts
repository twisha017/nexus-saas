import { prisma } from '../../db/prisma';
import { CreateWorkspaceInput, UpdateMemberRoleInput } from './workspace.schema';
import { AuditService } from '../audit/audit.service';

export class WorkspaceService {
  static async createWorkspace(userId: string, data: CreateWorkspaceInput) {
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      await tx.membership.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'OWNER',
        },
      });

      await AuditService.log({
        workspaceId: workspace.id,
        actorId: userId,
        action: 'WORKSPACE_CREATED',
        entityType: 'WORKSPACE',
        entityId: workspace.id,
        metadata: { name: workspace.name, slug: workspace.slug },
      });

      return workspace;
    });
  }

  static async listUserWorkspaces(userId: string) {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  static async listMembers(workspaceId: string) {
    return prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { role: 'asc' },
    });
  }

  static async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    actorId: string,
    data: UpdateMemberRoleInput
  ) {
    const updated = await prisma.membership.update({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      data: { role: data.role },
    });

    await AuditService.log({
      workspaceId,
      actorId,
      action: 'MEMBER_ROLE_UPDATED',
      entityType: 'MEMBERSHIP',
      entityId: updated.id,
      metadata: { targetUserId, newRole: data.role },
    });

    return updated;
  }

  static async removeMember(workspaceId: string, targetUserId: string, actorId: string) {
    const deleted = await prisma.membership.delete({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
    });

    await AuditService.log({
      workspaceId,
      actorId,
      action: 'MEMBER_REMOVED',
      entityType: 'MEMBERSHIP',
      entityId: deleted.id,
      metadata: { targetUserId },
    });

    return deleted;
  }
}