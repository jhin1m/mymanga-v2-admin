import { Component, input, output } from '@angular/core';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

/**
 * Shared pagination bar — hiển thị tổng số + nz-pagination.
 * Dùng chung cho mọi trang danh sách (members, manga, etc.)
 *
 * Cách dùng:
 *   <app-pagination-bar
 *     [total]="total()"
 *     [pageIndex]="pageIndex()"
 *     [pageSize]="pageSize()"
 *     totalLabel="truyện"
 *     (pageIndexChange)="onPageChange($event)"
 *     (pageSizeChange)="onPageSizeChange($event)"
 *   />
 */
@Component({
  selector: 'app-pagination-bar',
  standalone: true,
  imports: [NzPaginationModule],
  template: `
    <div class="pagination-bar" [class.bottom]="position() === 'bottom'">
      <!-- Chỉ hiện total text ở vị trí top -->
      @if (position() === 'top') {
        <span class="total-text">
          Tổng <strong>{{ total() }}</strong> {{ totalLabel() }}
        </span>
      }
      <nz-pagination
        [nzPageIndex]="pageIndex()"
        [nzPageSize]="pageSize()"
        [nzTotal]="total()"
        [nzShowSizeChanger]="true"
        [nzPageSizeOptions]="pageSizeOptions()"
        nzSize="small"
        (nzPageIndexChange)="pageIndexChange.emit($event)"
        (nzPageSizeChange)="pageSizeChange.emit($event)"
      />
    </div>
  `,
  styles: `
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      &.bottom {
        margin-bottom: 0;
        margin-top: 16px;
        justify-content: flex-end;
      }
    }

    .total-text {
      opacity: 0.65;
      font-size: 13px;
    }
  `,
})
export class PaginationBarComponent {
  // input() — Angular signals-based inputs (Angular 17+)
  readonly total = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalLabel = input<string>('mục'); // "Tổng X mục"
  readonly position = input<'top' | 'bottom'>('top');
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);

  // output() — thay thế @Output() EventEmitter
  readonly pageIndexChange = output<number>();
  readonly pageSizeChange = output<number>();
}
