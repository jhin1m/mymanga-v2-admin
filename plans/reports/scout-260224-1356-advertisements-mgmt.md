# Scout Report: Advertisements Management Implementation

**Date:** 2026-02-24  
**Scope:** Pattern analysis for advertisements management page implementation  
**Status:** Complete

---

## Executive Summary

Analyzed codebase to identify patterns and resources for implementing an advertisements management page. Found comprehensive CRUD patterns in existing pages (doujinshis, genres, manga-list) with consistent architecture using standalone components, signals, ng-zorro tables, and service-based API calls. Ready for implementation.

---

## Key Findings

### 1. Route Configuration

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`

Current routes structure:
- Login route outside layout (line 6-9)
- All authenticated routes as children of AdminLayoutComponent (line 11-97)
- Route pattern: `path: 'resource', loadComponent: () => import(...).then(m => m.ResourceComponent)`

**For Advertisements:**
Add to routes array (around line 55-65):
```typescript
{
  path: 'advertisements',
  loadComponent: () => 
    import('./pages/advertisements/advertisements').then(m => m.AdvertisementsComponent),
},
```

### 2. Menu Configuration (Startup Service)

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts`

Menu structure has 3 groups:
- "MENU CHÍNH" (Main menu) - Dashboard, Members, Manga, Artists, Doujinshi, Genres
- "CỘNG ĐỒNG" (Community) - Groups, Badges, Pets
- "HỆ THỐNG" (System) - Comments, Chapter Reports, Notifications

**For Advertisements:**
Add menu item to "MENU CHÍNH" group (around line 49-66):
```typescript
{
  text: 'Quảng cáo',
  link: '/advertisements',
  icon: { type: 'icon', value: 'bulb' }, // or 'banner', 'picture'
},
```

### 3. Service Pattern (HTTP Layer)

**Reference Files:**
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/doujinshis.service.ts` (simplest CRUD)
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/genres.service.ts` (with payload interface)
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/manga.service.ts` (complex with FormData)

**Service Architecture:**
1. Interface for API response shape (e.g., `Doujinshi`, `Genre`, `Manga`)
2. Interface for list params (filters, pagination)
3. Interface for payload (create/update body)
4. Injectable service with HTTP calls

**Pattern - Doujinshi Service Example:**
```typescript
@Injectable({ providedIn: 'root' })
export class DoujinshisService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/doujinshis`;

  getDoujinshis(params: DoujinshiListParams): Observable<PaginatedResponse<Doujinshi>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Doujinshi>>(this.apiBase, { params: httpParams });
  }

  createDoujinshi(name: string): Observable<ApiResponse<Doujinshi>> {
    return this.http.post<ApiResponse<Doujinshi>>(this.apiBase, { name });
  }

  updateDoujinshi(id: string, name: string): Observable<ApiResponse<Doujinshi>> {
    return this.http.put<ApiResponse<Doujinshi>>(`${this.apiBase}/${id}`, { name });
  }

  deleteDoujinshi(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

**For Advertisements Service:**
```typescript
export interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  link?: string | null;
  status: number; // 1=active, 0=inactive
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string };
}

export interface AdvertisementListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[title]'?: string;
  'filter[status]'?: number;
}

