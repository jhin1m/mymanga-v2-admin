import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { CrawlerService } from '../../core/services/crawler.service';
import { Proxy, ProxyStats, ProxyListParams } from '../../core/models/crawler-types';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-crawler-proxy',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzStatisticModule,
    NzGridModule,
    PaginationBarComponent,
  ],
  templateUrl: './crawler-proxy.html',
  styleUrl: './crawler-proxy.less',
})
export class CrawlerProxyComponent implements OnInit {
  private readonly crawlerService = inject(CrawlerService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // --- List state ---
  protected readonly proxies = signal<Proxy[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  // --- Stats ---
  protected readonly stats = signal<ProxyStats>({ active: 0, inactive: 0, dead: 0, total: 0 });

  // --- Filter form ---
  protected readonly filterForm = this.fb.group({
    type: [''],
    is_active: [null as number | null],
  });

  // --- Add proxy inline form ---
  protected readonly showAddForm = signal(false);
  protected readonly addForm = this.fb.group({
    address: ['', Validators.required],
    type: ['http'],
    username: [''],
    password: [''],
  });
  protected readonly addLoading = signal(false);

  // --- Import inline form ---
  protected readonly showImportForm = signal(false);
  protected readonly importForm = this.fb.group({
    text: ['', Validators.required],
    type: ['http'],
  });
  protected readonly importLoading = signal(false);

  // --- Per-row test state: Set of proxy IDs currently being tested ---
  protected readonly testingIds = signal<Set<number>>(new Set());

  // --- Bulk actions ---
  protected readonly testAllLoading = signal(false);
  protected readonly removeDeadLoading = signal(false);

  /** Proxy type options */
  protected readonly proxyTypes = [
    { label: 'HTTP', value: 'http' },
    { label: 'SOCKS4', value: 'socks4' },
    { label: 'SOCKS5', value: 'socks5' },
  ];

  /** Active filter options */
  protected readonly activeOptions = [
    { label: 'Active', value: 1 },
    { label: 'Inactive', value: 0 },
  ];

  ngOnInit(): void {
    this.loadProxies();
  }

  loadProxies(): void {
    this.loading.set(true);

    const fv = this.filterForm.getRawValue();
    const params: ProxyListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
    };

    if (fv.type) params['filter[type]'] = fv.type;
    if (fv.is_active !== null && fv.is_active !== undefined) {
      params['filter[is_active]'] = fv.is_active;
    }

    this.crawlerService.getProxies(params).subscribe({
      next: (res) => {
        this.proxies.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        if (res?.stats) {
          this.stats.set(res.stats);
        }
        this.loading.set(false);
      },
      error: () => {
        this.proxies.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách proxy');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadProxies();
  }

  onReset(): void {
    this.filterForm.reset({ type: '', is_active: null });
    this.pageIndex.set(1);
    this.loadProxies();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadProxies();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadProxies();
  }

  // --- Add Proxy ---

  onToggleAddForm(): void {
    this.showAddForm.update((v) => !v);
    if (!this.showAddForm()) {
      this.addForm.reset({ type: 'http' });
    }
    // Close import form if open
    if (this.showAddForm() && this.showImportForm()) {
      this.showImportForm.set(false);
      this.importForm.reset({ type: 'http' });
    }
  }

  onAddProxy(): void {
    if (this.addForm.invalid) {
      Object.values(this.addForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.addLoading.set(true);
    const fv = this.addForm.getRawValue();

    this.crawlerService.createProxy({
      address: fv.address ?? '',
      type: fv.type as any,
      username: fv.username || undefined,
      password: fv.password || undefined,
    }).subscribe({
      next: () => {
        this.message.success('Đã thêm proxy thành công');
        this.addForm.reset({ type: 'http' });
        this.showAddForm.set(false);
        this.addLoading.set(false);
        this.pageIndex.set(1);
        this.loadProxies();
      },
      error: () => {
        this.message.error('Thêm proxy thất bại');
        this.addLoading.set(false);
      },
    });
  }

  // --- Import Proxies ---

  onToggleImportForm(): void {
    this.showImportForm.update((v) => !v);
    if (!this.showImportForm()) {
      this.importForm.reset({ type: 'http' });
    }
    // Close add form if open
    if (this.showImportForm() && this.showAddForm()) {
      this.showAddForm.set(false);
      this.addForm.reset({ type: 'http' });
    }
  }

  onImportProxies(): void {
    if (this.importForm.invalid) {
      Object.values(this.importForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.importLoading.set(true);
    const fv = this.importForm.getRawValue();

    this.crawlerService.importProxies({
      text: fv.text ?? '',
      type: fv.type ?? 'http',
    }).subscribe({
      next: (res) => {
        const count = res?.data?.imported ?? 0;
        this.message.success(`Đã import ${count} proxy`);
        this.importForm.reset({ type: 'http' });
        this.showImportForm.set(false);
        this.importLoading.set(false);
        this.pageIndex.set(1);
        this.loadProxies();
      },
      error: () => {
        this.message.error('Import proxy thất bại');
        this.importLoading.set(false);
      },
    });
  }

  // --- Test single proxy ---

  isTestingProxy(id: number): boolean {
    return this.testingIds().has(id);
  }

  onTestProxy(proxy: Proxy): void {
    // Add ID to testing set (immutable update)
    this.testingIds.update((s) => {
      const next = new Set(s);
      next.add(proxy.id);
      return next;
    });

    this.crawlerService.testProxies({ proxy_ids: [proxy.id] }).subscribe({
      next: (res) => {
        const result = res?.data?.[0];
        if (result?.success) {
          this.message.success(`Proxy ${proxy.address} — OK (${result.response_time_ms ?? '?'}ms)`);
        } else {
          this.message.warning(`Proxy ${proxy.address} — Thất bại`);
        }
        this.removeTestingId(proxy.id);
        this.loadProxies();
      },
      error: () => {
        this.message.error(`Test proxy ${proxy.address} thất bại`);
        this.removeTestingId(proxy.id);
      },
    });
  }

  private removeTestingId(id: number): void {
    this.testingIds.update((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  // --- Test All ---

  onTestAll(): void {
    this.testAllLoading.set(true);

    this.crawlerService.testProxies({}).subscribe({
      next: (res) => {
        const results = res?.data ?? [];
        const ok = results.filter((r) => r.success).length;
        this.message.success(`Test xong: ${ok}/${results.length} proxy hoạt động`);
        this.testAllLoading.set(false);
        this.loadProxies();
      },
      error: () => {
        this.message.error('Test all proxy thất bại');
        this.testAllLoading.set(false);
      },
    });
  }

  // --- Remove Dead ---

  onRemoveDead(): void {
    this.removeDeadLoading.set(true);

    this.crawlerService.removeDeadProxies().subscribe({
      next: (res) => {
        const count = res?.data?.removed ?? 0;
        this.message.success(`Đã xóa ${count} proxy dead`);
        this.removeDeadLoading.set(false);
        this.pageIndex.set(1);
        this.loadProxies();
      },
      error: () => {
        this.message.error('Xóa proxy dead thất bại');
        this.removeDeadLoading.set(false);
      },
    });
  }

  // --- Delete ---

  onDeleteProxy(proxy: Proxy): void {
    this.crawlerService.deleteProxy(proxy.id).subscribe({
      next: () => {
        this.message.success(`Đã xóa proxy ${proxy.address}`);
        this.loadProxies();
      },
      error: () => this.message.error('Xóa proxy thất bại'),
    });
  }
}
