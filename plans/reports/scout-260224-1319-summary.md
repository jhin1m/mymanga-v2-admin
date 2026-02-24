# Scout Summary: Chapter Management & Drag-Drop Reordering

**Report Date:** 2026-02-24 13:19
**Scope:** Manga-edit page, chapter service, bulk operations, drag-drop patterns, existing UI components

---

## Quick Overview

The codebase has a complete chapter management system in the manga-edit page with:
- Chapter list with pagination (20 items per page)
- Bulk delete capability with modal confirmation
- Single delete with popconfirm
- Navigation to chapter create/edit pages
- Reusable PaginationBarComponent
- Drag-drop image reordering already implemented in chapter-edit page

---

## File Locations (Absolute Paths)

### Main Components
1. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts`
2. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.html`
3. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.less`

### Chapter Service
4. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/chapters.service.ts`

### Reference Pages (with similar patterns)
5. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-edit/chapter-edit.ts` (drag-drop pattern)
6. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-create/chapter-create.ts`
7. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-reports/chapter-reports.ts` (bulk operations)

### Shared Components
8. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`

### Models & Types
9. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

### Routing
10. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`

---

## Key Patterns Found

### 1. Chapter Management (in Manga-Edit)
- **State Management:** Angular signals (no RxJS subjects for internal state)
- **Pagination:** Managed via `chaptersPageIndex` + `chaptersPageSize` signals
- **Selection:** Set<string> for O(1) lookup of checked IDs
- **Loading:** Single `chaptersLoading` signal for entire list

### 2. Bulk Operations Flow
1. User selects items via checkboxes (Set-based storage)
2. "Xoá (n)" button appears conditionally
3. Modal confirmation on click
4. Call service method with IDs array
5. Reload data on success
6. Clear checkboxes

### 3. Drag-Drop Pattern (for Reordering)
- Import from `@angular/cdk/drag-drop`
- Use `cdkDropList`, `cdkDrag`, `cdkDragHandle` directives
- Call `moveItemInArray()` in drop handler
- Update signal with new order
- Persist on save (not auto-save)

### 4. File Upload Pattern
- Intercept via `[nzBeforeUpload]` callback
- Return `false` to prevent auto-upload
- Create local preview via `URL.createObjectURL()`
- Cleanup in `ngOnDestroy()` via `revokeObjectURL()`
- Sequential upload via `concat()` RxJS operator

### 5. Modal Confirmation
- `NzModalService.confirm()` for destructive actions
- Set `nzOkDanger: true` for danger styling
- Implement callback in `nzOnOk`
- Show count in title: `Xoá ${ids.length} chương đã chọn?`

---

## Reusable Components

### PaginationBarComponent
- Signals-based inputs/outputs (Angular 17+)
- Position: top/bottom
- Configurable page size options
- Auto-calculates total
- Usage: wrap in multiple places

```html
<app-pagination-bar
  [total]="total()"
  [pageIndex]="pageIndex()"
  [pageSize]="pageSize()"
  [totalLabel]="'chương'"
  position="top"
  (pageIndexChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)"
/>
```

---

## Service Methods Needed for Drag-Drop

**Currently available in ChaptersService:**
- `updateChapter(mangaId, chapterId, payload)` — supports `order?: number` in payload
- `getChapters(mangaId, params)` — returns list with `order` field in Chapter model

**For chapter reordering:**
1. Option A: Individual updates per chapter (API calls for each)
2. Option B: Bulk update endpoint (would need new backend endpoint)

The `Chapter` interface already has `order: number` field.

---

## Key Technical Decisions

### Checkbox Management
```typescript
// Use Set<string> for O(1) lookup
protected readonly checkedChapterIds = signal<Set<string>>(new Set());

// Track if all items on page are checked
protected readonly allChaptersChecked = signal(false);

