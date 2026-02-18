import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Shape thể loại từ API */
export interface Genre {
  id: number;
  name: string;
  slug: string;
}

/** API trả về { data: Genre[] } (không phân trang) */
export interface GenreListResponse {
  success: boolean;
  data: Genre[];
}

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/genres`;

  /** Lấy tất cả genres — dùng cho checkbox grid */
  getGenres(): Observable<GenreListResponse> {
    return this.http.get<GenreListResponse>(this.apiBase);
  }
}
