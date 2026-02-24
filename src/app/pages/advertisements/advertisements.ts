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
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

import {
  Advertisement,
  AdvertisementListParams,
  AdvertisementPayload,
  AdvertisementsService,
} from '../../core/services/advertisements.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

// --- Label maps cho hiển thị tiếng Việt ---

export const AD_TYPE_OPTIONS = [
  { value: 'banner', label: 'Banner' },
  { value: 'catfish', label: 'Catfish' },
] as const;

export const AD_LOCATION_OPTIONS = [
  { value: 'home', label: 'Trang chủ' },
  { value: 'manga_detail', label: 'Chi tiết Manga' },
  { value: 'chapter_content', label: 'Nội dung Chapter' },
  { value: 'all_pages', label: 'Tất cả trang' },
] as const;

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  AD_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);
const LOCATION_LABELS: Record<string, string> = Object.fromEntries(
  AD_LOCATION_OPTIONS.map((o) => [o.value, o.label]),
);

/** Modal component cho tạo/sửa quảng cáo */
@Component({
  selector: 'app-advertisement-form-modal',
  imports: [
    FormsModule,
    NzInputModule,
    NzFormModule,
    NzSwitchModule,
    NzSelectModule,
    NzInputNumberModule,
  ],
  template: `
    <nz-form-item>
      <nz-form-label>Tên quảng cáo</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="VD: Home Page Banner" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Loại</nz-form-label>
      <nz-form-control>
        <nz-select [(ngModel)]="type" nzPlaceHolder="Chọn loại">
          @for (opt of typeOptions; track opt.value) {
            <nz-option [nzValue]="opt.value" [nzLabel]="opt.label" />
          }
        </nz-select>
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Vị trí hiển thị</nz-form-label>
      <nz-form-control>
        <nz-select [(ngModel)]="location" nzPlaceHolder="Chọn vị trí">
          @for (opt of locationOptions; track opt.value) {
            <nz-option [nzValue]="opt.value" [nzLabel]="opt.label" />
          }
        </nz-select>
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Position</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="position" placeholder="VD: top, bottom, sidebar" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Mã quảng cáo (HTML/Script)</nz-form-label>
      <nz-form-control>
        <textarea nz-input [(ngModel)]="code" [nzAutosize]="{ minRows: 4, maxRows: 10 }" placeholder="Nhập mã HTML/Script quảng cáo"></textarea>
      </nz-form-control>
    </nz-form-item>
    <div style="display: flex; gap: 24px;">
      <nz-form-item>
        <nz-form-label>Thứ tự</nz-form-label>
        <nz-form-control>
          <nz-input-number [(ngModel)]="order" [nzMin]="0" [nzStep]="1" />
        </nz-form-control>
      </nz-form-item>
      <nz-form-item>
        <nz-form-label>Kích hoạt</nz-form-label>
        <nz-form-control>
          <nz-switch [(ngModel)]="isActive" />
        </nz-form-control>
      </nz-form-item>
    </div>
  `,
})
export class AdvertisementFormModalComponent {
  private readonly data = inject<{
    name: string;
    type: string;
    location: string;
    position: string;
    code: string;
    isActive: boolean;
    order: number;
  }>(NZ_MODAL_DATA);

  readonly typeOptions = AD_TYPE_OPTIONS;
  readonly locationOptions = AD_LOCATION_OPTIONS;

  name = this.data.name ?? '';
  type = this.data.type ?? 'banner';
  location = this.data.location ?? 'home';
  position = this.data.position ?? '';
  code = this.data.code ?? '';
  isActive = this.data.isActive ?? true;
  order = this.data.order ?? 0;
}

@Component({
  selector: 'app-advertisements',
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
    NzTagModule,
    NzSelectModule,
    PaginationBarComponent,
  ],
  templateUrl: './advertisements.html',
  styleUrl: './advertisements.less',
})
export class AdvertisementsComponent implements OnInit {
  private readonly adsService = inject(AdvertisementsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // Label maps — dùng trong template để hiển thị tiếng Việt
  protected readonly typeLabels = TYPE_LABELS;
  protected readonly locationLabels = LOCATION_LABELS;
  protected readonly typeOptions = AD_TYPE_OPTIONS;
  protected readonly locationOptions = AD_LOCATION_OPTIONS;

  protected readonly ads = signal<Advertisement[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
    type: [''],
    location: [''],
  });

  ngOnInit(): void {
    this.loadAds();
  }

  loadAds(): void {
    this.loading.set(true);
    const fv = this.searchForm.getRawValue();
    const params: AdvertisementListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: 'order',
    };
    if (fv.name) params['filter[name]'] = fv.name;
    if (fv.type) params['filter[type]'] = fv.type;
    if (fv.location) params['filter[location]'] = fv.location;

    this.adsService.getAdvertisements(params).subscribe({
      next: (res) => {
        this.ads.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.ads.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách quảng cáo');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadAds();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadAds();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadAds();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadAds();
  }

  /** Toggle trạng thái kích hoạt nhanh từ bảng */
  onToggleActive(ad: Advertisement): void {
    this.adsService.updateAdvertisement(ad.id, { is_active: !ad.is_active } as any).subscribe({
      next: () => {
        this.message.success(`Đã ${ad.is_active ? 'tắt' : 'bật'} "${ad.name}"`);
        this.loadAds();
      },
      error: () => this.message.error('Cập nhật thất bại'),
    });
  }

  /** Hiển thị modal form (dùng chung cho create & edit) */
  private showAdModal(
    title: string,
    defaults: {
      name: string;
      type: string;
      location: string;
      position: string;
      code: string;
      isActive: boolean;
      order: number;
    },
    onSubmit: (payload: AdvertisementPayload) => Observable<unknown>,
  ): void {
    this.modal.create({
      nzTitle: title,
      nzContent: AdvertisementFormModalComponent,
      nzData: defaults,
      nzWidth: 640,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (instance: AdvertisementFormModalComponent) => {
        const name = instance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên quảng cáo');
          return false;
        }
        if (!instance.code.trim()) {
          this.message.warning('Vui lòng nhập mã quảng cáo');
          return false;
        }
        const payload: AdvertisementPayload = {
          name,
          type: instance.type as AdvertisementPayload['type'],
          location: instance.location as AdvertisementPayload['location'],
          position: instance.position || null,
          code: instance.code,
          is_active: instance.isActive,
          order: instance.order,
        };
        return new Promise<boolean>((resolve) => {
          onSubmit(payload).subscribe({
            next: () => {
              this.message.success(`Đã lưu quảng cáo "${name}"`);
              this.loadAds();
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

  onCreateAd(): void {
    this.showAdModal(
      'Tạo quảng cáo mới',
      { name: '', type: 'banner', location: 'home', position: '', code: '', isActive: true, order: 0 },
      (payload) => this.adsService.createAdvertisement(payload),
    );
  }

  onEditAd(ad: Advertisement): void {
    this.showAdModal(
      'Sửa quảng cáo',
      {
        name: ad.name,
        type: ad.type,
        location: ad.location,
        position: ad.position ?? '',
        code: ad.code,
        isActive: ad.is_active,
        order: ad.order,
      },
      (payload) => this.adsService.updateAdvertisement(ad.id, payload),
    );
  }

  onDeleteAd(ad: Advertisement): void {
    this.adsService.deleteAdvertisement(ad.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa quảng cáo "${ad.name}"`);
        this.loadAds();
      },
      error: () => this.message.error('Xóa quảng cáo thất bại'),
    });
  }
}
