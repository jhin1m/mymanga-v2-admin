/** Thông tin phân trang từ API — nằm trong field "pagination" */
export interface PaginationInfo {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  links?: { next?: string; previous?: string };
}

/**
 * Response format thực tế từ API backend:
 * { status: 200, success: true, data: [...], pagination: { total, perPage, ... } }
 */
export interface PaginatedResponse<T> {
  status: number;
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}
