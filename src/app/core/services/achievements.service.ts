import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

/** Shape của Achievement trả về từ API */
export interface Achievement {
  id: string;
  name: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

/** Params gửi lên API để filter/phân trang */
export interface AchievementListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
  'filter[user_id]'?: string;
}

/** Payload khi tạo/sửa achievement */
export interface AchievementPayload {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AchievementsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/achievements`;

  /** Lấy danh sách achievements có filter + phân trang */
  getAchievements(params: AchievementListParams): Observable<PaginatedResponse<Achievement>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Achievement>>(this.apiBase, { params: httpParams });
  }

  /** Tạo achievement mới */
  createAchievement(payload: AchievementPayload): Observable<ApiResponse<Achievement>> {
    return this.http.post<ApiResponse<Achievement>>(this.apiBase, payload);
  }

  /** Cập nhật achievement */
  updateAchievement(id: string, payload: AchievementPayload): Observable<ApiResponse<Achievement>> {
    return this.http.put<ApiResponse<Achievement>>(`${this.apiBase}/${id}`, payload);
  }

  /** Xóa achievement */
  deleteAchievement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
