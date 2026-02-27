import { Component, OnInit, OnDestroy, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

// NG-ZORRO modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import { CrawlerService } from '../../core/services/crawler.service';
import { CrawlJob, CrawlJobListParams, CrawlJobStatus, CrawlerPaginatedResponse } from '../../core/models/crawler-types';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-crawler-history',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzSelectModule,
    NzInputModule,
    NzPopconfirmModule,
    NzIconModule,
    NzTooltipModule,
    PaginationBarComponent,
  ],
  templateUrl: './crawler-history.html',
  styleUrl: './crawler-history.less',
})
export class CrawlerHistoryComponent implements OnInit, OnDestroy {
  private readonly crawlerService = inject(CrawlerService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // --- Reactive state ---
  protected readonly items = signal<CrawlJob[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly drivers = signal<string[]>([]);

  // --- Action tracking ---
  protected readonly retryingIds = signal<Set<string>>(new Set());
  protected readonly cancellingIds = signal<Set<string>>(new Set());

  // --- Auto-refresh ---
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly POLL_INTERVAL = 10_000;

  // --- Filter form ---
  protected readonly searchForm = this.fb.group({
    status: [''],
    source_driver: [''],
    manga_name: [''],
  });

  // --- Status configuration ---
  readonly statusConfig: Record<string, { color: string; label: string }> = {
    pending:   { color: 'default',    label: 'Pending' },
    running:   { color: 'processing', label: 'Running' },
    completed: { color: 'success',    label: 'Completed' },
    failed:    { color: 'error',      label: 'Failed' },
    partial:   { color: 'warning',    label: 'Partial' },
    cancelled: { color: 'default',    label: 'Cancelled' },
  };

  readonly statusOptions: { label: string; value: string }[] = [
    { label: 'Pending',   value: 'pending' },
    { label: 'Running',   value: 'running' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed',    value: 'failed' },
    { label: 'Partial',   value: 'partial' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  ngOnInit(): void {
    this.loadDrivers();
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.clearPoll();
  }

  // --- Data loading ---

  private loadDrivers(): void {
    this.crawlerService.getDrivers().subscribe({
      next: (res) => this.drivers.set(res?.data ?? []),
      error: () => { /* non-critical, ignore */ },
    });
  }

  loadJobs(): void {
    this.loading.set(true);

    const f = this.searchForm.getRawValue();
    const params: CrawlJobListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
    };

    if (f.status) params['filter[status]'] = f.status;
    if (f.source_driver) params['filter[source_driver]'] = f.source_driver;
    if (f.manga_name) params['filter[manga_name]'] = f.manga_name;

    this.crawlerService.getJobs(params).subscribe({
      next: (res) => {
        this.items.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
        this.managePoll();
      },
      error: () => {
        this.items.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách crawl jobs');
        this.loading.set(false);
        this.clearPoll();
      },
    });
  }

  // --- Search & pagination ---

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadJobs();
  }

  onReset(): void {
    this.searchForm.reset({ status: '', source_driver: '', manga_name: '' });
    this.pageIndex.set(1);
    this.loadJobs();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadJobs();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadJobs();
  }

  // --- Actions ---

  onRetry(job: CrawlJob): void {
    this.addToSet(this.retryingIds, job.id);

    this.crawlerService.retryJob(job.id).subscribe({
      next: (res) => {
        this.message.success(`Job "${this.getMangaLabel(job)}" đã được retry`);
        this.removeFromSet(this.retryingIds, job.id);
        this.loadJobs();
      },
      error: () => {
        this.message.error('Retry thất bại');
        this.removeFromSet(this.retryingIds, job.id);
      },
    });
  }

  onCancel(job: CrawlJob): void {
    this.addToSet(this.cancellingIds, job.id);

    this.crawlerService.cancelJob(job.id).subscribe({
      next: () => {
        this.message.success(`Job "${this.getMangaLabel(job)}" đã được huỷ`);
        this.removeFromSet(this.cancellingIds, job.id);
        this.loadJobs();
      },
      error: () => {
        this.message.error('Huỷ job thất bại');
        this.removeFromSet(this.cancellingIds, job.id);
      },
    });
  }

  // --- Display helpers ---

  getMangaLabel(job: CrawlJob): string {
    if (job.manga_name) return job.manga_name;
    if (job.manga_url) {
      try {
        const url = new URL(job.manga_url);
        const path = url.pathname;
        return path.length > 30 ? '...' + path.slice(-27) : path;
      } catch {
        return job.manga_url.length > 30
          ? job.manga_url.slice(0, 27) + '...'
          : job.manga_url;
      }
    }
    return `Trang ${job.start_page ?? 1}-${job.end_page ?? '?'}`;
  }

  getMangaUrl(job: CrawlJob): string | null {
    return job.manga_url ?? null;
  }

  formatDuration(seconds: number | null): string {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isRetryable(status: CrawlJobStatus): boolean {
    return status === 'failed' || status === 'partial';
  }

  isCancellable(status: CrawlJobStatus): boolean {
    return status === 'running' || status === 'pending';
  }

  // --- Auto-refresh (poll) ---

  private hasActiveJobs(): boolean {
    return this.items().some((j) => j.status === 'running' || j.status === 'pending');
  }

  private managePoll(): void {
    if (this.hasActiveJobs()) {
      if (!this.pollTimer) {
        this.pollTimer = setInterval(() => this.loadJobs(), this.POLL_INTERVAL);
      }
    } else {
      this.clearPoll();
    }
  }

  private clearPoll(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // --- Set helpers ---

  private addToSet(sig: WritableSignal<Set<string>>, id: string): void {
    const s = new Set(sig());
    s.add(id);
    sig.set(s);
  }

  private removeFromSet(sig: WritableSignal<Set<string>>, id: string): void {
    const s = new Set(sig());
    s.delete(id);
    sig.set(s);
  }
}
