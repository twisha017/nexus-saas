import { z } from 'zod';

const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().trim().optional(),
    status: TaskStatusEnum.default('TODO'),
    priority: TaskPriorityEnum.default('MEDIUM'),
    workspaceId: z.string().uuid('Invalid workspace ID format'),
    assigneeId: z.string().uuid('Invalid assignee ID format').optional(),
    dueDate: z.string().datetime({ message: 'Invalid ISO date string' }).optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    title: z.string().trim().min(3).max(255).optional(),
    description: z.string().trim().nullable().optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
  }),
});

export const listTasksQuerySchema = z.object({
  query: z.object({
    workspaceId: z.string().uuid('workspaceId is required'),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>['query'];