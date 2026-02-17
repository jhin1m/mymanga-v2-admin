import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';

// NG-ZORRO modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import { Manga, MangaListParams, MangaService } from '../../core/services/manga.service';

@Component({
  selector: 'app-manga-list',
  imports: [
    ReactiveFormsModule,
    UpperCasePipe,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzPaginationModule,
    NzEmptyModule,
    NzSpinModule,
    NzTooltipModule,
  ],
  templateUrl: './manga-list.html',
  styleUrl: './manga-list.less',
})
export class MangaListComponent implements OnInit {
  private readonly mangaService = inject(MangaService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // --- Reactive state ---
  protected readonly mangas = signal<Manga[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  // --- Search form filters ---
  protected readonly searchForm = this.fb.group({
    name: [''],
    group_id: [''],
    user_id: [''],
    artist_id: [''],
    doujinshi_id: [''],
    is_reviewed: [''],
  });

  /** Options cho dropdown "Duyệt" */
  protected readonly reviewOptions = [
    { label: 'Đã duyệt', value: 1 },
    { label: 'Chưa duyệt', value: 0 },
  ];

  ngOnInit(): void {
    this.loadMangas();
  }

  /** Gọi API lấy danh sách manga */
  loadMangas(): void {
    this.loading.set(true);

    const f = this.searchForm.getRawValue();

    // Build params — chỉ gửi fields có giá trị
    const params: MangaListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      include: 'user,genres,artist,group,doujinshi',
      sort: '-created_at',
    };

    if (f.name) params['filter[name]'] = f.name;
    if (f.group_id) params['filter[group_id]'] = f.group_id;
    if (f.user_id) params['filter[user_id]'] = f.user_id;
    if (f.artist_id) params['filter[artist_id]'] = f.artist_id;
    if (f.doujinshi_id) params['filter[doujinshi_id]'] = f.doujinshi_id;
    if (f.is_reviewed !== '' && f.is_reviewed !== null) {
      params['filter[is_reviewed]'] = Number(f.is_reviewed);
    }

    this.mangaService.getMangas(params).subscribe({
      next: (res) => {
        this.mangas.set(res?.data ?? []);
        this.total.set(res?.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.mangas.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách manga');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadMangas();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadMangas();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadMangas();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadMangas();
  }

  /** Xoá manga — gọi sau khi user confirm ở popconfirm */
  onDeleteManga(manga: Manga): void {
    this.mangaService.deleteManga(manga.id).subscribe({
      next: () => {
        this.message.success(`Đã xoá "${manga.name}"`);
        this.loadMangas();
      },
      error: () => this.message.error('Xoá manga thất bại'),
    });
  }
}
