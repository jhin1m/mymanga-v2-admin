# Artist & Doujinshi Pages Pattern Analysis

## Overview

Both Artist and Doujinshi pages follow an identical CRUD pattern with pagination, search filtering, and modal-based inline editing. They use ng-zorro Ant Design components with Angular 21 signals API.

## File Structure

### Artist Page
```
src/app/pages/artists/
├── artists.ts          (Component class)
├── artists.html        (Template)
└── artists.less        (Styles)
```

### Doujinshi Page
```
src/app/pages/doujinshis/
├── doujinshis.ts       (Component class)
├── doujinshis.html     (Template)
└── doujinshis.less     (Styles)
```

### Services
```
src/app/core/services/
├── artists.service.ts       (Artist CRUD + types)
├── doujinshis.service.ts    (Doujinshi CRUD + types)
├── genres.service.ts        (Genre lookup — no CRUD)
├── groups.service.ts        (Groups — read-only with filter)
├── manga.service.ts         (Manga CRUD with genres relations)
├── chapters.service.ts      (Chapters with image management)
└── auth.service.ts          (Auth + ApiResponse<T> type)
```

### Types
```
src/app/core/models/
└── api-types.ts        (PaginatedResponse<T>, PaginationInfo)
```

### Shared Components
```
src/app/shared/pagination-bar/
└── pagination-bar.ts   (Reusable pagination component)
```

---

## COMPLETE FILE CONTENTS

### 1. Artist Component (src/app/pages/artists/artists.ts)

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

### 2. Artist Template (src/app/pages/artists/artists.html)

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

### 3. Artist Styles (src/app/pages/artists/artists.less)

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

### 4. Doujinshi Component (src/app/pages/doujinshis/doujinshis.ts)

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

import { Doujinshi, DoujinshiListParams, DoujinshisService } from '../../core/services/doujinshis.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-doujinshi-name-input',
  imports: [FormsModule, NzInputModule],
  template: `<input nz-input [(ngModel)]="name" placeholder="Nhập tên doujinshi" (keyup.enter)="name" />`,
})
export class DoujinshiNameInputComponent {
  private readonly data = inject<{ defaultName: string }>(NZ_MODAL_DATA);
  name = this.data.defaultName ?? '';
}

