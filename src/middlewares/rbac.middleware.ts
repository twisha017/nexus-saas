import { Request, Response, NextFunction, RequestHandler } from 'express';
import { prisma } from '../db/prisma';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

const ROLE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

declare global {
  namespace Express {
    interface Request {
      membership?: {
        workspaceId: string;
        userId: string;
        role: WorkspaceRole;
      };
    }
  }
}

export const requireWorkspaceRole = (requiredRole: WorkspaceRole): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaceId =
        req.params.workspaceId ||
        (req.query.workspaceId as string) ||
        req.body?.workspaceId;

      const userId = (req as any).user?.id || (req.headers['x-user-id'] as string);

      if (!workspaceId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Workspace ID and User identity header (x-user-id) are required',
        });
        return;
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId,
          },
        },
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          error: 'Access denied: You are not a member of this workspace',
        });
        return;
      }

      const userRank = ROLE_RANK[membership.role as WorkspaceRole] || 0;
      const requiredRank = ROLE_RANK[requiredRole];

      if (userRank < requiredRank) {
        res.status(403).json({
          success: false,
          error: `Insufficient permissions: Requires ${requiredRole} role`,
        });
        return;
      }

      req.membership = {
        workspaceId: membership.workspaceId,
        userId: membership.userId,
        role: membership.role as WorkspaceRole,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};