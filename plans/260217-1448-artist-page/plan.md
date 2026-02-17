---
title: "Artist Management Page"
description: "Tạo trang quản lý Artist với list, filter by name, và create mới"
status: pending
priority: P2
effort: 1.5h
branch: main
tags: [artist, crud, admin-page]
created: 2026-02-17
---

# Artist Management Page

## Mô tả

Tạo trang `/artists` quản lý Artist. Logic & UI tương tự trang Members nhưng đơn giản hơn:
- Filter chỉ theo `name`
- Có button "Tạo mới" Artist (POST API)
- Table hiển thị: name, slug, user (từ include), created_at

## API

| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/admin/artists?page=1&per_page=50&sort=-created_at&include=user` | List + filter |
| POST | `/api/admin/artists` | Tạo mới `{ name }` |

## Dependency Graph

```
Phase 01: Service + Models ──┐
                              ├──> (no further phases)
Phase 02: Component + Route ──┘
```

**Execution strategy:** Phase 1 & 2 chạy song song — không overlap file.

## File Ownership Matrix

| File | Phase |
|------|-------|
| `src/app/core/models/api-types.ts` | Phase 01 |
| `src/app/core/services/artists.service.ts` | Phase 01 |
| `src/app/core/services/members.service.ts` | Phase 01 (refactor imports) |
| `src/app/pages/artists/artists.ts` | Phase 02 |
| `src/app/pages/artists/artists.html` | Phase 02 |
| `src/app/pages/artists/artists.less` | Phase 02 |
| `src/app/app.routes.ts` | Phase 02 |

## Phases

| # | Phase | Status | Parallel Group | File |
|---|-------|--------|----------------|------|
| 01 | [Service + Models](./phase-01-artist-service.md) | pending | A | phase-01 |
| 02 | [Component + Route](./phase-02-artist-component.md) | pending | A | phase-02 |

## API

| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/admin/artists?page=1&per_page=50&sort=-created_at&include=user` | List + filter |
| POST | `/api/admin/artists` | Tạo mới `{ name }` |
| PUT | `/api/admin/artists/:id` | Sửa `{ name }` |
| DELETE | `/api/admin/artists/:id` | Xóa (204 No Content) |

## Notes
- Tạo shared `api-types.ts` cho `PaginatedResponse<T>`, `PaginationInfo`
- Reuse `PaginationBarComponent` shared component
- Menu item "Artist" đã có sẵn trong `startup.service.ts` (link `/artists`)
- NzModal cho create/edit dialog
- Full CRUD: list, create, edit, delete

## Validation Summary

**Validated:** 2026-02-17
**Questions asked:** 3

### Confirmed Decisions
- **Shared types**: Tạo `api-types.ts` trong shared — move `PaginatedResponse<T>` & `PaginationInfo` ra khỏi members.service
- **Create UI**: NzModal dialog (popup input name)
- **Actions**: Full CRUD — Edit (PUT) + Delete (DELETE 204) + Create (POST)

### Action Items
- [ ] Update Phase 01: thêm `updateArtist()` + `deleteArtist()` methods, tạo shared api-types.ts
- [ ] Update Phase 02: thêm cột actions (edit/delete), edit modal reuse create modal
- [ ] Thêm file `src/app/core/models/api-types.ts` vào file ownership matrix
