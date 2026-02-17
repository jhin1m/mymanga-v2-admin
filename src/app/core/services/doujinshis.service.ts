import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

// --- Interfaces ---

export interface Doujinshi {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface DoujinshiListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class DoujinshisService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/doujinshis`;

  getDoujinshis(params: DoujinshiListParams): Observable<PaginatedResponse<Doujinshi>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Doujinshi>>(this.apiBase, { params: httpParams });
  }

  createDoujinshi(name: string): Observable<ApiResponse<Doujinshi>> {
    return this.http.post<ApiResponse<Doujinshi>>(this.apiBase, { name });
  }

  updateDoujinshi(id: string, name: string): Observable<ApiResponse<Doujinshi>> {
    return this.http.put<ApiResponse<Doujinshi>>(`${this.apiBase}/${id}`, { name });
  }

  deleteDoujinshi(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
