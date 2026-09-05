import { Router } from 'express';
import { WorkspaceController } from './workspace.controller';
import { validate } from '../../middlewares/validate.middleware';
import { requireWorkspaceRole } from '../../middlewares/rbac.middleware';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  updateMemberRoleSchema,
} from './workspace.schema';

const router = Router();

// General workspace operations
router.post('/', validate(createWorkspaceSchema), WorkspaceController.create);
router.get('/me', WorkspaceController.listMine);

// Invite acceptance (public/authenticated user endpoint)
router.post('/invites/accept', validate(acceptInviteSchema), WorkspaceController.acceptInvite);

// RBAC-protected workspace operations
router.get(
  '/:workspaceId/members',
  requireWorkspaceRole('VIEWER'),
  WorkspaceController.listMembers
);

router.post(
  '/:workspaceId/invites',
  requireWorkspaceRole('ADMIN'),
  validate(inviteMemberSchema),
  WorkspaceController.inviteMember
);

router.patch(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole('OWNER'),
  validate(updateMemberRoleSchema),
  WorkspaceController.updateMemberRole
);

router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole('OWNER'),
  WorkspaceController.removeMember
);

router.get(
  '/:workspaceId/audit-logs',
  requireWorkspaceRole('ADMIN'),
  WorkspaceController.listAuditLogs
);

export default router;