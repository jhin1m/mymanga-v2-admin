# Phase 02 — Comments Component & Route

> Parent: [plan.md](./plan.md) | Depends on: [Phase 01](./phase-01-comments-service.md)

## Overview

- **Date**: 2026-02-20
- **Priority**: P2
- **Status**: completed
- **Review**: completed

Tạo standalone component cho trang quản lý bình luận + đăng ký route.

## Key Insights

- Theo pattern `genres` page — filter card + table card
- Không cần create/edit modal — chỉ list + delete
- Avatar dùng `nz-avatar` với fallback icon "user"
- Nội dung comment có thể dài → truncate hoặc ellipsis

## Requirements

1. **Filter Card**: Input tìm theo username (`filter[username]`)
2. **Table columns**: Avatar | Tạo bởi | Nội dung | Tạo lúc | Hành động
3. **Delete action**: Popconfirm → call `deleteComment()`
4. **Pagination**: `PaginationBarComponent` top + bottom
5. **Route**: `/comments` lazy-loaded

## Related Code Files

- Pattern: `src/app/pages/genres/genres.ts`, `genres.html`, `genres.less`
- Shared: `src/app/shared/pagination-bar/pagination-bar.ts`
- Routes: `src/app/app.routes.ts`
- Menu: already configured at `src/app/core/startup/startup.service.ts` (link: `/comments`)

## Architecture

```
CommentsComponent (standalone)
├── searchForm (FormBuilder) — username filter
├── signals: comments[], loading, total, pageIndex, pageSize
├── loadComments() — calls CommentsService.getComments()
├── onSearch(), onReset() — filter controls
├── onPageChange(), onPageSizeChange() — pagination
└── onDeleteComment() — popconfirm → delete
```

## Implementation Steps

### Step 1: Create `comments.ts`

```typescript
@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe,
    NzCardModule, NzTableModule, NzFormModule, NzInputModule,
    NzButtonModule, NzGridModule, NzIconModule,
    NzPopconfirmModule, NzAvatarModule, NzToolTipModule,
    PaginationBarComponent,
  ],
  templateUrl: './comments.html',
  styleUrl: './comments.less',
})
export class CommentsComponent implements OnInit {
  // signals: comments, loading, total, pageIndex, pageSize
  // searchForm with 'username' field
  // loadComments(): include=user, sort=-created_at, filter[username]
  // onDeleteComment(comment): popconfirm → deleteComment → reload
}
```

### Step 2: Create `comments.html`

Structure:
```html
<!-- Search Card -->
<nz-card nzTitle="Tìm kiếm Bình luận" [nzExtra]="searchExtra">
  <!-- username input -->
</nz-card>

<!-- Table Card -->
<nz-card class="table-card">
  <app-pagination-bar ... position="top" />
  <nz-table>
    <thead>
      <tr>
        <th nzWidth="60px">Avatar</th>
        <th nzWidth="150px">Tạo bởi</th>
        <th>Nội dung</th>
        <th nzWidth="160px">Tạo lúc</th>
        <th nzWidth="100px" nzRight>Hành động</th>
      </tr>
    </thead>
    <tbody>
      <!-- nz-avatar for avatar, truncated content, date pipe, delete button -->
    </tbody>
  </nz-table>
  <app-pagination-bar ... position="bottom" />
</nz-card>
```

### Step 3: Create `comments.less`

Copy from `genres.less`, add:
```less
.comment-content {
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Step 4: Register route in `app.routes.ts`

```typescript
{
  path: 'comments',
  loadComponent: () => import('./pages/comments/comments').then(m => m.CommentsComponent),
},
```

Add after `pets` route, before manga children routes.

## Todo

- [x] Create `src/app/pages/comments/comments.ts`
- [x] Create `src/app/pages/comments/comments.html`
- [x] Create `src/app/pages/comments/comments.less`
- [x] Add route to `src/app/app.routes.ts`
- [x] Verify menu link works (already in startup.service.ts)

## Success Criteria

- Page loads at `/comments` without errors
- Search by username filters results
- Table shows avatar, username, content, date, delete button
- Delete with popconfirm works
- Pagination works (top + bottom)
- Follows same visual style as genres page

## Risk Assessment

- **Low**: Standard list page, well-established pattern
- **Minor**: Comment content may contain HTML — display as plain text

## Security Considerations

- Sanitize comment content display (use text interpolation `{{ }}`, not `[innerHTML]`)
- Popconfirm before delete prevents accidental deletion

## Next Steps

→ Implementation complete after this phase
