# Phase 2: Create Edit Manga Component

**Effort**: 2.5h | **Status**: pending

## Context

- Services ready: getManga, updateManga, artist/doujinshi/group/genre/member lists
- Pattern: manga-list.component.ts — signal() state, ReactiveFormsModule, inject()
- Layout: Two-column (nz-row/nz-col), left=form, right=sidebar (cover + metadata)
- Top bar: last updated timestamp + Save button (nzExtra pattern from manga-list)

## Overview

Build standalone component at `pages/manga-edit/` with route `/manga/edit/:id`. Load manga data via ActivatedRoute params, patchValue form. Left column: name, name_alt, doujinshi select, finished_by input, genres checkboxes, pilot textarea. Right sidebar: cover upload (nz-upload picture-card), status dropdown, artist/group/user selects, is_hot switch. Top bar shows updated_at + Save button. Submit builds FormData, calls updateManga().

## Key Insights

- **Route param**: Use `inject(ActivatedRoute).params.subscribe(p => loadManga(p['id']))`
- **FormData construction**: Append all fields + cover file if changed
- **patchValue**: Form pre-population from API response
- **Checkbox group**: `nz-checkbox-group` with `nzOptions` array built from genres
- **File upload**: `nz-upload` with `nzListType="picture-card"`, `beforeUpload` returns false (manual control)
- **Dropdown data**: Load artists/groups/doujinshis/users on init for select options

## Requirements

### Component Structure
- Route: `/manga/edit/:id`
- Standalone: true
- Imports: ReactiveFormsModule, NzFormModule, NzInputModule, NzSelectModule, NzSwitchModule, NzCheckboxModule, NzUploadModule, NzButtonModule, NzCardModule, NzGridModule, NzIconModule, NzMessageService

### Form Fields
- **Left column**:
  - name (required, text input)
  - name_alt (text input)
  - doujinshi_id (nz-select with search, options from DoujinshisService)
  - finished_by (text input)
  - genre_ids (nz-checkbox-group, options from GenreService)
  - pilot (nz-textarea, rows=10) — will replace with quill in Phase 4
- **Right sidebar**:
  - cover (nz-upload picture-card, single file)
  - is_hot (nz-switch)
  - status (nz-select: 1=Hoàn thành, 2=Đang tiến hành)
  - artist_id (nz-select with search)
  - group_id (nz-select with search)
  - user_id (nz-select with search)

### State Management
- `manga = signal<Manga | null>(null)`
- `loading = signal(false)`
- `saving = signal(false)`
- `coverFileList = signal<NzUploadFile[]>([])`
- `artists = signal<Artist[]>([])`
- `groups = signal<Group[]>([])`
- `doujinshis = signal<Doujinshi[]>([])`
- `users = signal<Member[]>([])`
- `genres = signal<MangaGenre[]>([])`

### Lifecycle
1. **ngOnInit**:
   - Subscribe to route params, extract id
   - loadManga(id) — calls getManga, patchValue form
   - loadDropdownData() — parallel load artists/groups/doujinshis/users/genres
2. **loadManga(id)**:
   - Call mangaService.getManga(id, 'user,genres,artist,group,doujinshi')
   - Set manga signal
   - patchValue form with data
   - If manga.cover_full_url, build coverFileList for preview
3. **onSubmit()**:
   - Build FormData from form.getRawValue()
   - Append cover file if coverFileList changed
   - Call updateManga(id, formData)
   - Show success/error message
   - Reload manga data

## Architecture

```
src/app/pages/manga-edit/
├── manga-edit.ts (component logic)
├── manga-edit.html (template)
└── manga-edit.less (styles)
```

Component pattern (from manga-list.ts):
- inject() for services/router/route/message
- signal() for reactive state
- FormBuilder for reactive form
- NzMessageService for toast notifications

## Related Code

- `pages/manga-list/manga-list.ts` (lines 1-147) — pattern reference
- `core/services/manga.service.ts` — getManga, updateManga
- `core/services/artists.service.ts` — getArtists for dropdown
- `app.routes.ts` (lines 36-44) — manga route children

## Implementation Steps

### 1. Create Component Files

```bash
# Create directory structure
mkdir -p src/app/pages/manga-edit
touch src/app/pages/manga-edit/manga-edit.{ts,html,less}
```

