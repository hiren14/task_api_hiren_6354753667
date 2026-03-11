import { TaskService } from '../services/task.service';
import { Task } from '../types';

// Mock the database module
jest.mock('../config/database', () => {
  const mockQuery = {
    whereNull: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  const db = jest.fn(() => mockQuery) as any;
  db.raw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
  db.__mockQuery = mockQuery;
  return db;
});

const db = require('../config/database');
const mockQuery = db.__mockQuery;

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'A test task',
  status: 'pending',
  completed_at: null,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  deleted_at: null,
};

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService();
    jest.clearAllMocks();

    // Reset mock chain
    mockQuery.whereNull.mockReturnThis();
    mockQuery.where.mockReturnThis();
    mockQuery.orderBy.mockReturnThis();
    mockQuery.limit.mockReturnThis();
    mockQuery.offset.mockReturnThis();
    mockQuery.select.mockReturnThis();
    mockQuery.count.mockReturnThis();
    mockQuery.insert.mockReturnThis();
    mockQuery.update.mockReturnThis();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      mockQuery.first.mockResolvedValueOnce({ count: '2' });
      mockQuery.select.mockResolvedValueOnce([mockTask]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockTask]);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return empty list when no tasks exist', async () => {
      mockQuery.first.mockResolvedValueOnce({ count: '0' });
      mockQuery.select.mockResolvedValueOnce([]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a task when found', async () => {
      mockQuery.first.mockResolvedValueOnce(mockTask);

      const result = await service.findById(1);

      expect(result).toEqual(mockTask);
      expect(mockQuery.where).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null when task not found', async () => {
      mockQuery.first.mockResolvedValueOnce(undefined);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a task with default status', async () => {
      mockQuery.returning.mockResolvedValueOnce([mockTask]);

      const result = await service.create({ title: 'Test Task' });

      expect(result).toEqual(mockTask);
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          status: 'pending',
        })
      );
    });

    it('should create a task with custom status', async () => {
      const inProgressTask = { ...mockTask, status: 'in_progress' as const };
      mockQuery.returning.mockResolvedValueOnce([inProgressTask]);

      const result = await service.create({
        title: 'Test Task',
        status: 'in_progress',
      });

      expect(result.status).toBe('in_progress');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should return null if task not found', async () => {
      mockQuery.first.mockResolvedValueOnce(undefined);

      const result = await service.update(999, { title: 'Updated' });

      expect(result).toBeNull();
    });

    it('should set completed_at when status changes to completed', async () => {
      mockQuery.first.mockResolvedValueOnce(mockTask);
      const completedTask = {
        ...mockTask,
        status: 'completed' as const,
        completed_at: new Date(),
      };
      mockQuery.returning.mockResolvedValueOnce([completedTask]);

      const result = await service.update(1, { status: 'completed' });

      expect(result?.status).toBe('completed');
      expect(result?.completed_at).not.toBeNull();
    });

    it('should clear completed_at when status moves away from completed', async () => {
      const completedTask = {
        ...mockTask,
        status: 'completed' as const,
        completed_at: new Date(),
      };
      mockQuery.first.mockResolvedValueOnce(completedTask);
      mockQuery.returning.mockResolvedValueOnce([
        { ...completedTask, status: 'pending', completed_at: null },
      ]);

      const result = await service.update(1, { status: 'pending' });

      expect(result?.completed_at).toBeNull();
    });
  });

  // ─── softDelete ───────────────────────────────────────────────────────────

  describe('softDelete', () => {
    it('should return false when task not found', async () => {
      mockQuery.first.mockResolvedValueOnce(undefined);

      const result = await service.softDelete(999);

      expect(result).toBe(false);
    });

    it('should set deleted_at on soft delete', async () => {
      mockQuery.first.mockResolvedValueOnce(mockTask);
      mockQuery.update.mockResolvedValueOnce(1);

      const result = await service.softDelete(1);

      expect(result).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(Date) })
      );
    });
  });
});
