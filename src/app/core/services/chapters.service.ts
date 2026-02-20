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

/** Hình ảnh thuộc chapter */
export interface ChapterImage {
  id: string;
  image_full_url: string;
  order: number;
}

/** Chi tiết chapter kèm danh sách hình */
export interface ChapterDetail extends Chapter {
  /** API trả về mảng URL string trong field "content" */
  content?: string[];
  images?: ChapterImage[];
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
  image_urls?: string[];
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

  /** Lấy chi tiết 1 chapter (kèm images) */
  getChapter(id: string): Observable<ApiResponse<ChapterDetail>> {
    return this.http.get<ApiResponse<ChapterDetail>>(`${this.apiBase}/${id}`);
  }

  /** Upload 1 hình vào chapter (POST + _method=put — Laravel method spoofing cho multipart) */
  addImage(chapterId: string, file: File): Observable<ApiResponse<unknown>> {
    const fd = new FormData();
    fd.append('_method', 'put');
    fd.append('image', file);
    return this.http.post<ApiResponse<unknown>>(`${this.apiBase}/${chapterId}/add-img`, fd);
  }

  /** Xoá tất cả hình trong chapter */
  clearImages(chapterId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${chapterId}/clr-img`);
  }
}
