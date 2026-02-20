# Phase 02: Component & Template

> Parent: [plan.md](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-20 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

Create pets page component with table, search, modal CRUD. Mirrors `achievements` component exactly.

## Key Insights

- Achievements is simplest CRUD page — single name field, modal form, table with pagination
- Pets follows same pattern: name-only entity
- Vietnamese labels: "Ban dong hanh" for pets

## Requirements

- Signal-based state (items, loading, total, pageIndex, pageSize)
- Search form with name filter
- Table: ID, Name, Created At, Actions (edit/delete)
- Modal form for create/edit with name field
- Shared pagination-bar component top + bottom
- LESS styles identical to achievements

## Related Files

- `src/app/pages/achievements/achievements.ts` — component pattern
- `src/app/pages/achievements/achievements.html` — template pattern
- `src/app/pages/achievements/achievements.less` — style pattern

## Implementation Steps

### 1. Create `src/app/pages/pets/pets.ts`

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

/** Modal component for create/edit pet — name field only */
@Component({
  selector: 'app-pet-form-modal',
  imports: [FormsModule, NzInputModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label>Ten ban dong hanh</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="Nhap ten ban dong hanh" />
      </nz-form-control>
    </nz-form-item>
  `,
})
export class PetFormModalComponent {
  private readonly data = inject<{ name: string }>(NZ_MODAL_DATA);
  name = this.data.name ?? '';
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
        this.message.error('Khong the tai danh sach ban dong hanh');
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
    defaults: { name: string },
    onSubmit: (payload: PetPayload) => Observable<unknown>,
  ): void {
    this.modal.create({
      nzTitle: title,
      nzContent: PetFormModalComponent,
      nzData: defaults,
      nzOkText: 'Luu',
      nzCancelText: 'Huy',
      nzOnOk: (instance: PetFormModalComponent) => {
        const name = instance.name.trim();
        if (!name) {
          this.message.warning('Vui long nhap ten ban dong hanh');
          return false;
        }
        const payload: PetPayload = { name };
        return new Promise<boolean>((resolve) => {
          onSubmit(payload).subscribe({
            next: () => {
              this.message.success(`Da luu ban dong hanh "${name}"`);
              this.loadPets();
              resolve(true);
            },
            error: () => {
              this.message.error('Thao tac that bai');
              resolve(false);
            },
          });
        });
      },
    });
  }

  onCreatePet(): void {
    this.showPetModal('Tao ban dong hanh moi', { name: '' }, (payload) =>
      this.petsService.createPet(payload),
    );
  }

  onEditPet(pet: Pet): void {
    this.showPetModal(
      'Sua ban dong hanh',
      { name: pet.name },
      (payload) => this.petsService.updatePet(pet.id, payload),
    );
  }

  onDeletePet(pet: Pet): void {
    this.petsService.deletePet(pet.id).subscribe({
      next: () => {
        this.message.success(`Da xoa ban dong hanh "${pet.name}"`);
        this.loadPets();
      },
      error: () => this.message.error('Xoa ban dong hanh that bai'),
    });
  }
}
```

**IMPORTANT:** Vietnamese text in actual implementation must use proper diacritics (e.g., "Bạn đồng hành", "Không thể tải", etc.). The snippets above use ASCII for plan readability. Copy from achievements and replace "danh hiệu" with "bạn đồng hành".

### 2. Create `src/app/pages/pets/pets.html`

Mirror `achievements.html` exactly, replacing:
- `"Danh hiệu"` -> `"Bạn đồng hành"`
- `achievementTable` -> `petTable`
- `achievements()` -> `pets()`
- `achievement` -> `pet`
- `onCreateAchievement` -> `onCreatePet`
- `onEditAchievement` -> `onEditPet`
- `onDeleteAchievement` -> `onDeletePet`
- `totalLabel="danh hiệu"` -> `totalLabel="bạn đồng hành"`
- Table columns: ID, Tên, Ngày tạo, Hành động (same as achievements)
- `nzScroll x: '700px'` (same as achievements)

### 3. Create `src/app/pages/pets/pets.less`

Copy `achievements.less` exactly, replacing `.achievement-name` with `.pet-name`.

## Todo

- [ ] Create `src/app/pages/pets/pets.ts`
- [ ] Create `src/app/pages/pets/pets.html`
- [ ] Create `src/app/pages/pets/pets.less`

## Success Criteria

- Component renders table with pets data
- Search by name works
- Create/edit modal opens and saves
- Delete with confirmation works
- Pagination works (top + bottom bars)

## Risk Assessment

- Low risk — direct pattern clone
- Vietnamese diacritics must be correct in actual code (not ASCII approximations)

## Next Steps

Proceed to Phase 03 (routing & menu)
