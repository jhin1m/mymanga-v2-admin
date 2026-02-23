# Scout Report: MyManga Admin Panel Patterns

**Date:** 2026-02-20  
**Scope:** Analyzed existing management pages, services, routing, and shared components to establish patterns for new feature development.

---

## 1. Directory Structure

```
src/app/
├── pages/                          # Page components
│   ├── comments/                   # List + search pattern
│   ├── members/                    # List + search + actions pattern
│   ├── artists/                    # List + search + modal CRUD
│   ├── genres/                     # List + search + modal form
│   ├── groups/
│   ├── achievements/
│   ├── pets/
│   ├── doujinshis/
│   ├── manga-list/                 # List with complex filters
│   ├── manga-create/
│   ├── manga-edit/
│   ├── chapter-create/
│   ├── chapter-edit/
│   ├── dashboard/
│   └── login/
│
├── core/
│   ├── services/                   # API services
│   │   ├── comments.service.ts
│   │   ├── members.service.ts
│   │   ├── artists.service.ts
│   │   ├── genres.service.ts
│   │   ├── manga.service.ts
│   │   ├── chapters.service.ts
│   │   ├── groups.service.ts
│   │   ├── achievements.service.ts
│   │   ├── pets.service.ts
│   │   ├── doujinshis.service.ts
│   │   └── auth.service.ts
│   ├── models/
│   │   └── api-types.ts            # PaginatedResponse<T>, PaginationInfo
│   ├── guards/
│   ├── interceptors/
│   └── startup/
│       └── startup.service.ts      # Menu initialization
│
├── shared/
│   └── pagination-bar/
│       └── pagination-bar.ts       # Reusable pagination component
│
├── layout/
│   └── admin-layout/               # Main layout wrapper
│
├── app.routes.ts                   # Lazy-loaded route definitions
└── app.config.ts                   # Provider configuration
```

---

## 2. Routing Pattern

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`

### Structure:
- **Login route:** Standalone (outside layout)
- **Authenticated routes:** Nested children of AdminLayoutComponent with `authGuard`
- **Lazy-loading:** All page components loaded via `loadComponent()`

### Key Routes:
```typescript
{
  path: '',
  canActivate: [authGuard],
  loadComponent: () => import('./layout/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
  children: [
    {
      path: 'dashboard',
      loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    },
    {
      path: 'members',
      loadComponent: () => import('./pages/members/members').then(m => m.MembersComponent),
    },
    {
      path: 'manga',
      children: [
        { path: 'list', loadComponent: () => ... },
        { path: 'create', loadComponent: () => ... },
        { path: 'edit/:id', loadComponent: () => ... },
        { path: ':mangaId/chapters/create', loadComponent: () => ... },
        { path: ':mangaId/chapters/:chapterId/edit', loadComponent: () => ... },
        { path: '', redirectTo: 'list', pathMatch: 'full' },
      ],
    },
  ],
}
```

---

## 3. Sidebar Menu Pattern

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts`

### Structure:
- Uses `MenuService.add()` to populate sidebar menu
- Groups menu items by category (MENU CHÍNH, CỘNG ĐỒNG, HỆ THỐNG)
- Supports nested menu items

### Menu Groups:
1. **MENU CHÍNH** (Dashboard, Members, Manga, Artists, Doujinshi, Genres)
2. **CỘNG ĐỒNG** (Translation groups, Achievements/Badges, Pets)
3. **HỆ THỐNG** (Comments, Notifications)

### Code Pattern:
```typescript
this.menuService.add([
  {
    group: true,
    text: 'MENU CHÍNH',
    children: [
      {
        text: 'Tổng quan',
        link: '/dashboard',
        icon: { type: 'icon', value: 'dashboard' },
      },
      // ... more items
    ],
  },
]);
```

---

## 4. Service Pattern (API Layer)

**Example:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/comments.service.ts`

### Standard Structure:
```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';

// 1. Data interfaces (shapes from API)
export interface Comment {
  id: string;
  content: string;
  user_id: string;
  user?: { id: string; name: string; avatar_full_url?: string };
  created_at: string;
  updated_at: string;
}

// 2. Params interface (filters + pagination)
export interface CommentListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[username]'?: string;
}

// 3. Service with HttpClient injection
@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/comments`;

  // List method with filtering & pagination
  getComments(params: CommentListParams): Observable<PaginatedResponse<Comment>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Comment>>(this.apiBase, { params: httpParams });
  }

  // Delete method
  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

### API Response Format (Backend Spatie QueryBuilder):
```typescript
// PaginatedResponse<T>
{
  status: 200,
  success: true,
  data: T[],
  pagination: {
    count: number,
    total: number,
    perPage: number,
    currentPage: number,
    totalPages: number,
    links?: { next?: string, previous?: string }
  }
}

