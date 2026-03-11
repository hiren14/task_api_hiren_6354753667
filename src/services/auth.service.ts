import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { User, LoginDTO, AuthPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface LoginResult {
  token: string;
  user: Omit<User, 'password'>;
}

export class AuthService {
  private readonly TABLE = 'users';

  /**
   * Find a user by email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await db(this.TABLE).where({ email }).first<User>();
    return user ?? null;
  }

  /**
   * Authenticate user with email and password.
   * Returns a signed JWT and user info on success.
   */
  async login(dto: LoginDTO): Promise<LoginResult | null> {
    const user = await this.findByEmail(dto.email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) return null;

    const payload: AuthPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const { password: _password, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  /**
   * Hash a plain-text password.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

export default new AuthService();
