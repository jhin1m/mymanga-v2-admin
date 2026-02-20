---
phase: 3
title: "Drag-Drop Image Management"
effort: 1.5h
status: completed
depends_on: [2]
---

# Phase 3: Drag-Drop Image Management

## Context
- [manga-edit.html](../../src/app/pages/manga-edit/manga-edit.html) — nz-upload usage pattern
- [API docs](../../docs/API-ADMIN-DOCS.md) — add-img (PUT multipart), clr-img (DELETE)
- `@angular/cdk/drag-drop` — CdkDragDrop, moveItemInArray

## Overview
Add image upload zone and sortable image list to the "Hinh chuong" card. Users can upload new images (click/drag-drop), reorder existing images via drag-drop, and clear all images.

## Key Insights
- `add-img` endpoint accepts ONE image at a time (multipart, field: `image`)
- For multi-file upload: iterate files, call add-img sequentially via `concat`
- `clr-img` deletes ALL images — no single-image delete API
- Image reorder is local/visual only — no server endpoint for image order (chapters-order is for chapter ordering, not images within a chapter)
- CDK DragDrop: `cdkDropList` on container, `cdkDrag` on each item, `(cdkDropListDropped)` handler calls `moveItemInArray`
- nz-upload with `nzBeforeUpload` returning false to prevent auto-upload; collect files, then batch-send

