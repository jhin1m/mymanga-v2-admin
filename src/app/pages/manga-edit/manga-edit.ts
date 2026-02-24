import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

import { Manga, MangaService } from '../../core/services/manga.service';
import { GenreSimple, GenresService } from '../../core/services/genres.service';
import { ArtistsService, Artist } from '../../core/services/artists.service';
import { AuthorsService, Author } from '../../core/services/authors.service';
import { GroupsService, Group } from '../../core/services/groups.service';
import { DoujinshisService, Doujinshi } from '../../core/services/doujinshis.service';
import { MembersService, Member } from '../../core/services/members.service';
import { Chapter, ChaptersService } from '../../core/services/chapters.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-manga-edit',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzCheckboxModule,
    NzSwitchModule,
    NzUploadModule,
    NzSpinModule,
    NzDividerModule,
    NzTableModule,
    NzPopconfirmModule,
    NzTooltipModule,
    NgxEditorModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    PaginationBarComponent,
  ],
  templateUrl: './manga-edit.html',
  styleUrl: './manga-edit.less',
})
export class MangaEditComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly mangaService = inject(MangaService);
  private readonly genresService = inject(GenresService);
  private readonly artistsService = inject(ArtistsService);
  private readonly authorsService = inject(AuthorsService);
  private readonly groupsService = inject(GroupsService);
  private readonly doujinshisService = inject(DoujinshisService);
  private readonly membersService = inject(MembersService);
  private readonly chaptersService = inject(ChaptersService);

  // --- State ---
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly manga = signal<Manga | null>(null);
  protected readonly mangaId = signal('');

  // Genre checkboxes
  protected readonly allGenres = signal<GenreSimple[]>([]);
  protected readonly selectedGenreIds = signal<number[]>([]);

  // Dropdown options (loaded via search)
  protected readonly authorOptions = signal<Author[]>([]);
  protected readonly artistOptions = signal<Artist[]>([]);
  protected readonly groupOptions = signal<Group[]>([]);
  protected readonly doujinshiOptions = signal<Doujinshi[]>([]);
  protected readonly userOptions = signal<Member[]>([]);
  protected readonly authorLoading = signal(false);
  protected readonly artistLoading = signal(false);
  protected readonly groupLoading = signal(false);
  protected readonly doujinshiLoading = signal(false);
  protected readonly userLoading = signal(false);

  // Cover upload
  protected coverFile: File | null = null;
  protected readonly coverPreviewUrl = signal<string>('');

  // Chapter list
  protected readonly chapters = signal<Chapter[]>([]);
  protected readonly chaptersLoading = signal(false);
  protected readonly chaptersTotal = signal(0);
  protected readonly chaptersPageIndex = signal(1);
  protected readonly chaptersPageSize = signal(20);
  protected readonly checkedChapterIds = signal<Set<string>>(new Set());
  protected readonly allChaptersChecked = signal(false);

  // Chapter reorder (drag-drop)
  protected readonly orderChanged = signal(false);
  protected readonly savingOrder = signal(false);
  private originalChapters: Chapter[] = [];

  // Search subjects for server-search dropdowns
  private readonly authorSearch$ = new Subject<string>();
  private readonly artistSearch$ = new Subject<string>();
  private readonly groupSearch$ = new Subject<string>();
  private readonly doujinshiSearch$ = new Subject<string>();
  private readonly userSearch$ = new Subject<string>();

  // --- Form ---
  protected readonly editForm = this.fb.group({
    name: ['', Validators.required],
    name_alt: [''],
    pilot: [''],
    status: [2],
    is_hot: [false],
    author_id: [''],
    artist_id: [''],
    group_id: [''],
    doujinshi_id: [''],
    user_id: [''],
    finished_by: [''],
  });

  protected readonly statusOptions = [
    { label: 'Đang tiến hành', value: 2 },
    { label: 'Hoàn thành', value: 1 },
  ];

  // ngx-editor — ProseMirror-based, không cần API key
  protected pilotEditor = new Editor();
  protected readonly pilotToolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'link'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3'] }],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right'],
  ];

  ngOnDestroy(): void {
    this.pilotEditor.destroy();
  }

  ngOnInit(): void {
    // Lấy manga ID từ route param
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.mangaId.set(id);

    // Setup search debounce cho dropdowns
    this.setupSearchStreams();

    // Load genres + manga data song song
    this.loadGenres();
    this.loadManga(id);
  }

  // ========== DATA LOADING ==========

  private loadManga(id: string): void {
    this.loading.set(true);
    this.mangaService.getManga(id).subscribe({
      next: (res) => {
        const manga = res.data;
        if (!manga) {
          this.message.error('Không tìm thấy manga');
          this.router.navigate(['/manga/list']);
          return;
        }
        this.manga.set(manga);
        this.patchForm(manga);
        this.loading.set(false);

        // Load chapters sau khi có manga data
        this.loadChapters();
      },
      error: () => {
        this.message.error('Không thể tải thông tin manga');
        this.loading.set(false);
      },
    });
  }

  private patchForm(manga: Manga): void {
    this.editForm.patchValue({
      name: manga.name,
      name_alt: manga.name_alt ?? '',
      pilot: manga.pilot ?? '',
      status: manga.status,
      is_hot: manga.is_hot,
      author_id: manga.author?.id ?? '',
      artist_id: manga.artist?.id ?? '',
      group_id: manga.group?.id ?? '',
      doujinshi_id: manga.doujinshi?.id ?? '',
      user_id: manga.user?.id ?? '',
      finished_by: manga.finished_by ?? '',
    });

    // Set cover preview từ URL hiện tại
    if (manga.cover_full_url) {
      this.coverPreviewUrl.set(manga.cover_full_url);
    }

    // Set selected genres
    if (manga.genres?.length) {
      this.selectedGenreIds.set(manga.genres.map((g) => g.id));
    }

    // Pre-populate dropdown options với data hiện tại
    if (manga.author) {
      this.authorOptions.set([{ ...manga.author, slug: '', user_id: '', created_at: '', updated_at: '' } as Author]);
    }
    if (manga.artist) {
      this.artistOptions.set([{ ...manga.artist, slug: '', user_id: '', created_at: '', updated_at: '' } as Artist]);
    }
    if (manga.group) {
      this.groupOptions.set([{ ...manga.group, slug: '', created_at: '', updated_at: '' } as Group]);
    }
    if (manga.doujinshi) {
      this.doujinshiOptions.set([
        { ...manga.doujinshi, slug: '', user_id: '', created_at: '', updated_at: '' } as Doujinshi,
      ]);
    }
    if (manga.user) {
      this.userOptions.set([
        {
          ...manga.user,
          total_points: 0,
          used_points: 0,
          avatar_full_url: null,
          banned_until: null,
          created_at: '',
          level: 0,
          exp: 0,
        } as Member,
      ]);
    }
  }

  private loadGenres(): void {
    this.genresService.getAllGenres().subscribe({
      next: (res) => this.allGenres.set(res.data ?? []),
      error: () => this.message.error('Không thể tải thể loại'),
    });
  }

  // ========== SEARCH DROPDOWNS ==========

  private setupSearchStreams(): void {
    // Author search
    this.authorSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      if (term.length < 2) return;
      this.authorLoading.set(true);
      this.authorsService.getAuthors({ 'filter[name]': term, per_page: 20 }).subscribe({
        next: (res) => {
          this.authorOptions.set(res.data ?? []);
          this.authorLoading.set(false);
        },
        error: () => this.authorLoading.set(false),
      });
    });

    // Artist search — debounce 300ms, gọi API khi >= 2 ký tự
    this.artistSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      if (term.length < 2) return;
      this.artistLoading.set(true);
      this.artistsService.getArtists({ 'filter[name]': term, per_page: 20 }).subscribe({
        next: (res) => {
          this.artistOptions.set(res.data ?? []);
          this.artistLoading.set(false);
        },
        error: () => this.artistLoading.set(false),
      });
    });

    // Group search
    this.groupSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      if (term.length < 2) return;
      this.groupLoading.set(true);
      this.groupsService.getGroups({ 'filter[name]': term, per_page: 20 }).subscribe({
        next: (res) => {
          this.groupOptions.set(res.data ?? []);
          this.groupLoading.set(false);
        },
        error: () => this.groupLoading.set(false),
      });
    });

    // Doujinshi search
    this.doujinshiSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      if (term.length < 2) return;
      this.doujinshiLoading.set(true);
      this.doujinshisService.getDoujinshis({ 'filter[name]': term, per_page: 20 }).subscribe({
        next: (res) => {
          this.doujinshiOptions.set(res.data ?? []);
          this.doujinshiLoading.set(false);
        },
        error: () => this.doujinshiLoading.set(false),
      });
    });

    // User search — nzServerSearch pattern vì có nhiều users
    this.userSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      if (term.length < 2) return;
      this.userLoading.set(true);
      this.membersService.getMembers({ 'filter[name]': term, per_page: 20 }).subscribe({
        next: (res) => {
          this.userOptions.set(res.data ?? []);
          this.userLoading.set(false);
        },
        error: () => this.userLoading.set(false),
      });
    });
  }

  onAuthorSearch(term: string): void {
    this.authorSearch$.next(term);
  }

  onArtistSearch(term: string): void {
    this.artistSearch$.next(term);
  }

  onGroupSearch(term: string): void {
    this.groupSearch$.next(term);
  }

  onDoujinshiSearch(term: string): void {
    this.doujinshiSearch$.next(term);
  }

  onUserSearch(term: string): void {
    this.userSearch$.next(term);
  }

  // ========== GENRE CHECKBOXES ==========

  onGenreChange(genreId: number, checked: boolean): void {
    const current = this.selectedGenreIds();
    if (checked) {
      this.selectedGenreIds.set([...current, genreId]);
    } else {
      this.selectedGenreIds.set(current.filter((id) => id !== genreId));
    }
  }

  isGenreSelected(genreId: number): boolean {
    return this.selectedGenreIds().includes(genreId);
  }

  // ========== COVER UPLOAD ==========

  /** Xử lý trước khi upload — chỉ lưu file, không gửi lên server */
  beforeCoverUpload = (file: NzUploadFile): boolean => {
    const rawFile = file as unknown as File;
    this.coverFile = rawFile;

    // Tạo preview URL từ file local
    const reader = new FileReader();
    reader.onload = () => this.coverPreviewUrl.set(reader.result as string);
    reader.readAsDataURL(rawFile);

    return false; // Ngăn nz-upload tự gửi request
  };

  // ========== SAVE ==========

  onSave(): void {
    if (this.editForm.invalid) {
      // Đánh dấu tất cả fields để hiện lỗi validation
      Object.values(this.editForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.saving.set(true);
    const formData = this.buildFormData();

    this.mangaService.updateManga(this.mangaId(), formData).subscribe({
      next: () => {
        this.message.success('Cập nhật manga thành công');
        this.saving.set(false);
        // Reload data sau khi save (ở lại trang edit)
        this.loadManga(this.mangaId());
      },
      error: () => {
        this.message.error('Cập nhật manga thất bại');
        this.saving.set(false);
      },
    });
  }

  private buildFormData(): FormData {
    const fd = new FormData();
    const v = this.editForm.getRawValue();

    // Laravel cần _method=PUT cho multipart form
    fd.append('_method', 'PUT');
    fd.append('name', v.name ?? '');
    if (v.name_alt) fd.append('name_alt', v.name_alt);
    if (v.pilot) fd.append('pilot', v.pilot);
    fd.append('status', String(v.status));
    fd.append('is_hot', v.is_hot ? '1' : '0');
    if (v.author_id) fd.append('author_id', v.author_id);
    if (v.artist_id) fd.append('artist_id', v.artist_id);
    if (v.group_id) fd.append('group_id', v.group_id);
    if (v.doujinshi_id) fd.append('doujinshi_id', v.doujinshi_id);
    if (v.user_id) fd.append('user_id', v.user_id);
    if (v.finished_by) fd.append('finished_by', v.finished_by);

    // Genres — gửi dạng genres[]=1&genres[]=2
    for (const gId of this.selectedGenreIds()) {
      fd.append('genres[]', String(gId));
    }

    // Cover file (chỉ gửi khi user chọn ảnh mới)
    if (this.coverFile) {
      fd.append('cover', this.coverFile);
    }

    return fd;
  }

  // ========== CHAPTERS ==========

  loadChapters(): void {
    this.chaptersLoading.set(true);
    this.chaptersService
      .getChapters(this.mangaId(), {
        page: this.chaptersPageIndex(),
        per_page: this.chaptersPageSize(),
        sort: 'order',
      })
      .subscribe({
        next: (res) => {
          const data = res.data ?? [];
          this.chapters.set(data);
          this.originalChapters = data.map((c) => ({ ...c }));
          this.chaptersTotal.set(res.pagination?.total ?? 0);
          this.chaptersLoading.set(false);
          this.checkedChapterIds.set(new Set());
          this.allChaptersChecked.set(false);
          this.orderChanged.set(false);
        },
        error: () => {
          this.chapters.set([]);
          this.message.error('Không thể tải danh sách chương');
          this.chaptersLoading.set(false);
        },
      });
  }

  onChaptersPageChange(page: number): void {
    this.chaptersPageIndex.set(page);
    this.loadChapters();
  }

  onChaptersPageSizeChange(size: number): void {
    this.chaptersPageSize.set(size);
    this.chaptersPageIndex.set(1);
    this.loadChapters();
  }

  // --- Chapter checkbox ---
  onAllChaptersChecked(checked: boolean): void {
    this.allChaptersChecked.set(checked);
    if (checked) {
      this.checkedChapterIds.set(new Set(this.chapters().map((c) => c.id)));
    } else {
      this.checkedChapterIds.set(new Set());
    }
  }

  onChapterChecked(id: string, checked: boolean): void {
    const set = new Set(this.checkedChapterIds());
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
    this.checkedChapterIds.set(set);
    this.allChaptersChecked.set(set.size === this.chapters().length && this.chapters().length > 0);
  }

  isChapterChecked(id: string): boolean {
    return this.checkedChapterIds().has(id);
  }

  get hasCheckedChapters(): boolean {
    return this.checkedChapterIds().size > 0;
  }

  // --- Chapter navigation ---
  onNavigateCreateChapter(): void {
    this.router.navigate(['/manga', this.mangaId(), 'chapters', 'create']);
  }

  onNavigateEditChapter(chapter: Chapter): void {
    this.router.navigate(['/manga', this.mangaId(), 'chapters', chapter.id, 'edit']);
  }

  onDeleteChapter(chapter: Chapter): void {
    this.chaptersService.deleteChapter(this.mangaId(), chapter.id).subscribe({
      next: () => {
        this.message.success(`Đã xoá chương "${chapter.name}"`);
        this.loadChapters();
      },
      error: () => this.message.error('Xoá chương thất bại'),
    });
  }

  // --- Chapter drag-drop reorder ---
  onChapterDrop(event: CdkDragDrop<Chapter[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const list = [...this.chapters()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.chapters.set(list);
    this.orderChanged.set(true);
  }

  onSaveChapterOrder(): void {
    const chaptersOrder = this.chapters().map((c, i) => ({ id: c.id, order: i + 1 }));
    this.savingOrder.set(true);
    this.chaptersService.updateChaptersOrder(chaptersOrder).subscribe({
      next: () => {
        this.message.success('Đã cập nhật thứ tự chương');
        this.savingOrder.set(false);
        this.loadChapters();
      },
      error: () => {
        this.message.error('Cập nhật thứ tự thất bại');
        this.savingOrder.set(false);
      },
    });
  }

  onResetChapterOrder(): void {
    this.chapters.set(this.originalChapters.map((c) => ({ ...c })));
    this.orderChanged.set(false);
  }

  onBulkDeleteChapters(): void {
    const ids = [...this.checkedChapterIds()];
    if (!ids.length) return;

    this.modal.confirm({
      nzTitle: `Xoá ${ids.length} chương đã chọn?`,
      nzContent: 'Hành động này không thể hoàn tác.',
      nzOkDanger: true,
      nzOkText: 'Xoá',
      nzOnOk: () => {
        this.chaptersService.deleteChaptersBulk(this.mangaId(), ids).subscribe({
          next: () => {
            this.message.success(`Đã xoá ${ids.length} chương`);
            this.loadChapters();
          },
          error: () => this.message.error('Xoá chương thất bại'),
        });
      },
    });
  }

  // ========== NAVIGATION ==========

  onBack(): void {
    this.router.navigate(['/manga/list']);
  }
}

