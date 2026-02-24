import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

// --- Interfaces ---

export interface Advertisement {
  id: string;
  name: string;
  type: 'banner' | 'catfish';
  location: 'home' | 'manga_detail' | 'chapter_content' | 'all_pages';
  position: string | null;
  code: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface AdvertisementListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[name]'?: string;
  'filter[type]'?: string;
  'filter[location]'?: string;
}

export interface AdvertisementPayload {
  name: string;
  type: 'banner' | 'catfish';
  location: 'home' | 'manga_detail' | 'chapter_content' | 'all_pages';
  position?: string | null;
  code: string;
  is_active?: boolean;
  order?: number;
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class AdvertisementsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/advertisements`;

  getAdvertisements(params: AdvertisementListParams): Observable<PaginatedResponse<Advertisement>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Advertisement>>(this.apiBase, { params: httpParams });
  }

  getAdvertisement(id: string): Observable<ApiResponse<Advertisement>> {
    return this.http.get<ApiResponse<Advertisement>>(`${this.apiBase}/${id}`);
  }

  createAdvertisement(payload: AdvertisementPayload): Observable<ApiResponse<Advertisement>> {
    return this.http.post<ApiResponse<Advertisement>>(this.apiBase, payload);
  }

  updateAdvertisement(
    id: string,
    payload: Partial<AdvertisementPayload>,
  ): Observable<ApiResponse<Advertisement>> {
    return this.http.put<ApiResponse<Advertisement>>(`${this.apiBase}/${id}`, payload);
  }

  deleteAdvertisement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
