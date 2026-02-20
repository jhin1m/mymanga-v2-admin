# Code Review Report: Chapter Edit Page

**Date:** 2026-02-18
**Reviewer:** code-reviewer subagent
**Plan:** `plans/260218-1202-chapter-edit-page/`

---

## Code Review Summary

### Scope
- Files reviewed: 5
  - `src/app/core/services/chapters.service.ts`
  - `src/app/app.routes.ts`
  - `src/app/pages/chapter-edit/chapter-edit.ts`
  - `src/app/pages/chapter-edit/chapter-edit.html`
  - `src/app/pages/chapter-edit/chapter-edit.less`
- Lines of code analyzed: ~350
- Review focus: recent changes (chapter-edit feature branch additions)
- Build status: PASS (`ng build --configuration=development` — 0 errors, 0 warnings)
- TypeScript: PASS (`tsc --noEmit` — exit 0)

### Overall Assessment

Implementation is correct, follows established patterns well, and builds cleanly. The standalone component structure, signals API usage, and sequential upload via `concat` are all sound. Three issues worth addressing before shipping: missing client-side file-size validation (the hint says 3MB but enforcement is absent), the upload batch mechanism does not handle mid-batch partial failures gracefully, and image reorder is local-only with no indication to the user that a refresh will reset order.

---

### Critical Issues

None.

---

### High Priority Findings

#### H1 — Missing client-side file size/type validation in `beforeImageUpload`

**File:** `src/app/pages/chapter-edit/chapter-edit.ts` — line 141
**Problem:** The template hint says "Tối đa 3MB/hình." (`chapter-edit.html:59`) but `beforeImageUpload` pushes every file into `pendingFiles` without checking size or MIME. `nzAccept="image/*"` is a browser-side file-picker hint only — it is trivially bypassed via drag-and-drop.

Without this check:
- A 50MB file is sent to the server; depending on server limits it may cause a 413 or a long timeout that hangs `uploading` in `true` indefinitely.
- A non-image file dropped on the zone will reach the API.

**Fix:**
```typescript
beforeImageUpload = (file: NzUploadFile): boolean => {
  const f = file as unknown as File;
  const isImage = f.type.startsWith('image/');
  const isUnder3MB = f.size / 1024 / 1024 < 3;

  if (!isImage) {
    this.message.error(`${f.name}: chỉ chấp nhận file hình ảnh`);
    return false;
  }
  if (!isUnder3MB) {
    this.message.error(`${f.name}: vượt quá 3MB`);
    return false;
  }

  this.pendingFiles.push(f);
  if (this.uploadTimeout) clearTimeout(this.uploadTimeout);
  this.uploadTimeout = setTimeout(() => this.uploadPendingFiles(), 100);
  return false;
};
```

---

#### H2 — Partial upload failure loses progress silently

**File:** `src/app/pages/chapter-edit/chapter-edit.ts` — line 165
**Problem:** `concat(...uploads).subscribe({ error: () => ... })` stops on the **first** failed upload (RxJS `concat` propagates errors immediately). If 10 files are queued and file 3 fails, files 4–10 are never attempted. The error handler only shows a generic "Tải hình thất bại" — the user cannot tell how many succeeded.

**Fix (minimal):** Surface partial success count in the error message:
```typescript
concat(...uploads).subscribe({
  complete: () => {
    this.uploading.set(false);
    this.message.success(`Đã tải lên ${files.length} hình`);
    this.loadChapter();
  },
  error: () => {
    const done = this.uploadedCount();
    this.uploading.set(false);
    this.message.error(`Tải hình thất bại (${done}/${files.length} đã xong)`);
    this.loadChapter();
  },
});
```

**Fix (better, use `catchError` per-item to continue on failure):** Replace inner tap with catchError so remaining files still upload:
```typescript
const uploads = files.map((f) =>
  this.chaptersService.addImage(this.chapterId(), f).pipe(
    tap(() => this.uploadedCount.update((c) => c + 1)),
    catchError(() => {
      this.message.warning(`Lỗi khi tải: ${f.name}`);
      return of(null);
    }),
  ),
);
```
Needs `import { catchError, of } from 'rxjs'`.

