import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from './workspace.service';
import { InviteService } from './invite.service';
import { AuditService } from '../audit/audit.service';

export class WorkspaceController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req.headers['x-user-id'] as string);
      const workspace = await WorkspaceService.createWorkspace(userId, req.body);
      res.status(201).json({ success: true, data: workspace });
    } catch (error) {
      next(error);
    }
  }

  static async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req.headers['x-user-id'] as string);
      const workspaces = await WorkspaceService.listUserWorkspaces(userId);
      res.json({ success: true, data: workspaces });
    } catch (error) {
      next(error);
    }
  }

  static async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const members = await WorkspaceService.listMembers(workspaceId);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = req.params.userId as string;
      const actorId = (req as any).user?.id || (req.headers['x-user-id'] as string);
      const updated = await WorkspaceService.updateMemberRole(workspaceId, userId, actorId, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = req.params.userId as string;
      const actorId = (req as any).user?.id || (req.headers['x-user-id'] as string);
      await WorkspaceService.removeMember(workspaceId, userId, actorId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const actorId = (req as any).user?.id || (req.headers['x-user-id'] as string);
      const invite = await InviteService.createInvite({
        workspaceId,
        invitedById: actorId,
        email: req.body.email,
        role: req.body.role || 'MEMBER',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(201).json({ success: true, data: invite });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const userId = (req as any).user?.id || (req.headers['x-user-id'] as string);
      const membership = await InviteService.acceptInvite(token, userId);
      res.status(200).json({ success: true, data: membership });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const logs = await AuditService.listLogs(workspaceId);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}