### 2. Component TypeScript (manga-edit.ts)

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { Manga, MangaService, MangaGenre } from '../../core/services/manga.service';
import { ArtistsService, Artist } from '../../core/services/artists.service';
import { DoujinshisService, Doujinshi } from '../../core/services/doujinshis.service';
import { GroupService, Group } from '../../core/services/group.service';
import { MembersService, Member } from '../../core/services/members.service';
import { GenreService } from '../../core/services/genre.service';

@Component({
  selector: 'app-manga-edit',
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSwitchModule,
    NzCheckboxModule,
    NzUploadModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzSpinModule,
  ],
  templateUrl: './manga-edit.html',
  styleUrl: './manga-edit.less',
})
export class MangaEditComponent implements OnInit {
  private readonly mangaService = inject(MangaService);
  private readonly artistsService = inject(ArtistsService);
  private readonly doujinshisService = inject(DoujinshisService);
  private readonly groupService = inject(GroupService);
  private readonly membersService = inject(MembersService);
  private readonly genreService = inject(GenreService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);

  protected readonly manga = signal<Manga | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly coverFileList = signal<NzUploadFile[]>([]);

  protected readonly artists = signal<Artist[]>([]);
  protected readonly groups = signal<Group[]>([]);
  protected readonly doujinshis = signal<Doujinshi[]>([]);
  protected readonly users = signal<Member[]>([]);
  protected readonly genres = signal<MangaGenre[]>([]);

  protected readonly statusOptions = [
    { label: 'Hoàn thành', value: 1 },
    { label: 'Đang tiến hành', value: 2 },
  ];