---

### Medium Priority Improvements

#### M1 — Image reorder is local-only, no user feedback

**File:** `chapter-edit.ts` line 181, `chapter-edit.html` line 71
**Problem:** Drag-drop reorder mutates local state only. After a page reload the order reverts to whatever the server returns. This is intentional per plan ("no server-side order API") but there is zero UI indication of this. A user could drag images into order, save the chapter name, then be confused when the image order resets.

**Fix:** Add a hint below the image list:
```html
<p class="upload-hint-text" style="opacity:0.4; font-size:12px; text-align:center;">
  Thứ tự hình chỉ lưu tạm thời, sẽ reset khi tải lại trang.
</p>
```
Or disable the drag handles until the API supports it. Either approach communicates the limitation.

---

#### M2 — `uploadTimeout` not cleared on component destroy (minor leak)

**File:** `chapter-edit.ts` line 69
**Problem:** `uploadTimeout` is a `setTimeout` reference. If the user navigates away within the 100ms debounce window, the timeout fires on a destroyed component. Angular signals on destroyed components do not throw in most builds, but this is still bad hygiene. The component does not implement `OnDestroy`.

**Fix:** Implement `OnDestroy` and clear the timeout:
```typescript
export class ChapterEditComponent implements OnInit, OnDestroy {
  ngOnDestroy(): void {
    if (this.uploadTimeout) clearTimeout(this.uploadTimeout);
  }
}
```

---

#### M3 — `updateChapter` signature includes unused `mangaId`

**File:** `chapters.service.ts` lines 65-67
**Problem:** `updateChapter(mangaId, chapterId, payload)` accepts `mangaId` but the HTTP call does not use it — the URL is just `${this.apiBase}/${chapterId}`. Same for `deleteChapter` and `deleteChaptersBulk`. This is pre-existing but worth noting since chapter-edit now calls `updateChapter`.

```typescript
// mangaId is accepted but never used in URL construction
updateChapter(mangaId: string, chapterId: string, payload: ChapterPayload): Observable<ApiResponse<Chapter>> {
  return this.http.put<ApiResponse<Chapter>>(`${this.apiBase}/${chapterId}`, payload);
}
```

**Fix (later):** Remove `mangaId` from these signatures if the API does not require it in the URL. Low priority — does not break anything.

---

#### M4 — `::ng-deep` in component styles

**File:** `chapter-edit.less` line 35
```less
::ng-deep nz-form-item {
  margin-bottom: 12px;
}
```
`::ng-deep` is deprecated but used consistently across the project (same pattern in manga-edit). No action needed unless Angular team removes it. Note for future: prefer `:host ::ng-deep` or ViewEncapsulation.None with a global class.

---

### Low Priority Suggestions

#### L1 — Route pattern mismatch in plan vs. implementation (documentation only)

**File:** `plans/260218-1202-chapter-edit-page/plan.md` line 33
The plan's "Key Decisions" says:
> Route pattern: `manga/edit/:id/chapters/:chapterId/edit`

But the actual implementation (correctly) uses:
> `manga/:mangaId/chapters/:chapterId/edit`

The plan note is stale. Implementation matches the `onNavigateEditChapter` call in `manga-edit.ts` (`/manga/${mangaId}/chapters/${chapterId}/edit`), which is correct.

---

#### L2 — `img` tag missing explicit `loading` attribute

**File:** `chapter-edit.html` line 75
For chapters with many images, adding `loading="lazy"` prevents the browser from loading off-screen thumbnails eagerly:
```html
<img [src]="img.image_full_url" loading="lazy" class="image-thumb" alt="Trang {{ i + 1 }}" />
```

---

#### L3 — `chapterId` and `mangaId` stored as signals unnecessarily

**File:** `chapter-edit.ts` lines 58-59
`chapterId` and `mangaId` are set once in `ngOnInit` and never updated reactively. Plain class properties suffice:
```typescript
protected chapterId = '';
protected mangaId = '';
```
Not wrong — signals are valid — just slight over-engineering per YAGNI.

---

### Positive Observations

