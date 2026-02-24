import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

import { MangaService } from '../../core/services/manga.service';
import { GenreSimple, GenresService } from '../../core/services/genres.service';
import { ArtistsService, Artist } from '../../core/services/artists.service';
import { AuthorsService, Author } from '../../core/services/authors.service';
import { GroupsService, Group } from '../../core/services/groups.service';
import { DoujinshisService, Doujinshi } from '../../core/services/doujinshis.service';
import { MembersService, Member } from '../../core/services/members.service';

@Component({
  selector: 'app-manga-create',
  imports: [
    ReactiveFormsModule,
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
    NgxEditorModule,
  ],
  templateUrl: './manga-create.html',
  styleUrl: './manga-create.less',
})
export class MangaCreateComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly mangaService = inject(MangaService);
  private readonly genresService = inject(GenresService);
  private readonly artistsService = inject(ArtistsService);
  private readonly authorsService = inject(AuthorsService);
  private readonly groupsService = inject(GroupsService);
  private readonly doujinshisService = inject(DoujinshisService);
  private readonly membersService = inject(MembersService);

  // --- State ---
  protected readonly saving = signal(false);

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

  // Search subjects
  private readonly authorSearch$ = new Subject<string>();
  private readonly artistSearch$ = new Subject<string>();
  private readonly groupSearch$ = new Subject<string>();
  private readonly doujinshiSearch$ = new Subject<string>();
  private readonly userSearch$ = new Subject<string>();

  // --- Form ---
  protected readonly createForm = this.fb.group({
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

  // ngx-editor
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
    this.setupSearchStreams();
    this.loadGenres();
  }

  // ========== DATA LOADING ==========

  private loadGenres(): void {
    this.genresService.getAllGenres().subscribe({
      next: (res) => this.allGenres.set(res.data ?? []),
      error: () => this.message.error('Không thể tải thể loại'),
    });
  }

  // ========== SEARCH DROPDOWNS ==========

  private setupSearchStreams(): void {
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

  beforeCoverUpload = (file: NzUploadFile): boolean => {
    const rawFile = file as unknown as File;
    this.coverFile = rawFile;

    const reader = new FileReader();
    reader.onload = () => this.coverPreviewUrl.set(reader.result as string);
    reader.readAsDataURL(rawFile);

    return false; // Ngăn nz-upload tự gửi request
  };

  // ========== SAVE ==========

  onSave(): void {
    if (this.createForm.invalid) {
      Object.values(this.createForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.saving.set(true);
    const formData = this.buildFormData();

    this.mangaService.createManga(formData).subscribe({
      next: (res) => {
        this.message.success('Tạo manga thành công');
        this.saving.set(false);
        // Chuyển sang trang edit sau khi tạo thành công
        if (res.data?.id) {
          this.router.navigate(['/manga/edit', res.data.id]);
        } else {
          this.router.navigate(['/manga/list']);
        }
      },
      error: () => {
        this.message.error('Tạo manga thất bại');
        this.saving.set(false);
      },
    });
  }

  private buildFormData(): FormData {
    const fd = new FormData();
    const v = this.createForm.getRawValue();

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

    for (const gId of this.selectedGenreIds()) {
      fd.append('genres[]', String(gId));
    }

    if (this.coverFile) {
      fd.append('cover', this.coverFile);
    }

    return fd;
  }

  // ========== NAVIGATION ==========

  onBack(): void {
    this.router.navigate(['/manga/list']);
  }
}
