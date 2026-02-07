import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { errorResponse } from '../utils/response';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Prisma 错误处理
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json(errorResponse('记录已存在', 409));
    }
    if (err.code === 'P2025') {
      return res.status(404).json(errorResponse('记录不存在', 404));
    }
  }

  // 默认错误
  res.status(500).json(errorResponse(err.message || '服务器内部错误', 500));
};
