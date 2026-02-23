import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';

// --- Report type constants ---

/** 6 loại báo cáo chapter — key = giá trị API, value = label tiếng Việt */
export const REPORT_TYPES = {
  broken_images: 'Ảnh bị lỗi',
  missing_images: 'Thiếu ảnh',
  wrong_order: 'Sai thứ tự ảnh',
  wrong_chapter: 'Sai chapter',
  duplicate: 'Chapter trùng lặp',
  other: 'Lỗi khác',
} as const;

export type ReportType = keyof typeof REPORT_TYPES;

/** Map mỗi loại báo cáo → màu nz-tag tương ứng */
export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  broken_images: 'red',
  missing_images: 'orange',
  wrong_order: 'blue',
  wrong_chapter: 'purple',
  duplicate: 'gold',
  other: 'default',
};

// --- Interfaces ---

export interface ChapterReport {
  id: string;
  user_id: string;
  chapter_id: string;
  manga_id: string;
  report_type: ReportType;
  report_type_label: string;
  description: string;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string; avatar_full_url?: string };
  chapter?: { id: string; name: string; slug: string; order: number; views: number };
  manga?: { id: string; name: string; slug: string; cover_full_url?: string };
}

export interface ChapterReportStatistics {
  total: number;
  by_type: Record<string, number>;
  recent_reports: number;
  today_reports: number;
}

/** Params cho GET /api/admin/chapter-reports — Spatie QueryBuilder format */
export interface ChapterReportListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[report_type]'?: string;
  'filter[chapter_id]'?: string;
  'filter[manga_id]'?: string;
  'filter[user_id]'?: string;
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class ChapterReportService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/chapter-reports`;

  /** Lấy danh sách báo cáo với filter + phân trang */
  getReports(params: ChapterReportListParams): Observable<PaginatedResponse<ChapterReport>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<ChapterReport>>(this.apiBase, { params: httpParams });
  }

  /** Lấy thống kê báo cáo — tổng, theo loại, hôm nay, gần đây */
  getStatistics(): Observable<{ success: boolean; data: ChapterReportStatistics }> {
    return this.http.get<{ success: boolean; data: ChapterReportStatistics }>(
      `${this.apiBase}/statistics`
    );
  }

  /** Xóa 1 báo cáo */
  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }

  /** Xóa nhiều báo cáo cùng lúc — DELETE với body { ids: [...] } */
  bulkDelete(ids: string[]): Observable<{ success: boolean; data: { deleted_count: number } }> {
    return this.http.delete<{ success: boolean; data: { deleted_count: number } }>(
      `${this.apiBase}/bulk-delete`,
      { body: { ids } }
    );
  }
}
