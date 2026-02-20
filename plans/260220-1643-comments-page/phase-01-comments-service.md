# Phase 01 — Comments Service

> Parent: [plan.md](./plan.md)

## Overview

- **Date**: 2026-02-20
- **Priority**: P2
- **Status**: completed
- **Review**: completed

Tạo Angular service để giao tiếp với Comments API.

## Key Insights

- API trả về standard `PaginatedResponse<Comment>` — tái sử dụng interface có sẵn
- Chỉ cần 2 methods: `getComments()` (list) và `deleteComment()` (remove)
- Luôn include `user` relationship để lấy avatar + username

## Requirements

1. `Comment` interface matching API response shape
2. `CommentListParams` interface cho query params
3. `CommentsService` injectable service

## Related Code Files

- Pattern reference: `src/app/core/services/genres.service.ts`
- Shared types: `src/app/core/models/api-types.ts` (`PaginatedResponse`, `ApiResponse`)
- Auth types: `src/app/core/services/auth.service.ts` (`ApiResponse`)

## Implementation Steps

### Step 1: Define interfaces

```typescript
export interface Comment {
  id: string;
  content: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    avatar_full_url?: string;
  };
  commentable_type?: string;
  commentable_id?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CommentListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[username]'?: string;
}
```

### Step 2: Create CommentsService

```typescript
@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/comments`;

  getComments(params: CommentListParams): Observable<PaginatedResponse<Comment>> {
    // Build HttpParams from params object, skip empty values
    // Same pattern as GenresService.getGenres()
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

## Todo

- [x] Create `src/app/core/services/comments.service.ts`
- [x] Define `Comment` interface
- [x] Define `CommentListParams` interface
- [x] Implement `getComments()` with HttpParams
- [x] Implement `deleteComment()`

## Success Criteria

- Service compiles without errors
- Follows same pattern as `genres.service.ts`
- Interfaces match API response shape from docs

## Risk Assessment

- **Low**: Standard CRUD service, well-established pattern

## Next Steps

→ Phase 02: Comments Component & Route
