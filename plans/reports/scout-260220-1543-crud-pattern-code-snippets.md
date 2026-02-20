# CRUD Pattern - Copy-Paste Code Snippets

This file provides ready-to-use code for creating a "Pets" management page. Replace `{entity}` with actual names.

---

## 1. Service File: pets.service.ts

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

export interface Pet {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  user?: { id: string; name: string };
}

export interface PetListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

export interface PetPayload {
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class PetsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/pets`;

  getPets(params: PetListParams): Observable<PaginatedResponse<Pet>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Pet>>(this.apiBase, { params: httpParams });
  }

  createPet(payload: PetPayload): Observable<ApiResponse<Pet>> {
    return this.http.post<ApiResponse<Pet>>(this.apiBase, payload);
  }

  updatePet(id: string, payload: PetPayload): Observable<ApiResponse<Pet>> {
    return this.http.put<ApiResponse<Pet>>(`${this.apiBase}/${id}`, payload);
  }

  deletePet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

---

## 2. Component File: pets.ts

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

import { Pet, PetListParams, PetPayload, PetsService } from '../../core/services/pets.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-pet-form-modal',
  imports: [FormsModule, NzInputModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tên thú cưng</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="Nhập tên thú cưng" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Mô tả</nz-form-label>
      <nz-form-control>
        <textarea nz-input [(ngModel)]="description" placeholder="Nhập mô tả" rows="3"></textarea>
      </nz-form-control>
    </nz-form-item>
  `,
})
export class PetFormModalComponent {
  private readonly data = inject<{ name: string; description?: string }>(NZ_MODAL_DATA);
  name = this.data.name ?? '';
  description = this.data.description ?? '';
}

@Component({
  selector: 'app-pets',
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
  templateUrl: './pets.html',
  styleUrl: './pets.less',
})
export class PetsComponent implements OnInit {
  private readonly petsService = inject(PetsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly pets = signal<Pet[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadPets();
  }

  loadPets(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: PetListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.petsService.getPets(params).subscribe({
      next: (res) => {
        this.pets.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.pets.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách thú cưng');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadPets();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadPets();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadPets();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadPets();
  }

  private showPetModal(
    title: string,
    defaults: { name: string; description?: string },
    onSubmit: (payload: PetPayload) => Observable<unknown>,
  ): void {
    this.modal.create({
      nzTitle: title,
      nzContent: PetFormModalComponent,
      nzData: defaults,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (instance: PetFormModalComponent) => {
        const name = instance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên thú cưng');
          return false;
        }
        const payload: PetPayload = {
          name,
          description: instance.description.trim(),
        };
        return new Promise<boolean>((resolve) => {
          onSubmit(payload).subscribe({
            next: () => {
              this.message.success(`Đã lưu thú cưng "${name}"`);
              this.loadPets();
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

  onCreatePet(): void {
    this.showPetModal('Tạo thú cưng mới', { name: '', description: '' }, (payload) =>
      this.petsService.createPet(payload),
    );
  }

  onEditPet(pet: Pet): void {
    this.showPetModal(
      'Sửa thú cưng',
      { name: pet.name, description: pet.description },
      (payload) => this.petsService.updatePet(pet.id, payload),
    );
  }

  onDeletePet(pet: Pet): void {
    this.petsService.deletePet(pet.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa thú cưng "${pet.name}"`);
        this.loadPets();
      },
      error: () => this.message.error('Xóa thú cưng thất bại'),
    });
  }
}
```

---

## 3. Template File: pets.html

```html
<!-- Search/Filter Section -->
<nz-card nzTitle="Tìm kiếm Thú cưng" [nzExtra]="searchExtra">
  <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical">
    <div nz-row [nzGutter]="[16, 0]">
      <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="24">
        <nz-form-item>
          <nz-form-label>Tên</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="name" placeholder="Nhập tên thú cưng" />
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
      <button nz-button nzType="primary" nzSize="small" (click)="onCreatePet()">
        <nz-icon nzType="plus" />
        Tạo mới
      </button>
    </div>
  </ng-template>
</nz-card>

<!-- Pets Table -->
<nz-card class="table-card">
  <app-pagination-bar
    [total]="total()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    totalLabel="thú cưng"
    position="top"
    (pageIndexChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  />

  <nz-table
    #petTable
    [nzData]="pets()"
    [nzLoading]="loading()"
    [nzFrontPagination]="false"
    [nzShowPagination]="false"
    [nzScroll]="{ x: '900px' }"
    nzSize="middle"
  >
    <thead>
      <tr>
        <th nzWidth="80px" nzAlign="center">ID</th>
        <th nzWidth="200px">Tên</th>
        <th nzWidth="300px">Mô tả</th>
        <th nzWidth="150px">Ngày tạo</th>
        <th nzWidth="120px" nzAlign="center" nzRight>Hành động</th>
      </tr>
    </thead>
    <tbody>
      @for (pet of petTable.data; track pet.id) {
        <tr>
          <td nzAlign="center">{{ pet.id }}</td>
          <td>
            <span class="pet-name">{{ pet.name }}</span>
          </td>
          <td class="text-muted">{{ pet.description || '—' }}</td>
          <td class="text-muted">{{ pet.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          <td nzAlign="center" nzRight>
            <div class="action-buttons">
              <button
                nz-button
                nzSize="small"
                (click)="onEditPet(pet)"
                title="Sửa"
              >
                <nz-icon nzType="edit" />
              </button>
              <button
                nz-button
                nzDanger
                nzSize="small"
                nz-popconfirm
                [nzPopconfirmTitle]="'Xóa thú cưng \'' + pet.name + '\'?'"
                (nzOnConfirm)="onDeletePet(pet)"
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

  @if (pets().length > 0) {
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

## 4. Stylesheet: pets.less

```less
// Minimal styles — most styling comes from ng-zorro
.search-actions {
  display: flex;
  gap: 8px;

  button {
    white-space: nowrap;
  }
}

.table-card {
  margin-top: 24px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pet-name {
  font-weight: 500;
}

.text-muted {
  opacity: 0.65;
  font-size: 13px;
}
```

---

## 5. Route Registration in app.routes.ts

Add this to the children array of the admin layout route (after line 42):

```typescript
{
  path: 'pets',
  loadComponent: () => import('./pages/pets/pets').then((m) => m.PetsComponent),
},
```

---

## 6. Menu Item Registration in startup.service.ts

Add to the appropriate menu group (e.g., MENU CHÍNH or create new section):

```typescript
{
  text: 'Thú cưng',
  link: '/pets',
  icon: { type: 'icon', value: 'smile' },  // or any other icon
},
```

---

## File Structure Summary

```
src/app/
├── core/services/
│   └── pets.service.ts          [NEW]
├── pages/pets/
│   ├── pets.ts                  [NEW] — component + modal
│   ├── pets.html                [NEW] — template
│   └── pets.less                [NEW] — styles
└── app.routes.ts                [MODIFY] — add route
```

---

## Implementation Checklist

- [ ] Create `/src/app/core/services/pets.service.ts`
- [ ] Create `/src/app/pages/pets/` directory
- [ ] Create `pets.ts` (component + modal)
- [ ] Create `pets.html` (template)
- [ ] Create `pets.less` (styles)
- [ ] Add route to `app.routes.ts` (line ~43)
- [ ] Add menu item to `startup.service.ts`
- [ ] Test create/read/update/delete operations
- [ ] Verify routing and menu navigation
- [ ] Verify pagination and search/filter