export interface AdvertisementPayload {
  title: string;
  description: string;
  image?: File;
  link?: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class AdvertisementsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/advertisements`;

  getAdvertisements(params: AdvertisementListParams): Observable<PaginatedResponse<Advertisement>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Advertisement>>(this.apiBase, { params: httpParams });
  }

  createAdvertisement(formData: FormData): Observable<ApiResponse<Advertisement>> {
    return this.http.post<ApiResponse<Advertisement>>(this.apiBase, formData);
  }

  updateAdvertisement(id: string, formData: FormData): Observable<ApiResponse<Advertisement>> {
    return this.http.post<ApiResponse<Advertisement>>(`${this.apiBase}/${id}`, formData);
  }

  deleteAdvertisement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

### 4. Component Architecture Pattern

**Reference:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/genres/genres.ts`

**Key Patterns:**

#### Standalone Component with Signals:
```typescript
@Component({
  selector: 'app-advertisements',
  imports: [ // List all ng-zorro + shared components
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
  templateUrl: './advertisements.html',
  styleUrl: './advertisements.less',
})
export class AdvertisementsComponent implements OnInit {
  // Inject dependencies
  private readonly advertisementsService = inject(AdvertisementsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // Signals for state management
  protected readonly advertisements = signal<Advertisement[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  // Search form
  protected readonly searchForm = this.fb.group({
    title: [''],
    status: [''],
  });

  ngOnInit(): void {
    this.loadAdvertisements();
  }

  loadAdvertisements(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: AdvertisementListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.title) params['filter[title]'] = formValue.title;
    if (formValue.status !== '' && formValue.status !== null) {
      params['filter[status]'] = Number(formValue.status);
    }

    this.advertisementsService.getAdvertisements(params).subscribe({
      next: (res) => {
        this.advertisements.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.advertisements.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách quảng cáo');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadAdvertisements();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadAdvertisements();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadAdvertisements();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadAdvertisements();
  }

  onDeleteAdvertisement(ad: Advertisement): void {
    this.advertisementsService.deleteAdvertisement(ad.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa quảng cáo "${ad.title}"`);
        this.loadAdvertisements();
      },
      error: () => this.message.error('Xóa quảng cáo thất bại'),
    });
  }
}
```

#### Modal Component for Create/Edit:
```typescript
@Component({
  selector: 'app-advertisement-form-modal',
  imports: [FormsModule, NzInputModule, NzFormModule, NzSwitchModule, NzUploadModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tiêu đề</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="title" placeholder="Nhập tiêu đề" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Mô tả</nz-form-label>
      <nz-form-control>
        <textarea nz-input [(ngModel)]="description" placeholder="Nhập mô tả" [nzAutosize]="{ minRows: 3 }"></textarea>
      </nz-form-control>
    </nz-form-item>
    <!-- More form fields as needed -->
  `,
})
export class AdvertisementFormModalComponent {
  private readonly data = inject<{ title: string; description: string }>(NZ_MODAL_DATA);
  title = this.data.title ?? '';
  description = this.data.description ?? '';
}
```

### 5. Page Template Pattern

**Reference:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/genres/genres.html`

**Structure:**
1. Search/Filter card
2. Data table card
3. Pagination bar (top & bottom)

**For Advertisements HTML:**
```html
<!-- Search/Filter Section -->
<nz-card nzTitle="Tìm kiếm Quảng cáo" [nzExtra]="searchExtra">
  <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical">
    <div nz-row [nzGutter]="[16, 0]">
      <div nz-col [nzXs]="24" [nzSm]="12">
        <nz-form-item>
          <nz-form-label>Tiêu đề</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="title" placeholder="Nhập tiêu đề" />
          </nz-form-control>
        </nz-form-item>
      </div>
      <div nz-col [nzXs]="24" [nzSm]="12">
        <nz-form-item>
          <nz-form-label>Trạng thái</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="status" nzPlaceHolder="Tất cả" nzAllowClear>
              <nz-option [nzValue]="1" [nzLabel]="'Kích hoạt'" />
              <nz-option [nzValue]="0" [nzLabel]="'Vô hiệu hóa'" />
            </nz-select>
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
      <button nz-button nzType="primary" nzSize="small" (click)="onCreateAdvertisement()">
        <nz-icon nzType="plus" />
        Tạo mới
      </button>
    </div>
  </ng-template>
</nz-card>

<!-- Advertisements Table -->
<nz-card class="table-card">
  <app-pagination-bar
    [total]="total()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    totalLabel="quảng cáo"
    position="top"
    (pageIndexChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  />

  <nz-table
    #adTable
    [nzData]="advertisements()"
    [nzLoading]="loading()"
    [nzFrontPagination]="false"
    [nzShowPagination]="false"
    [nzScroll]="{ x: '900px' }"
    nzSize="middle"
  >
    <thead>
      <tr>
        <th nzWidth="80px" nzAlign="center">ID</th>
        <th nzWidth="200px">Tiêu đề</th>
        <th nzWidth="200px">Mô tả</th>
        <th nzWidth="100px" nzAlign="center">Trạng thái</th>
        <th nzWidth="150px">Ngày tạo</th>
        <th nzWidth="120px" nzAlign="center" nzRight>Hành động</th>
      </tr>
    </thead>
    <tbody>
      @for (ad of adTable.data; track ad.id) {
        <tr>
          <td nzAlign="center">{{ ad.id }}</td>
          <td>{{ ad.title }}</td>
          <td class="text-muted">{{ ad.description }}</td>
          <td nzAlign="center">
            <nz-tag [nzColor]="ad.status ? 'success' : 'default'">
              {{ ad.status ? 'Kích hoạt' : 'Vô hiệu' }}
            </nz-tag>
          </td>
          <td class="text-muted">{{ ad.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          <td nzAlign="center" nzRight>
            <div class="action-buttons">
              <button
                nz-button
                nzSize="small"
                (click)="onEditAdvertisement(ad)"
                title="Sửa"
              >
                <nz-icon nzType="edit" />
              </button>
              <button
                nz-button
                nzDanger
                nzSize="small"
                nz-popconfirm
                [nzPopconfirmTitle]="'Xóa quảng cáo \"' + ad.title + '\"?'"
                (nzOnConfirm)="onDeleteAdvertisement(ad)"
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

  @if (advertisements().length > 0) {
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

### 6. API Response Types

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

Already defined:
```typescript
export interface PaginatedResponse<T> {
  status: number;
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  links?: { next?: string; previous?: string };
}
```

Used by: `ApiResponse<T>` from auth.service (wraps single resource)

### 7. Shared Components

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`

**Usage Pattern:**
```html
<app-pagination-bar
  [total]="total()"
  [pageIndex]="pageIndex()"
  [pageSize]="pageSize()"
  totalLabel="quảng cáo"
  position="top"
  (pageIndexChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)"
/>
```

Inputs:
- `total`: number (required)
- `pageIndex`: number (required)
- `pageSize`: number (required)
- `totalLabel`: string (default: 'mục')
- `position`: 'top' | 'bottom' (default: 'top')
- `pageSizeOptions`: number[] (default: [10, 20, 50])

Outputs:
- `pageIndexChange`: EventEmitter<number>
- `pageSizeChange`: EventEmitter<number>

---

## Directory Structure Reference

```
src/app/
├── pages/
│   ├── advertisements/              # NEW - Advertisement list page
│   │   ├── advertisements.ts        # Main component
│   │   ├── advertisements.html      # Template
│   │   └── advertisements.less      # Styles
│   ├── doujinshis/
│   ├── genres/
│   ├── manga-list/
│   └── ... (other pages)
├── core/
│   ├── services/
│   │   ├── advertisements.service.ts # NEW - HTTP service
│   │   ├── doujinshis.service.ts
│   │   ├── genres.service.ts
│   │   └── ... (other services)
│   ├── models/
│   │   └── api-types.ts
│   ├── guards/
│   ├── interceptors/
│   └── startup/
│       └── startup.service.ts        # Update: add menu item
├── layout/
│   └── admin-layout/
├── shared/
│   └── pagination-bar/
└── app.routes.ts                    # Update: add route
```

---

## Key Technologies & Patterns

### Technology Stack
- **Angular 21** with signals API
- **ng-zorro v21.1.0** — antd-like UI components
- **Reactive Forms** — FormBuilder for forms
- **RxJS** — Observable-based HTTP requests
- **Standalone Components** — no NgModules
- **TypeScript 5.9** — strict mode

### Component State Management
- Use `signal<T>()` for reactive state
- Use `input()` for component inputs (Angular 17+)
- Use `output()` for component outputs (Angular 17+)
- Use `computed()` if derived state needed

### Form Patterns
- `FormBuilder` for reactive forms
- `FormGroup` with `getRawValue()`
- Modal dialogs for create/edit (NZ_MODAL_DATA injection)
- Upload handling with `beforeUpload` hook

### HTTP Patterns
- `HttpClient.get/post/put/delete` with `Observable<T>`
- `HttpParams` for query parameters (handles encoding)
- Filter params as `filter[field]` (Spatie QueryBuilder)
- Multipart form data for file uploads (FormData)

### ng-Zorro Components
- `nz-card` — containers
- `nz-form` + `nz-form-item` + `nz-form-control` — forms
- `nz-table` — data tables
- `nz-button` — buttons
- `nz-icon` — icons (feather icons via ng-zorro)
- `nz-input` — text input
- `nz-select` — dropdowns
- `nz-modal` — dialogs
- `nz-message` — toast notifications
- `nz-popconfirm` — confirmation dialogs
- `nz-switch` — toggle switches
- `nz-tag` — badges/tags
- `nz-upload` — file upload

---

## Files to Create

1. **Service** → `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/advertisements.service.ts`
2. **Component** → `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/advertisements/advertisements.ts`
3. **Template** → `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/advertisements/advertisements.html`
4. **Styles** → `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/advertisements/advertisements.less`

## Files to Update

1. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts` — add route
2. `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts` — add menu item

---

## Implementation Checklist

- [ ] Create advertisements.service.ts with interfaces + HTTP methods
- [ ] Create advertisements.ts component with signals + form logic
- [ ] Create advertisements.html template (search card + table + pagination)
- [ ] Create advertisements.less stylesheet
- [ ] Update app.routes.ts with new route
- [ ] Update startup.service.ts with menu item
- [ ] Test pagination, search, create, edit, delete flows
- [ ] Verify routing and menu navigation

---

## Reference Files (Full Paths)

- **Simple CRUD Service:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/doujinshis.service.ts`
- **With Modal Component:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/genres/genres.ts`
- **Table Template:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/doujinshis/doujinshis.html`
- **Complex Form (for reference):** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/manga-edit.ts`
- **Routes Config:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`
- **Menu Config:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts`
- **Pagination Component:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`
- **API Types:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

---

## Unresolved Questions

None at this time. All patterns documented and ready for implementation.
