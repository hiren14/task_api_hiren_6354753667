import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

export class AuthController {
  /**
   * POST /auth/login
   * Authenticates a user and returns a JWT token.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login({ email, password });

      if (!result) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
