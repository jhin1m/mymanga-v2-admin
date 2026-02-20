import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMessageService } from 'ng-zorro-antd/message';

import { Comment, CommentListParams, CommentsService } from '../../core/services/comments.service';
import { PaginationBarComponent } from '../../shared/pagination-bar/pagination-bar';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    NzCardModule,
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    NzPopconfirmModule,
    NzAvatarModule,
    PaginationBarComponent,
  ],
  templateUrl: './comments.html',
  styleUrl: './comments.less',
})
export class CommentsComponent implements OnInit {
  private readonly commentsService = inject(CommentsService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  protected readonly comments = signal<Comment[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    username: [''],
  });

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    this.loading.set(true);
    const formValue = this.searchForm.getRawValue();
    const params: CommentListParams = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort: '-created_at',
      include: 'user',
    };
    if (formValue.username) params['filter[username]'] = formValue.username;

    this.commentsService.getComments(params).subscribe({
      next: (res) => {
        this.comments.set(res?.data ?? []);
        this.total.set(res?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.comments.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách bình luận');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.pageIndex.set(1);
    this.loadComments();
  }

  onReset(): void {
    this.searchForm.reset();
    this.pageIndex.set(1);
    this.loadComments();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.loadComments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadComments();
  }

  onDeleteComment(comment: Comment): void {
    this.commentsService.deleteComment(comment.id).subscribe({
      next: () => {
        this.message.success('Đã xóa bình luận');
        this.loadComments();
      },
      error: () => this.message.error('Xóa bình luận thất bại'),
    });
  }
}
