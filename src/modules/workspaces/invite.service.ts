import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { WorkspaceRole } from './workspace.schema';
import { AuditService } from '../audit/audit.service';

export class InviteService {
  static async createInvite(params: {
    workspaceId: string;
    invitedById: string;
    email: string;
    role: WorkspaceRole;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { workspaceId, invitedById, email, role, ipAddress, userAgent } = params;

    // 1. Verify user isn't already an active member
    const existingMember = await prisma.membership.findFirst({
      where: {
        workspaceId,
        user: { email: { equals: email, mode: 'insensitive' } },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    // 2. Revoke any prior pending invites for this workspace + recipient
    await prisma.workspaceInvite.updateMany({
      where: {
        workspaceId,
        email: { equals: email, mode: 'insensitive' },
        status: 'PENDING',
      },
      data: { status: 'REVOKED' },
    });

    // 3. Generate 48-char high-entropy hex token with 7-day TTL
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        invitedById,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      },
      include: {
        workspace: { select: { name: true } },
      },
    });

    // 4. Record audit event
    await AuditService.log({
      workspaceId,
      actorId: invitedById,
      action: 'INVITE_CREATED',
      entityType: 'INVITE',
      entityId: invite.id,
      metadata: { email: invite.email, role },
      ipAddress,
      userAgent,
    });

    return {
      inviteId: invite.id,
      token: invite.token,
      email: invite.email,
      workspaceName: invite.workspace.name,
      expiresAt: invite.expiresAt,
    };
  }

  static async acceptInvite(token: string, userId: string) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite || invite.status !== 'PENDING') {
      throw new Error('Invite is invalid or has already been used');
    }

    if (new Date() > invite.expiresAt) {
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Invite has expired');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error('Invite was issued to a different email address');
    }

    // Atomically claim invite and create membership
    return prisma.$transaction(async (tx) => {
      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });

      const membership = await tx.membership.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
        },
      });

      await AuditService.log({
        workspaceId: invite.workspaceId,
        actorId: user.id,
        action: 'INVITE_ACCEPTED',
        entityType: 'MEMBERSHIP',
        entityId: membership.id,
        metadata: { role: invite.role },
      });

      return membership;
    });
  }
}