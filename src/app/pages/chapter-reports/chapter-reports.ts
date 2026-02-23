import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

import {
  ChapterReport,
  ChapterReportListParams,
  ChapterReportService,
  ChapterReportStatistics,
  REPORT_TYPES,
  REPORT_TYPE_COLORS,
  ReportType,
} from '../../core/services/chapter-report.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-chapter-reports',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzTableModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzPopconfirmModule,
    NzTagModule,
    NzStatisticModule,
    NzTooltipModule,
    PaginationBarComponent,
  ],
  templateUrl: './chapter-reports.html',
  styleUrl: './chapter-reports.less',
})
export class ChapterReportsComponent implements OnInit {
  private readonly reportService = inject(ChapterReportService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // --- State signals ---
  protected readonly reports = signal<ChapterReport[]>([]);
  protected readonly statistics = signal<ChapterReportStatistics | null>(null);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  // Checkbox selection — Set giúp tra cứu nhanh O(1)
  protected readonly checkedIds = signal<Set<string>>(new Set());
  protected readonly allChecked = signal(false);

  // computed: có item nào được chọn không? Dùng để enable/disable nút bulk delete
  protected readonly hasChecked = computed(() => this.checkedIds().size > 0);

  // --- Constants cho template ---
  protected readonly reportTypes = REPORT_TYPES;
  protected readonly reportTypeColors = REPORT_TYPE_COLORS;
  protected readonly reportTypeOptions = Object.entries(REPORT_TYPES).map(([value, label]) => ({
    value,
    label,
  }));

  // --- Search form ---
  protected readonly searchForm = this.fb.group({
    report_type: [''],
  });

  ngOnInit(): void {
    this.loadReports();
    this.loadStatistics();
  }

  // --- Data loading ---

  loadReports(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: ChapterReportListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user,chapter,manga',
    };
    if (formValue.report_type) params['filter[report_type]'] = formValue.report_type;

    this.reportService.getReports(params).subscribe({
      next: (res) => {
        this.reports.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
        // Clear selection khi data thay đổi
        this.checkedIds.set(new Set());
        this.allChecked.set(false);
      },
      error: () => {
        this.reports.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách báo cáo');
        this.loading.set(false);
      },
    });
  }

  loadStatistics(): void {
    this.reportService.getStatistics().subscribe({
      next: (res) => this.statistics.set(res?.data ?? null),
      error: () => {}, // Statistics lỗi không cần block UI
    });
  }

  // --- Search & Pagination ---

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadReports();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadReports();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadReports();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadReports();
  }

  // --- Checkbox selection ---

  onItemChecked(id: string, checked: boolean): void {
    const set = new Set(this.checkedIds());
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
    this.checkedIds.set(set);
    // Cập nhật allChecked dựa trên số item đang hiển thị
    this.allChecked.set(set.size === this.reports().length && this.reports().length > 0);
  }

  onAllChecked(checked: boolean): void {
    const set = new Set<string>();
    if (checked) {
      this.reports().forEach((r) => set.add(r.id));
    }
    this.checkedIds.set(set);
    this.allChecked.set(checked);
  }

  // --- Delete actions ---

  onDeleteReport(report: ChapterReport): void {
    this.reportService.deleteReport(report.id).subscribe({
      next: () => {
        this.message.success('Đã xóa báo cáo');
        this.loadReports();
        this.loadStatistics();
      },
      error: () => this.message.error('Xóa báo cáo thất bại'),
    });
  }

  onBulkDelete(): void {
    const ids = Array.from(this.checkedIds());
    if (ids.length === 0) return;

    this.reportService.bulkDelete(ids).subscribe({
      next: (res) => {
        this.message.success(`Đã xóa ${res.data.deleted_count} báo cáo`);
        this.loadReports();
        this.loadStatistics();
      },
      error: () => this.message.error('Xóa hàng loạt thất bại'),
    });
  }

  // --- Helpers ---

  getReportTypeColor(type: string): string {
    return REPORT_TYPE_COLORS[type as ReportType] ?? 'default';
  }

  getReportTypeLabel(type: string): string {
    return REPORT_TYPES[type as ReportType] ?? type;
  }
}
