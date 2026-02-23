# Phase 02 — Component + Template + Styles

> Parent: [plan.md](./plan.md) | Depends on: [Phase 01](./phase-01-service.md)

## Overview
- **Date**: 2026-02-20
- **Priority**: P2
- **Implementation Status**: pending
- **Review Status**: pending

## Context

Tạo standalone component hiển thị danh sách báo cáo chapter. Follow pattern Comments page — search form, nz-table, pagination, delete actions. Thêm: statistics cards, bulk delete, report type filter dropdown.

## Key Insights

- Dùng `signal()` cho reactive state (follow project pattern)
- Statistics cards ở trên search form — hiển thị tổng quan nhanh
- Bulk delete cần checkbox column + selected state
- Report type hiển thị bằng `nz-tag` với màu khác nhau theo loại
- nz-table `nzChecked` / `nzCheckAll` cho checkbox chọn hàng

## Requirements

1. Statistics cards: tổng báo cáo, hôm nay, gần đây, theo loại
2. Filter form: report_type dropdown (nz-select), reset, search buttons
3. Table columns: checkbox, report_type (tag), manga name, chapter name, user, description, created_at, actions (delete)
4. Bulk delete button (disabled khi chưa chọn)
5. Pagination (PaginationBarComponent) top + bottom
6. Delete single + bulk với confirm dialog

## Related Code Files

- `src/app/pages/comments/comments.ts` — Component pattern reference
- `src/app/pages/comments/comments.html` — Template pattern reference
- `src/app/pages/comments/comments.less` — Style pattern reference
- `src/app/shared/pagination-bar/pagination-bar.ts` — Pagination component

## Architecture

```
chapter-reports/
├── chapter-reports.ts       # Component class (signals, form, load/delete logic)
├── chapter-reports.html     # Template (stats cards, search, table, pagination)
└── chapter-reports.less     # Styles (host padding, table card, stats)
```

## Implementation Steps

### 1. Component class (`chapter-reports.ts`)

**Signals:**
- `reports = signal<ChapterReport[]>([])` — danh sách báo cáo
- `statistics = signal<ChapterReportStatistics | null>(null)` — thống kê
- `loading = signal(false)` — loading state
- `total = signal(0)` — tổng số record
- `pageIndex = signal(1)` / `pageSize = signal(20)` — pagination
- `checkedIds = signal<Set<string>>(new Set())` — selected rows for bulk delete
- `allChecked = signal(false)` — header checkbox state

**Search form (FormBuilder):**
- `report_type: ['']` — dropdown filter

**Methods:**
- `ngOnInit()` → loadReports() + loadStatistics()
- `loadReports()` → build params, call service, set signals
- `loadStatistics()` → call service, set signal
- `onSearch()` / `onReset()` — filter handlers
- `onPageChange(page)` / `onPageSizeChange(size)` — pagination
- `onDeleteReport(report)` — single delete → reload
- `onBulkDelete()` — bulk delete → reload + clear selection
- `onItemChecked(id, checked)` — toggle item in checkedIds set
- `onAllChecked(checked)` — select/deselect all visible items

### 2. Template (`chapter-reports.html`)

**Structure:**
```
1. Statistics row (nz-row + nz-col, nz-statistic or nz-card)
2. Search/Filter card (nz-card, nz-select for report_type)
3. Table card:
   - Top pagination bar
   - Bulk delete button (above table, shown when selection > 0)
   - nz-table with columns:
     - Checkbox (nzChecked)
     - Loại báo cáo (nz-tag with color)
     - Manga
     - Chapter
     - Người báo cáo
     - Mô tả (truncated)
     - Ngày tạo (DatePipe)
     - Actions (delete button with popconfirm)
   - Bottom pagination bar
```

**Tag colors by report_type:**
- broken_images → `red`
- missing_images → `orange`
- wrong_order → `blue`
- wrong_chapter → `purple`
- duplicate → `gold`
- other → `default`

### 3. Styles (`chapter-reports.less`)

Follow comments.less pattern:
- `:host { display: block; padding: 24px; }`
- `.stats-row { margin-bottom: 16px; }` — statistics cards spacing
- `.table-card` — same as comments
- `.description-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`
- `.bulk-actions { padding: 8px 16px; display: flex; align-items: center; gap: 8px; }`

## Todo List

- [ ] Create component class with signals + form
- [ ] Create template with stats, search, table, pagination
- [ ] Create styles
- [ ] Wire up checkbox selection for bulk delete
- [ ] Map report types to tag colors

## Success Criteria

- [ ] List loads with pagination
- [ ] Filter by report_type works
- [ ] Statistics cards display correct numbers
- [ ] Single delete with confirmation
- [ ] Bulk delete with confirmation
- [ ] Checkbox select all / individual works
- [ ] Tag colors match report types
- [ ] Loading state shown during API calls
- [ ] Error messages on failure

## Risk Assessment

- **Medium**: Bulk delete + checkbox state management is more complex than simple list pages
  - Mitigation: Use Set<string> for tracking checked IDs, clear on page change

## Security Considerations

- Description field may contain user input → use text binding (not innerHTML) to prevent XSS
