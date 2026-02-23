import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Observable } from 'rxjs';

// NG-ZORRO UI components
import { NzCardModule } from 'ng-zorro-antd/card';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';
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

/** Dữ liệu mặc định truyền vào modal */
interface AchievementFormData {
  name: string;
  font_family: string;
  font_size: string;
  color: string;
  weight: string;
  font_style: string;
  text_shadow: string;
  required_points: number;
}

/** Các font có sẵn cho dropdown */
const FONT_OPTIONS = [
  'Arial, sans-serif',
  'Tahoma, sans-serif',
  'Verdana, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Impact, sans-serif',
  'Comic Sans MS, cursive',
];

/** Các font-weight có sẵn */
const WEIGHT_OPTIONS = [
  { label: 'Thin (100)', value: '100' },
  { label: 'Light (300)', value: '300' },
  { label: 'Normal (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semi-bold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
  { label: 'Extra-bold (800)', value: '800' },
  { label: 'Black (900)', value: '900' },
];

/** Các text-shadow preset */
const TEXT_SHADOW_OPTIONS = [
  { label: 'Không có', value: 'unset' },
  { label: 'Bóng nhẹ', value: '1px 1px 2px rgba(0,0,0,0.3)' },
  { label: 'Bóng đậm', value: '2px 2px 4px rgba(0,0,0,0.5)' },
  { label: 'Phát sáng', value: '0 0 8px rgba(255,255,255,0.6)' },
  { label: 'Neon', value: '0 0 5px #fff, 0 0 10px currentColor' },
];

/** Modal component cho tạo/sửa achievement */
@Component({
  selector: 'app-achievement-form-modal',
  imports: [
    FormsModule,
    NzInputModule,
    NzInputNumberModule,
    NzFormModule,
    NzSelectModule,
    NzColorPickerModule,
    NzGridModule,
  ],
  template: `
    <!-- Preview danh hiệu theo style đang chọn -->
    <div class="badge-preview-wrapper">
      <span class="badge-preview-label">Xem trước:</span>
      <span
        class="badge-preview"
        [style.font-family]="font_family"
        [style.font-size.px]="font_size"
        [style.color]="color"
        [style.font-weight]="weight"
        [style.font-style]="font_style"
        [style.text-shadow]="text_shadow"
      >
        {{ name || 'Tên danh hiệu' }}
      </span>
    </div>

    <form nz-form nzLayout="vertical">
      <div nz-row [nzGutter]="16">
        <div nz-col [nzSpan]="24">
          <nz-form-item>
            <nz-form-label>Tên danh hiệu</nz-form-label>
            <nz-form-control>
              <input nz-input [(ngModel)]="name" [ngModelOptions]="{standalone: true}" placeholder="Nhập tên danh hiệu" />
            </nz-form-control>
          </nz-form-item>
        </div>

        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-label>Font chữ</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="font_family" [ngModelOptions]="{standalone: true}" nzPlaceHolder="Chọn font">
                @for (font of fontOptions; track font) {
                  <nz-option [nzValue]="font" [nzLabel]="font.split(',')[0]" />
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-label>Cỡ chữ (px)</nz-form-label>
            <nz-form-control>
              <nz-input-number
                [(ngModel)]="font_size"
                [ngModelOptions]="{standalone: true}"
                [nzMin]="16"
                [nzMax]="20"
                [nzStep]="1"
                style="width: 100%"
              />
            </nz-form-control>
          </nz-form-item>
        </div>

        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-label>Độ đậm</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="weight" [ngModelOptions]="{standalone: true}" nzPlaceHolder="Chọn độ đậm">
                @for (w of weightOptions; track w.value) {
                  <nz-option [nzValue]="w.value" [nzLabel]="w.label" />
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-label>Kiểu chữ</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="font_style" [ngModelOptions]="{standalone: true}" nzPlaceHolder="Chọn kiểu chữ">
                <nz-option nzValue="normal" nzLabel="Bình thường" />
                <nz-option nzValue="italic" nzLabel="Nghiêng (italic)" />
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>

        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-label>Màu sắc</nz-form-label>
            <nz-form-control>
              <nz-color-picker [(ngModel)]="color" [ngModelOptions]="{standalone: true}" nzShowText />
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-label>Bóng chữ</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="text_shadow" [ngModelOptions]="{standalone: true}" nzPlaceHolder="Chọn bóng chữ">
                @for (s of textShadowOptions; track s.value) {
                  <nz-option [nzValue]="s.value" [nzLabel]="s.label" />
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>

        <div nz-col [nzSpan]="24">
          <nz-form-item>
            <nz-form-label>Điểm yêu cầu</nz-form-label>
            <nz-form-control>
              <nz-input-number
                [(ngModel)]="required_points"
                [ngModelOptions]="{standalone: true}"
                [nzMin]="0"
                [nzStep]="10"
                style="width: 100%"
                nzPlaceHolder="Nhập điểm cần đạt để mở khoá"
              />
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
    </form>
  `,
  styles: [
    `
      .badge-preview-wrapper {
        background: rgba(255, 255, 255, 0.05);
        border: 1px dashed rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 16px;
        text-align: center;
      }
      .badge-preview-label {
        display: block;
        font-size: 12px;
        opacity: 0.5;
        margin-bottom: 8px;
      }
      .badge-preview {
        display: inline-block;
        line-height: 1.4;
      }
      nz-form-item {
        margin-bottom: 0;
      }
    `,
  ],
})
export class AchievementFormModalComponent {
  private readonly data = inject<AchievementFormData>(NZ_MODAL_DATA);

  name = this.data.name ?? '';
  font_family = this.data.font_family || 'Arial, sans-serif';
  font_size: string | number = this.data.font_size || '16';
  color = this.data.color || '#ffffff';
  weight = this.data.weight || '400';
  font_style = this.data.font_style || 'normal';
  text_shadow = this.data.text_shadow || 'unset';
  required_points = this.data.required_points ?? 0;

  readonly fontOptions = FONT_OPTIONS;
  readonly weightOptions = WEIGHT_OPTIONS;
  readonly textShadowOptions = TEXT_SHADOW_OPTIONS;
}

@Component({
  selector: 'app-achievements',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
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
    defaults: AchievementFormData,
    onSubmit: (payload: AchievementPayload) => Observable<unknown>,
  ): void {
    this.modal.create({
      nzTitle: title,
      nzContent: AchievementFormModalComponent,
      nzData: defaults,
      nzWidth: 560,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (instance: AchievementFormModalComponent) => {
        const name = instance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên danh hiệu');
          return false;
        }

        const payload: AchievementPayload = {
          name,
          font_family: instance.font_family,
          font_size: String(instance.font_size),
          color: instance.color,
          weight: instance.weight,
          font_style: instance.font_style,
          text_shadow: instance.text_shadow,
          required_points: instance.required_points ?? 0,
        };

        return new Promise<boolean>((resolve) => {
          onSubmit(payload).subscribe({
            next: () => {
              this.message.success(`Đã lưu danh hiệu "${name}"`);
              this.loadAchievements();
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

  onCreateAchievement(): void {
    this.showAchievementModal(
      'Tạo danh hiệu mới',
      {
        name: '',
        font_family: 'Arial, sans-serif',
        font_size: '16',
        color: '#ffffff',
        weight: '400',
        font_style: 'normal',
        text_shadow: 'unset',
        required_points: 0,
      },
      (payload) => this.achievementsService.createAchievement(payload),
    );
  }

  onEditAchievement(achievement: Achievement): void {
    this.showAchievementModal(
      'Sửa danh hiệu',
      {
        name: achievement.name,
        font_family: achievement.font_family,
        font_size: achievement.font_size,
        color: achievement.color,
        weight: achievement.weight,
        font_style: achievement.font_style,
        text_shadow: achievement.text_shadow,
        required_points: achievement.required_points,
      },
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
