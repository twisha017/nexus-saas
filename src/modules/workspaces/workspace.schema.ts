import { z } from 'zod';

export const WorkspaceRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleEnum>;

// Workspace Creation
export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
    slug: z
      .string()
      .trim()
      .min(2, 'Slug must be at least 2 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase alphanumeric characters and hyphens'),
  }),
});

// Member Invite Generation
export const inviteMemberSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid('Invalid workspace ID format'),
  }),
  body: z.object({
    email: z.string().trim().email('Invalid email address format'),
    role: WorkspaceRoleEnum.default('MEMBER'),
  }),
});

// Accept Invite Token
export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'Valid invite token is required'),
  }),
});

// Update Member Role
export const updateMemberRoleSchema = z.object({
  params: z.object({
    workspaceId: z.string().uuid('Invalid workspace ID format'),
    userId: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    role: WorkspaceRoleEnum,
  }),
});

// TypeScript inference types
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body'];
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>['body'];
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>['body'];
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>['body'];