import { Response, NextFunction } from 'express';
import taskService from '../services/task.service';
import { AuthenticatedRequest } from '../types';

export class TaskController {
  /**
   * GET /tasks
   * Returns a paginated list of all non-deleted tasks.
   */
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));

      const result = await taskService.findAll({ page, limit });
      const totalPages = Math.ceil(result.total / limit);

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tasks/:id
   * Returns a single task by its ID.
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id!, 10);

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid task ID' });
        return;
      }

      const task = await taskService.findById(id);

      if (!task) {
        res.status(404).json({ success: false, message: `Task with ID ${id} not found` });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tasks
   * Creates a new task.
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /tasks/:id
   * Partially updates a task.
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id!, 10);

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid task ID' });
        return;
      }

      if (Object.keys(req.body).length === 0) {
        res.status(400).json({ success: false, message: 'No fields provided for update' });
        return;
      }

      const task = await taskService.update(id, req.body);

      if (!task) {
        res.status(404).json({ success: false, message: `Task with ID ${id} not found` });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tasks/:id
   * Soft-deletes a task by setting deleted_at.
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id!, 10);

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid task ID' });
        return;
      }

      const deleted = await taskService.softDelete(id);

      if (!deleted) {
        res.status(404).json({ success: false, message: `Task with ID ${id} not found` });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
