import { AuthService } from '../services/auth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../config/database', () => {
  const mockQuery = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
  };
  const db = jest.fn(() => mockQuery) as any;
  db.__mockQuery = mockQuery;
  return db;
});

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const db = require('../config/database');
const mockQuery = db.__mockQuery;

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  name: 'Test User',
  created_at: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
    mockQuery.where.mockReturnThis();
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockQuery.first.mockResolvedValueOnce(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockQuery.where).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user not found', async () => {
      mockQuery.first.mockResolvedValueOnce(undefined);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return null when user not found', async () => {
      mockQuery.first.mockResolvedValueOnce(undefined);

      const result = await service.login({
        email: 'notfound@example.com',
        password: 'password',
      });

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockQuery.first.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await service.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
    });

    it('should return token and user on successful login', async () => {
      mockQuery.first.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('mock-jwt-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).not.toBeNull();
      expect(result?.token).toBe('mock-jwt-token');
      expect(result?.user).not.toHaveProperty('password');
      expect(result?.user.email).toBe('test@example.com');
    });
  });

  describe('hashPassword', () => {
    it('should return hashed password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');

      const result = await service.hashPassword('plain-password');

      expect(result).toBe('hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 10);
    });
  });
});
