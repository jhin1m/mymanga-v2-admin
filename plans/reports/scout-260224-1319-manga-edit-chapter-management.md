# Scout Report: Manga-Edit & Chapter Management

**Date:** 2026-02-24 | **Time:** 13:19
**Focus:** Manga-edit page, chapter service, bulk operations, drag-drop patterns

---

## 1. MANGA-EDIT PAGE FILES

### Component
**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts`

Key features:
- Loads manga form + related dropdowns (artist, group, doujinshi, user, genres)
- Chapter list table with pagination + checkboxes
- Bulk delete chapters capability (modal confirmation)
- Server-search dropdowns (debounce 300ms)
- Form-based manga editing + cover upload handling

Core chapter-related signals:
```typescript
protected readonly chapters = signal<Chapter[]>([]);
protected readonly chaptersLoading = signal(false);
protected readonly chaptersTotal = signal(0);
protected readonly chaptersPageIndex = signal(1);
protected readonly chaptersPageSize = signal(20);
protected readonly checkedChapterIds = signal<Set<string>>(new Set());
protected readonly allChaptersChecked = signal(false);
```

Key methods:
- `loadChapters()` — fetches chapters via ChaptersService
- `onChaptersPageChange()`, `onChaptersPageSizeChange()` — pagination
- `onAllChaptersChecked()`, `onChapterChecked()` — checkbox handling
- `onBulkDeleteChapters()` — confirms modal then calls service
- `onNavigateCreateChapter()`, `onNavigateEditChapter()` — navigation

### Template
**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.html`

Chapter section structure:
- Pagination bar (top + bottom)
- nz-table with checkbox column
- Row actions: edit (button) + delete (nz-popconfirm)
- Bulk delete button (conditional, shown when `hasCheckedChapters`)

### Styles
**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.less`

Layout:
- Top bar: back button, title, last update timestamp, save button
- Two-column form layout (left 16 cols, right 8 cols for sidebar)
- Chapters card with action buttons

---

## 2. CHAPTER SERVICE

**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/chapters.service.ts`

Interfaces:
```typescript
export interface Chapter {
  id: string;
  name: string;
  order: number;
  manga_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterDetail extends Chapter {
  content?: string[];
  images?: ChapterImage[];
}

export interface ChapterImage {
  id: string;
  image_full_url: string;
  order: number;
}
```

Service methods:
- `getChapters(mangaId, params)` — list chapters with pagination
- `createChapter(mangaId, payload)` — create new chapter
- `updateChapter(mangaId, chapterId, payload)` — update chapter metadata
- `deleteChapter(mangaId, chapterId)` — delete single chapter
- **`deleteChaptersBulk(mangaId, ids)`** — delete multiple chapters (POST to `/bulk-delete`)
- `getChapter(id)` — get chapter detail with images
- `addImage(chapterId, file)` — upload image to chapter
- `clearImages(chapterId)` — delete all images in chapter

API endpoint base: `${environment.apiUrl}/api/admin/chapters`

---

## 3. CHAPTER EDIT PAGE (Drag-Drop Pattern)

**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-edit/chapter-edit.ts`

Drag-drop implementation (lines 322-328):
```typescript
// ========== DRAG-DROP REORDER ==========

onImageDrop(event: CdkDragDrop<ChapterImage[]>): void {
  const imgs = [...this.images()];
  moveItemInArray(imgs, event.previousIndex, event.currentIndex);
  this.images.set(imgs);
}
```

Imports:
```typescript
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
```

Image management patterns:
- Pending previews tracked with status: `'waiting' | 'uploading' | 'done' | 'error'`
- Soft delete: clears local state first, then calls `clearImages()` on save
- Sequential upload via `concat()` to preserve order
- Auto-clear old images when user adds new ones

---

## 4. CHAPTER CREATE PAGE (Similar Pattern)

**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-create/chapter-create.ts`

Key differences from edit:
- Creates chapter FIRST, then uploads images
- No existing images to manage
- Simpler pending state (no status tracking per image)
- Drag-drop same pattern (lines 189-193)

---

## 5. BULK OPERATIONS PATTERN (from chapter-reports)

**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-reports/chapter-reports.ts`

Checkbox selection pattern (lines 153-172):
```typescript
onItemChecked(id: string, checked: boolean): void {
  const set = new Set(this.checkedIds());
  if (checked) {
    set.add(id);
  } else {
    set.delete(id);
  }
  this.checkedIds.set(set);
  // Cập nhật allChecked dựa trên số item đang hiển thị
  this.allChecked.set(set.size === this.reports().length && this.reports().length > 0);
}

onAllChecked(checked: boolean): void {
  const set = new Set<string>();
  if (checked) {
    this.reports().forEach((r) => set.add(r.id));
  }
  this.checkedIds.set(set);
  this.allChecked.set(checked);
}
```

Bulk delete (lines 187-199):
```typescript
onBulkDelete(): void {
  const ids = Array.from(this.checkedIds());
  if (ids.length === 0) return;

  this.reportService.bulkDelete(ids).subscribe({
    next: (res) => {
      this.message.success(`Đã xóa ${res.data.deleted_count} báo cáo`);
      this.loadReports();
      this.loadStatistics();
    },
    error: () => this.message.error('Xóa hàng loạt thất bại'),
  });
}
```

---

## 6. MODAL CONFIRMATION PATTERN

**Current in manga-edit (line 493-507):**
```typescript
onBulkDeleteChapters(): void {
  const ids = [...this.checkedChapterIds()];
  if (!ids.length) return;

  this.modal.confirm({
    nzTitle: `Xoá ${ids.length} chương đã chọn?`,
    nzContent: 'Hành động này không thể hoàn tác.',
    nzOkDanger: true,
    nzOkText: 'Xoá',
    nzOnOk: () => {
      this.chaptersService.deleteChaptersBulk(this.mangaId(), ids).subscribe({
        next: () => {
          this.message.success(`Đã xoá ${ids.length} chương`);
          this.loadChapters();
        },
        error: () => this.message.error('Xoá chương thất bại'),
      });
    },
  });
}
```

Single item popconfirm (in template):
```html
<button
  nz-button
  nzType="text"
  nzDanger
  nzSize="small"
  nz-popconfirm
  nzPopconfirmTitle="Xoá chương này?"
  (nzOnConfirm)="onDeleteChapter(chapter)"
  nz-tooltip
  nzTooltipTitle="Xoá"
