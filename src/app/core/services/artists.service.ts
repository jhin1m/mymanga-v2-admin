import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

// --- Interfaces (mô tả shape của data) ---

/** Thông tin 1 artist từ API */
export interface Artist {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

/** Params gửi lên API để filter/phân trang */
export interface ArtistListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class ArtistsService {
  // inject() là cách mới thay cho constructor injection trong Angular 14+
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/artists`;

  /**
   * Lấy danh sách artists có filter + phân trang.
   * Backend dùng Spatie QueryBuilder nên params dạng filter[field]=value
   */
  getArtists(params: ArtistListParams): Observable<PaginatedResponse<Artist>> {
    // HttpParams giúp build query string an toàn (tự encode ký tự đặc biệt)
    let httpParams = new HttpParams();

    // Chỉ gửi param nào có giá trị (tránh gửi ?filter[name]=undefined)
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<PaginatedResponse<Artist>>(this.apiBase, { params: httpParams });
  }

  /** Tạo artist mới */
  createArtist(name: string): Observable<ApiResponse<Artist>> {
    return this.http.post<ApiResponse<Artist>>(this.apiBase, { name });
  }

  /** Cập nhật tên artist */
  updateArtist(id: string, name: string): Observable<ApiResponse<Artist>> {
    return this.http.put<ApiResponse<Artist>>(`${this.apiBase}/${id}`, { name });
  }

  /** Xóa artist */
  deleteArtist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
