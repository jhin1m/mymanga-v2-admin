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

import { Genre, GenreListParams, GenrePayload, GenresService } from '../../core/services/genres.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

/** Modal component cho tạo/sửa genre — có name + 2 switch */
@Component({
  selector: 'app-genre-form-modal',
  imports: [FormsModule, NzInputModule, NzSwitchModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label>Tên thể loại</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="name" placeholder="Nhập tên thể loại" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Hiển thị trên PC</nz-form-label>
      <nz-form-control>
        <nz-switch [(ngModel)]="showHeader" />
      </nz-form-control>
    </nz-form-item>
    <nz-form-item>
      <nz-form-label>Hiển thị trên Mobile</nz-form-label>
      <nz-form-control>
        <nz-switch [(ngModel)]="showMb" />
      </nz-form-control>
    </nz-form-item>
  `,
})
export class GenreFormModalComponent {
  private readonly data = inject<{ name: string; showHeader: boolean; showMb: boolean }>(NZ_MODAL_DATA);
  name = this.data.name ?? '';
  showHeader = this.data.showHeader ?? false;
  showMb = this.data.showMb ?? false;
}

@Component({
  selector: 'app-genres',
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
    PaginationBarComponent,
  ],
  templateUrl: './genres.html',
  styleUrl: './genres.less',
})
export class GenresComponent implements OnInit {
  private readonly genresService = inject(GenresService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly genres = signal<Genre[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: GenreListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.genresService.getGenres(params).subscribe({
      next: (res) => {
        this.genres.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.genres.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách thể loại');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadGenres();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadGenres();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadGenres();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadGenres();
  }

  /** Hiển thị modal form genre (dùng chung cho create & edit) */
  private showGenreModal(
    title: string,
    defaults: { name: string; showHeader: boolean; showMb: boolean },
    onSubmit: (payload: GenrePayload) => Observable<unknown>,
  ): void {
    this.modal.create({
      nzTitle: title,
      nzContent: GenreFormModalComponent,
      nzData: defaults,
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (instance: GenreFormModalComponent) => {
        const name = instance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên thể loại');
          return false;
        }
        const payload: GenrePayload = {
          name,
          show_header: instance.showHeader,
          show_mb: instance.showMb,
        };
        return new Promise<boolean>((resolve) => {
          onSubmit(payload).subscribe({
            next: () => {
              this.message.success(`Đã lưu thể loại "${name}"`);
              this.loadGenres();
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

  onCreateGenre(): void {
    this.showGenreModal('Tạo thể loại mới', { name: '', showHeader: false, showMb: false }, (payload) =>
      this.genresService.createGenre(payload),
    );
  }

  onEditGenre(genre: Genre): void {
    this.showGenreModal(
      'Sửa thể loại',
      { name: genre.name, showHeader: genre.show_header, showMb: genre.show_mb },
      (payload) => this.genresService.updateGenre(genre.id, payload),
    );
  }

  onDeleteGenre(genre: Genre): void {
    this.genresService.deleteGenre(genre.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa thể loại "${genre.name}"`);
        this.loadGenres();
      },
      error: () => this.message.error('Xóa thể loại thất bại'),
    });
  }
}
