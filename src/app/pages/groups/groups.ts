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

import { Group, GroupListParams, GroupsService } from '../../core/services/groups.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

/** Modal component nhập tên nhóm dịch */
@Component({
  selector: 'app-group-name-input',
  imports: [FormsModule, NzInputModule],
  template: `<input nz-input [(ngModel)]="name" placeholder="Nhập tên nhóm dịch" (keyup.enter)="name" />`,
})
export class GroupNameInputComponent {
  private readonly data = inject<{ defaultName: string }>(NZ_MODAL_DATA);
  name = this.data.defaultName ?? '';
}

@Component({
  selector: 'app-groups',
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
  templateUrl: './groups.html',
  styleUrl: './groups.less',
})
export class GroupsComponent implements OnInit {
  private readonly groupsService = inject(GroupsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly groups = signal<Group[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: GroupListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.groupsService.getGroups(params).subscribe({
      next: (res) => {
        this.groups.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.groups.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách nhóm dịch');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadGroups();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadGroups();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadGroups();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadGroups();
  }

  /** Hiển thị modal nhập tên nhóm dịch (dùng chung cho create & edit) */
  private showGroupModal(title: string, defaultName: string, onSubmit: (name: string) => Observable<unknown>): void {
    this.modal.create({
      nzTitle: title,
      nzContent: GroupNameInputComponent,
      nzData: { defaultName },
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (instance: GroupNameInputComponent) => {
        const name = instance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên nhóm dịch');
          return false;
        }
        return new Promise<boolean>((resolve) => {
          onSubmit(name).subscribe({
            next: () => {
              this.message.success(`Đã lưu nhóm dịch "${name}"`);
              this.loadGroups();
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

  onCreateGroup(): void {
    this.showGroupModal('Tạo nhóm dịch mới', '', (name) => this.groupsService.createGroup(name));
  }

  onEditGroup(group: Group): void {
    this.showGroupModal('Sửa nhóm dịch', group.name, (name) => this.groupsService.updateGroup(group.id, name));
  }

  onDeleteGroup(group: Group): void {
    this.groupsService.deleteGroup(group.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa nhóm dịch "${group.name}"`);
        this.loadGroups();
      },
      error: () => this.message.error('Xóa nhóm dịch thất bại'),
    });
  }
}
