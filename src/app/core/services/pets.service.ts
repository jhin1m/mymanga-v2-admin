import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

/** Shape của Pet trả về từ API */
export interface Pet {
  id: string;
  name: string;
  price: number;
  image_full_url: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/** Params gửi lên API để filter/phân trang */
export interface PetListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
  'filter[user_id]'?: string;
}

@Injectable({ providedIn: 'root' })
export class PetsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/pets`;

  /** Lấy danh sách pets có filter + phân trang */
  getPets(params: PetListParams): Observable<PaginatedResponse<Pet>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Pet>>(this.apiBase, { params: httpParams });
  }

  /** Tạo pet mới — dùng FormData vì có file ảnh */
  createPet(formData: FormData): Observable<ApiResponse<Pet>> {
    return this.http.post<ApiResponse<Pet>>(this.apiBase, formData);
  }

  /** Cập nhật pet — POST + _method=put vì Laravel không parse FormData với PUT */
  updatePet(id: string, formData: FormData): Observable<ApiResponse<Pet>> {
    formData.append('_method', 'put');
    return this.http.post<ApiResponse<Pet>>(`${this.apiBase}/${id}`, formData);
  }

  /** Xóa pet */
  deletePet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
