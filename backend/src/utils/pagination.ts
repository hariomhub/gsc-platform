export const getPagination = (query: Record<string, unknown>) => {
  const page  = Math.max(1, parseInt(String(query.page  || 1),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};
