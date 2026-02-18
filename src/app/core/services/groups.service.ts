import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';

/** Shape nhóm dịch từ API */
export interface Group {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface GroupListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[name]'?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/groups`;

  /** Lấy danh sách groups — dùng cho dropdown */
  getGroups(params: GroupListParams): Observable<PaginatedResponse<Group>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Group>>(this.apiBase, { params: httpParams });
  }
}
