# Phase 3: Chapter List Section

**Effort**: 2h | **Status**: pending

## Context

- Edit component exists with manga form
- ChapterService ready (list, create, update, delete, deleteBulk)
- Pattern: Embedded table below form (same component), modal for create/edit
- PaginationBarComponent available for reuse

## Overview

Add "Danh sách chương" card below main form in manga-edit component. Display chapters in nz-table with checkbox column, name+date, edit/delete actions. Implement "+ Tạo mới" button that opens modal form. Support bulk delete via selected checkboxes. Paginate using PaginationBarComponent.

## Key Insights

- **API params**: `filter[manga_id]=xxx&include=user&sort=-created_at`
- **Modal pattern**: Use NzModalService.create() with component template
- **Checkbox selection**: Track selectedChapterIds in signal, pass to deleteBulk
- **Order field**: Auto-increment based on max order in current list + 1
- **Nested state**: Chapter list state separate from manga form state

## Requirements

### Chapter List Features
- Load chapters filtered by current manga.id
- Display table columns: checkbox, name (with created_at), actions (edit, delete)
- Pagination via PaginationBarComponent
- "+ Tạo mới" button opens create modal
- Edit button opens edit modal with pre-populated form
- Delete button shows popconfirm, calls deleteChapter
- Bulk delete button (visible when checkboxes selected)

### Chapter Modal Form
- Fields: name (required), order (number, default = max+1)
- manga_id auto-filled from current manga
- Save creates/updates chapter, closes modal, reloads list

## Architecture

Extend `manga-edit.ts` with:
- Chapter state: `chapters = signal<Chapter[]>([])`, `chapterTotal = signal(0)`, `chapterPage = signal(1)`, `chapterPageSize = signal(10)`
- Selection state: `selectedChapterIds = signal<Set<string>>(new Set())`
- Modal state: `chapterModalVisible = signal(false)`, `chapterModalMode = signal<'create' | 'edit'>('create')`, `editingChapter = signal<Chapter | null>(null)`
- Chapter form: `chapterForm = fb.group({ name: ['', Validators.required], order: [1] })`

Methods:
- `loadChapters()` — fetch chapters for current manga
- `onCreateChapter()` — open modal, reset form, mode=create
- `onEditChapter(chapter)` — open modal, patchValue, mode=edit
- `onDeleteChapter(id)` — confirm + delete + reload
- `onBulkDeleteChapters()` — confirm + deleteBulk(Array.from(selectedIds)) + reload
- `onChapterModalOk()` — submit create/update, close modal, reload
- `onChapterCheckChange(id, checked)` — toggle id in selectedChapterIds
- `onChapterCheckAll(checked)` — add/remove all visible chapter ids

## Related Code

- `pages/manga-list/manga-list.html` (lines 100-151) — table + pagination pattern
- `shared/pagination-bar/pagination-bar.ts` — component usage
- `core/services/chapter.service.ts` — CRUD methods
- NzModalService docs: https://ng.ant.design/components/modal/en

## Implementation Steps

### 1. Extend Component State (manga-edit.ts)

Add to class properties:
```typescript
// Chapter list state
protected readonly chapters = signal<Chapter[]>([]);
protected readonly chapterTotal = signal(0);
protected readonly chapterPage = signal(1);
protected readonly chapterPageSize = signal(10);
protected readonly loadingChapters = signal(false);

// Checkbox selection
protected readonly selectedChapterIds = signal<Set<string>>(new Set());
protected readonly allChecked = signal(false);
protected readonly indeterminate = signal(false);

// Chapter modal
protected readonly chapterModalVisible = signal(false);
protected readonly chapterModalMode = signal<'create' | 'edit'>('create');
protected readonly editingChapter = signal<Chapter | null>(null);
protected readonly savingChapter = signal(false);

protected readonly chapterForm = this.fb.group({
  name: ['', Validators.required],
  order: [1],
});
```

Add imports:
```typescript
import { ChapterService, Chapter } from '../../core/services/chapter.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
```

### 2. Load Chapters Method

```typescript
private readonly chapterService = inject(ChapterService);

loadChapters(): void {
  const manga = this.manga();
  if (!manga) return;

  this.loadingChapters.set(true);
  this.chapterService
    .getChapters({
      'filter[manga_id]': manga.id,
      include: 'user',
      sort: '-created_at',
      page: this.chapterPage(),
      per_page: this.chapterPageSize(),
    })
    .subscribe({
      next: (res) => {
        this.chapters.set(res.data ?? []);
        this.chapterTotal.set(res.pagination?.total ?? 0);
        this.loadingChapters.set(false);
      },
      error: () => {
        this.message.error('Không thể tải danh sách chương');
        this.loadingChapters.set(false);
      },
    });
}

// Call in loadManga after setting manga signal
loadManga(id: string): void {
  // ... existing code ...
  this.mangaService.getManga(id).subscribe({
    next: (res) => {
      if (res.success && res.data) {
        this.manga.set(res.data);
        this.patchFormValues(res.data);
        this.loadChapters(); // Add this line
        this.loading.set(false);
      }
    },
    // ...
  });
}
```