// Helper getter to enable/disable bulk action button
get hasCheckedChapters(): boolean {
  return this.checkedChapterIds().size > 0;
}
```

### Pagination
- Default page size: 20 items
- Page index starts at 1
- Reset to page 1 on search/filter

### Soft Delete Pattern (for images)
- Clear local state immediately (optimistic update)
- Mark as `pendingDeletion: true`
- Call API on save
- Show confirmation message

### Optimistic UI
- Current pattern: update local state first, then API
- This allows better UX but requires rollback on error

---

## NG-ZORRO Modules Used

| Module | Purpose |
|--------|---------|
| NzCardModule | Layout containers |
| NzTableModule | Chapter list table |
| NzFormModule | Form validation + layout |
| NzButtonModule | Action buttons |
| NzIconModule | Icons (edit, delete, etc) |
| NzModalService | Confirmation modals |
| NzMessageService | Toast notifications |
| NzPopconfirmModule | Single-item delete confirmation |
| NzCheckboxModule | Checkboxes for genre/chapter selection |
| NzSelectModule | Server-search dropdowns |
| NzUploadModule | File upload with drag-drop |
| NzPaginationModule | Pagination (via PaginationBarComponent) |

---

## API Endpoints Used

**Base URL:** `${environment.apiUrl}/api/admin/chapters`

| Method | Endpoint | Params |
|--------|----------|--------|
| GET | `/` | `filter[manga_id], page, per_page, sort` |
| POST | `/` | `manga_id, name, order?, image_urls?` |
| PUT | `/{chapterId}` | `name, order?, image_urls?` |
| DELETE | `/{chapterId}` | — |
| POST | `/bulk-delete` | `ids: string[]` (in body) |
| GET | `/{chapterId}` | — |
| POST | `/{chapterId}/add-img` | `image` (FormData) |
| DELETE | `/{chapterId}/clr-img` | — |

---

## Response Types

All endpoints return wrapped responses:

**Paginated list:**
```typescript
{
  status: 200,
  success: true,
  data: Chapter[],
  pagination: {
    count: number,
    total: number,
    perPage: number,
    currentPage: number,
    totalPages: number
  }
}
```

**Single resource:**
```typescript
{
  status: 200,
  success: true,
  data: Chapter
}
```

---

## Required Dependencies

Already installed (no new deps needed):
- `@angular/cdk` — for drag-drop
- `ng-zorro-antd` — for UI components
- `rxjs` — for async operations

---

## Implementation Checklist

For adding chapter reordering:

- [ ] Add drag-drop directives to chapter table rows
- [ ] Implement `onChapterDrop()` method using `moveItemInArray()`
- [ ] Add visual feedback (drag handle icon)
- [ ] Update UI to show order has changed
- [ ] Call `updateChapter()` with new order on save
- [ ] Handle errors gracefully (show error message, reload)
- [ ] Add loading state during save
- [ ] Test with multiple chapters
- [ ] Test with pagination (reorder within page only)

---

## Known Patterns in Project

1. **Server-search dropdowns:** debounce 300ms, min 2 chars before search
2. **Confirmation modals:** use `nzOkDanger: true` for destructive actions
3. **Pagination reset:** reset to page 1 when search/filter changes
4. **Soft delete:** mark locally, execute on save/confirmation
5. **Sequential uploads:** use `concat()` to maintain order
6. **Resource cleanup:** `ngOnDestroy` for URL.revokeObjectURL()

---

## Notes for Implementation

1. **Drag-drop UX:** Consider adding a handle icon (three-line menu icon) to make it obvious items are draggable
2. **Save confirmation:** After reordering, should ask user to save before navigation away
3. **Bulk operations:** Current pattern is good — use modal for confirmation
4. **Performance:** For large chapter lists (100+), consider virtualizing table rows
5. **Accessibility:** Ensure keyboard support for checkboxes and drag operations

---

## Questions for Backend

1. Does the backend handle partial chapter list reordering (reorder chapters 2-5 while keeping others)?
2. Should `order` be 0-indexed or 1-indexed?
3. Can multiple chapters have the same order value, or are order values unique per manga?
4. What's the expected behavior if user reorders but doesn't save?

