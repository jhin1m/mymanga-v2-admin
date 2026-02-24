import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';

// NG-ZORRO modules — mỗi module cung cấp 1 nhóm UI components
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

import { Member, MemberListParams, MembersService, UpdatePointsPayload } from '../../core/services/members.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

// --- Modal component cho sửa điểm ---

/** Dữ liệu truyền vào modal qua NZ_MODAL_DATA */
interface PointsModalData {
  totalPoints: number;
  usedPoints: number;
  achievementsPoints: number;
}

/** Modal form inline — hiển thị 3 trường nhập điểm */
@Component({
  selector: 'app-edit-points-modal',
  imports: [FormsModule, NzFormModule, NzInputNumberModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tổng điểm</nz-form-label>
      <nz-form-control>
        <nz-input-number [(ngModel)]="totalPoints" [nzMin]="0" [nzStep]="1" style="width: 100%" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Điểm đã dùng</nz-form-label>
      <nz-form-control>
        <nz-input-number [(ngModel)]="usedPoints" [nzMin]="0" [nzStep]="1" style="width: 100%" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Điểm thành tựu</nz-form-label>
      <nz-form-control>
        <nz-input-number [(ngModel)]="achievementsPoints" [nzMin]="0" [nzStep]="1" style="width: 100%" />
      </nz-form-control>
    </nz-form-item>
  `,
})
export class EditPointsModalComponent {
  private readonly data = inject<PointsModalData>(NZ_MODAL_DATA);

  totalPoints = this.data.totalPoints ?? 0;
  usedPoints = this.data.usedPoints ?? 0;
  achievementsPoints = this.data.achievementsPoints ?? 0;
}

// --- Modal component cho sửa role ---

/** Dữ liệu truyền vào modal sửa role */
interface RoleModalData {
  currentRole: string;
  isSuperAdmin: boolean;
}

/** Danh sách role có thể gán */
const AVAILABLE_ROLES = [
  { label: 'User', value: 'user' },
  { label: 'Translator', value: 'translator' },
  { label: 'Admin', value: 'admin' },
];

/** Modal form — dropdown chọn 1 role cho thành viên */
@Component({
  selector: 'app-edit-role-modal',
  imports: [FormsModule, NzFormModule, NzSelectModule],
  template: `
    <nz-form-item>
      <nz-form-label>Chức danh</nz-form-label>
      <nz-form-control>
        @if (isSuperAdmin) {
          <p style="color: #ff4d4f">Không thể sửa role của Super Admin.</p>
        } @else {
          <nz-select
            [(ngModel)]="selectedRole"
            nzPlaceHolder="Chọn role"
            style="width: 100%"
          >
            @for (role of availableRoles; track role.value) {
              <nz-option [nzValue]="role.value" [nzLabel]="role.label" />
            }
          </nz-select>
        }
      </nz-form-control>
    </nz-form-item>
  `,
})
export class EditRoleModalComponent {
  private readonly data = inject<RoleModalData>(NZ_MODAL_DATA);

  selectedRole: string = this.data.currentRole;
  isSuperAdmin = this.data.isSuperAdmin;
  availableRoles = AVAILABLE_ROLES;
}

@Component({
  selector: 'app-members',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    NzCardModule,
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzAvatarModule,
    PaginationBarComponent,
  ],
  templateUrl: './members.html',
  styleUrl: './members.less',
})
export class MembersComponent implements OnInit {
  // inject() thay cho constructor DI — gọn hơn, không cần constructor
  private readonly membersService = inject(MembersService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // --- Signals: reactive state management của Angular ---
  // signal() tạo reactive variable, khi giá trị thay đổi → UI tự cập nhật
  protected readonly members = signal<Member[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  // Reactive form cho search filters
  // FormBuilder giúp tạo form group gọn hơn so với new FormGroup()
  protected readonly searchForm = this.fb.group({
    id: [''],
    name: [''],
    email: [''],
    role: [''],
  });

  /** Danh sách role cho dropdown */
  protected readonly roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Translator', value: 'translator' },
    { label: 'User', value: 'user' },
  ];

  ngOnInit(): void {
    this.loadMembers();
  }

  /** Gọi API lấy danh sách thành viên */
  loadMembers(): void {
    this.loading.set(true);

    const formValue = this.searchForm.getRawValue();

    // Build params object — chỉ gửi fields có giá trị
    const params: MemberListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
    };

    if (formValue.id) params['filter[id]'] = formValue.id;
    if (formValue.name) params['filter[name]'] = formValue.name;
    if (formValue.email) params['filter[email]'] = formValue.email;
    if (formValue.role) params['filter[role]'] = formValue.role;

    this.membersService.getMembers(params).subscribe({
      next: (res) => {
        // Defensive check: API có thể trả format khác hoặc lỗi
        // res?.data — optional chaining phòng trường hợp res undefined
        this.members.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      // error: xử lý khi API lỗi (network, 404, 500, etc.)
      error: () => {
        this.members.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách thành viên');
        this.loading.set(false);
      },
    });
  }

  /** Khi user click "Tìm kiếm" */
  onSearch(): void {
    this.pageIndex.set(1); // Reset về trang 1 khi search mới
    this.loadMembers();
  }

  /** Khi user click "Reset" */
  onReset(): void {
    this.searchForm.reset(); // Xóa hết giá trị trong form
    this.pageIndex.set(1);
    this.loadMembers();
  }

  /** Khi user chuyển trang trong bảng */
  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadMembers();
  }

  /** Khi user thay đổi số dòng/trang */
  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadMembers();
  }

  /** Cấm thành viên — gọi sau khi user confirm ở popconfirm */
  onBanUser(member: Member): void {
    this.membersService.banUser(member.id).subscribe({
      next: () => {
        this.message.success(`Đã ${member.banned_until ? 'bỏ cấm' : 'cấm'} thành viên "${member.name}"`);
        this.loadMembers(); // Reload để cập nhật trạng thái
      },
      error: () => this.message.error('Thao tác thất bại'),
    });
  }

  /** Xóa tất cả bình luận của thành viên */
  onDeleteComments(member: Member): void {
    this.membersService.deleteUserComments(member.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa bình luận của "${member.name}"`);
      },
      error: () => this.message.error('Xóa bình luận thất bại'),
    });
  }

  /** Super admin email — không cho phép sửa role */
  private readonly SUPER_ADMIN_EMAIL = 'admin@admin.com';

  /** Mở modal sửa role cho thành viên */
  onEditRole(member: Member): void {
    const isSuperAdmin = member.email === this.SUPER_ADMIN_EMAIL;

    this.modal.create({
      nzTitle: `Sửa role — ${member.name}`,
      nzContent: EditRoleModalComponent,
      nzData: {
        currentRole: member.role ?? 'user',
        isSuperAdmin,
      } as RoleModalData,
      nzWidth: 420,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOkDisabled: isSuperAdmin,
      nzOnOk: (instance: EditRoleModalComponent) => {
        if (isSuperAdmin || !instance.selectedRole) {
          this.message.warning('Vui lòng chọn role');
          return false;
        }

        return new Promise<boolean>((resolve) => {
          this.membersService.updateUserRole(member.id, { role: instance.selectedRole }).subscribe({
            next: () => {
              this.message.success(`Đã cập nhật role cho "${member.name}"`);
              this.loadMembers();
              resolve(true);
            },
            error: () => {
              this.message.error('Cập nhật role thất bại');
              resolve(false);
            },
          });
        });
      },
    });
  }

  /** Mở modal sửa điểm cho thành viên */
  onEditPoints(member: Member): void {
    this.modal.create({
      nzTitle: `Sửa điểm — ${member.name}`,
      nzContent: EditPointsModalComponent,
      nzData: {
        totalPoints: member.total_points,
        usedPoints: member.used_points,
        achievementsPoints: member.achievements_points,
      } as PointsModalData,
      nzWidth: 480,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (instance: EditPointsModalComponent) => {
        const payload: UpdatePointsPayload = {
          total_points: instance.totalPoints,
          used_points: instance.usedPoints,
          achievements_points: instance.achievementsPoints,
        };

        // Trả về Promise để modal biết khi nào đóng
        return new Promise<boolean>((resolve) => {
          this.membersService.updateUserPoints(member.id, payload).subscribe({
            next: () => {
              this.message.success(`Đã cập nhật điểm cho "${member.name}"`);
              this.loadMembers();
              resolve(true);
            },
            error: () => {
              this.message.error('Cập nhật điểm thất bại');
              resolve(false);
            },
          });
        });
      },
    });
  }
}
