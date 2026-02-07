export const successResponse = <T>(data: T, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

export const errorResponse = (message: string, code = 500) => ({
  success: false,
  message,
  code,
  timestamp: new Date().toISOString(),
});

export const paginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) => ({
  success: true,
  data,
  pagination: {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  },
  timestamp: new Date().toISOString(),
});
