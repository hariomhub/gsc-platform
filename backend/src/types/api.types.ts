export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface RequestUser {
  id:    number;
  email: string;
  role:  'founding_member' | 'council_member' | 'professional';
  status: 'pending' | 'approved' | 'rejected';
}
