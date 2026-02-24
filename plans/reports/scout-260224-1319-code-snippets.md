# Code Snippets Reference

Extracted from scout of manga-edit, chapter management, and bulk operations patterns.

---

## CHAPTER SERVICE METHODS

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/chapters.service.ts`

### Get Chapters List (Paginated)
```typescript
getChapters(mangaId: string, params: Omit<ChapterListParams, 'filter[manga_id]'>): Observable<PaginatedResponse<Chapter>> {
  let httpParams = new HttpParams().set('filter[manga_id]', mangaId);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      httpParams = httpParams.set(key, String(value));
    }
  }
  return this.http.get<PaginatedResponse<Chapter>>(this.apiBase, { params: httpParams });
}
```

### Create Chapter
```typescript
createChapter(mangaId: string, payload: ChapterPayload): Observable<ApiResponse<Chapter>> {
  return this.http.post<ApiResponse<Chapter>>(this.apiBase, { ...payload, manga_id: mangaId });
}
```

### Update Chapter
```typescript
updateChapter(mangaId: string, chapterId: string, payload: ChapterPayload): Observable<ApiResponse<Chapter>> {
  return this.http.put<ApiResponse<Chapter>>(`${this.apiBase}/${chapterId}`, payload);
}
```

### Delete Single Chapter
```typescript
deleteChapter(mangaId: string, chapterId: string): Observable<void> {
  return this.http.delete<void>(`${this.apiBase}/${chapterId}`);
}
```

### Delete Multiple Chapters (Bulk)
```typescript
deleteChaptersBulk(mangaId: string, chapterIds: string[]): Observable<void> {
  return this.http.post<void>(`${this.apiBase}/bulk-delete`, { ids: chapterIds });
}
```

### Get Chapter Detail with Images
```typescript
getChapter(id: string): Observable<ApiResponse<ChapterDetail>> {
  return this.http.get<ApiResponse<ChapterDetail>>(`${this.apiBase}/${id}`);
}
```

### Upload Image to Chapter
```typescript
addImage(chapterId: string, file: File): Observable<ApiResponse<unknown>> {
  const fd = new FormData();
  fd.append('_method', 'put');
  fd.append('image', file);
  return this.http.post<ApiResponse<unknown>>(`${this.apiBase}/${chapterId}/add-img`, fd);
}
```

### Clear All Images from Chapter
```typescript
clearImages(chapterId: string): Observable<void> {
  return this.http.delete<void>(`${this.apiBase}/${chapterId}/clr-img`);
}
```

---

## CHAPTER LOADING IN MANGA-EDIT

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts` (lines 409-428)

```typescript
loadChapters(): void {
  this.chaptersLoading.set(true);
  this.chaptersService
    .getChapters(this.mangaId(), {
    })
    .subscribe({
      next: (res) => {
        this.chapters.set(res.data ?? []);
        this.chaptersTotal.set(res.pagination?.total ?? 0);
        this.chaptersLoading.set(false);
        this.checkedChapterIds.set(new Set());
        this.allChaptersChecked.set(false);
      },
      error: () => {
        this.chapters.set([]);
        this.message.error('Không thể tải danh sách chương');
        this.chaptersLoading.set(false);
      },
    });
}
```

---

## PAGINATION HANDLING

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts` (lines 430-439)

```typescript
onChaptersPageChange(page: number): void {
  this.chaptersPageIndex.set(page);
  this.loadChapters();
}

onChaptersPageSizeChange(size: number): void {
  this.chaptersPageSize.set(size);
  this.chaptersPageIndex.set(1);
  this.loadChapters();
}
```

---

## CHECKBOX SELECTION (ALL + INDIVIDUAL)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts` (lines 442-464)

```typescript
// --- Chapter checkbox ---
onAllChaptersChecked(checked: boolean): void {
  this.allChaptersChecked.set(checked);
  if (checked) {
    this.checkedChapterIds.set(new Set(this.chapters().map((c) => c.id)));
  } else {
    this.checkedChapterIds.set(new Set());
  }
}

onChapterChecked(id: string, checked: boolean): void {
  const set = new Set(this.checkedChapterIds());
  if (checked) {
    set.add(id);
  } else {
    set.delete(id);
  }
  this.checkedChapterIds.set(set);
  this.allChaptersChecked.set(set.size === this.chapters().length && this.chapters().length > 0);
}

isChapterChecked(id: string): boolean {
  return this.checkedChapterIds().has(id);
}

get hasCheckedChapters(): boolean {
  return this.checkedChapterIds().size > 0;
}
```

---

## BULK DELETE WITH CONFIRMATION MODAL

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts` (lines 489-508)

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

---

## SINGLE DELETE WITH POPCONFIRM

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts` (lines 479-487)

