import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest, AuthPayload } from '../types';

jest.mock('jsonwebtoken');

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

const mockPayload: AuthPayload = { id: 1, email: 'test@example.com', name: 'Test' };

describe('authenticate middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when no Authorization header', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockRes();

    authenticate(req, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when header does not start with Bearer', () => {
    const req = { headers: { authorization: 'Basic sometoken' } } as AuthenticatedRequest;
    const res = mockRes();

    authenticate(req, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when token is expired', () => {
    const req = {
      headers: { authorization: 'Bearer expired-token' },
    } as AuthenticatedRequest;
    const res = mockRes();

    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });

    authenticate(req, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('expired') })
    );
  });

  it('should return 401 when token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as AuthenticatedRequest;
    const res = mockRes();

    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new jwt.JsonWebTokenError('invalid token');
    });

    authenticate(req, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should call next() and attach user when token is valid', () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as AuthenticatedRequest;
    const res = mockRes();

    (jwt.verify as jest.Mock).mockReturnValueOnce(mockPayload);

    authenticate(req, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toEqual(mockPayload);
  });
});
