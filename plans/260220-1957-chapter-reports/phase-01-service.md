# Phase 01 — Service + Types

> Parent: [plan.md](./plan.md)

## Overview
- **Date**: 2026-02-20
- **Priority**: P2
- **Implementation Status**: pending
- **Review Status**: pending

## Context

Tạo service để gọi API chapter-reports. Follow pattern của `comments.service.ts` — inject HttpClient, dùng HttpParams, return Observable<PaginatedResponse<T>>.

## Key Insights

- API response format giống các endpoint khác: `{ success, data: [...], pagination: {...} }`
- Statistics endpoint trả response khác (không phải paginated list)
- Bulk delete dùng `DELETE` method với body `{ ids: [] }`
- Report types là fixed enum (6 loại)

## Requirements

1. Interfaces cho ChapterReport, ChapterReportStatistics, report type enum
2. Service methods: list, getStatistics, delete, bulkDelete
3. Params interface cho list endpoint

## Related Code Files

- `src/app/core/services/comments.service.ts` — Pattern reference
- `src/app/core/models/api-types.ts` — PaginatedResponse, PaginationInfo

## Implementation Steps

### 1. Tạo file `src/app/core/services/chapter-report.service.ts`

### 2. Define report types constant

```typescript
export const REPORT_TYPES = {
  broken_images: 'Ảnh bị lỗi/không load được',
  missing_images: 'Thiếu ảnh',
  wrong_order: 'Sai thứ tự ảnh',
  wrong_chapter: 'Sai chapter/nhầm chapter',
  duplicate: 'Chapter trùng lặp',
  other: 'Lỗi khác',
} as const;

export type ReportType = keyof typeof REPORT_TYPES;
```

### 3. Define interfaces

```typescript
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
  by_type: Record<ReportType, number>;
  recent_reports: number;
  today_reports: number;
}

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
```

### 4. Service class

Methods:
- `getReports(params): Observable<PaginatedResponse<ChapterReport>>` — dùng HttpParams loop
- `getStatistics(): Observable<{ success: boolean; data: ChapterReportStatistics }>` — GET /statistics
- `deleteReport(id): Observable<void>` — DELETE /{id}
- `bulkDelete(ids): Observable<{ success: boolean; data: { deleted_count: number } }>` — DELETE /bulk-delete with body

## Success Criteria

- [ ] Service injectable, providedIn: 'root'
- [ ] All interfaces match API response
- [ ] REPORT_TYPES constant exportable for UI use
- [ ] HttpParams built from params object correctly

## Risk Assessment

- **Low**: Straightforward HTTP service, follow existing pattern
- Bulk delete uses DELETE with body — HttpClient supports this via `{ body: {} }` option

## Security Considerations

- Auth handled by interceptor (already in project)
- No user input sanitization needed in service layer
