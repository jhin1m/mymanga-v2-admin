---
phase: 2
title: "Chapter Edit Component"
effort: 1h
status: completed
depends_on: [1]
---

# Phase 2: Chapter Edit Component

## Context
- [manga-edit.ts](../../src/app/pages/manga-edit/manga-edit.ts) — reference pattern (519 lines)
- [manga-edit.html](../../src/app/pages/manga-edit/manga-edit.html) — template pattern
- [manga-edit.less](../../src/app/pages/manga-edit/manga-edit.less) — styles pattern

## Overview
Create `src/app/pages/chapter-edit/` with chapter-edit.ts, .html, .less. Simpler than manga-edit: one form field (name), header bar, and image management card (Phase 3).

## Key Insights
- Follow manga-edit pattern exactly: standalone component, signal-based state, inject services
- Much simpler form: only `name` field (required)
- Route params: `mangaId` and `chapterId` from ActivatedRoute
- Header shows "Cap nhat lan cuoi luc {time}" on left, "Luu" button on right
- Two cards: "Thong tin" (name form) and "Hinh chuong" (Phase 3)

## Requirements
1. Standalone component with proper imports
2. Signal-based state: `loading`, `saving`, `chapter`, `chapterId`, `mangaId`
3. Form with single `name` field (required)
4. Header bar with last updated time + save button
5. Load chapter data on init via `getChapter`
6. Save via `updateChapter` — stay on page, reload data
7. Back navigation to manga edit page

## Architecture

### Component Structure
```
src/app/pages/chapter-edit/
  chapter-edit.ts    — component class
  chapter-edit.html  — template
  chapter-edit.less  — styles (reuse manga-edit patterns)
```

### Component Class Skeleton
```typescript
@Component({
  selector: 'app-chapter-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe,
    NzCardModule, NzFormModule, NzInputModule,
    NzButtonModule, NzGridModule, NzIconModule,
    NzSpinModule, NzMessageModule, NzUploadModule,
    NzPopconfirmModule, NzEmptyModule,
    CdkDropList, CdkDrag,  // Phase 3
  ],
  templateUrl: './chapter-edit.html',
  styleUrl: './chapter-edit.less',
})
export class ChapterEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly chaptersService = inject(ChaptersService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly chapter = signal<ChapterDetail | null>(null);
  protected readonly chapterId = signal('');
  protected readonly mangaId = signal('');

  // Image state — Phase 3
  protected readonly images = signal<ChapterImage[]>([]);
  protected readonly uploading = signal(false);

  protected readonly editForm = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    this.mangaId.set(this.route.snapshot.paramMap.get('mangaId') ?? '');
    this.chapterId.set(this.route.snapshot.paramMap.get('chapterId') ?? '');
    this.loadChapter();
  }
}
```

### Template Layout
```html
<!-- Top bar -->
<div class="top-bar">
  <div class="top-bar-left">
    <button nz-button nzType="text" (click)="onBack()">
      <nz-icon nzType="arrow-left" />
    </button>
    <h3 class="page-title">Chinh sua chuong</h3>
    @if (chapter(); as c) {
      <span class="updated-at">Cap nhat lan cuoi luc {{ c.updated_at | date: 'dd/MM/yyyy HH:mm' }}</span>
    }
  </div>
  <button nz-button nzType="primary" (click)="onSave()" [nzLoading]="saving()">
    <nz-icon nzType="save" />
    Luu
  </button>
</div>

<nz-spin [nzSpinning]="loading()">
  <form [formGroup]="editForm" class="edit-content">
    <!-- Card: Thong tin -->
    <nz-card nzTitle="Thong tin">
      <nz-form-item>
        <nz-form-label [nzSpan]="24" nzRequired>Ten chuong</nz-form-label>
        <nz-form-control [nzSpan]="24" nzErrorTip="Vui long nhap ten chuong">
          <input nz-input formControlName="name" placeholder="Nhap ten chuong" />
        </nz-form-control>
      </nz-form-item>
    </nz-card>

    <!-- Card: Hinh chuong — Phase 3 content -->
    <nz-card nzTitle="Hinh chuong" class="images-card">
      <!-- Phase 3: upload zone + image list -->
    </nz-card>
  </form>
</nz-spin>
```

## Related Files
- `src/app/pages/chapter-edit/chapter-edit.ts` (new)
- `src/app/pages/chapter-edit/chapter-edit.html` (new)
- `src/app/pages/chapter-edit/chapter-edit.less` (new)

## Implementation Steps
- [ ] Create `src/app/pages/chapter-edit/` directory
- [ ] Create `chapter-edit.ts` with component class, signals, form, load/save logic
- [ ] Create `chapter-edit.html` with top-bar, spin wrapper, info card with name field
- [ ] Create `chapter-edit.less` reusing manga-edit styles (top-bar, page-title, updated-at, etc.)
- [ ] Implement `loadChapter()` — calls `getChapter`, patches form, sets images signal
- [ ] Implement `onSave()` — validates form, calls `updateChapter`, shows success/error message
- [ ] Implement `onBack()` — navigates to `/manga/edit/${mangaId}`
- [ ] Verify component loads correctly via route navigation from manga-edit chapter table

## Success Criteria
- Component loads chapter data and displays name in form
- Save button updates chapter name via API
- Back button returns to manga edit page
- Loading spinner shows during data fetch
- Form validation marks name field as required

## Risk Assessment
- **Low**: Simple form, well-established patterns from manga-edit
- **Route params**: Ensure `mangaId` and `chapterId` match route definition from Phase 1

## Security Considerations
- Form validation on client side; server validates too
- No sensitive data displayed

## Next Steps
Phase 3: Add drag-drop image management to the "Hinh chuong" card.
