import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js';
import { ApiResponse, UserRole } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided'
      } as ApiResponse);
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    const userDoc = await auth.getUser(decodedToken.uid);
    const customClaims = userDoc.customClaims;

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      role: (customClaims?.role as UserRole) || UserRole.WORKER
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token'
    } as ApiResponse);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      } as ApiResponse);
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions'
      } as ApiResponse);
      return;
    }

    next();
  };
};
