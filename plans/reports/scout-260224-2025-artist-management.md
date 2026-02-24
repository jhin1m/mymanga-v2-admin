# Scout Report: Artist Management Files

**Date:** 2025-02-24  
**Status:** Complete  
**Files Found:** 5 core files + references in 3 routing/menu files

---

## Summary

Artist management is fully implemented with:
- Service layer with CRUD operations
- Standalone component with modal-based create/edit
- Routing in main app.routes.ts
- Menu entry in startup service
- Proper TypeScript interfaces and API response handling

---

## 1. Artist Service (API Layer)

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/artists.service.ts`

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

// --- Interfaces (mô tả shape của data) ---

/** Thông tin 1 artist từ API */
export interface Artist {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

/** Params gửi lên API để filter/phân trang */
export interface ArtistListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class ArtistsService {
  // inject() là cách mới thay cho constructor injection trong Angular 14+
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/artists`;

  /**
   * Lấy danh sách artists có filter + phân trang.
   * Backend dùng Spatie QueryBuilder nên params dạng filter[field]=value
   */
  getArtists(params: ArtistListParams): Observable<PaginatedResponse<Artist>> {
    // HttpParams giúp build query string an toàn (tự encode ký tự đặc biệt)
    let httpParams = new HttpParams();

    // Chỉ gửi param nào có giá trị (tránh gửi ?filter[name]=undefined)
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<PaginatedResponse<Artist>>(this.apiBase, { params: httpParams });
  }

  /** Tạo artist mới */
  createArtist(name: string): Observable<ApiResponse<Artist>> {
    return this.http.post<ApiResponse<Artist>>(this.apiBase, { name });
  }

  /** Cập nhật tên artist */
  updateArtist(id: string, name: string): Observable<ApiResponse<Artist>> {
    return this.http.put<ApiResponse<Artist>>(`${this.apiBase}/${id}`, { name });
  }

  /** Xóa artist */
  deleteArtist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

**Key Points:**
- Uses `@Injectable({ providedIn: 'root' })` for tree-shaking
- Endpoint: `${environment.apiUrl}/api/admin/artists`
- Supports filtering by name (`filter[name]`)
- Includes pagination (`page`, `per_page`)
- Uses Spatie QueryBuilder-style filter params
- CRUD operations: create, read (list), update, delete

---

## 2. Artist Component (UI Layer)

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/artists/artists.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { Artist, ArtistListParams, ArtistsService } from '../../core/services/artists.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

/** Component nhỏ dùng làm nội dung modal — NzModal cần Component cho nzContent */
@Component({
  selector: 'app-artist-name-input',
  imports: [FormsModule, NzInputModule],
  template: `<input nz-input [(ngModel)]="name" placeholder="Nhập tên artist" (keyup.enter)="name" />`,
})
export class ArtistNameInputComponent {
  private readonly data = inject<{ defaultName: string }>(NZ_MODAL_DATA);
  name = this.data.defaultName ?? '';
}