>
  <nz-icon nzType="delete" />
</button>
```

---

## 7. SHARED COMPONENTS

**Pagination Bar Component:**
**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`

Signals-based inputs/outputs:
```typescript
readonly total = input.required<number>();
readonly pageIndex = input.required<number>();
readonly pageSize = input.required<number>();
readonly totalLabel = input<string>('mục');
readonly position = input<'top' | 'bottom'>('top');
readonly pageSizeOptions = input<number[]>([10, 20, 50]);

readonly pageIndexChange = output<number>();
readonly pageSizeChange = output<number>();
```

Usage in manga-edit:
```html
<app-pagination-bar
  [total]="chaptersTotal()"
  [pageIndex]="chaptersPageIndex()"
  [pageSize]="chaptersPageSize()"
  totalLabel="chương"
  position="top"
  (pageIndexChange)="onChaptersPageChange($event)"
  (pageSizeChange)="onChaptersPageSizeChange($event)"
/>
```

---

## 8. API RESPONSE TYPES

**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

```typescript
export interface PaginationInfo {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  links?: { next?: string; previous?: string };
}

export interface PaginatedResponse<T> {
  status: number;
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}
```

ChaptersService uses: `Observable<PaginatedResponse<Chapter>>`

---

## 9. ROUTING STRUCTURE

**Path:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`

Chapter routes (lines 82-91):
```typescript
{
  path: ':mangaId/chapters/create',
  loadComponent: () =>
    import('./pages/chapter-create/chapter-create').then((m) => m.ChapterCreateComponent),
},
{
  path: ':mangaId/chapters/:chapterId/edit',
  loadComponent: () =>
    import('./pages/chapter-edit/chapter-edit').then((m) => m.ChapterEditComponent),
},
```

Manga edit route (line 78):
```typescript
{
  path: 'edit/:id',
  loadComponent: () =>
    import('./pages/manga-edit/manga-edit').then((m) => m.MangaEditComponent),
},
```

---

## 10. KEY PATTERNS FOR IMPLEMENTATION

### Chapter Reordering via API
- Use `order` field in Chapter interface (currently exists but not exposed in UI)
- ChapterPayload supports `order?: number` parameter
- Implement in similar way to image reordering — store new order after drag-drop, call updateChapter on save

### Bulk Operations Flow
1. Collect IDs from Set<string>: `Array.from(this.checkedChapterIds())`
2. Show confirmation modal with count
3. Call service bulk endpoint
4. Reload data on success
5. Clear checkboxes after reload

### Modal Confirmation
- Use `NzModalService.confirm()` for destructive actions
- Set `nzOkDanger: true` for danger styling
- Implement in `nzOnOk` callback

### Drag-Drop Setup
- Import from `@angular/cdk/drag-drop`
- Wrap draggable items in `cdkDrop cdkDropSortingDisabled`
- Items need `cdkDrag` + `cdkDragHandle` (optional handle)
- Use `moveItemInArray()` in drop handler
- Mark as changed locally first, persist on save

### Image Upload Pattern
- Use `nz-upload` with `[nzBeforeUpload]` to intercept
- Return `false` to prevent auto-upload
- Create local preview via `URL.createObjectURL()`
- Cleanup with `URL.revokeObjectURL()` in ngOnDestroy
- Use `concat()` for sequential uploads via RxJS

---

## 11. COMPONENTS & NG-ZORRO MODULES USED

Core modules:
- NzCardModule (layout cards)
- NzTableModule (chapter list)
- NzFormModule (form items)
- NzButtonModule (actions)
- NzIconModule (icons)
- NzModalService (confirmations)
- NzMessageService (notifications)
- NzUploadModule (file upload)
- NzPopconfirmModule (single delete)
- NzSelectModule (dropdowns with server search)
- NzCheckboxModule (genre checkboxes)
- NzPaginationModule (via PaginationBarComponent)

---

## File Summary

| File | Type | Purpose |
|------|------|---------|
| manga-edit.ts | Component | Main page: form + chapter list |
| manga-edit.html | Template | UI layout for manga editing + chapters |
| manga-edit.less | Styles | Layout & spacing |
| chapters.service.ts | Service | API calls for chapter CRUD |
| chapter-edit.ts | Component | Edit single chapter + images + drag-drop |
| chapter-create.ts | Component | Create chapter + images + drag-drop |
| chapter-reports.ts | Component | Example bulk operations pattern |
| chapter-report.service.ts | Service | Example bulk delete endpoint |
| pagination-bar.ts | Shared Component | Reusable pagination UI |
| api-types.ts | Models | Response interfaces |
| app.routes.ts | Routing | Chapter route definitions |

---

## Unresolved Questions

1. **Chapter Reordering Endpoint:** Does the backend support `PUT /api/admin/chapters/{id}` with `order` field?
2. **Bulk Update vs Bulk Delete:** Should chapter reordering be a separate bulk update endpoint or use individual updates?
3. **Optimistic UI:** Should chapter list update optimistically before server response (especially for reordering)?
4. **Drag-Drop Save Behavior:** Auto-save after drop or manual save (current pattern for images)?