```typescript
onDeleteChapter(chapter: Chapter): void {
  this.chaptersService.deleteChapter(this.mangaId(), chapter.id).subscribe({
    next: () => {
      this.message.success(`Đã xoá chương "${chapter.name}"`);
      this.loadChapters();
    },
    error: () => this.message.error('Xoá chương thất bại'),
  });
}
```

Template:
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

## DRAG-DROP IMAGE REORDERING

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-edit/chapter-edit.ts` (lines 322-328)

```typescript
// ========== DRAG-DROP REORDER ==========

onImageDrop(event: CdkDragDrop<ChapterImage[]>): void {
  const imgs = [...this.images()];
  moveItemInArray(imgs, event.previousIndex, event.currentIndex);
  this.images.set(imgs);
}
```

Imports required:
```typescript
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
```

Template wrapper:
```html
<div cdkDropList cdkDropSortingDisabled (cdkDropListDropped)="onImageDrop($event)">
  @for (image of images(); track image.id; let i = $index) {
    <div class="image-item" cdkDrag cdkDragHandle>
      <!-- Content -->
    </div>
  }
</div>
```

---

## SEQUENTIAL FILE UPLOAD (RxJS CONCAT)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-edit/chapter-edit.ts` (lines 246-313)

```typescript
private uploadPendingFiles(pending: PendingFile[], name: string): void {
  this.uploading.set(true);

  let failCount = 0;
  const uploads = pending.map((p, idx) =>
    this.chaptersService.addImage(this.chapterId(), p.file).pipe(
      tap(() => this.updatePendingStatus(idx, 'done')),
      catchError(() => {
        failCount++;
        this.updatePendingStatus(idx, 'error');
        return of(null);
      }),
    ),
  );

  // Đánh dấu file đầu tiên đang upload khi bắt đầu
  this.updatePendingStatus(0, 'uploading');

  // Wrap mỗi upload để đánh dấu file kế tiếp đang upload
  const uploadsWithTracking = uploads.map((upload$, idx) =>
    upload$.pipe(
      tap(() => {
        // Khi file hiện tại xong, đánh dấu file tiếp theo đang upload
        if (idx + 1 < pending.length) {
          this.updatePendingStatus(idx + 1, 'uploading');
        }
      }),
    ),
  );

  this.chaptersService.clearImages(this.chapterId()).pipe(
    switchMap(() => {
      this.pendingDeletion.set(false);
      // Upload từng file tuần tự (concat = gọi lần lượt, giữ thứ tự)
      return concat(...uploadsWithTracking).pipe(toArray());
    }),
    switchMap(() => this.chaptersService.getChapter(this.chapterId())),
  ).subscribe({
    next: res => {
      this.uploading.set(false);
      pending.forEach(p => URL.revokeObjectURL(p.previewUrl));
      this.pendingPreviews.set([]);

      if (failCount > 0) {
        this.message.warning(
          `${pending.length - failCount}/${pending.length} hình tải lên (${failCount} lỗi)`,
        );
      }

      const freshImages: ChapterImage[] = (res.data?.content ?? []).map((url, i) => ({
        id: `content-${i}`,
        image_full_url: url,
        order: i,
      }));
      this.images.set(freshImages);

      // PUT update tên + image_urls mới
      this.updateChapterName(name);
    },
    error: () => {
      this.uploading.set(false);
      this.saving.set(false);
      this.message.error('Upload hình thất bại');
    },
  });
}
```

---

## FILE UPLOAD INTERCEPTION (nz-upload)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-edit/chapter-edit.ts` (lines 209-233)

```typescript
beforeImageUpload = (file: NzUploadFile): boolean => {
  const f = (file.originFileObj ?? file) as unknown as File;

  if (!f.type.startsWith('image/')) {
    this.message.error(`${f.name}: chỉ chấp nhận file hình ảnh`);
    return false;
  }
  if (f.size / 1024 / 1024 > 3) {
    this.message.error(`${f.name}: vượt quá 3MB`);
    return false;
  }

  // Auto-clear ảnh cũ (temp) khi kéo ảnh mới vào lần đầu
  if (this.images().length > 0 && this.pendingPreviews().length === 0) {
    this.images.set([]);
    this.pendingDeletion.set(true);
  }

  const previewUrl = URL.createObjectURL(f);
  this.pendingPreviews.update(list => [
    ...list,
    { file: f, previewUrl, status: 'waiting' as UploadStatus },
  ]);
  return false; // Ngăn nz-upload tự gửi request
};
```

