import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

/** Shape chapter từ API */
export interface Chapter {
  id: string;
  name: string;
  order: number;
  manga_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[manga_id]'?: string;
}

/** Payload tạo/sửa chapter */
export interface ChapterPayload {
  name: string;
  order?: number;
}

@Injectable({ providedIn: 'root' })
export class ChaptersService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/chapters`;

  /** Lấy danh sách chapters — filter theo manga_id */
  getChapters(mangaId: string, params: Omit<ChapterListParams, 'filter[manga_id]'>): Observable<PaginatedResponse<Chapter>> {
    let httpParams = new HttpParams().set('filter[manga_id]', mangaId);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Chapter>>(this.apiBase, { params: httpParams });
  }

  /** Tạo chapter mới */
  createChapter(mangaId: string, payload: ChapterPayload): Observable<ApiResponse<Chapter>> {
    return this.http.post<ApiResponse<Chapter>>(this.apiBase, { ...payload, manga_id: mangaId });
  }

  /** Cập nhật chapter */
  updateChapter(mangaId: string, chapterId: string, payload: ChapterPayload): Observable<ApiResponse<Chapter>> {
    return this.http.put<ApiResponse<Chapter>>(`${this.apiBase}/${chapterId}`, payload);
  }

  /** Xoá 1 chapter */
  deleteChapter(mangaId: string, chapterId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${chapterId}`);
  }

  /** Xoá nhiều chapters cùng lúc */
  deleteChaptersBulk(mangaId: string, chapterIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/bulk-delete`, { ids: chapterIds });
  }
}
