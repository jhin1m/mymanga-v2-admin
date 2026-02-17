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

import { Artist, ArtistListParams, ArtistsService } from '../../core/services/artists.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

/** Component nhỏ dùng làm nội dung modal — NzModal cần Component cho nzContent */
@Component({
  selector: 'app-artist-name-input',
  imports: [FormsModule, NzInputModule],
  template: `<input nz-input [(ngModel)]="name" placeholder="Nhập tên artist" (keyup.enter)="name" />`,
})
export class ArtistNameInputComponent {
  private readonly data = inject<{ defaultName: string }>(NZ_MODAL_DATA);
  name = this.data.defaultName ?? '';
}

@Component({
  selector: 'app-artists',
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
  templateUrl: './artists.html',
  styleUrl: './artists.less',
})
export class ArtistsComponent implements OnInit {
  private readonly artistsService = inject(ArtistsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  protected readonly artists = signal<Artist[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    name: [''],
  });

  ngOnInit(): void {
    this.loadArtists();
  }

  loadArtists(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: ArtistListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.name) params['filter[name]'] = formValue.name;

    this.artistsService.getArtists(params).subscribe({
      next: (res) => {
        this.artists.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.artists.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách artist');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadArtists();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadArtists();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadArtists();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadArtists();
  }

  /**
   * Hiển thị modal nhập tên artist (dùng chung cho create & edit).
   * Dùng modal.create() thay vì confirm() — confirm() render HTML string qua innerHTML
   * nên input không hiển thị đúng. create() cho phép dùng nzContent là Component.
   */
  private showArtistModal(title: string, defaultName: string, onSubmit: (name: string) => Observable<unknown>): void {
    this.modal.create({
      nzTitle: title,
      nzContent: ArtistNameInputComponent,
      nzData: { defaultName },
      nzOkText: 'Lưu',
      nzCancelText: 'Hủy',
      nzOnOk: (componentInstance: ArtistNameInputComponent) => {
        const name = componentInstance.name.trim();
        if (!name) {
          this.message.warning('Vui lòng nhập tên artist');
          return false; // Ngăn modal đóng
        }
        return new Promise<boolean>((resolve) => {
          onSubmit(name).subscribe({
            next: () => {
              this.message.success(`Đã lưu artist "${name}"`);
              this.loadArtists();
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

  /** Mở modal tạo artist mới */
  onCreateArtist(): void {
    this.showArtistModal('Tạo Artist mới', '', (name) => this.artistsService.createArtist(name));
  }

  /** Mở modal sửa artist */
  onEditArtist(artist: Artist): void {
    this.showArtistModal('Sửa Artist', artist.name, (name) =>
      this.artistsService.updateArtist(artist.id, name),
    );
  }

  /** Xóa artist */
  onDeleteArtist(artist: Artist): void {
    this.artistsService.deleteArtist(artist.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa artist "${artist.name}"`);
        this.loadArtists();
      },
      error: () => this.message.error('Xóa artist thất bại'),
    });
  }
}