@Component({
  selector: 'app-doujinshis',
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
  templateUrl: './doujinshis.html',
  styleUrl: './doujinshis.less',
})
export class DoujinshisComponent implements OnInit {
  private readonly doujinshisService = inject(DoujinshisService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly doujinshis = signal<Doujinshi[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadDoujinshis();
  }

  loadDoujinshis(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: DoujinshiListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.doujinshisService.getDoujinshis(params).subscribe({
      next: (res) => {
        this.doujinshis.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.doujinshis.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách doujinshi');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadDoujinshis();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadDoujinshis();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadDoujinshis();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadDoujinshis();
  }

  private showDoujinshiModal(title: string, defaultName: string, onSubmit: (name: string) => Observable<unknown>): void {
    this.modal.create({
      nzTitle: title,
      nzContent: DoujinshiNameInputComponent,
      nzData: { defaultName },
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (componentInstance: DoujinshiNameInputComponent) => {
        const name = componentInstance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên doujinshi');
          return false;
        }
        return new Promise<boolean>((resolve) => {
          onSubmit(name).subscribe({
            next: () => {
              this.message.success(`Đã lưu doujinshi "${name}"`);
              this.loadDoujinshis();
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

  onCreateDoujinshi(): void {
    this.showDoujinshiModal('Tạo Doujinshi mới', '', (name) => this.doujinshisService.createDoujinshi(name));
  }

  onEditDoujinshi(doujinshi: Doujinshi): void {
    this.showDoujinshiModal('Sửa Doujinshi', doujinshi.name, (name) =>
      this.doujinshisService.updateDoujinshi(doujinshi.id, name),
    );
  }

  onDeleteDoujinshi(doujinshi: Doujinshi): void {
    this.doujinshisService.deleteDoujinshi(doujinshi.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa doujinshi "${doujinshi.name}"`);
        this.loadDoujinshis();
      },
      error: () => this.message.error('Xóa doujinshi thất bại'),
    });
  }
}
```

### 5. Doujinshi Template (src/app/pages/doujinshis/doujinshis.html)

```html
<!-- Search/Filter Section -->
<nz-card nzTitle="Tìm kiếm Doujinshi" [nzExtra]="searchExtra">
  <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical">
    <div nz-row [nzGutter]="[16, 0]">
      <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="24">
        <nz-form-item>
          <nz-form-label>Tên</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="name" placeholder="Nhập tên doujinshi" />
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
      <button nz-button nzType="primary" nzSize="small" (click)="onCreateDoujinshi()">
        <nz-icon nzType="plus" />
        Tạo mới
      </button>
    </div>
  </ng-template>
</nz-card>

<!-- Doujinshis Table -->
<nz-card class="table-card">
  <app-pagination-bar
    [total]="total()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    totalLabel="doujinshi"
    position="top"
    (pageIndexChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  />

  <nz-table
    #doujinshiTable
    [nzData]="doujinshis()"
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
      @for (doujinshi of doujinshiTable.data; track doujinshi.id) {
        <tr>
          <td nzAlign="center">{{ doujinshi.id }}</td>
          <td>
            <span class="doujinshi-name">{{ doujinshi.name }}</span>
          </td>
          <td class="text-muted">{{ doujinshi.slug }}</td>
          <td class="text-muted">{{ doujinshi.user?.name ?? '—' }}</td>
          <td class="text-muted">{{ doujinshi.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          <td nzAlign="center" nzRight>
            <div class="action-buttons">
              <button
                nz-button
                nzSize="small"
                (click)="onEditDoujinshi(doujinshi)"
                title="Sửa"
              >
                <nz-icon nzType="edit" />
              </button>
              <button
                nz-button
                nzDanger
                nzSize="small"
                nz-popconfirm
                [nzPopconfirmTitle]="'Xóa doujinshi \'' + doujinshi.name + '\'?'"
                (nzOnConfirm)="onDeleteDoujinshi(doujinshi)"
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

  @if (doujinshis().length > 0) {
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

### 6. Doujinshi Styles (src/app/pages/doujinshis/doujinshis.less)

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

.doujinshi-name {
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

### 7. Artists Service (src/app/core/services/artists.service.ts)

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

### 8. Doujinshis Service (src/app/core/services/doujinshis.service.ts)

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

// --- Interfaces ---

export interface Doujinshi {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface DoujinshiListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

// --- Service ---

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

### 9. Genres Service (src/app/core/services/genres.service.ts)

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Shape thể loại từ API */
export interface Genre {
  id: number;
  name: string;
  slug: string;
}

/** API trả về { data: Genre[] } (không phân trang) */
export interface GenreListResponse {
  success: boolean;
  data: Genre[];
}

@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/genres`;

  /** Lấy tất cả genres — dùng cho checkbox grid */
  getGenres(): Observable<GenreListResponse> {
    return this.http.get<GenreListResponse>(this.apiBase);
  }
}
```

### 10. API Types (src/app/core/models/api-types.ts)

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

### 11. Auth Service (src/app/core/services/auth.service.ts)

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Standard API response shape from the backend */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthToken {
  token: string;
  type: 'Bearer';
}

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenSignal = signal<string | null>(this.getToken());

  /** Reactive check — components can bind to this */
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(email: string, password: string): Observable<ApiResponse<AuthToken>> {
    return this.http
      .post<ApiResponse<AuthToken>>(`${environment.apiUrl}/api/admin/auth`, { email, password })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.setToken(res.data.token);
          }
        }),
      );
  }

  logout(): void {
    // Fire-and-forget DELETE to revoke server token
    const token = this.getToken();
    if (token) {
      this.http
        .delete(`${environment.apiUrl}/api/admin/auth`)
        .pipe(catchError(() => EMPTY))
        .subscribe();
    }
    this.removeToken();
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${environment.apiUrl}/api/admin/auth`);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  private removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }
}
```

### 12. Groups Service (src/app/core/services/groups.service.ts)

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';

/** Shape nhóm dịch từ API */
export interface Group {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface GroupListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[name]'?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/groups`;

  /** Lấy danh sách groups — dùng cho dropdown */
  getGroups(params: GroupListParams): Observable<PaginatedResponse<Group>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Group>>(this.apiBase, { params: httpParams });
  }
}
```

### 13. Manga Service (src/app/core/services/manga.service.ts)

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';
import { ApiResponse } from './auth.service';

// --- Interfaces mô tả shape data từ API ---

/** Thông tin user tạo manga (nested trong manga response) */
export interface MangaUser {
  id: string;
  name: string;
  email: string;
}

/** Thông tin artist/group/doujinshi (cùng shape) */
export interface MangaRelation {
  id: string;
  name: string;
}

/** Thể loại manga */
export interface MangaGenre {
  id: number;
  name: string;
  slug: string;
}

/** Thông tin 1 manga từ API */
export interface Manga {
  id: string; // UUID
  name: string;
  name_alt: string | null;
  pilot: string | null;
  status: number; // 1=Completed, 2=InProgress
  slug: string;
  is_reviewed: boolean;
  is_hot: boolean;
  cover_full_url: string | null;
  finished_by: string | null;
  created_at: string;
  updated_at: string;
  user?: MangaUser;
  artist?: MangaRelation | null;
  group?: MangaRelation | null;
  doujinshi?: MangaRelation | null;
  genres?: MangaGenre[];
}

/** Params gửi lên API để filter/phân trang manga */
export interface MangaListParams {
  page?: number;
  per_page?: number;
  include?: string;
  sort?: string;
  'filter[status]'?: number;
  'filter[is_reviewed]'?: number;
  'filter[name]'?: string;
  'filter[user_id]'?: string;
  'filter[artist_id]'?: string;
  'filter[group_id]'?: string;
  'filter[doujinshi_id]'?: string;
}

@Injectable({ providedIn: 'root' })
export class MangaService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/mangas`;

  /**
   * Lấy danh sách manga có filter + phân trang.
   * include=user,genres,artist,group,doujinshi để lấy thêm quan hệ
   */
  getMangas(params: MangaListParams): Observable<PaginatedResponse<Manga>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<PaginatedResponse<Manga>>(this.apiBase, { params: httpParams });
  }

  /** Lấy chi tiết 1 manga theo UUID */
  getManga(id: string): Observable<ApiResponse<Manga>> {
    return this.http.get<ApiResponse<Manga>>(`${this.apiBase}/${id}`, {
      params: { include: 'user,genres,artist,group,doujinshi' },
    });
  }

  /** Tạo manga mới — gửi FormData vì có file cover */
  createManga(formData: FormData): Observable<ApiResponse<Manga>> {
    return this.http.post<ApiResponse<Manga>>(this.apiBase, formData);
  }

  /** Cập nhật manga — gửi FormData vì có file cover */
  updateManga(id: string, formData: FormData): Observable<ApiResponse<Manga>> {
    return this.http.post<ApiResponse<Manga>>(`${this.apiBase}/${id}`, formData);
  }

  /** Xoá manga theo UUID — trả 204 No Content */
  deleteManga(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

### 14. Chapters Service (src/app/core/services/chapters.service.ts)

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

/** Shape chapter từ API */
export interface Chapter {
  id: string;
  name: string;
  order: number;
  manga_id: string;
  created_at: string;
  updated_at: string;
}

/** Hình ảnh thuộc chapter */
export interface ChapterImage {
  id: string;
  image_full_url: string;
  order: number;
}

/** Chi tiết chapter kèm danh sách hình */
export interface ChapterDetail extends Chapter {
  /** API trả về mảng URL string trong field "content" */
  content?: string[];
  images?: ChapterImage[];
}

export interface ChapterListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[manga_id]'?: string;
}

/** Payload tạo/sửa chapter */
export interface ChapterPayload {
  name: string;
  order?: number;
  image_urls?: string[];
}

@Injectable({ providedIn: 'root' })
export class ChaptersService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/chapters`;

  /** Lấy danh sách chapters — filter theo manga_id */
  getChapters(mangaId: string, params: Omit<ChapterListParams, 'filter[manga_id]'>): Observable<PaginatedResponse<Chapter>> {
    let httpParams = new HttpParams().set('filter[manga_id]', mangaId);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Chapter>>(this.apiBase, { params: httpParams });
  }

  /** Tạo chapter mới */
  createChapter(mangaId: string, payload: ChapterPayload): Observable<ApiResponse<Chapter>> {
    return this.http.post<ApiResponse<Chapter>>(this.apiBase, { ...payload, manga_id: mangaId });
  }

  /** Cập nhật chapter */
  updateChapter(mangaId: string, chapterId: string, payload: ChapterPayload): Observable<ApiResponse<Chapter>> {
    return this.http.put<ApiResponse<Chapter>>(`${this.apiBase}/${chapterId}`, payload);
  }

  /** Xoá 1 chapter */
  deleteChapter(mangaId: string, chapterId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${chapterId}`);
  }

  /** Xoá nhiều chapters cùng lúc */
  deleteChaptersBulk(mangaId: string, chapterIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiBase}/bulk-delete`, { ids: chapterIds });
  }

  /** Lấy chi tiết 1 chapter (kèm images) */
  getChapter(id: string): Observable<ApiResponse<ChapterDetail>> {
    return this.http.get<ApiResponse<ChapterDetail>>(`${this.apiBase}/${id}`);
  }

  /** Upload 1 hình vào chapter (POST + _method=put — Laravel method spoofing cho multipart) */
  addImage(chapterId: string, file: File): Observable<ApiResponse<unknown>> {
    const fd = new FormData();
    fd.append('_method', 'put');
    fd.append('image', file);
    return this.http.post<ApiResponse<unknown>>(`${this.apiBase}/${chapterId}/add-img`, fd);
  }

  /** Xoá tất cả hình trong chapter */
  clearImages(chapterId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${chapterId}/clr-img`);
  }
}
```

### 15. Pagination Bar Component (src/app/shared/pagination-bar/pagination-bar.ts)

```typescript
import { Component, input, output } from '@angular/core';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

/**
 * Shared pagination bar — hiển thị tổng số + nz-pagination.
 * Dùng chung cho mọi trang danh sách (members, manga, etc.)
 *
 * Cách dùng:
 *   <app-pagination-bar
 *     [total]="total()"
 *     [pageIndex]="pageIndex()"
 *     [pageSize]="pageSize()"
 *     totalLabel="truyện"
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
      <!-- Chỉ hiện total text ở vị trí top -->
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
  // input() — Angular signals-based inputs (Angular 17+)
  readonly total = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalLabel = input<string>('mục'); // "Tổng X mục"
  readonly position = input<'top' | 'bottom'>('top');
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);

  // output() — thay thế @Output() EventEmitter
  readonly pageIndexChange = output<number>();
  readonly pageSizeChange = output<number>();
}
```

### 16. Route Definitions (src/app/app.routes.ts)

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Login stays outside admin layout
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
      {
        path: 'members',
        loadComponent: () => import('./pages/members/members').then((m) => m.MembersComponent),
      },
      {
        path: 'artists',
        loadComponent: () => import('./pages/artists/artists').then((m) => m.ArtistsComponent),
      },
      {
        path: 'doujinshi',
        loadComponent: () =>
          import('./pages/doujinshis/doujinshis').then((m) => m.DoujinshisComponent),
      },
      {
        path: 'manga',
        children: [
          {
            path: 'list',
            loadComponent: () =>
              import('./pages/manga-list/manga-list').then((m) => m.MangaListComponent),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./pages/manga-create/manga-create').then((m) => m.MangaCreateComponent),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./pages/manga-edit/manga-edit').then((m) => m.MangaEditComponent),
          },
          {
            path: ':mangaId/chapters/create',
            loadComponent: () =>
              import('./pages/chapter-create/chapter-create').then((m) => m.ChapterCreateComponent),
          },
          {
            path: ':mangaId/chapters/:chapterId/edit',
            loadComponent: () =>
              import('./pages/chapter-edit/chapter-edit').then((m) => m.ChapterEditComponent),
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

### 17. Menu Setup (src/app/core/startup/startup.service.ts) - Relevant Sections

```typescript
import { Injectable, inject } from '@angular/core';
import { MenuService, SettingsService } from '@delon/theme';

/**
 * App initialization service.
 * Configures sidebar menu items and app settings on startup.
 */
@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly menuService = inject(MenuService);
  private readonly settingsService = inject(SettingsService);

  load(): Promise<void> {
    return Promise.resolve().then(() => {
      this.initAppSettings();
      this.initMenuItems();
    });
  }

  private initAppSettings(): void {
    this.settingsService.setApp({
      name: 'MyManga AdminCP',
      description: 'Quản lý hệ thống MyManga',
    });

    this.settingsService.setUser({
      name: 'Admin',
      avatar: '',
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
          {
            text: 'Thành viên',
            link: '/members',
            icon: { type: 'icon', value: 'user' },
          },
          {
            text: 'Manga',
            link: '/manga',
            icon: { type: 'icon', value: 'book' },
            children: [
              { text: 'Danh sách', link: '/manga/list' },
              { text: 'Thêm mới', link: '/manga/create' },
            ],
          },
          {
            text: 'Artist',
            link: '/artists',
            icon: { type: 'icon', value: 'team' },
          },
          {
            text: 'Doujinshi',
            link: '/doujinshi',
            icon: { type: 'icon', value: 'file' },
          },
          {
            text: 'Thể loại',
            link: '/categories',
            icon: { type: 'icon', value: 'tags' },
          },
        ],
      },
      {
        group: true,
        text: 'CỘNG ĐỒNG',
        children: [
          {
            text: 'Nhóm dịch',
            link: '/groups',
            icon: { type: 'icon', value: 'team' },
          },
          {
            text: 'Danh hiệu',
            link: '/badges',
            icon: { type: 'icon', value: 'trophy' },
          },
        ],
      },
      {
        group: true,
        text: 'HỆ THỐNG',
        children: [
          {
            text: 'Bạn đồng hành',
            link: '/history',
            icon: { type: 'icon', value: 'history' },
          },
          {
            text: 'Bình luận',
            link: '/comments',
            icon: { type: 'icon', value: 'message' },
          },
          {
            text: 'Thông báo',
            link: '/notifications',
            icon: { type: 'icon', value: 'notification' },
          },
        ],
      },
    ]);
  }
}
```

---

## Key Patterns & Conventions

### Component Architecture
- **Signals API**: State via `signal()`, `computed()` for reactivity
- **Template Control Flow**: `@for`, `@if` instead of `*ngFor`, `*ngIf`
- **Input/Output**: `input()`, `output()` for signals-based I/O (Angular 17+)
- **Dependency Injection**: `inject()` instead of constructor parameters

### Service Layer
- **Generic Types**: `PaginatedResponse<T>`, `ApiResponse<T>` for type safety
- **HttpParams Building**: Safe query string construction via `HttpParams.set()`
- **Shared Interfaces**: Located in `api-types.ts` for reusability

### Modal Implementation
- **Modal Content**: Use `nzContent: Component` + `NZ_MODAL_DATA` injection for interactive forms
- **Modal Callbacks**: `nzOnOk` returns Promise to handle async operations before closing
- **Validation**: Client-side trim + empty check before API call

### Pagination
- **Shared Component**: `PaginationBarComponent` provides consistent pagination UI
- **Top/Bottom Positioning**: Position input controls display location
- **Signal Inputs**: Uses new Angular 17+ signals API for inputs

### Styling
- **LESS Variables**: Leverage ng-zorro color system via LESS
- **::ng-deep**: Used sparingly to style nested component internals
- **Layout**: 24px container padding, consistent spacing with gap/margin utilities

### API Contract
- **Filter Params**: `filter[field]=value` convention (Spatie QueryBuilder)
- **Includes**: `include=relations` for eager loading nested data
- **Sorting**: `sort=-created_at` for reverse chronological

### Form Handling
- **Reactive Forms**: `FormBuilder.group()` with reactive control
- **Search Form**: Simple key-value pairs, not nested validation
- **Method Binding**: `ngSubmit` on form tag, manual reset, no auto-clearing

---

## Genre Service

Genre service exists but is **read-only**: only `getGenres()` method to fetch all genres (non-paginated). Used for checkbox/select options in Manga create/edit pages.

---

## Unresolved Questions

None — all files comprehensively documented with full contents.
