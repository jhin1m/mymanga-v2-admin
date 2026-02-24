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

import { Author, AuthorListParams, AuthorsService } from '../../core/services/authors.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

/** Modal input component cho tên author */
@Component({
  selector: 'app-author-name-input',
  imports: [FormsModule, NzInputModule],
  template: `<input nz-input [(ngModel)]="name" placeholder="Nhập tên author" (keyup.enter)="name" />`,
})
export class AuthorNameInputComponent {
  private readonly data = inject<{ defaultName: string }>(NZ_MODAL_DATA);
  name = this.data.defaultName ?? '';
}

@Component({
  selector: 'app-authors',
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
  templateUrl: './authors.html',
  styleUrl: './authors.less',
})
export class AuthorsComponent implements OnInit {
  private readonly authorsService = inject(AuthorsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly authors = signal<Author[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadAuthors();
  }

  loadAuthors(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: AuthorListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.authorsService.getAuthors(params).subscribe({
      next: (res) => {
        this.authors.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.authors.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách author');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadAuthors();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadAuthors();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadAuthors();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadAuthors();
  }

  private showAuthorModal(title: string, defaultName: string, onSubmit: (name: string) => Observable<unknown>): void {
    this.modal.create({
      nzTitle: title,
      nzContent: AuthorNameInputComponent,
      nzData: { defaultName },
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (componentInstance: AuthorNameInputComponent) => {
        const name = componentInstance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên author');
          return false;
        }
        return new Promise<boolean>((resolve) => {
          onSubmit(name).subscribe({
            next: () => {
              this.message.success(`Đã lưu author "${name}"`);
              this.loadAuthors();
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

  onCreateAuthor(): void {
    this.showAuthorModal('Tạo Author mới', '', (name) => this.authorsService.createAuthor(name));
  }

  onEditAuthor(author: Author): void {
    this.showAuthorModal('Sửa Author', author.name, (name) =>
      this.authorsService.updateAuthor(author.id, name),
    );
  }

  onDeleteAuthor(author: Author): void {
    this.authorsService.deleteAuthor(author.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa author "${author.name}"`);
        this.loadAuthors();
      },
      error: () => this.message.error('Xóa author thất bại'),
    });
  }
}
