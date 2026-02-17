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
