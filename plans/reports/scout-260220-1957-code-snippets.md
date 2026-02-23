# Code Snippets Reference - MyManga Admin Panel

Quick-reference code snippets for common patterns across the codebase.

---

## 1. Service (API Layer)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/comments.service.ts`

### Full Service Template
```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    avatar_full_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CommentListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[username]'?: string;
}

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/comments`;

  getComments(params: CommentListParams): Observable<PaginatedResponse<Comment>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Comment>>(this.apiBase, { params: httpParams });
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

---

## 2. List Component (with Search & Pagination)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/comments/comments.ts`

### Full Component Template
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMessageService } from 'ng-zorro-antd/message';

import { Comment, CommentListParams, CommentsService } from '../../core/services/comments.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-comments',
  standalone: true,
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
    NzAvatarModule,
    PaginationBarComponent,
  ],
  templateUrl: './comments.html',
  styleUrl: './comments.less',
})
export class CommentsComponent implements OnInit {
  private readonly commentsService = inject(CommentsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  protected readonly comments = signal<Comment[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    username: [''],
  });

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: CommentListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.username) params['filter[username]'] = formValue.username;

    this.commentsService.getComments(params).subscribe({
      next: (res) => {
        this.comments.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.comments.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách bình luận');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadComments();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadComments();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadComments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadComments();
  }

  onDeleteComment(comment: Comment): void {
    this.commentsService.deleteComment(comment.id).subscribe({
      next: () => {
        this.message.success('Đã xóa bình luận');
        this.loadComments();
      },
      error: () => this.message.error('Xóa bình luận thất bại'),
    });
  }
}
```

---

## 3. List Template (HTML)

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/comments/comments.html`

### Complete Template Structure
```html
<!-- Search Card -->
<nz-card nzTitle="Tìm kiếm bình luận" [nzExtra]="searchExtra">
  <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical">
    <div nz-row [nzGutter]="[16, 0]">
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="24">
        <nz-form-item>
          <nz-form-label>Tên thành viên</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="username" placeholder="Nhập tên" />
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
    </div>
  </ng-template>
</nz-card>

<!-- Data Table -->
<nz-card class="table-card">
  <app-pagination-bar
    [total]="total()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    totalLabel="bình luận"
    position="top"
    (pageIndexChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  />

  <nz-table
    #commentTable
    [nzData]="comments()"
    [nzLoading]="loading()"
    [nzFrontPagination]="false"
    [nzShowPagination]="false"
    [nzScroll]="{ x: '1000px' }"
    nzSize="middle"
  >
    <thead>
      <tr>
        <th nzWidth="200px">Nội dung</th>
        <th nzWidth="150px">Người bình luận</th>
        <th nzWidth="150px">Ngày tạo</th>
        <th nzWidth="120px" nzAlign="center" nzRight>Hành động</th>
      </tr>
    </thead>
    <tbody>
      @for (comment of commentTable.data; track comment.id) {
        <tr>
          <td>{{ comment.content }}</td>
          <td>
            <div class="user-info">
              <nz-avatar
                [nzSrc]="comment.user?.avatar_full_url ?? undefined"
                nzIcon="user"
                [nzSize]="24"
              />
              <span>{{ comment.user?.name ?? '—' }}</span>
            </div>
          </td>
          <td>{{ comment.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          <td nzAlign="center" nzRight>
            <button
              nz-button
              nzDanger
              nzSize="small"
              nz-popconfirm
              nzPopconfirmTitle="Xóa bình luận này?"
              (nzOnConfirm)="onDeleteComment(comment)"
              title="Xóa"
            >
              <nz-icon nzType="delete" />
            </button>
          </td>
        </tr>
      }
    </tbody>
  </nz-table>

  @if (comments().length > 0) {
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

---

## 4. Modal Form Pattern

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/genres/genres.ts`

### Modal Component + Parent Pattern
```typescript
// 1. MODAL COMPONENT
@Component({
  selector: 'app-genre-form-modal',
  imports: [FormsModule, NzInputModule, NzSwitchModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tên thể loại</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="Nhập tên thể loại" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Hiển thị trên PC</nz-form-label>
      <nz-form-control>
        <nz-switch [(ngModel)]="showHeader" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Hiển thị trên Mobile</nz-form-label>
      <nz-form-control>
        <nz-switch [(ngModel)]="showMb" />
      </nz-form-control>
    </nz-form-item>
  `,
})
export class GenreFormModalComponent {
  private readonly data = inject<{ name: string; showHeader: boolean; showMb: boolean }>(NZ_MODAL_DATA);
  name = this.data.name ?? '';
  showHeader = this.data.showHeader ?? false;
  showMb = this.data.showMb ?? false;
}

