import db from '../config/database';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../types';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export class TaskService {
  private readonly TABLE = 'tasks';

  /**
   * Retrieve all tasks (non-deleted) with pagination.
   */
  async findAll(options: PaginationOptions): Promise<PaginatedResult<Task>> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const [countResult, tasks] = await Promise.all([
      db(this.TABLE)
        .whereNull('deleted_at')
        .count<{ count: string }>('id as count')
        .first(),
      db(this.TABLE)
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .select<Task[]>('*'),
    ]);

    const total = parseInt(countResult?.count ?? '0', 10);

    return { data: tasks, total, page, limit };
  }

  /**
   * Find a task by ID (non-deleted only).
   */
  async findById(id: number): Promise<Task | null> {
    const task = await db(this.TABLE)
      .where({ id })
      .whereNull('deleted_at')
      .first<Task>();

    return task ?? null;
  }

  /**
   * Create a new task.
   */
  async create(dto: CreateTaskDTO): Promise<Task> {
    const [task] = await db(this.TABLE)
      .insert({
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status ?? 'pending',
        completed_at: null,
      })
      .returning<Task[]>('*');

    return task!;
  }

  /**
   * Update an existing task by ID.
   * Automatically sets completed_at when status changes to 'completed'.
   */
  async update(id: number, dto: UpdateTaskDTO): Promise<Task | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updateData: Partial<Task> & { updated_at: Date } = {
      ...dto,
      updated_at: new Date(),
    };

    // Auto-set completed_at when status changes to completed
    if (dto.status === 'completed' && existing.status !== 'completed') {
      updateData.completed_at = new Date();
    }

    // Clear completed_at if moved away from completed
    if (dto.status && dto.status !== 'completed' && existing.status === 'completed') {
      updateData.completed_at = null;
    }

    const [updated] = await db(this.TABLE)
      .where({ id })
      .whereNull('deleted_at')
      .update(updateData)
      .returning<Task[]>('*');

    return updated ?? null;
  }

  /**
   * Soft delete a task by setting deleted_at timestamp.
   */
  async softDelete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    await db(this.TABLE)
      .where({ id })
      .update({ deleted_at: new Date(), updated_at: new Date() });

    return true;
  }
}

export default new TaskService();