## Requirements
1. Upload zone (nz-upload drag area) accepting multiple image files
2. File restrictions: image/* accept, max 3MB per file, max 200 images
3. Sequential upload via concat (one add-img call per file)
4. Display existing images as a vertical list: thumbnail + "Trang X" label
5. CDK drag-drop reorder on the image list
6. "Xoa tat ca hinh" button with popconfirm, calls clr-img
7. Upload progress indication (uploading signal + count)
8. After upload completes, reload chapter data to refresh image list

## Architecture

### Image List Template
```html
<nz-card nzTitle="Hinh chuong" [nzExtra]="imageActions" class="images-card">
  <ng-template #imageActions>
    @if (images().length > 0) {
      <button nz-button nzDanger nzSize="small"
        nz-popconfirm nzPopconfirmTitle="Xoa tat ca hinh?"
        (nzOnConfirm)="onClearImages()">
        <nz-icon nzType="delete" /> Xoa tat ca
      </button>
    }
  </ng-template>

  <!-- Upload zone -->
  <nz-upload
    nzType="drag"
    [nzMultiple]="true"
    nzAccept="image/*"
    [nzBeforeUpload]="beforeImageUpload"
    [nzShowUploadList]="false"
    [nzDisabled]="uploading()"
  >
    <p class="ant-upload-drag-icon"><nz-icon nzType="inbox" /></p>
    <p class="ant-upload-text">Click hoac keo tha hinh vao day</p>
    <p class="ant-upload-hint">Ho tro nhieu hinh cung luc. Toi da 3MB/hinh.</p>
  </nz-upload>

  <!-- Upload progress -->
  @if (uploading()) {
    <div class="upload-progress">
      Dang tai... {{ uploadedCount() }}/{{ uploadTotal() }}
    </div>
  }

  <!-- Image list with drag-drop -->
  @if (images().length > 0) {
    <div cdkDropList (cdkDropListDropped)="onImageDrop($event)" class="image-list">
      @for (img of images(); track img.id; let i = $index) {
        <div cdkDrag class="image-item">
          <nz-icon cdkDragHandle nzType="holder" class="drag-handle" />
          <img [src]="img.image_full_url" class="image-thumb" />
          <span class="image-label">Trang {{ i + 1 }}</span>
        </div>
      }
    </div>
  }
</nz-card>
```

### Component Methods
```typescript
// Signals
protected readonly images = signal<ChapterImage[]>([]);
protected readonly uploading = signal(false);
protected readonly uploadedCount = signal(0);
protected readonly uploadTotal = signal(0);

// Collect files, then upload sequentially
beforeImageUpload = (file: NzUploadFile): boolean => {
  this.pendingFiles.push(file as unknown as File);
  // Use setTimeout to batch — nz-upload calls this per file
  clearTimeout(this.uploadTimeout);
  this.uploadTimeout = setTimeout(() => this.uploadPendingFiles(), 100);
  return false;
};

private uploadPendingFiles(): void {
  const files = [...this.pendingFiles];
  this.pendingFiles = [];
  if (!files.length) return;

  this.uploading.set(true);
  this.uploadTotal.set(files.length);
  this.uploadedCount.set(0);

  const uploads = files.map(f =>
    this.chaptersService.addImage(this.chapterId(), f).pipe(
      tap(() => this.uploadedCount.update(c => c + 1))
    )
  );

  concat(...uploads).subscribe({
    complete: () => {
      this.uploading.set(false);
      this.message.success(`Da tai len ${files.length} hinh`);
      this.loadChapter(); // Reload to get updated images
    },
    error: () => {
      this.uploading.set(false);
      this.message.error('Tai hinh that bai');
      this.loadChapter();
    },
  });
}

// Drag-drop reorder (local only)
onImageDrop(event: CdkDragDrop<ChapterImage[]>): void {
  const imgs = [...this.images()];
  moveItemInArray(imgs, event.previousIndex, event.currentIndex);
  this.images.set(imgs);
}

// Clear all images
onClearImages(): void {
  this.chaptersService.clearImages(this.chapterId()).subscribe({
    next: () => {
      this.images.set([]);
      this.message.success('Da xoa tat ca hinh');
    },
    error: () => this.message.error('Xoa hinh that bai'),
  });
}
```

### Styles (chapter-edit.less additions)
```less
.images-card {
  margin-top: 16px;
}

.upload-progress {
  padding: 8px 0;
  text-align: center;
  opacity: 0.7;
}

.image-list {
  margin-top: 16px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.02);
  cursor: move;

  &.cdk-drag-preview {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

.drag-handle {
  cursor: grab;
  opacity: 0.5;
}

.image-thumb {
  width: 60px;
  height: 80px;
  object-fit: cover;
  border-radius: 2px;
}

.image-label {
  font-size: 13px;
}

// CDK drag placeholder
.cdk-drag-placeholder {
  opacity: 0.3;
}

.cdk-drag-animating {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}
```

## Related Files
- `src/app/pages/chapter-edit/chapter-edit.ts` — add upload/drag-drop logic
- `src/app/pages/chapter-edit/chapter-edit.html` — add image card content
- `src/app/pages/chapter-edit/chapter-edit.less` — add image styles

## Implementation Steps
- [ ] Import CDK DragDrop modules in component: `CdkDropList`, `CdkDrag`, `CdkDragHandle`
- [ ] Import `moveItemInArray` from `@angular/cdk/drag-drop`
- [ ] Add upload signals: `uploading`, `uploadedCount`, `uploadTotal`
- [ ] Add `pendingFiles` array and `uploadTimeout` for batching
- [ ] Implement `beforeImageUpload` — collect files, defer upload via setTimeout
- [ ] Implement `uploadPendingFiles` — sequential upload via `concat`
- [ ] Implement `onImageDrop` — local reorder with `moveItemInArray`
- [ ] Implement `onClearImages` — call clearImages API, reset images signal
- [ ] Add upload zone template (nz-upload type=drag)
- [ ] Add image list template with cdkDropList + cdkDrag
- [ ] Add upload progress indicator
- [ ] Add "Xoa tat ca" button with nz-popconfirm
- [ ] Add all LESS styles for image list, drag states, thumbnails
- [ ] Test: upload multiple files, verify sequential API calls
- [ ] Test: drag-drop reorder, verify visual update
- [ ] Test: clear all images, verify API call and UI reset

## Success Criteria
- Can upload multiple images via drag-drop or click
- Images upload sequentially with progress indicator
- Existing images display as list with thumbnails and page numbers
- Drag-drop reorders images locally
- "Xoa tat ca" clears all images after confirmation
- UI works with dark theme styles

## Risk Assessment
- **Sequential upload performance**: For large batches (100+ images), could be slow. Acceptable for admin use case. Could add parallel limit (e.g., 3 concurrent) later if needed.
- **No single-image delete**: Users must clear all and re-upload to remove one image. Document this limitation in UI hint text if needed.
- **Image order persistence**: Reorder is visual only. If user refreshes, order resets to server order. This is a known limitation — no API for image order.

## Security Considerations
- Client-side file size check (3MB) + type check (image/*); server also validates
- Large file uploads could timeout — server config dependent

## Next Steps
Feature complete after Phase 3. Integration test by navigating from manga-edit chapter table to chapter-edit page.
