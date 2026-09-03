import { prisma } from '../../db/prisma';
import { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './task.schema';

export class TaskService {
  static async createTask(data: CreateTaskInput) {
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        workspaceId: data.workspaceId,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, email: true },
        },
      },
    });
  }

  static async listTasks(filter: ListTasksQuery) {
    const { workspaceId, status, priority, cursor } = filter;
    // Force numeric coercion to prevent "5" + 1 = "51" string concatenation
    const limit = Number(filter.limit) || 20;

    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        ...(status && { status }),
        ...(priority && { priority }),
      },
      take: limit + 1, // Now cleanly evaluates to an integer (e.g. 5 + 1 = 6)
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: {
          select: { id: true, firstName: true, email: true },
        },
      },
    });

    const hasNextPage = tasks.length > limit;
    const items = hasNextPage ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      pagination: {
        limit,
        hasNextPage,
        nextCursor,
      },
    };
  }

  static async getTaskById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, firstName: true, email: true },
        },
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  static async updateTask(id: string, data: UpdateTaskInput) {
    return prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, email: true },
        },
      },
    });
  }

  static async deleteTask(id: string) {
    return prisma.task.delete({
      where: { id },
    });
  }
}