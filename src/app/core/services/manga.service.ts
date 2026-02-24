import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';
import { ApiResponse } from './auth.service';

// --- Interfaces mô tả shape data từ API ---

/** Thông tin user tạo manga (nested trong manga response) */
export interface MangaUser {
  id: string;
  name: string;
  email: string;
}

/** Thông tin artist/group/doujinshi (cùng shape) */
export interface MangaRelation {
  id: string;
  name: string;
}

/** Thể loại manga */
export interface MangaGenre {
  id: number;
  name: string;
  slug: string;
}

/** Thông tin 1 manga từ API */
export interface Manga {
  id: string; // UUID
  name: string;
  name_alt: string | null;
  pilot: string | null;
  status: number; // 1=Completed, 2=InProgress
  slug: string;
  is_reviewed: boolean;
  is_hot: boolean;
  cover_full_url: string | null;
  finished_by: string | null;
  created_at: string;
  updated_at: string;
  user?: MangaUser;
  author?: MangaRelation | null;
  artist?: MangaRelation | null;
  group?: MangaRelation | null;
  doujinshi?: MangaRelation | null;
  genres?: MangaGenre[];
}

/** Params gửi lên API để filter/phân trang manga */
export interface MangaListParams {
  page?: number;
  per_page?: number;
  include?: string;
  sort?: string;
  'filter[status]'?: number;
  'filter[is_reviewed]'?: number;
  'filter[name]'?: string;
  'filter[user_id]'?: string;
  'filter[artist_id]'?: string;
  'filter[group_id]'?: string;
  'filter[doujinshi_id]'?: string;
}

@Injectable({ providedIn: 'root' })
export class MangaService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/mangas`;

  /**
   * Lấy danh sách manga có filter + phân trang.
   * include=user,genres,artist,group,doujinshi để lấy thêm quan hệ
   */
  getMangas(params: MangaListParams): Observable<PaginatedResponse<Manga>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<PaginatedResponse<Manga>>(this.apiBase, { params: httpParams });
  }

  /** Lấy chi tiết 1 manga theo UUID */
  getManga(id: string): Observable<ApiResponse<Manga>> {
    return this.http.get<ApiResponse<Manga>>(`${this.apiBase}/${id}`, {
      params: { include: 'user,genres,author,artist,group,doujinshi' },
    });
  }

  /** Tạo manga mới — gửi FormData vì có file cover */
  createManga(formData: FormData): Observable<ApiResponse<Manga>> {
    return this.http.post<ApiResponse<Manga>>(this.apiBase, formData);
  }

  /** Cập nhật manga — gửi FormData vì có file cover */
  updateManga(id: string, formData: FormData): Observable<ApiResponse<Manga>> {
    return this.http.post<ApiResponse<Manga>>(`${this.apiBase}/${id}`, formData);
  }

  /** Xoá manga theo UUID — trả 204 No Content */
  deleteManga(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