// 2. PARENT COMPONENT METHOD
export class GenresComponent implements OnInit {
  private readonly genresService = inject(GenresService);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);

  private showGenreModal(
    title: string,
    defaults: { name: string; showHeader: boolean; showMb: boolean },
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
          this.message.warning('Vui lòng nhập tên thể loại');
          return false; // Prevent close
        }
        const payload: GenrePayload = {
          name,
          show_header: instance.showHeader,
          show_mb: instance.showMb,
        };
        return new Promise<boolean>((resolve) => {
          onSubmit(payload).subscribe({
            next: () => {
              this.message.success(`Đã lưu thể loại "${name}"`);
              this.loadGenres();
              resolve(true); // Allow close
            },
            error: () => {
              this.message.error('Thao tác thất bại');
              resolve(false); // Prevent close
            },
          });
        });
      },
    });
  }

  onCreateGenre(): void {
    this.showGenreModal('Tạo thể loại mới', { name: '', showHeader: false, showMb: false }, (payload) =>
      this.genresService.createGenre(payload),
    );
  }

  onEditGenre(genre: Genre): void {
    this.showGenreModal(
      'Sửa thể loại',
      { name: genre.name, showHeader: genre.show_header, showMb: genre.show_mb },
      (payload) => this.genresService.updateGenre(genre.id, payload),
    );
  }
}
```

---

## 5. Pagination Bar Component

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`

### Full Component Code
```typescript
import { Component, input, output } from '@angular/core';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

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
  styles: `
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      &.bottom {
        margin-bottom: 0;
        margin-top: 16px;
        justify-content: flex-end;
      }
    }

    .total-text {
      opacity: 0.65;
      font-size: 13px;
    }
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

---

## 6. Route Configuration

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`

### Route Pattern for New Page
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Login outside layout
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  // All authenticated routes wrapped in admin layout
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      // ADD NEW ROUTES HERE
      {
        path: 'my-feature',
        loadComponent: () =>
          import('./pages/my-feature/my-feature').then((m) => m.MyFeatureComponent),
      },
      // Nested routes example (like manga with children)
      {
        path: 'manga',
        children: [
          {
            path: 'list',
            loadComponent: () =>
              import('./pages/manga-list/manga-list').then((m) => m.MangaListComponent),
          },
          { path: '', redirectTo: 'list', pathMatch: 'full' },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

---

## 7. Startup Menu Service

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts`

### Add Menu Item Pattern
```typescript
import { Injectable, inject } from '@angular/core';
import { MenuService } from '@delon/theme';

@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly menuService = inject(MenuService);

  load(): Promise<void> {
    return Promise.resolve().then(() => {
      this.initMenuItems();
    });
  }

  private initMenuItems(): void {
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
          // ADD NEW MENU ITEM HERE
          {
            text: 'My Feature',
            link: '/my-feature',
            icon: { type: 'icon', value: 'icon-name' },
          },
        ],
      },
      // More menu groups...
    ]);
  }
}
```

### Available Antd Icons
Common icons used:
- `dashboard`, `user`, `book`, `team`, `file`, `tags`, `message`, `notification`
- `delete`, `edit`, `plus`, `search`, `redo`, `stop`, `smile`, `trophy`

---

## 8. API Types

**Source:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

### Shared Types
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

// For single item responses (used in services)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
```

---

## 9. LESS Styling Template

### Component Styles
```less
// src/app/pages/my-feature/my-feature.less

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

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-muted {
  opacity: 0.65;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
```

---

## 10. Complete Service Template

For quick copy-paste when creating new service:

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

// ============================================
// INTERFACES
// ============================================

export interface MyItem {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface MyItemListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[name]'?: string;
}

export interface MyItemPayload {
  name: string;
}

// ============================================
// SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class MyItemService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/my-items`;

  // List with filters & pagination
  getMyItems(params: MyItemListParams): Observable<PaginatedResponse<MyItem>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<MyItem>>(this.apiBase, { params: httpParams });
  }

  // Get single item
  getMyItem(id: string): Observable<ApiResponse<MyItem>> {
    return this.http.get<ApiResponse<MyItem>>(`${this.apiBase}/${id}`);
  }

  // Create item
  createMyItem(payload: MyItemPayload): Observable<ApiResponse<MyItem>> {
    return this.http.post<ApiResponse<MyItem>>(this.apiBase, payload);
  }

  // Update item
  updateMyItem(id: string, payload: MyItemPayload): Observable<ApiResponse<MyItem>> {
    return this.http.put<ApiResponse<MyItem>>(`${this.apiBase}/${id}`, payload);
  }

  // Delete item
  deleteMyItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

---

**Reference compiled:** 2026-02-20
