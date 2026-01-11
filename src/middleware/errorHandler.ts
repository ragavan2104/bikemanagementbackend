import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  } as ApiResponse);
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  } as ApiResponse);
};
