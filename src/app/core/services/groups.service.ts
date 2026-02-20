import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

/** Shape nhóm dịch từ API */
export interface Group {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface GroupListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/groups`;

  /** Lấy danh sách groups có filter + phân trang */
  getGroups(params: GroupListParams): Observable<PaginatedResponse<Group>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Group>>(this.apiBase, { params: httpParams });
  }

  /** Tạo nhóm dịch mới */
  createGroup(name: string): Observable<ApiResponse<Group>> {
    return this.http.post<ApiResponse<Group>>(this.apiBase, { name });
  }

  /** Cập nhật tên nhóm dịch */
  updateGroup(id: string, name: string): Observable<ApiResponse<Group>> {
    return this.http.put<ApiResponse<Group>>(`${this.apiBase}/${id}`, { name });
  }

  /** Xóa nhóm dịch */
  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