  protected readonly editForm = this.fb.group({
    name: ['', Validators.required],
    name_alt: [''],
    doujinshi_id: [''],
    finished_by: [''],
    genre_ids: [[] as number[]],
    pilot: [''],
    status: [2],
    artist_id: [''],
    group_id: [''],
    user_id: [''],
    is_hot: [false],
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadManga(id);
        this.loadDropdownData();
      }
    });
  }

  loadManga(id: string): void {
    this.loading.set(true);
    this.mangaService.getManga(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.manga.set(res.data);
          this.patchFormValues(res.data);
          this.loading.set(false);
        }
      },
      error: () => {
        this.message.error('Không thể tải thông tin manga');
        this.loading.set(false);
        this.router.navigate(['/manga/list']);
      },
    });
  }

  patchFormValues(manga: Manga): void {
    this.editForm.patchValue({
      name: manga.name,
      name_alt: manga.name_alt,
      doujinshi_id: manga.doujinshi?.id ?? '',
      finished_by: manga.finished_by,
      genre_ids: manga.genres?.map((g) => g.id) ?? [],
      pilot: manga.pilot,
      status: manga.status,
      artist_id: manga.artist?.id ?? '',
      group_id: manga.group?.id ?? '',
      user_id: manga.user?.id ?? '',
      is_hot: manga.is_hot,
    });

    // Build cover preview
    if (manga.cover_full_url) {
      this.coverFileList.set([
        {
          uid: '-1',
          name: 'cover.jpg',
          status: 'done',
          url: manga.cover_full_url,
        },
      ]);
    }
  }

  loadDropdownData(): void {
    // Load all dropdown options in parallel
    this.artistsService.getArtists({ per_page: 1000 }).subscribe({
      next: (res) => this.artists.set(res.data ?? []),
    });
    this.groupService.getGroups({ per_page: 1000 }).subscribe({
      next: (res) => this.groups.set(res.data ?? []),
    });
    this.doujinshisService.getDoujinshis({ per_page: 1000 }).subscribe({
      next: (res) => this.doujinshis.set(res.data ?? []),
    });
    this.membersService.getMembers({ per_page: 1000 }).subscribe({
      next: (res) => this.users.set(res.data ?? []),
    });
    this.genreService.getGenres().subscribe({
      next: (res) => this.genres.set(res.data ?? []),
    });
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.coverFileList.set([file]);
    return false; // Prevent auto upload, handle manually on submit
  };

  onRemoveCover = (): boolean => {
    this.coverFileList.set([]);
    return true;
  };

  onSubmit(): void {
    if (this.editForm.invalid) {
      Object.values(this.editForm.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const manga = this.manga();
    if (!manga) return;

    this.saving.set(true);
    const formData = new FormData();
    const values = this.editForm.getRawValue();

    formData.append('name', values.name!);
    if (values.name_alt) formData.append('name_alt', values.name_alt);
    if (values.doujinshi_id) formData.append('doujinshi_id', values.doujinshi_id);
    if (values.finished_by) formData.append('finished_by', values.finished_by);
    if (values.pilot) formData.append('pilot', values.pilot);
    formData.append('status', String(values.status));
    if (values.artist_id) formData.append('artist_id', values.artist_id);
    if (values.group_id) formData.append('group_id', values.group_id);
    if (values.user_id) formData.append('user_id', values.user_id);
    formData.append('is_hot', values.is_hot ? '1' : '0');

    // Append genre_ids as array
    values.genre_ids?.forEach((id) => formData.append('genre_ids[]', String(id)));

    // Append cover file if changed
    const coverFiles = this.coverFileList();
    if (coverFiles.length > 0 && coverFiles[0].originFileObj) {
      formData.append('cover', coverFiles[0].originFileObj as File);
    }

    this.mangaService.updateManga(manga.id, formData).subscribe({
      next: (res) => {
        this.message.success('Cập nhật manga thành công');
        this.saving.set(false);
        if (res.data) this.patchFormValues(res.data);
      },
      error: () => {
        this.message.error('Cập nhật manga thất bại');
        this.saving.set(false);
      },
    });
  }

  getLastUpdated(): string {
    const manga = this.manga();
    if (!manga?.updated_at) return '';
    return new Date(manga.updated_at).toLocaleString('vi-VN');
  }
}
```

### 3. Component Template (manga-edit.html)

```html
<nz-spin [nzSpinning]="loading()">
  <nz-card [nzTitle]="cardTitle" [nzExtra]="cardExtra">
    <ng-template #cardTitle>
      <span>Chỉnh sửa manga</span>
      @if (manga()) {
        <small style="margin-left: 16px; color: #999; font-weight: normal;">
          Cập nhật lần cuối lúc {{ getLastUpdated() }}
        </small>
      }
    </ng-template>

    <ng-template #cardExtra>
      <button
        nz-button
        nzType="primary"
        (click)="onSubmit()"
        [nzLoading]="saving()"
        [disabled]="loading()"
      >
        <nz-icon nzType="save" />
        Lưu
      </button>
    </ng-template>

    <form nz-form [formGroup]="editForm" nzLayout="vertical">
      <div nz-row [nzGutter]="24">
        <!-- Left Column: Main Content -->
        <div nz-col [nzSpan]="16">
          <nz-card nzTitle="Thông tin" nzSize="small">
            <!-- is_hot switch in card title -->
            <span slot="extra">
              Hot:
              <nz-switch formControlName="is_hot" style="margin-left: 8px;" />
            </span>

            <!-- Name -->
            <nz-form-item>
              <nz-form-label nzRequired>Tên truyện</nz-form-label>
              <nz-form-control nzErrorTip="Vui lòng nhập tên truyện">
                <input nz-input formControlName="name" placeholder="Tên manga" />
              </nz-form-control>
            </nz-form-item>

            <!-- Name Alt -->
            <nz-form-item>
              <nz-form-label>Tên khác</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="name_alt" placeholder="Tên khác (nếu có)" />
              </nz-form-control>
            </nz-form-item>

            <!-- Doujinshi -->
            <nz-form-item>
              <nz-form-label>Doujinshi</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="doujinshi_id"
                  nzShowSearch
                  nzPlaceHolder="Chọn doujinshi"
                  nzAllowClear
                >
                  @for (d of doujinshis(); track d.id) {
                    <nz-option [nzValue]="d.id" [nzLabel]="d.name" />
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- Finished By -->
            <nz-form-item>
              <nz-form-label>Thực hiện</nz-form-label>
              <nz-form-control>
                <input nz-input formControlName="finished_by" placeholder="Người thực hiện" />
              </nz-form-control>
            </nz-form-item>

            <!-- Genres (checkbox group) -->
            <nz-form-item>
              <nz-form-label>Thể loại</nz-form-label>
              <nz-form-control>
                <nz-checkbox-group formControlName="genre_ids">
                  <div nz-row [nzGutter]="[8, 8]">
                    @for (genre of genres(); track genre.id) {
                      <div nz-col [nzSpan]="8">
                        <label nz-checkbox [nzValue]="genre.id">{{ genre.name }}</label>
                      </div>
                    }
                  </div>
                </nz-checkbox-group>
              </nz-form-control>
            </nz-form-item>

            <!-- Pilot (rich text placeholder) -->
            <nz-form-item>
              <nz-form-label>Nội dung</nz-form-label>
              <nz-form-control>
                <textarea
                  nz-input
                  formControlName="pilot"
                  rows="10"
                  placeholder="Mô tả nội dung manga"
                ></textarea>
              </nz-form-control>
            </nz-form-item>
          </nz-card>
        </div>

        <!-- Right Column: Sidebar -->
        <div nz-col [nzSpan]="8">
          <!-- Cover Image -->
          <nz-card nzTitle="Ảnh bìa" nzSize="small">
            <nz-upload
              nzListType="picture-card"
              [nzFileList]="coverFileList()"
              [nzBeforeUpload]="beforeUpload"
              [nzRemove]="onRemoveCover"
              [nzShowUploadList]="{ showPreviewIcon: false }"
              nzAccept="image/*"
            >
              @if (coverFileList().length === 0) {
                <div>
                  <nz-icon nzType="plus" />
                  <div style="margin-top: 8px;">Upload</div>
                </div>
              }
            </nz-upload>
          </nz-card>

          <!-- Metadata -->
          <nz-card nzTitle="Thông tin khác" nzSize="small" style="margin-top: 16px;">
            <!-- Status -->
            <nz-form-item>
              <nz-form-label>Tình trạng</nz-form-label>
              <nz-form-control>
                <nz-select formControlName="status" nzPlaceHolder="Chọn tình trạng">
                  @for (opt of statusOptions; track opt.value) {
                    <nz-option [nzValue]="opt.value" [nzLabel]="opt.label" />
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- Artist -->
            <nz-form-item>
              <nz-form-label>Tác giả</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="artist_id"
                  nzShowSearch
                  nzPlaceHolder="Chọn tác giả"
                  nzAllowClear
                >
                  @for (a of artists(); track a.id) {
                    <nz-option [nzValue]="a.id" [nzLabel]="a.name" />
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- Group -->
            <nz-form-item>
              <nz-form-label>Nhóm dịch</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="group_id"
                  nzShowSearch
                  nzPlaceHolder="Chọn nhóm dịch"
                  nzAllowClear
                >
                  @for (g of groups(); track g.id) {
                    <nz-option [nzValue]="g.id" [nzLabel]="g.name" />
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- User -->
            <nz-form-item>
              <nz-form-label>Người đăng</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="user_id"
                  nzShowSearch
                  nzPlaceHolder="Chọn người đăng"
                  nzAllowClear
                >
                  @for (u of users(); track u.id) {
                    <nz-option [nzValue]="u.id" [nzLabel]="u.name" />
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </nz-card>
        </div>
      </div>
    </form>
  </nz-card>
</nz-spin>
```

### 4. Component Styles (manga-edit.less)

```less
// Adjust card spacing
nz-card {
  margin-bottom: 16px;
}

// Upload area styling
nz-upload {
  width: 100%;
}
```

## Todo

- [ ] Create manga-edit component files (ts, html, less)
- [ ] Implement TypeScript logic with signals and form
- [ ] Wire up all dropdowns to service data
- [ ] Implement file upload with beforeUpload handler
- [ ] Implement FormData construction in onSubmit
- [ ] Add route to app.routes.ts (Phase 5)
- [ ] Test form pre-population from API
- [ ] Test save functionality

## Success Criteria

- Component loads manga data via route param
- Form pre-populates with all fields (text, selects, checkboxes, switch)
- Cover image preview displays existing cover_full_url
- All dropdowns populated from services
- File upload allows single image selection
- Save button builds FormData, calls updateManga
- Success/error messages display
- Form updates after successful save

## Security Considerations

- Validate file type (image/*) on frontend before upload
- Backend should validate file size/type again
- genre_ids array properly formatted for backend

## Next Steps

After component complete:
- Add chapter list section (Phase 3)
- Wire route and navigation (Phase 5)
- Replace pilot textarea with Quill (Phase 4)
