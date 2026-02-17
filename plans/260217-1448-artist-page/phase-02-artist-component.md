# Phase 02: Artist Component + Route

## Context
- Parent: [plan.md](./plan.md)
- Reference: `src/app/pages/members/` (pattern to follow)
- Depends on: Phase 01 types (compile-time only)

## Parallelization Info
- **Group A** — chạy song song với Phase 01
- Import types từ Phase 01 file — chỉ cần tên, không cần runtime dependency

## Overview
- Date: 2026-02-17
- Description: Tạo component hiển thị danh sách Artist với filter, pagination, và nút tạo mới
- Priority: P2
- Implementation status: pending
- Review status: pending

## Key Insights
- Copy pattern từ Members nhưng lược bỏ: role filter, email filter, ID filter, ban/delete actions
- Thêm: button "Tạo mới" → modal hoặc inline input
- Filter chỉ có `name`
- Table columns: Name, Slug, User (from include), Created at
- Dùng NzModal để tạo artist mới (input name → POST)

## Requirements
1. Component `ArtistsComponent` standalone
2. Search form: chỉ field `name`
3. Button "Tạo mới" mở NzModal nhập tên
4. Table: Name, Slug, Người tạo (user.name), Ngày tạo, Hành động
5. Actions column: Edit (mở modal sửa name) + Delete (popconfirm → DELETE API 204)
6. Pagination (reuse `PaginationBarComponent`)
7. Route `/artists` trong app.routes.ts

## Architecture
```
src/app/pages/artists/
  ├── artists.ts        (component logic)
  ├── artists.html      (template)
  └── artists.less      (styles)

src/app/app.routes.ts   (add /artists route)
```

## File Ownership
| File | Action |
|------|--------|
| `src/app/pages/artists/artists.ts` | CREATE |
| `src/app/pages/artists/artists.html` | CREATE |
| `src/app/pages/artists/artists.less` | CREATE |
| `src/app/app.routes.ts` | MODIFY (add route) |

## Implementation Steps

### Step 1: Component class (`artists.ts`)
- Signals: `artists`, `loading`, `total`, `pageIndex`, `pageSize`
- Search form: chỉ `name` field
- Methods: `loadArtists()`, `onSearch()`, `onReset()`, `onPageChange()`, `onPageSizeChange()`
- `onCreateArtist()` — NzModal input tên → POST
- `onEditArtist(artist)` — NzModal input tên (prefill) → PUT
- `onDeleteArtist(artist)` — popconfirm → DELETE (204)

### Step 2: Template (`artists.html`)
```
Search card:
  - Input: name
  - Buttons: Reset, Tìm kiếm
  - Extra: Button "Tạo mới" (primary)

Table card:
  - Pagination top
  - Table: Name | Slug | Người tạo | Ngày tạo | Hành động (Edit, Delete)
  - Pagination bottom
```

### Step 3: Styles (`artists.less`)
- Copy pattern từ members.less, bỏ member-specific styles

### Step 4: Route
- Thêm `{ path: 'artists', loadComponent: ... }` vào app.routes.ts children

## Todo
- [ ] Tạo artists.ts component
- [ ] Tạo artists.html template
- [ ] Tạo artists.less styles
- [ ] Thêm route /artists vào app.routes.ts
- [ ] Modal create/edit artist (NzModal)
- [ ] Delete artist với popconfirm

## Success Criteria
- Navigate to `/artists` hiển thị danh sách
- Filter by name hoạt động
- Pagination hoạt động
- "Tạo mới" mở modal, submit POST, reload list
- "Edit" mở modal prefill name, submit PUT, reload list
- "Delete" popconfirm → DELETE 204 → reload list

## Conflict Prevention
- Chỉ sửa `app.routes.ts` (thêm 1 route entry) — không chạm file khác
- Tạo 3 file mới trong `pages/artists/`

## Risk Assessment
- Low — follow proven pattern từ members page
- NzModal cần thêm import `NzModalModule` hoặc `NzModalService`

## Security Considerations
- Validate input name trước khi POST (không empty)
- Sanitize display data trong template (Angular tự handle)