// ApiResponse<T> (single item response)
{
  success: true,
  data: T
}
```

### Service Methods by Operation:

| Operation | HTTP Method | Return Type | Example |
|-----------|------------|-------------|---------|
| **List** | GET | `Observable<PaginatedResponse<T>>` | `getMembers(params)` |
| **Get Single** | GET | `Observable<ApiResponse<T>>` | `getManga(id)` |
| **Create** | POST | `Observable<ApiResponse<T>>` | `createArtist(name)` |
| **Update** | PUT or POST | `Observable<ApiResponse<T>>` | `updateManga(id, formData)` |
| **Delete** | DELETE | `Observable<void>` | `deleteComment(id)` |
| **Custom Action** | POST | `Observable<ApiResponse<T>>` | `banUser(id)` |

### Filtering Pattern (Spatie QueryBuilder):
- Filter params: `filter[field_name]=value`
- Include relations: `include=relation1,relation2`
- Sorting: `sort=-created_at` (- prefix = DESC)
- Pagination: `page=1&per_page=20`

---

## 5. Page Component Pattern (List + Search)

**Example:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/members/members.ts`

### Component Structure:
```typescript
@Component({
  selector: 'app-members',
  imports: [
    // Forms
    ReactiveFormsModule,
    // Pipes
    DatePipe,
    // NG-ZORRO modules
    NzCardModule,
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzAvatarModule,
    // Shared
    PaginationBarComponent,
  ],
  templateUrl: './members.html',
  styleUrl: './members.less',
})
export class MembersComponent implements OnInit {
  // Service injection
  private readonly membersService = inject(MembersService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // --- Signals for reactive state management ---
  protected readonly members = signal<Member[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  // --- Search/filter form ---
  protected readonly searchForm = this.fb.group({
    id: [''],
    name: [''],
    email: [''],
    role: [''],
  });

  // --- Static options (for dropdowns) ---
  protected readonly roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Translator', value: 'translator' },
    { label: 'User', value: 'user' },
  ];

  // --- Lifecycle ---
  ngOnInit(): void {
    this.loadMembers();
  }

  // --- Data loading ---
  loadMembers(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    
    const params: MemberListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
    };
    
    // Only set filter params if they have values
    if (formValue.id) params['filter[id]'] = formValue.id;
    if (formValue.name) params['filter[name]'] = formValue.name;
    if (formValue.email) params['filter[email]'] = formValue.email;
    if (formValue.role) params['filter[role]'] = formValue.role;

    this.membersService.getMembers(params).subscribe({
      next: (res) => {
        this.members.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.members.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách thành viên');
        this.loading.set(false);
      },
    });
  }

  // --- Search/Pagination handlers ---
  onSearch(): void {
    this.pageIndex.set(1);
    this.loadMembers();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadMembers();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadMembers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadMembers();
  }

  // --- Actions ---
  onBanUser(member: Member): void {
    this.membersService.banUser(member.id).subscribe({
      next: () => {
        this.message.success(`Đã ${member.banned_until ? 'bỏ cấm' : 'cấm'} thành viên "${member.name}"`);
        this.loadMembers();
      },
      error: () => this.message.error('Thao tác thất bại'),
    });
  }
}
```

### Signal Pattern (Angular 17+):
- Use `signal<T>()` for reactive state
- Use `computed()` for derived state (optional)
- Access in template with `()` function call: `{{ members() }}`

---

## 6. HTML Template Pattern

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/members/members.html`

### Structure:
```html
<!-- 1. Search/Filter Card -->
<nz-card nzTitle="Tìm kiếm thành viên" [nzExtra]="searchExtra">
  <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical">
    <div nz-row [nzGutter]="[16, 0]">
      <!-- Filter inputs in grid layout -->
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
        <nz-form-item>
          <nz-form-label>Field Label</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="fieldName" placeholder="..." />
          </nz-form-control>
        </nz-form-item>
      </div>
    </div>
  </form>

  <!-- Action buttons in card header -->
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
    </div>
  </ng-template>
</nz-card>

