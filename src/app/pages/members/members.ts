import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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

import { Member, MemberListParams, MembersService } from '../../core/services/members.service';

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
  ],
  templateUrl: './members.html',
  styleUrl: './members.less',
})
export class MembersComponent implements OnInit {
  // inject() thay cho constructor DI — gọn hơn, không cần constructor
  private readonly membersService = inject(MembersService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

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
        this.total.set(res?.meta?.total ?? 0);
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
        this.message.success(`Đã ${member.is_banned ? 'bỏ cấm' : 'cấm'} thành viên "${member.name}"`);
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
}
