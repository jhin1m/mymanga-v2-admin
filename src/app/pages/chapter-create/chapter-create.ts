import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, concat, of, switchMap, tap } from 'rxjs';

import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { ChaptersService } from '../../core/services/chapters.service';

@Component({
  selector: 'app-chapter-create',
  imports: [
    ReactiveFormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzUploadModule,
    NzEmptyModule,
  ],
  templateUrl: './chapter-create.html',
  styleUrl: './chapter-create.less',
})
export class ChapterCreateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly chaptersService = inject(ChaptersService);

  // --- State ---
  protected readonly saving = signal(false);
  protected readonly mangaId = signal('');

  // --- Image state ---
  protected readonly uploading = signal(false);
  protected readonly uploadedCount = signal(0);
  protected readonly uploadTotal = signal(0);

  // File chờ upload: hiển thị preview local, chỉ upload khi nhấn Lưu
  protected readonly pendingPreviews = signal<{ file: File; previewUrl: string }[]>([]);

  // --- Form ---
  protected readonly createForm = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnDestroy(): void {
    // Giải phóng Object URLs để tránh memory leak
    this.pendingPreviews().forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }

  ngOnInit(): void {
    this.mangaId.set(this.route.snapshot.paramMap.get('mangaId') ?? '');
  }

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
    const { name } = this.createForm.getRawValue();
    const pending = this.pendingPreviews();

    // Bước 1: Tạo chapter trước
    this.chaptersService.createChapter(this.mangaId(), { name: name ?? '' }).subscribe({
      next: (res) => {
        const newChapterId = res.data?.id;
        if (!newChapterId) {
          this.message.error('Tạo chương thất bại');
          this.saving.set(false);
          return;
        }

        if (pending.length > 0) {
          // Bước 2: Upload hình vào chapter vừa tạo
          this.uploadPendingFiles(newChapterId, pending);
        } else {
          // Không có hình → chuyển sang trang edit
          this.message.success('Tạo chương thành công');
          this.saving.set(false);
          this.navigateToEdit(newChapterId);
        }
      },
      error: () => {
        this.message.error('Tạo chương thất bại');
        this.saving.set(false);
      },
    });
  }

  // ========== IMAGE UPLOAD ==========

  /**
   * nz-upload gọi hàm này cho TỪNG file.
   * Chỉ tạo preview local, KHÔNG upload. Upload khi nhấn Lưu.
   * Return false → ngăn nz-upload tự gửi request.
   */
  beforeImageUpload = (file: NzUploadFile): boolean => {
    const f = (file.originFileObj ?? file) as unknown as File;

    if (!f.type.startsWith('image/')) {
      this.message.error(`${f.name}: chỉ chấp nhận file hình ảnh`);
      return false;
    }
    if (f.size / 1024 / 1024 > 3) {
      this.message.error(`${f.name}: vượt quá 3MB`);
      return false;
    }

    const previewUrl = URL.createObjectURL(f);
    this.pendingPreviews.update((list) => [...list, { file: f, previewUrl }]);
    return false;
  };

  /** Xoá 1 file pending khỏi danh sách preview */
  onRemovePending(index: number): void {
    const current = this.pendingPreviews();
    URL.revokeObjectURL(current[index].previewUrl);
    this.pendingPreviews.set(current.filter((_, i) => i !== index));
  }

  /** Upload hình vào chapter vừa tạo, sau đó chuyển sang trang edit */
  private uploadPendingFiles(chapterId: string, pending: { file: File; previewUrl: string }[]): void {
    this.uploading.set(true);
    this.uploadTotal.set(pending.length);
    this.uploadedCount.set(0);

    let failCount = 0;
    const uploads = pending.map((p) =>
      this.chaptersService.addImage(chapterId, p.file).pipe(
        tap(() => this.uploadedCount.update((c) => c + 1)),
        catchError(() => {
          failCount++;
          this.uploadedCount.update((c) => c + 1);
          return of(null);
        }),
      ),
    );

    // Upload từng file tuần tự bằng concat
    concat(...uploads).subscribe({
      complete: () => {
        this.uploading.set(false);
        this.saving.set(false);
        pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        this.pendingPreviews.set([]);

        if (failCount > 0) {
          this.message.warning(
            `Tạo chương OK. ${pending.length - failCount}/${pending.length} hình tải lên (${failCount} lỗi)`,
          );
        } else {
          this.message.success('Tạo chương thành công');
        }

        this.navigateToEdit(chapterId);
      },
      error: () => {
        this.uploading.set(false);
        this.saving.set(false);
        this.message.error('Upload hình thất bại');
      },
    });
  }

  // ========== DRAG-DROP REORDER ==========

  onImageDrop(event: CdkDragDrop<{ file: File; previewUrl: string }[]>): void {
    const items = [...this.pendingPreviews()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.pendingPreviews.set(items);
  }

  // ========== NAVIGATION ==========

  onBack(): void {
    this.router.navigate(['/manga/edit', this.mangaId()]);
  }

  private navigateToEdit(chapterId: string): void {
    this.router.navigate(['/manga', this.mangaId(), 'chapters', chapterId, 'edit']);
  }
}