Template:
```html
<nz-upload
  nzType="drag"
  [nzMultiple]="true"
  nzAccept="image/*"
  [nzBeforeUpload]="beforeImageUpload"
  [nzShowUploadList]="false"
  [nzDisabled]="uploading()"
>
  <p class="ant-upload-drag-icon"><nz-icon nzType="inbox" /></p>
  <p class="ant-upload-text">Click hoặc kéo thả hình vào đây</p>
  <p class="ant-upload-hint">Hỗ trợ nhiều hình cùng lúc. Tối đa 3MB/hình.</p>
</nz-upload>
```

---

## CLEANUP OF FILE PREVIEWS

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-edit/chapter-edit.ts` (lines 90-93)

```typescript
ngOnDestroy(): void {
  // Giải phóng Object URLs để tránh memory leak
  this.pendingPreviews().forEach(p => URL.revokeObjectURL(p.previewUrl));
}
```

---

## SOFT DELETE PATTERN

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-edit/chapter-edit.ts` (lines 330-336)

```typescript
// ========== CLEAR IMAGES (Soft delete — chỉ xoá trên UI) ==========

onClearImages(): void {
  this.images.set([]);
  this.pendingDeletion.set(true);
  this.message.info('Đã đánh dấu xoá tất cả hình. Nhấn Lưu để xác nhận.');
}
```

Then in save:
```typescript
if (this.pendingDeletion()) {
  // Chỉ xoá hình (đã soft delete), gọi API clear rồi update tên
  this.clearThenUpdateName(name ?? '');
}
```

---

## PAGINATION BAR COMPONENT USAGE

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.html` (lines 238-246)

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

Component definition:
```typescript
export class PaginationBarComponent {
  readonly total = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalLabel = input<string>('mục');
  readonly position = input<'top' | 'bottom'>('top');
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);

  readonly pageIndexChange = output<number>();
  readonly pageSizeChange = output<number>();
}
```

---

## CHAPTER TABLE HEADER (WITH CHECKBOX)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.html` (lines 256-266)

```html
<nz-table
  #chapterTable
  [nzData]="chapters()"
  [nzLoading]="chaptersLoading()"
  [nzShowPagination]="false"
  nzSize="small"
  [nzFrontPagination]="false"
>
  <thead>
    <tr>
      <th
        nzWidth="40px"
        [nzChecked]="allChaptersChecked()"
        (nzCheckedChange)="onAllChaptersChecked($event)"
      ></th>
      <th>Tên chương</th>
      <th nzWidth="120px">Ngày tạo</th>
      <th nzWidth="100px" nzAlign="center">Thao tác</th>
    </tr>
  </thead>
  <!-- ... tbody -->
</nz-table>
```

---

## CHAPTER TABLE BODY ROWS

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.html` (lines 268-303)

```html
<tbody>
  @for (chapter of chapters(); track chapter.id) {
    <tr>
      <td
        [nzChecked]="isChapterChecked(chapter.id)"
        (nzCheckedChange)="onChapterChecked(chapter.id, $event)"
      ></td>
      <td>{{ chapter.name }}</td>
      <td>{{ chapter.created_at | date: 'dd/MM/yyyy' }}</td>
      <td nzAlign="center">
        <button
          nz-button
          nzType="text"
          nzSize="small"
          nz-tooltip
          nzTooltipTitle="Sửa"
          (click)="onNavigateEditChapter(chapter)"
        >
          <nz-icon nzType="edit" />
        </button>
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
      </td>
    </tr>
  }
</tbody>
```

---

## BULK ACTION BUTTON (CONDITIONAL)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.html` (lines 216-233)

```html
<ng-template #chapterActions>
  <div class="chapter-actions">
    @if (hasCheckedChapters) {
      <button
        nz-button
        nzType="primary"
        nzDanger
        nzSize="small"
        (click)="onBulkDeleteChapters()"
      >
        <nz-icon nzType="delete" />
        Xoá ({{ checkedChapterIds().size }})
      </button>
    }
    <button nz-button nzType="primary" nzSize="small" (click)="onNavigateCreateChapter()">
      <nz-icon nzType="plus" />
      Tạo mới
    </button>
  </div>
</ng-template>
```

---

## API RESPONSE TYPES

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

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

---

## CHAPTER DATA MODELS

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/chapters.service.ts` (lines 8-44)

```typescript
export interface Chapter {
  id: string;
  name: string;
  order: number;
  manga_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterImage {
  id: string;
  image_full_url: string;
  order: number;
}

export interface ChapterDetail extends Chapter {
  content?: string[];
  images?: ChapterImage[];
}

export interface ChapterListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[manga_id]'?: string;
}

export interface ChapterPayload {
  name: string;
  order?: number;
  image_urls?: string[];
}
```

---

## MODULE IMPORTS (FOR CHAPTERS FUNCTIONALITY)

Required in component:

```typescript
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';
```

