import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
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
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { Pet, PetListParams, PetsService } from '../../core/services/pets.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

/** Modal component cho tạo/sửa pet — name + image upload */
@Component({
  selector: 'app-pet-form-modal',
  imports: [FormsModule, NzInputModule, NzFormModule, NzUploadModule, NzButtonModule, NzIconModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tên bạn đồng hành</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="Nhập tên bạn đồng hành" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Hình ảnh</nz-form-label>
      <nz-form-control>
        @if (imagePreviewUrl) {
          <img [src]="imagePreviewUrl" alt="Preview" class="image-preview" />
        }
        <nz-upload [nzShowUploadList]="false" [nzBeforeUpload]="beforeUpload" nzAccept="image/*">
          <button nz-button>
            <nz-icon nzType="upload" />
            {{ imagePreviewUrl ? 'Đổi ảnh' : 'Tải ảnh lên' }}
          </button>
        </nz-upload>
      </nz-form-control>
    </nz-form-item>
  `,
  styles: [
    `
      .image-preview {
        max-width: 200px;
        max-height: 120px;
        object-fit: contain;
        border-radius: 4px;
        margin-bottom: 8px;
        display: block;
      }
    `,
  ],
})
export class PetFormModalComponent {
  private readonly data = inject<{ name: string; imageUrl: string }>(NZ_MODAL_DATA);
  private readonly cdr = inject(ChangeDetectorRef);
  name = this.data.name ?? '';
  imageFile: File | null = null;
  imagePreviewUrl: string | null = this.data.imageUrl || null;

  /** Chặn nz-upload tự gửi request — chỉ lưu file để gửi cùng form */
  beforeUpload = (file: NzUploadFile): boolean => {
    const rawFile = file as unknown as File;
    this.imageFile = rawFile;

    // Tạo preview URL để hiển thị ảnh ngay
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = reader.result as string;
      this.cdr.detectChanges(); // FileReader callback chạy ngoài Angular zone
    };
    reader.readAsDataURL(rawFile);

    return false; // Ngăn nz-upload tự gửi request
  };
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

  // Signal-based state — Angular tracks changes automatically
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
        this.message.error('Không thể tải danh sách bạn đồng hành');
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

  /** Hiển thị modal form — dùng chung cho create & edit */
  private showPetModal(
    title: string,
    defaults: { name: string; imageUrl: string },
    onSubmit: (formData: FormData) => Observable<unknown>,
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
          this.message.warning('Vui lòng nhập tên bạn đồng hành');
          return false; // Giữ modal mở
        }

        // Đóng gói name + image file vào FormData
        const formData = new FormData();
        formData.append('name', name);
        if (instance.imageFile) {
          formData.append('image', instance.imageFile);
        }

        return new Promise<boolean>((resolve) => {
          onSubmit(formData).subscribe({
            next: () => {
              this.message.success(`Đã lưu bạn đồng hành "${name}"`);
              this.loadPets();
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

  onCreatePet(): void {
    this.showPetModal('Tạo bạn đồng hành mới', { name: '', imageUrl: '' }, (formData) =>
      this.petsService.createPet(formData),
    );
  }

  onEditPet(pet: Pet): void {
    this.showPetModal(
      'Sửa bạn đồng hành',
      { name: pet.name, imageUrl: pet.image_full_url },
      (formData) => this.petsService.updatePet(pet.id, formData),
    );
  }

  onDeletePet(pet: Pet): void {
    this.petsService.deletePet(pet.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa bạn đồng hành "${pet.name}"`);
        this.loadPets();
      },
      error: () => this.message.error('Xóa bạn đồng hành thất bại'),
    });
  }
}
