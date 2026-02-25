import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

/** Shape đơn giản — dùng cho checkbox grid (manga create/edit) */
export interface GenreSimple {
  id: number;
  name: string;
  slug: string;
}

/** Shape đầy đủ — dùng cho trang quản lý genres */
export interface Genre {
  id: string;
  name: string;
  slug: string;
  show_header: boolean;
  show_mb: boolean;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

/** Params gửi lên API để filter/phân trang */
export interface GenreListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

/** Payload khi tạo/sửa genre */
export interface GenrePayload {
  name: string;
  show_header: boolean;
  show_mb: boolean;
}

/** API trả về { data: GenreSimple[] } (không phân trang) — dùng cho checkbox grid */
export interface GenreListResponse {
  success: boolean;
  data: GenreSimple[];
}

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/genres`;

  /** Lấy tất cả genres — dùng cho checkbox grid (manga create/edit) */
  getAllGenres(): Observable<GenreListResponse> {
    // Truyền per_page lớn để lấy toàn bộ genres, tránh bị cắt bởi phân trang mặc định của API
    return this.http.get<GenreListResponse>(this.apiBase, {
      params: { per_page: '9999' },
    });
  }

  /** Lấy danh sách genres có filter + phân trang */
  getGenres(params: GenreListParams): Observable<PaginatedResponse<Genre>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Genre>>(this.apiBase, { params: httpParams });
  }

  /** Tạo genre mới */
  createGenre(payload: GenrePayload): Observable<ApiResponse<Genre>> {
    return this.http.post<ApiResponse<Genre>>(this.apiBase, payload);
  }

  /** Cập nhật genre */
  updateGenre(id: string, payload: GenrePayload): Observable<ApiResponse<Genre>> {
    return this.http.put<ApiResponse<Genre>>(`${this.apiBase}/${id}`, payload);
  }

  /** Xóa genre */
  deleteGenre(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