### 3. Chapter CRUD Methods

```typescript
onCreateChapter(): void {
  const chapters = this.chapters();
  const maxOrder = chapters.length > 0 ? Math.max(...chapters.map((c) => c.order)) : 0;

  this.chapterForm.reset({ name: '', order: maxOrder + 1 });
  this.chapterModalMode.set('create');
  this.editingChapter.set(null);
  this.chapterModalVisible.set(true);
}

onEditChapter(chapter: Chapter): void {
  this.chapterForm.patchValue({ name: chapter.name, order: chapter.order });
  this.chapterModalMode.set('edit');
  this.editingChapter.set(chapter);
  this.chapterModalVisible.set(true);
}

onChapterModalOk(): void {
  if (this.chapterForm.invalid) {
    Object.values(this.chapterForm.controls).forEach((c) => {
      c.markAsDirty();
      c.updateValueAndValidity();
    });
    return;
  }

  const manga = this.manga();
  if (!manga) return;

  this.savingChapter.set(true);
  const values = this.chapterForm.getRawValue();
  const data = {
    name: values.name!,
    manga_id: manga.id,
    order: values.order ?? 1,
  };

  const mode = this.chapterModalMode();
  const request =
    mode === 'create'
      ? this.chapterService.createChapter(data)
      : this.chapterService.updateChapter(this.editingChapter()!.id, data);

  request.subscribe({
    next: () => {
      this.message.success(mode === 'create' ? 'Tạo chapter thành công' : 'Cập nhật chapter thành công');
      this.chapterModalVisible.set(false);
      this.savingChapter.set(false);
      this.loadChapters();
    },
    error: () => {
      this.message.error(mode === 'create' ? 'Tạo chapter thất bại' : 'Cập nhật chapter thất bại');
      this.savingChapter.set(false);
    },
  });
}

onChapterModalCancel(): void {
  this.chapterModalVisible.set(false);
}

onDeleteChapter(chapter: Chapter): void {
  this.chapterService.deleteChapter(chapter.id).subscribe({
    next: () => {
      this.message.success(`Đã xóa chapter "${chapter.name}"`);
      this.loadChapters();
    },
    error: () => this.message.error('Xóa chapter thất bại'),
  });
}

onBulkDeleteChapters(): void {
  const ids = Array.from(this.selectedChapterIds());
  if (ids.length === 0) return;

  this.chapterService.deleteChapters(ids).subscribe({
    next: () => {
      this.message.success(`Đã xóa ${ids.length} chapter`);
      this.selectedChapterIds.set(new Set());
      this.loadChapters();
    },
    error: () => this.message.error('Xóa chapters thất bại'),
  });
}
```

### 4. Checkbox Selection Methods

```typescript
onChapterCheckChange(id: string, checked: boolean): void {
  const selected = new Set(this.selectedChapterIds());
  if (checked) {
    selected.add(id);
  } else {
    selected.delete(id);
  }
  this.selectedChapterIds.set(selected);
  this.updateCheckboxState();
}

onChapterCheckAll(checked: boolean): void {
  const selected = new Set<string>();
  if (checked) {
    this.chapters().forEach((c) => selected.add(c.id));
  }
  this.selectedChapterIds.set(selected);
  this.updateCheckboxState();
}

updateCheckboxState(): void {
  const total = this.chapters().length;
  const selectedCount = this.selectedChapterIds().size;
  this.allChecked.set(total > 0 && selectedCount === total);
  this.indeterminate.set(selectedCount > 0 && selectedCount < total);
}

onChapterPageChange(page: number): void {
  this.chapterPage.set(page);
  this.loadChapters();
}

onChapterPageSizeChange(size: number): void {
  this.chapterPageSize.set(size);
  this.chapterPage.set(1);
  this.loadChapters();
}
```

### 5. Add Template Section (manga-edit.html)

Add after main form closing `</form>` tag:

```html
<!-- Chapter List Section -->
<nz-card nzTitle="Danh sách chương" [nzExtra]="chapterExtra" style="margin-top: 24px;">
  <ng-template #chapterExtra>
    <button nz-button nzType="primary" nzSize="small" (click)="onCreateChapter()">
      <nz-icon nzType="plus" />
      Tạo mới
    </button>
    @if (selectedChapterIds().size > 0) {
      <button
        nz-button
        nzDanger
        nzSize="small"
        style="margin-left: 8px;"
        nz-popconfirm
        nzPopconfirmTitle="Xóa các chapter đã chọn?"
        (nzOnConfirm)="onBulkDeleteChapters()"
      >
        <nz-icon nzType="delete" />
        Xóa ({{ selectedChapterIds().size }})
      </button>
    }
  </ng-template>

  <nz-spin [nzSpinning]="loadingChapters()">
    <nz-table
      #chapterTable
      [nzData]="chapters()"
      [nzShowPagination]="false"
      [nzSize]="'small'"
    >
      <thead>
        <tr>
          <th
            nzWidth="40px"
            [nzChecked]="allChecked()"
            [nzIndeterminate]="indeterminate()"
            (nzCheckedChange)="onChapterCheckAll($event)"
          ></th>
          <th>Tên chapter</th>
          <th nzWidth="120px">Thứ tự</th>
          <th nzWidth="200px">Ngày tạo</th>
          <th nzWidth="120px" nzAlign="center">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        @for (chapter of chapters(); track chapter.id) {
          <tr>
            <td
              [nzChecked]="selectedChapterIds().has(chapter.id)"
              (nzCheckedChange)="onChapterCheckChange(chapter.id, $event)"
            ></td>
            <td>{{ chapter.name }}</td>
            <td>{{ chapter.order }}</td>
            <td>{{ chapter.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
            <td nzAlign="center">
              <button
                nz-button
                nzType="link"
                nzSize="small"
                (click)="onEditChapter(chapter)"
                nz-tooltip
                nzTooltipTitle="Chỉnh sửa"
              >
                <nz-icon nzType="edit" />
              </button>
              <button
                nz-button
                nzType="link"
                nzDanger
                nzSize="small"
                nz-popconfirm
                nzPopconfirmTitle="Xóa chapter này?"
                (nzOnConfirm)="onDeleteChapter(chapter)"
                nz-tooltip
                nzTooltipTitle="Xóa"
              >
                <nz-icon nzType="delete" />
              </button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>

    @if (chapterTotal() === 0 && !loadingChapters()) {
      <nz-empty nzNotFoundContent="Chưa có chapter nào" />
    }

    @if (chapters().length > 0) {
      <app-pagination-bar
        [total]="chapterTotal()"
        [pageIndex]="chapterPage()"
        [pageSize]="chapterPageSize()"
        totalLabel="chapter"
        position="bottom"
        (pageIndexChange)="onChapterPageChange($event)"
        (pageSizeChange)="onChapterPageSizeChange($event)"
      />
    }
  </nz-spin>
</nz-card>

<!-- Chapter Modal -->
<nz-modal
  [nzVisible]="chapterModalVisible()"
  [nzTitle]="chapterModalMode() === 'create' ? 'Tạo chapter mới' : 'Chỉnh sửa chapter'"
  [nzOkText]="chapterModalMode() === 'create' ? 'Tạo' : 'Lưu'"
  [nzOkLoading]="savingChapter()"
  (nzOnOk)="onChapterModalOk()"
  (nzOnCancel)="onChapterModalCancel()"
>
  <ng-container *nzModalContent>
    <form nz-form [formGroup]="chapterForm" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label nzRequired>Tên chapter</nz-form-label>
        <nz-form-control nzErrorTip="Vui lòng nhập tên chapter">
          <input nz-input formControlName="name" placeholder="Chapter 1, Chapter 2, ..." />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>Thứ tự</nz-form-label>
        <nz-form-control>
          <nz-input-number
            formControlName="order"
            [nzMin]="1"
            style="width: 100%;"
          ></nz-input-number>
        </nz-form-control>
      </nz-form-item>
    </form>
  </ng-container>
</nz-modal>
```

### 6. Update Component Imports

Add to imports array in `@Component`:
```typescript
NzTableModule,
NzModalModule,
NzPopconfirmModule,
NzInputNumberModule,
NzEmptyModule,
CommonModule, // for date pipe
PaginationBarComponent,
```

Add CommonModule import:
```typescript
import { CommonModule } from '@angular/common';
```

## Todo

- [ ] Add chapter state signals to component
- [ ] Inject ChapterService
- [ ] Implement loadChapters() method
- [ ] Add CRUD methods (create, edit, delete, bulk delete)
- [ ] Implement checkbox selection logic
- [ ] Add chapter table template to HTML
- [ ] Add chapter modal template
- [ ] Import required NZ modules (table, modal, popconfirm, input-number)
- [ ] Import PaginationBarComponent
- [ ] Test chapter list loads on manga edit page
- [ ] Test create/edit/delete chapter functionality

## Success Criteria

- Chapter list loads filtered by manga_id
- Table displays chapters with name, order, date, actions
- Checkbox column allows multi-select
- Create modal opens with auto-incremented order
- Edit modal pre-populates with chapter data
- Delete shows popconfirm, removes chapter on confirm
- Bulk delete works with selected checkboxes
- Pagination controls chapter list pages
- All operations reload chapter list after success

## Security Considerations

- Ensure chapter.manga_id matches current manga.id on create/update
- Backend should validate ownership before delete
- Bulk delete validates all IDs belong to same manga

## Next Steps

After chapter list complete:
- Install and integrate Quill editor (Phase 4)
- Wire routes and navigation (Phase 5)
