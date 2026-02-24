import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

// --- Interfaces ---

export interface Author {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface AuthorListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class AuthorsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/authors`;

  getAuthors(params: AuthorListParams): Observable<PaginatedResponse<Author>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Author>>(this.apiBase, { params: httpParams });
  }

  createAuthor(name: string): Observable<ApiResponse<Author>> {
    return this.http.post<ApiResponse<Author>>(this.apiBase, { name });
  }

  updateAuthor(id: string, name: string): Observable<ApiResponse<Author>> {
    return this.http.put<ApiResponse<Author>>(`${this.apiBase}/${id}`, { name });
  }

  deleteAuthor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