<!-- 2. Data Table Card -->
<nz-card class="table-card">
  <!-- Pagination bar (top) -->
  <app-pagination-bar
    [total]="total()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    totalLabel="thành viên"
    position="top"
    (pageIndexChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  />

  <!-- Table -->
  <nz-table
    #memberTable
    [nzData]="members()"
    [nzLoading]="loading()"
    [nzFrontPagination]="false"
    [nzShowPagination]="false"
    [nzScroll]="{ x: '1000px' }"
    nzSize="middle"
  >
    <thead>
      <tr>
        <th nzWidth="100px" nzAlign="center">ID</th>
        <th nzWidth="240px">Name</th>
        <!-- More columns -->
        <th nzWidth="160px" nzAlign="center" nzRight>Actions</th>
      </tr>
    </thead>
    <tbody>
      @for (item of memberTable.data; track item.id) {
        <tr>
          <td nzAlign="center">{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <!-- More cells -->
          <td nzAlign="center" nzRight>
            <div class="action-buttons">
              <!-- Action buttons -->
            </div>
          </td>
        </tr>
      }
    </tbody>
  </nz-table>

  <!-- Pagination bar (bottom) -->
  @if (members().length > 0) {
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

### Key NG-ZORRO Components:
- **NzCardModule:** Container with title and extra content slot
- **NzTableModule:** Data table with scroll support
- **NzFormModule:** Form layout with NzFormItem/NzFormLabel/NzFormControl
- **NzInputModule, NzSelectModule:** Form inputs
- **NzButtonModule:** Buttons with type and size options
- **NzGridModule:** Responsive grid (nzXs, nzSm, nzMd, nzLg)
- **NzIconModule:** Icons from antd icon library
- **NzTagModule:** Status tags with colors
- **NzPopconfirmModule:** Confirmation before destructive actions
- **NzAvatarModule:** User avatars

### Control Flow:
- Use `@for` (new Angular control flow) for loops
- Use `@if` for conditional rendering
- Track by `item.id` for efficient re-rendering

---

## 7. Modal/Form Pattern (Create/Edit)

**Example:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/genres/genres.ts`

### Simple Modal (Form in modal):
```typescript
// 1. Define inline modal component
@Component({
  selector: 'app-genre-form-modal',
  imports: [FormsModule, NzInputModule, NzSwitchModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tên thể loại</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="..." />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Show Header</nz-form-label>
      <nz-form-control>
        <nz-switch [(ngModel)]="showHeader" />
      </nz-form-control>
    </nz-form-item>
  `,
})
export class GenreFormModalComponent {
  private readonly data = inject<{ name: string; showHeader: boolean }>(NZ_MODAL_DATA);
  name = this.data.name ?? '';
  showHeader = this.data.showHeader ?? false;
}

// 2. Show modal in parent component
private showGenreModal(
  title: string,
  defaults: { name: string; showHeader: boolean },
  onSubmit: (payload: GenrePayload) => Observable<unknown>,
): void {
  this.modal.create({
    nzTitle: title,
    nzContent: GenreFormModalComponent,
    nzData: defaults,
    nzOkText: 'Lưu',
    nzCancelText: 'Hủy',
    nzOnOk: (instance: GenreFormModalComponent) => {
      const name = instance.name.trim();
      if (!name) {
        this.message.warning('Vui lòng nhập tên');
        return false; // Prevent modal close
      }
      const payload: GenrePayload = {
        name,
        show_header: instance.showHeader,
      };
      return new Promise<boolean>((resolve) => {
        onSubmit(payload).subscribe({
          next: () => {
            this.message.success(`Đã lưu "${name}"`);
            this.loadGenres();
            resolve(true); // Allow modal close
          },
          error: () => {
            this.message.error('Thao tác thất bại');
            resolve(false); // Prevent close on error
          },
        });
      });
    },
  });
}

// 3. Call modal from button handlers
onCreateGenre(): void {
  this.showGenreModal(
    'Tạo thể loại mới',
    { name: '', showHeader: false },
    (payload) => this.genresService.createGenre(payload),
  );
}

onEditGenre(genre: Genre): void {
  this.showGenreModal(
    'Sửa thể loại',
    { name: genre.name, showHeader: genre.show_header },
    (payload) => this.genresService.updateGenre(genre.id, payload),
  );
}
```

### Key Points:
- Modal component uses `NZ_MODAL_DATA` to receive initial values
- Modal component uses two-way binding `[(ngModel)]`
- Parent passes `onSubmit` callback (Observable) to handle submission
- Modal returns `Promise<boolean>` to control close behavior

---

## 8. Shared Components

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`

### PaginationBarComponent:
```typescript
/**
 * Shared pagination bar — displays total count + nz-pagination.
 * Used across all list pages (members, manga, artists, etc.)
 *
 * Usage:
 *   <app-pagination-bar
 *     [total]="total()"
 *     [pageIndex]="pageIndex()"
 *     [pageSize]="pageSize()"
 *     totalLabel="truyện"
 *     position="top"
 *     (pageIndexChange)="onPageChange($event)"
 *     (pageSizeChange)="onPageSizeChange($event)"
 *   />
 */
@Component({
  selector: 'app-pagination-bar',
  standalone: true,
  imports: [NzPaginationModule],
  template: `
    <div class="pagination-bar" [class.bottom]="position() === 'bottom'">
      @if (position() === 'top') {
        <span class="total-text">
          Tổng <strong>{{ total() }}</strong> {{ totalLabel() }}
        </span>
      }
      <nz-pagination
        [nzPageIndex]="pageIndex()"
        [nzPageSize]="pageSize()"
        [nzTotal]="total()"
        [nzShowSizeChanger]="true"
        [nzPageSizeOptions]="pageSizeOptions()"
        nzSize="small"
        (nzPageIndexChange)="pageIndexChange.emit($event)"
        (nzPageSizeChange)="pageSizeChange.emit($event)"
      />
    </div>
  `,
})
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

### Signal-based Inputs/Outputs:
- `input()` and `input.required()` replace `@Input()`
- `output()` replaces `@Output() EventEmitter`
- Template accesses signals with `()` function call

---

## 9. Styling Pattern (LESS)

### File Naming:
- Component styles: `{page-name}.less` (e.g., `members.less`)
- Located co-located with component

### Common Styles:
```less
// Layout helpers
.search-actions {
  display: flex;
  gap: 8px;

  button {
    margin-left: 8px;
  }
}

.table-card {
  margin-top: 16px;
}

// Row/cell utilities
.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-detail {
  display: flex;
  flex-direction: column;
}

.text-muted {
  opacity: 0.65;
}

// Actions
.action-buttons {
  display: flex;
  gap: 8px;
}
```

---

## 10. Common Patterns Summary

### Initialization Flow:
1. Component `ngOnInit()` calls `loadData()`
2. `loadData()` builds params and calls service
3. Service calls API with HttpParams
4. Component updates signals on success/error
5. Template automatically re-renders via signal changes

### Form Filtering Flow:
1. User enters search criteria in form
2. Click "Tìm kiếm" calls `onSearch()`
3. `onSearch()` resets page to 1 and calls `loadData()`
4. Click "Reset" clears form and calls `onSearch()`

### Action Flow (Delete/Ban/etc.):
1. User clicks action button with `nz-popconfirm`
2. User confirms in popconfirm dialog
3. Component calls service method
4. On success: show message, reload data
5. On error: show error message

### Modal CRUD Flow:
1. Button click calls `onCreateX()` or `onEditX(item)`
2. Function calls `showXModal(title, defaults, onSubmit)`
3. Modal opens with form component and pre-filled values
4. User submits form in modal `nzOnOk` callback
5. Validation in callback — return `false` to prevent close
6. On submit success: reload data, allow modal close
7. On submit error: show error message, prevent modal close

---

## 11. Key Imports by Functionality

### Form Handling:
```typescript
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
```

### Angular Features:
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
```

### NG-ZORRO Modules (add as needed):
```typescript
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
```

### Services & Types:
```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';
```

---

## 12. File Locations (for Reference)

| Component | Path |
|-----------|------|
| Comments list | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/comments/comments.ts` |
| Members list | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/members/members.ts` |
| Artists (modal CRUD) | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/artists/artists.ts` |
| Genres (modal form) | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/genres/genres.ts` |
| Manga list (complex filters) | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-list/manga-list.ts` |
| Comments service | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/comments.service.ts` |
| Members service | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/members.service.ts` |
| Pagination component | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts` |
| Routing | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts` |
| Startup menu | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts` |
| API types | `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts` |

---

## 13. Best Practices Observed

1. **Signals-first state:** All reactive state uses `signal()`, not RxJS Subjects
2. **Dependency injection:** All services use `inject()` in property initializers
3. **Strong typing:** Explicit interfaces for data shapes and API params
4. **Error handling:** Every API call has error handler with user-facing message
5. **Pagination control:** Dedicated component for pagination, shared across pages
6. **Form validation:** Modal callbacks validate before submission, return boolean
7. **Lazy loading:** All page components lazy-loaded via route config
8. **Defensive checks:** Optional chaining and nullish coalescing (`res?.data ?? []`)
9. **No state management library:** Pure signals + component local state sufficient
10. **Standalone components:** No NgModules, only standalone imports

---

## Quick Start Template

For a new management page, follow this template structure:

### 1. Create Service
```
src/app/core/services/{feature}.service.ts
```

### 2. Create Page Component
```
src/app/pages/{feature}/{feature}.ts
src/app/pages/{feature}/{feature}.html
src/app/pages/{feature}/{feature}.less
```

### 3. Add Route
```
// In app.routes.ts
{
  path: 'feature',
  loadComponent: () => import('./pages/feature/feature').then(m => m.FeatureComponent),
}
```

### 4. Add Menu Item
```
// In startup.service.ts
menuService.add([
  {
    group: true,
    text: 'GROUP_NAME',
    children: [
      {
        text: 'Feature',
        link: '/feature',
        icon: { type: 'icon', value: 'icon-name' },
      },
    ],
  },
]);
```

---

**Report generated:** 2026-02-20