- Sequential upload via `concat` is the right approach for a server that accepts one image at a time. Prevents server overload.
- Batch collection of files via `pendingFiles + setTimeout(100ms)` correctly handles nz-upload's per-file `beforeUpload` callback pattern. Elegant solution.
- Template uses `@if / @for` (Angular 17+ control flow), consistent with project style.
- `loading` guard in template (`!uploading() && !loading()`) correctly prevents premature `nz-empty` flicker.
- `alt` attribute added to `<img>` (`alt="Trang {{ i + 1 }}"`) — good accessibility practice.
- `nzDisabled="uploading()"` on the upload zone prevents double-submission during upload.
- Build passes clean with no warnings.
- Route placement inside `manga` children is correct — `edit`, `list`, `create` literals take precedence over `:mangaId` dynamic segment per Angular route matching rules.
- `CdkDragHandle` correctly scoped to the icon so the entire row isn't accidentally draggable.

---

### Task Completeness Verification

All phases from the plan are implemented:

| Phase | Requirement | Status |
|-------|------------|--------|
| 1 | `ChapterImage` + `ChapterDetail` interfaces | DONE |
| 1 | `getChapter(id)` method | DONE |
| 1 | `addImage(chapterId, file)` method | DONE |
| 1 | `clearImages(chapterId)` method | DONE |
| 1 | Route `:mangaId/chapters/:chapterId/edit` added | DONE |
| 1 | `@angular/cdk` installed | DONE (`^21.1.4`) |
| 2 | Standalone component with signals | DONE |
| 2 | Form with `name` field (required) | DONE |
| 2 | Header bar with updated_at + save | DONE |
| 2 | `loadChapter()` on init | DONE |
| 2 | `onSave()` with validation | DONE |
| 2 | `onBack()` navigation | DONE |
| 3 | Upload zone (nz-upload drag type) | DONE |
| 3 | Sequential upload via `concat` | DONE |
| 3 | Upload progress indicator | DONE |
| 3 | CDK drag-drop reorder | DONE |
| 3 | Clear all with popconfirm | DONE |
| 3 | After upload: reload chapter | DONE |
| 3 | LESS styles for image list | DONE |

**Gap vs. plan requirements (Phase 3, item 2):**
> File restrictions: image/* accept, max 3MB per file, max 200 images

The 3MB enforcement is missing in `beforeImageUpload` (H1 above). The 200-image maximum is also not enforced.

---

### Recommended Actions

1. **[H1 — BEFORE SHIP]** Add file size/type validation in `beforeImageUpload`. 3MB hint in UI must be enforced in code.
2. **[H2 — BEFORE SHIP]** Improve partial upload failure message to show `done/total` count. Optional: use per-item `catchError` to continue remaining uploads.
3. **[M2 — QUICK WIN]** Add `OnDestroy` + `clearTimeout(this.uploadTimeout)` to avoid stale timer on navigation.
4. **[M1 — LATER]** Add UI note that image order is not persisted server-side.
5. **[M3 — LATER]** Clean up unused `mangaId` param in `updateChapter`/`deleteChapter`/`deleteChaptersBulk` service signatures.
6. **[L2 — LATER]** Add `loading="lazy"` to image thumbnails in `chapter-edit.html`.

---

### Metrics
- TypeScript type check: PASS (exit 0)
- Build: PASS (0 errors, 0 warnings)
- Linting issues: 0 (no linter configured, tsc strict mode used as proxy)
- Test coverage: N/A (no spec file added — consistent with project pattern; all other page components also lack specs)
- Plan tasks complete: 18/19 (missing: 3MB enforcement in `beforeImageUpload`)

---

### Unresolved Questions (carried forward from plan)
1. Does `GET /chapters/{id}` response always include an `images` array, or only when images exist? Code handles `chapter.images ?? []` — safe either way, but the interface marks `images?` as optional; confirm API contract.
2. Does `add-img` endpoint return updated chapter data or just a success status? Current strategy (reload chapter after all uploads complete) is safe regardless, but if it returns updated data, one reload instead of N+1 round trips could be achieved.
3. Is there a plan for single-image delete? If yes, the clear-all UX is a blocker for production use.