@Component({
  selector: 'app-artists',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzPopconfirmModule,
    PaginationBarComponent,
  ],
  templateUrl: './artists.html',
  styleUrl: './artists.less',
})
export class ArtistsComponent implements OnInit {
  private readonly artistsService = inject(ArtistsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly artists = signal<Artist[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadArtists();
  }

  loadArtists(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: ArtistListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.artistsService.getArtists(params).subscribe({
      next: (res) => {
        this.artists.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.artists.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách artist');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadArtists();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadArtists();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadArtists();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadArtists();
  }

  /**
   * Hiển thị modal nhập tên artist (dùng chung cho create & edit).
   * Dùng modal.create() thay vì confirm() — confirm() render HTML string qua innerHTML
   * nên input không hiển thị đúng. create() cho phép dùng nzContent là Component.
   */
  private showArtistModal(title: string, defaultName: string, onSubmit: (name: string) => Observable<unknown>): void {
    this.modal.create({
      nzTitle: title,
      nzContent: ArtistNameInputComponent,
      nzData: { defaultName },
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (componentInstance: ArtistNameInputComponent) => {
        const name = componentInstance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên artist');
          return false; // Ngăn modal đóng
        }
        return new Promise<boolean>((resolve) => {
          onSubmit(name).subscribe({
            next: () => {
              this.message.success(`Đã lưu artist "${name}"`);
              this.loadArtists();
              resolve(true);
            },
            error: () => {
              this.message.error('Thao tác thất bại');
              resolve(false);
            },
          });
        });
      },
    });
  }

  /** Mở modal tạo artist mới */
  onCreateArtist(): void {
    this.showArtistModal('Tạo Artist mới', '', (name) => this.artistsService.createArtist(name));
  }

  /** Mở modal sửa artist */
  onEditArtist(artist: Artist): void {
    this.showArtistModal('Sửa Artist', artist.name, (name) =>
      this.artistsService.updateArtist(artist.id, name),
    );
  }

  /** Xóa artist */
  onDeleteArtist(artist: Artist): void {
    this.artistsService.deleteArtist(artist.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa artist "${artist.name}"`);
        this.loadArtists();
      },
      error: () => this.message.error('Xóa artist thất bại'),
    });
  }
}
```

**Key Points:**
- Standalone component with all imports in `imports` array
- Uses Angular signals for reactive state (`signal()`)
- Two sub-components: main `ArtistsComponent` + modal-based `ArtistNameInputComponent`
- Modal reused for both create & edit (cleaner UX)
- Includes search form with name filter
- Pagination via `PaginationBarComponent` (custom)
- Actions: create, edit, delete with confirmations
- Messages via `NzMessageService`

---

## 3. Artist Template (HTML)

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/artists/artists.html`

```html
<!-- Search/Filter Section -->
<nz-card nzTitle="Tìm kiếm Artist" [nzExtra]="searchExtra">
  <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical">
    <div nz-row [nzGutter]="[16, 0]">
      <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="24">
        <nz-form-item>
          <nz-form-label>Tên</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="name" placeholder="Nhập tên artist" />
          </nz-form-control>
        </nz-form-item>
      </div>
    </div>
  </form>

  <ng-template #searchExtra>
    <div class="search-actions">
      <button nz-button nzSize="small" (click)="onReset()" type="button">
        <nz-icon nzType="redo" />
        Reset
      </button>
      <button nz-button nzType="primary" nzSize="small" (click)="onSearch()">
        <nz-icon nzType="search" />
        Tìm kiếm
      </button>
      <button nz-button nzType="primary" nzSize="small" (click)="onCreateArtist()">
        <nz-icon nzType="plus" />
        Tạo mới
      </button>
    </div>
  </ng-template>
</nz-card>

<!-- Artists Table -->
<nz-card class="table-card">
  <app-pagination-bar
    [total]="total()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    totalLabel="artist"
    position="top"
    (pageIndexChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  />

  <nz-table
    #artistTable
    [nzData]="artists()"
    [nzLoading]="loading()"
    [nzFrontPagination]="false"
    [nzShowPagination]="false"
    [nzScroll]="{ x: '800px' }"
    nzSize="middle"
  >
    <thead>
      <tr>
        <th nzWidth="80px" nzAlign="center">ID</th>
        <th nzWidth="200px">Tên</th>
        <th nzWidth="200px">Slug</th>
        <th nzWidth="150px">Người tạo</th>
        <th nzWidth="150px">Ngày tạo</th>
        <th nzWidth="120px" nzAlign="center" nzRight>Hành động</th>
      </tr>
    </thead>
    <tbody>
      @for (artist of artistTable.data; track artist.id) {
        <tr>
          <td nzAlign="center">{{ artist.id }}</td>
          <td>
            <span class="artist-name">{{ artist.name }}</span>
          </td>
          <td class="text-muted">{{ artist.slug }}</td>
          <td class="text-muted">{{ artist.user?.name ?? '—' }}</td>
          <td class="text-muted">{{ artist.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          <td nzAlign="center" nzRight>
            <div class="action-buttons">
              <button
                nz-button
                nzSize="small"
                (click)="onEditArtist(artist)"
                title="Sửa"
              >
                <nz-icon nzType="edit" />
              </button>
              <button
                nz-button
                nzDanger
                nzSize="small"
                nz-popconfirm
                [nzPopconfirmTitle]="'Xóa artist \'' + artist.name + '\'?'"
                (nzOnConfirm)="onDeleteArtist(artist)"
                title="Xóa"
              >
                <nz-icon nzType="delete" />
              </button>
            </div>
          </td>
        </tr>
      }
    </tbody>
  </nz-table>

  @if (artists().length > 0) {
    <app-pagination-bar
      [total]="total()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      position="bottom"
      (pageIndexChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    />
  }
</nz-card>
```

**Key Points:**
- Uses ng-zorro components (`nz-card`, `nz-table`, `nz-form`, etc.)
- Search section with name input + buttons
- Table columns: ID, Name, Slug, Creator, Created Date, Actions
- Action buttons: Edit (pencil icon) + Delete (trash icon)
- Pagination at top & bottom (conditional bottom)
- Uses custom `<app-pagination-bar>` component

---

## 4. Artist Styles (LESS)

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/artists/artists.less`

```less
:host {
  display: block;
  padding: 24px;
}

.search-actions {
  display: flex;
  gap: 8px;
}

::ng-deep nz-form-item {
  margin-bottom: 0;
}

.table-card {
  margin-top: 16px;

  ::ng-deep .ant-card-body {
    padding: 0;
  }

  app-pagination-bar {
    display: block;
    padding: 12px 16px;
  }
}

.artist-name {
  font-weight: 500;
}

.text-muted {
  opacity: 0.65;
}

.action-buttons {
  display: inline-flex;
  gap: 8px;
}
```

**Key Points:**
- Scoped styling (`:host` block)
- Padding: 24px for page margin
- Flexbox for search actions & buttons
- Table card has no padding in body
- Pagination bar has padding within card

---

## 5. Routing Configuration

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts` (extract)

```typescript
{
  path: 'artists',
  loadComponent: () => import('./pages/artists/artists').then((m) => m.ArtistsComponent),
},
```

**Location:** Line 27-29 in app.routes.ts  
**Pattern:** Lazy-loaded route using dynamic import  
**Parent Route:** Wrapped in admin layout with auth guard  

---

## 6. Sidebar Menu Registration

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts` (extract)

```typescript
{
  text: 'Artist',
  link: '/artists',
  icon: { type: 'icon', value: 'team' },
},
```

**Location:** Lines 57-61 in startup.service.ts  
**Menu Group:** "MENU CHÍNH" (Main Menu)  
**Icon:** `team` (ng-zorro Ant Design icon)  
**Position:** Below Manga, above Doujinshi  

---

## 7. API Response Model

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts` (relevant parts)

```typescript
/** Thông tin phân trang từ API — nằm trong field "pagination" */
export interface PaginationInfo {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  links?: { next?: string; previous?: string };
}

/**
 * Response format thực tế từ API backend:
 * { status: 200, success: true, data: [...], pagination: { total, perPage, ... } }
 */
export interface PaginatedResponse<T> {
  status: number;
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}
```

**Used By:** `ArtistsService.getArtists()` for list responses

---

## Implementation Checklist

- [x] Artist service (`artists.service.ts`)
- [x] Artist component (`artists.ts`)
- [x] Artist template (`artists.html`)
- [x] Artist styles (`artists.less`)
- [x] Routing entry in `app.routes.ts`
- [x] Menu entry in `startup.service.ts`
- [x] TypeScript interfaces/models (`Artist`, `ArtistListParams`)
- [x] API response types (`PaginatedResponse`, `PaginationInfo`)

---

## Key Architecture Patterns

### 1. Service Injection
- Uses `inject()` function (Angular 14+) instead of constructor parameters
- Services provided at root level (`providedIn: 'root'`)
- Dependency injection: `HttpClient`, `FormBuilder`, `NzModalService`, `NzMessageService`

### 2. Signals API
- State managed via `signal<T>()` (reactive, immutable)
- Accessed as functions: `artists()`, `loading()`, `pageIndex()`
- Updated via `.set()` method
- No Observable subscriptions for state management

### 3. Modal Pattern
- Reuses single modal component (`ArtistNameInputComponent`) for create & edit
- Modal config via `nzOnOk` callback returning `Promise<boolean>`
- Form input passed through `NZ_MODAL_DATA` token

### 4. Reactive Forms
- Reactive forms with `FormBuilder.group()`
- Uses `getRawValue()` to get form data with disabled fields
- One-way binding: form → params (no two-way in this component)

### 5. Lazy Loading
- Route uses dynamic import: `import('./pages/artists/artists').then(m => m.ArtistsComponent)`
- Component loads only when route is activated
- Reduces initial bundle size

### 6. Filter Params
- Backend uses Spatie QueryBuilder with bracket notation: `filter[name]=value`
- Service safely builds params via `HttpParams` builder
- Only adds params with values (avoids `?filter[name]=undefined`)

---

## File Locations Summary

```
src/
├── app/
│   ├── app.routes.ts                                (route definition: line 27-29)
│   ├── core/
│   │   ├── services/artists.service.ts             (API layer)
│   │   ├── models/api-types.ts                      (response types)
│   │   └── startup/startup.service.ts              (menu registration: line 57-61)
│   └── pages/
│       └── artists/
│           ├── artists.ts                           (main component)
│           ├── artists.html                         (template)
│           └── artists.less                         (styles)
```

---

## Unresolved Questions

None. All Artist management files are present and fully documented.
