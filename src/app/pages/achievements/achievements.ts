import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';

// NG-ZORRO UI components
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

import {
  Achievement,
  AchievementListParams,
  AchievementPayload,
  AchievementsService,
} from '../../core/services/achievements.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

/** Modal component cho tạo/sửa achievement — chỉ có field name */
@Component({
  selector: 'app-achievement-form-modal',
  imports: [FormsModule, NzInputModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tên danh hiệu</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="Nhập tên danh hiệu" />
      </nz-form-control>
    </nz-form-item>
  `,
})
export class AchievementFormModalComponent {
  private readonly data = inject<{ name: string }>(NZ_MODAL_DATA);
  name = this.data.name ?? '';
}

@Component({
  selector: 'app-achievements',
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
  templateUrl: './achievements.html',
  styleUrl: './achievements.less',
})
export class AchievementsComponent implements OnInit {
  private readonly achievementsService = inject(AchievementsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // Signal-based state — Angular tracks changes automatically
  protected readonly achievements = signal<Achievement[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadAchievements();
  }

  loadAchievements(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: AchievementListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.achievementsService.getAchievements(params).subscribe({
      next: (res) => {
        this.achievements.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.achievements.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách danh hiệu');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadAchievements();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadAchievements();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadAchievements();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadAchievements();
  }

  /** Hiển thị modal form — dùng chung cho create & edit */
  private showAchievementModal(
    title: string,
    defaults: { name: string },
    onSubmit: (payload: AchievementPayload) => Observable<unknown>,
  ): void {
    this.modal.create({
      nzTitle: title,
      nzContent: AchievementFormModalComponent,
      nzData: defaults,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (instance: AchievementFormModalComponent) => {
        const name = instance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên danh hiệu');
          return false; // Giữ modal mở
        }
        const payload: AchievementPayload = { name };
        return new Promise<boolean>((resolve) => {
          onSubmit(payload).subscribe({
            next: () => {
              this.message.success(`Đã lưu danh hiệu "${name}"`);
              this.loadAchievements();
              resolve(true); // Đóng modal
            },
            error: () => {
              this.message.error('Thao tác thất bại');
              resolve(false); // Giữ modal mở
            },
          });
        });
      },
    });
  }

  onCreateAchievement(): void {
    this.showAchievementModal('Tạo danh hiệu mới', { name: '' }, (payload) =>
      this.achievementsService.createAchievement(payload),
    );
  }

  onEditAchievement(achievement: Achievement): void {
    this.showAchievementModal(
      'Sửa danh hiệu',
      { name: achievement.name },
      (payload) => this.achievementsService.updateAchievement(achievement.id, payload),
    );
  }

  onDeleteAchievement(achievement: Achievement): void {
    this.achievementsService.deleteAchievement(achievement.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa danh hiệu "${achievement.name}"`);
        this.loadAchievements();
      },
      error: () => this.message.error('Xóa danh hiệu thất bại'),
    });
  }
}
