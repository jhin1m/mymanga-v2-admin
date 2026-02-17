# Phase 01: Artist Service + Models

## Context
- Parent: [plan.md](./plan.md)
- Reference: `src/app/core/services/members.service.ts` (pattern to follow)

## Parallelization Info
- **Group A** — chạy song song với Phase 02
- Không phụ thuộc phase nào khác
- Phase 02 import từ file này nhưng chỉ cần interface/service name, không cần runtime

## Overview
- Date: 2026-02-17
- Description: Tạo service gọi API artists + interfaces
- Priority: P2
- Implementation status: pending
- Review status: pending

## Key Insights
- API pattern giống members: `PaginatedResponse<T>`, `HttpParams`
- Reuse `PaginatedResponse<T>` & `PaginationInfo` từ members.service — NHƯNG nên move sang shared hoặc import trực tiếp
- Artist response có field: `id, name, slug, user_id, user?, created_at, updated_at`

## Requirements
1. Tạo `src/app/core/models/api-types.ts` — move `PaginatedResponse<T>`, `PaginationInfo` từ members.service
2. Refactor members.service imports từ api-types.ts
3. Interface `Artist` với fields từ API response
4. Interface `ArtistListParams` cho query params
5. Service với `getArtists()`, `createArtist()`, `updateArtist()`, `deleteArtist()`

## Architecture
```
src/app/core/models/api-types.ts    (shared pagination types)
src/app/core/services/artists.service.ts
  ├── Artist interface
  ├── ArtistListParams interface
  └── ArtistsService
       ├── getArtists(params) → Observable<PaginatedResponse<Artist>>
       ├── createArtist(name) → Observable<ApiResponse<Artist>>
       ├── updateArtist(id, name) → Observable<ApiResponse<Artist>>
       └── deleteArtist(id) → Observable<void>
```

## File Ownership
| File | Action |
|------|--------|
| `src/app/core/models/api-types.ts` | CREATE |
| `src/app/core/services/artists.service.ts` | CREATE |
| `src/app/core/services/members.service.ts` | MODIFY (import from api-types) |

## Implementation Steps

### Step 1: Tạo `artists.service.ts`
```typescript
// Interfaces
interface Artist {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };  // from include=user
  created_at: string;
  updated_at: string;
}

interface ArtistListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}
```

### Step 2: Tạo shared `api-types.ts`
- Move `PaginatedResponse<T>`, `PaginationInfo` từ members.service → `src/app/core/models/api-types.ts`
- Update members.service: import từ `../models/api-types`

### Step 3: Service methods
- `getArtists(params)` — GET `/api/admin/artists` với HttpParams
- `createArtist(name)` — POST `/api/admin/artists` body `{ name }`
- `updateArtist(id, name)` — PUT `/api/admin/artists/:id` body `{ name }`
- `deleteArtist(id)` — DELETE `/api/admin/artists/:id` (returns 204)

## Todo
- [ ] Tạo shared api-types.ts
- [ ] Refactor members.service imports
- [ ] Tạo Artist interface
- [ ] Tạo ArtistListParams interface
- [ ] Tạo ArtistsService với getArtists, createArtist, updateArtist, deleteArtist

## Success Criteria
- Shared types compile OK, members.service vẫn hoạt động
- getArtists trả về Observable<PaginatedResponse<Artist>>
- createArtist/updateArtist trả về Observable<ApiResponse<Artist>>
- deleteArtist trả về Observable<void>

## Conflict Prevention
- Chỉ tạo file mới `artists.service.ts` — không chạm file nào khác
- Import types từ members.service (read-only, không sửa)

## Risk Assessment
- Low risk — follow existing pattern 1:1

## Security Considerations
- HttpParams tự encode query string — an toàn XSS
