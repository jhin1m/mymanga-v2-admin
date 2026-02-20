import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { catchError, concat, of, switchMap, tap, toArray } from 'rxjs';

import { CdkDropList, CdkDrag, CdkDragHandle, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzProgressModule } from 'ng-zorro-antd/progress';

import {
  ChapterDetail,
  ChapterImage,
  ChaptersService,
} from '../../core/services/chapters.service';

/** Trạng thái upload của từng file pending */
type UploadStatus = 'waiting' | 'uploading' | 'done' | 'error';

export interface PendingFile {
  file: File;
  previewUrl: string;
  status: UploadStatus;
}

@Component({
  selector: 'app-chapter-edit',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzUploadModule,
    NzSpinModule,
    NzEmptyModule,
    NzProgressModule,
  ],
  templateUrl: './chapter-edit.html',
  styleUrl: './chapter-edit.less',
})
export class ChapterEditComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly chaptersService = inject(ChaptersService);

  // --- State ---
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly chapter = signal<ChapterDetail | null>(null);
  protected readonly chapterId = signal('');
  protected readonly mangaId = signal('');

  // --- Image state ---
  protected readonly images = signal<ChapterImage[]>([]);
  protected readonly uploading = signal(false);

  // File chờ upload: hiển thị preview local, chỉ upload khi nhấn Lưu
  protected readonly pendingPreviews = signal<PendingFile[]>([]);

  // Đánh dấu cần gọi API clearImages khi Save (soft delete)
  protected readonly pendingDeletion = signal(false);

  // Tính toán: có thay đổi cần lưu không (để disable/enable nút Lưu thông minh hơn)
  protected readonly hasChanges = computed(() => {
    return this.pendingPreviews().length > 0 || this.pendingDeletion();
  });

  // --- Form ---
  protected readonly editForm = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnDestroy(): void {
    // Giải phóng Object URLs để tránh memory leak
    this.pendingPreviews().forEach(p => URL.revokeObjectURL(p.previewUrl));
  }

  ngOnInit(): void {
    this.mangaId.set(this.route.snapshot.paramMap.get('mangaId') ?? '');
    this.chapterId.set(this.route.snapshot.paramMap.get('chapterId') ?? '');
    this.loadChapter();
  }

  // ========== DATA LOADING ==========

  private loadChapter(): void {
    this.loading.set(true);
    this.chaptersService.getChapter(this.chapterId()).subscribe({
      next: res => {
        const chapter = res.data;
        if (!chapter) {
          this.message.error('Không tìm thấy chương');
          this.router.navigate(['/manga/edit', this.mangaId()]);
          return;
        }
        this.chapter.set(chapter);
        this.editForm.patchValue({ name: chapter.name });

        // API trả hình trong "content" (mảng URL string) — map sang ChapterImage[]
        const images: ChapterImage[] = (chapter.content ?? []).map((url, i) => ({
          id: `content-${i}`,
          image_full_url: url,
          order: i,
        }));
        this.images.set(images);
        this.pendingDeletion.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Không thể tải thông tin chương');
        this.loading.set(false);
      },
    });
  }

  // ========== SAVE ==========

  onSave(): void {
    if (this.editForm.invalid) {
      Object.values(this.editForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.saving.set(true);
    const { name } = this.editForm.getRawValue();
    const pending = this.pendingPreviews();

    if (pending.length > 0) {
      // Có hình mới: clr-img → add-img × N → update tên → reload
      this.uploadPendingFiles(pending, name ?? '');
    } else if (this.pendingDeletion()) {
      // Chỉ xoá hình (đã soft delete), gọi API clear rồi update tên
      this.clearThenUpdateName(name ?? '');
    } else {
      // Chỉ update tên
      this.updateChapterName(name ?? '');
    }
  }

  /** Xoá hình trên server rồi update tên */
  private clearThenUpdateName(name: string): void {
    this.chaptersService.clearImages(this.chapterId()).pipe(
      switchMap(() => {
        this.pendingDeletion.set(false);
        return this.chaptersService.updateChapter(this.mangaId(), this.chapterId(), {
          name,
          image_urls: [],
        });
      }),
    ).subscribe({
      next: () => {
        this.message.success('Cập nhật chương thành công');
        this.saving.set(false);
        this.loadChapter();
      },
      error: () => {
        this.message.error('Cập nhật chương thất bại');
        this.saving.set(false);
      },
    });
  }

  /** Cập nhật tên chương + image_urls hiện tại */
  private updateChapterName(name: string): void {
    const imageUrls = this.images().map(img => img.image_full_url);
    this.chaptersService
      .updateChapter(this.mangaId(), this.chapterId(), { name, image_urls: imageUrls })
      .subscribe({
        next: () => {
          this.message.success('Cập nhật chương thành công');
          this.saving.set(false);
          this.loadChapter();
        },
        error: () => {
          this.message.error('Cập nhật chương thất bại');
          this.saving.set(false);
        },
      });
  }

  // ========== IMAGE UPLOAD ==========

  /**
   * nz-upload gọi hàm này cho TỪNG file.
   * Chỉ tạo preview local, KHÔNG upload. Upload khi nhấn Lưu.
   * Khi thêm file mới → tự xoá ảnh cũ (temp) nếu có.
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

    // Auto-clear ảnh cũ (temp) khi kéo ảnh mới vào lần đầu
    if (this.images().length > 0 && this.pendingPreviews().length === 0) {
      this.images.set([]);
      this.pendingDeletion.set(true);
    }

    const previewUrl = URL.createObjectURL(f);
    this.pendingPreviews.update(list => [
      ...list,
      { file: f, previewUrl, status: 'waiting' as UploadStatus },
    ]);
    return false;
  };

  /** Xoá 1 file pending khỏi danh sách preview */
  onRemovePending(index: number): void {
    const current = this.pendingPreviews();
    URL.revokeObjectURL(current[index].previewUrl);
    this.pendingPreviews.set(current.filter((_, i) => i !== index));
  }

  /**
   * Flow: clr-img → add-img × N (tuần tự, giữ thứ tự) → GET chapter → PUT update tên.
   * Upload tuần tự bằng concat() để đảm bảo server nhận đúng thứ tự hình.
   */
  private uploadPendingFiles(pending: PendingFile[], name: string): void {
    this.uploading.set(true);

    let failCount = 0;
    const uploads = pending.map((p, idx) =>
      this.chaptersService.addImage(this.chapterId(), p.file).pipe(
        tap(() => this.updatePendingStatus(idx, 'done')),
        catchError(() => {
          failCount++;
          this.updatePendingStatus(idx, 'error');
          return of(null);
        }),
      ),
    );

    // Đánh dấu file đầu tiên đang upload khi bắt đầu
    this.updatePendingStatus(0, 'uploading');

    // Wrap mỗi upload để đánh dấu file kế tiếp đang upload
    const uploadsWithTracking = uploads.map((upload$, idx) =>
      upload$.pipe(
        tap(() => {
          // Khi file hiện tại xong, đánh dấu file tiếp theo đang upload
          if (idx + 1 < pending.length) {
            this.updatePendingStatus(idx + 1, 'uploading');
          }
        }),
      ),
    );

    this.chaptersService.clearImages(this.chapterId()).pipe(
      switchMap(() => {
        this.pendingDeletion.set(false);
        // Upload từng file tuần tự (concat = gọi lần lượt, giữ thứ tự)
        // toArray() gom tất cả emissions → chỉ phát 1 lần khi TOÀN BỘ uploads hoàn thành
        return concat(...uploadsWithTracking).pipe(toArray());
      }),
      // Reload chapter để lấy image_urls mới từ server (chỉ chạy 1 lần sau khi tất cả upload xong)
      switchMap(() => this.chaptersService.getChapter(this.chapterId())),
    ).subscribe({
      next: res => {
        this.uploading.set(false);
        pending.forEach(p => URL.revokeObjectURL(p.previewUrl));
        this.pendingPreviews.set([]);

        if (failCount > 0) {
          this.message.warning(
            `${pending.length - failCount}/${pending.length} hình tải lên (${failCount} lỗi)`,
          );
        }

        const freshImages: ChapterImage[] = (res.data?.content ?? []).map((url, i) => ({
          id: `content-${i}`,
          image_full_url: url,
          order: i,
        }));
        this.images.set(freshImages);

        // PUT update tên + image_urls mới
        this.updateChapterName(name);
      },
      error: () => {
        this.uploading.set(false);
        this.saving.set(false);
        this.message.error('Upload hình thất bại');
      },
    });
  }

  /** Cập nhật status của 1 file pending theo index */
  private updatePendingStatus(index: number, status: UploadStatus): void {
    this.pendingPreviews.update(list =>
      list.map((item, i) => (i === index ? { ...item, status } : item)),
    );
  }

  // ========== DRAG-DROP REORDER ==========

  onImageDrop(event: CdkDragDrop<ChapterImage[]>): void {
    const imgs = [...this.images()];
    moveItemInArray(imgs, event.previousIndex, event.currentIndex);
    this.images.set(imgs);
  }

  // ========== CLEAR IMAGES (Soft delete — chỉ xoá trên UI) ==========

  onClearImages(): void {
    this.images.set([]);
    this.pendingDeletion.set(true);
    this.message.info('Đã đánh dấu xoá tất cả hình. Nhấn Lưu để xác nhận.');
  }

  // ========== NAVIGATION ==========

  onBack(): void {
    this.router.navigate(['/manga/edit', this.mangaId()]);
  }
}
