import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';

/** Shape bình luận từ API — include=user để lấy thông tin người dùng */
export interface Comment {
  id: string;
  content: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    avatar_full_url?: string;
  };
  commentable_type?: string;
  commentable_id?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

/** Params gửi lên API để filter/phân trang */
export interface CommentListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[username]'?: string;
}

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/comments`;

  /** Lấy danh sách bình luận có filter + phân trang */
  getComments(params: CommentListParams): Observable<PaginatedResponse<Comment>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Comment>>(this.apiBase, { params: httpParams });
  }

  /** Xóa bình luận theo ID */
  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
