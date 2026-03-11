import { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../validators/task.validator';
import { loginSchema } from '../validators/auth.validator';

const mockReq = (body = {}, query = {}, params = {}): Partial<Request> => ({
  body,
  query,
  params,
});

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('validate middleware (Joi)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createTaskSchema', () => {
    const middleware = validate(createTaskSchema);

    it('should call next() when body is valid', () => {
      const req = mockReq({ title: 'My Task' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 422 when title is missing', () => {
      const req = mockReq({});
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Validation failed' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 422 when status is invalid', () => {
      const req = mockReq({ title: 'Task', status: 'invalid_status' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('pending')]) })
      );
    });

    it('should pass when valid status is provided', () => {
      const req = mockReq({ title: 'Task', status: 'in_progress' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 422 when title exceeds max length', () => {
      const req = mockReq({ title: 'a'.repeat(256) });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should pass all three valid statuses', () => {
      for (const status of ['pending', 'in_progress', 'completed'] as const) {
        jest.clearAllMocks();
        const req = mockReq({ title: 'Task', status });
        const res = mockRes();

        middleware(req as Request, res as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      }
    });
  });

  describe('updateTaskSchema', () => {
    const middleware = validate(updateTaskSchema);

    it('should call next() with partial body (no fields required)', () => {
      const req = mockReq({ description: 'Updated desc' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 422 when title is empty string', () => {
      const req = mockReq({ title: '' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('loginSchema', () => {
    const middleware = validate(loginSchema);

    it('should call next() with valid credentials', () => {
      const req = mockReq({ email: 'user@example.com', password: 'password123' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 422 with invalid email', () => {
      const req = mockReq({ email: 'not-an-email', password: 'password123' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 422 when password is too short', () => {
      const req = mockReq({ email: 'user@example.com', password: '123' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 422 when email is missing', () => {
      const req = mockReq({ password: 'password123' });
      const res = mockRes();

      middleware(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('Email')]) })
      );
    });
  });
});
