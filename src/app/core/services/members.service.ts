import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

// --- Interfaces (mô tả shape của data) ---

/** Thông tin 1 thành viên từ API */
export interface Member {
  id: string;
  name: string;
  email: string;
  total_points: number;
  used_points: number;
  avatar_full_url: string | null;
  banned_until: string | null;
  created_at: string;
  level: number;
  exp: number;
}

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

/** Params gửi lên API để filter/phân trang */
export interface MemberListParams {
  page?: number;
  per_page?: number;
  'filter[id]'?: string;
  'filter[name]'?: string;
  'filter[email]'?: string;
  'filter[role]'?: string;
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class MembersService {
  // inject() là cách mới thay cho constructor injection trong Angular 14+
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/users`;

  /**
   * Lấy danh sách thành viên có filter + phân trang.
   * Backend dùng Spatie QueryBuilder nên params dạng filter[field]=value
   */
  getMembers(params: MemberListParams): Observable<PaginatedResponse<Member>> {
    // HttpParams giúp build query string an toàn (tự encode ký tự đặc biệt)
    let httpParams = new HttpParams();

    // Chỉ gửi param nào có giá trị (tránh gửi ?filter[id]=undefined)
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<PaginatedResponse<Member>>(this.apiBase, { params: httpParams });
  }

  /** Cấm/bỏ cấm thành viên */
  banUser(id: string): Observable<ApiResponse<Member>> {
    return this.http.post<ApiResponse<Member>>(`${this.apiBase}/${id}/ban`, {});
  }

  /** Xóa tất cả bình luận của thành viên */
  deleteUserComments(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiBase}/${id}/delete-comment`);
  }
}
