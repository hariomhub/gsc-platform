import { Response } from 'express';
import { Pagination } from '../types/api.types.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: Pagination,
) => {
  const body: Record<string, unknown> = { success: true, data };
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
) => res.status(statusCode).json({ success: false, message });

export const paginate = (
  total: number,
  page: number,
  limit: number,
): Pagination => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
