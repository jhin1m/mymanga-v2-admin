import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UpperCasePipe } from '@angular/common';

import { CrawlerService } from '../../core/services/crawler.service';
import { CrawlJob, CrawlJobStatus, CreateCrawlPayload } from '../../core/models/crawler-types';
import { ApiResponse } from '../../core/services/auth.service';

/** Terminal statuses - polling should stop */
const TERMINAL_STATUSES: CrawlJobStatus[] = ['completed', 'failed', 'partial', 'cancelled'];

/** Tag color map for each job status */
const STATUS_COLOR_MAP: Record<CrawlJobStatus, string> = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  partial: 'warning',
  cancelled: 'default',
};

@Component({
  selector: 'app-crawler-crawl',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzRadioModule,
    NzButtonModule,
    NzCollapseModule,
    NzCheckboxModule,
    NzTagModule,
    NzSpinModule,
    NzAlertModule,
    NzDividerModule,
    NzIconModule,
    UpperCasePipe,
  ],
  templateUrl: './crawler-crawl.html',
  styleUrl: './crawler-crawl.less',
})
export class CrawlerCrawlComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly crawlerService = inject(CrawlerService);

  // --- State ---
  protected readonly submitting = signal(false);
  protected readonly driversLoading = signal(false);
  protected readonly drivers = signal<string[]>([]);
  protected readonly activeJob = signal<CrawlJob | null>(null);

  /** Expose color map to template */
  protected readonly statusColorMap = STATUS_COLOR_MAP;

  /** Storage type options */
  protected readonly storageOptions = [
    { label: 'Amazon S3', value: 's3' },
    { label: 'Public (local)', value: 'public' },
    { label: 'Hotlink (no download)', value: 'hotlink' },
  ];

  /** Polling interval handle */
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  // --- Form ---
  protected readonly form = this.fb.group({
    mode: ['url' as 'url' | 'page', Validators.required],
    source_driver: ['', Validators.required],
    manga_url: [''],
    start_page: [1],
    end_page: [10],
    storage_type: ['s3' as 's3' | 'public' | 'hotlink', Validators.required],
    // Image options
    resize: [true],
    resize_width: [900],
    compress: [true],
    compress_quality: [90],
    watermark: [true],
    credit: [true],
    // Proxy
    use_proxies: [false],
  });

  // --- Lifecycle ---

  ngOnInit(): void {
    this.loadDrivers();
    this.watchModeChanges();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // --- Data loading ---

  private loadDrivers(): void {
    this.driversLoading.set(true);
    this.crawlerService.getDrivers().subscribe({
      next: (res: ApiResponse<string[]>) => {
        this.drivers.set(res.data ?? []);
        this.driversLoading.set(false);
      },
      error: () => {
        this.message.error('Failed to load crawler drivers');
        this.driversLoading.set(false);
      },
    });
  }

  /** Update validators when mode changes */
  private watchModeChanges(): void {
    this.form.get('mode')!.valueChanges.subscribe((mode) => {
      const urlCtrl = this.form.get('manga_url')!;
      if (mode === 'url') {
        urlCtrl.setValidators([Validators.required]);
      } else {
        urlCtrl.clearValidators();
      }
      urlCtrl.updateValueAndValidity();
    });

    // Trigger initial validator setup
    this.form.get('mode')!.setValue('url');
  }

  // --- Getters for template ---

  get currentMode(): string {
    return this.form.get('mode')!.value ?? 'url';
  }

  // --- Submit ---

  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        ctrl.markAsDirty();
        ctrl.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);
    const payload = this.buildPayload();

    this.crawlerService.crawl(payload).subscribe({
      next: (res: ApiResponse<CrawlJob>) => {
        this.submitting.set(false);
        if (res.data) {
          this.message.success('Crawl job started');
          this.activeJob.set(res.data);
          this.startPolling(res.data.id);
        }
      },
      error: (err: any) => {
        this.submitting.set(false);
        const msg = err?.error?.message ?? 'Failed to start crawl job';
        this.message.error(msg);
      },
    });
  }

  private buildPayload(): CreateCrawlPayload {
    const v = this.form.getRawValue();
    const payload: CreateCrawlPayload = {
      source_driver: v.source_driver!,
      mode: v.mode as 'url' | 'page',
      storage_type: v.storage_type as 's3' | 'public' | 'hotlink',
      use_proxies: v.use_proxies ?? false,
      options: {
        resize: v.resize ?? true,
        resize_width: v.resize_width ?? 900,
        compress: v.compress ?? true,
        compress_quality: v.compress_quality ?? 90,
        watermark: v.watermark ?? true,
        credit: v.credit ?? true,
      },
    };

    if (v.mode === 'url') {
      payload.manga_url = v.manga_url ?? '';
    } else {
      payload.start_page = v.start_page ?? 1;
      payload.end_page = v.end_page ?? 10;
    }

    return payload;
  }

  // --- Polling ---

  private startPolling(jobId: string): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      this.crawlerService.getJob(jobId).subscribe({
        next: (res: ApiResponse<CrawlJob>) => {
          if (res.data) {
            this.activeJob.set(res.data);
            if (TERMINAL_STATUSES.includes(res.data.status)) {
              this.stopPolling();
              const statusMsg: Record<CrawlJobStatus, string> = {
                completed: 'Crawl completed successfully',
                failed: 'Crawl job failed',
                partial: 'Crawl completed with partial results',
                cancelled: 'Crawl job was cancelled',
                pending: '',
                running: '',
              };
              const msg = statusMsg[res.data.status];
              if (msg) {
                if (res.data.status === 'completed') {
                  this.message.success(msg);
                } else if (res.data.status === 'failed') {
                  this.message.error(msg);
                } else {
                  this.message.warning(msg);
                }
              }
            }
          }
        },
        error: () => {
          // Silent: keep polling on transient errors
        },
      });
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // --- Helpers ---

  protected formatDuration(seconds: number | null): string {
    if (seconds === null) return '—';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
}
