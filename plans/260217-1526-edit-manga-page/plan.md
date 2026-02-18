---
title: "Edit Manga Page Implementation"
description: "Complete CRUD interface for manga editing with chapters, genres, rich text, and file upload"
status: pending
priority: P1
effort: 8h
branch: main
tags: [manga, crud, edit-page, rich-text, file-upload, chapters]
created: 2026-02-17
---

# Edit Manga Page Implementation Plan

## Overview

Full-featured edit manga page with two-column layout, rich text editor for pilot content, cover image upload, genre checkboxes, related entity dropdowns (artist, group, doujinshi, user), embedded chapter list with CRUD operations, and bulk delete.

## Context

- **Existing**: MangaService with getMangas + deleteManga
- **Existing**: Artist, Doujinshi, Members services with list methods
- **Missing**: Group service, Chapter service, Genre list endpoint, getManga(id), updateManga(id)
- **Tech**: Angular 21 standalone, ng-zorro-antd 21.1.0, ReactiveFormsModule
- **Pattern**: signal() state, inject() DI, PaginationBarComponent reuse

## Phases

### Phase 1: Extend Services & Add Types (1.5h)
**Status**: pending
**Files**: `manga.service.ts`, `chapter.service.ts`, `group.service.ts`, `genre.service.ts`

- Add getManga(id), updateManga(id, FormData) to MangaService
- Create ChapterService (list, create, update, delete, deleteBulk)
- Create GroupService (list for dropdown)
- Create GenreService (list all genres)
- Define Chapter, Group, Genre interfaces in service files

### Phase 2: Create Edit Manga Component (2.5h)
**Status**: pending
**Files**: `pages/manga-edit/manga-edit.ts`, `manga-edit.html`, `manga-edit.less`

- Route: `/manga/edit/:id`
- Two-column layout (nz-row/nz-col): left form, right sidebar
- Top bar: last updated timestamp + Save button
- Left: name, name_alt, doujinshi, finished_by, genres checkboxes, pilot textarea (temp)
- Right: cover upload (nz-upload picture-card), status/artist/group/user dropdowns, is_hot switch
- Load manga on init via ActivatedRoute.params, patchValue form
- Submit: build FormData with cover file, call updateManga()

### Phase 3: Chapter List Section (2h)
**Status**: pending
**Files**: Same component extended

- Below main form: "Danh sách chương" card
- "+ Tạo mới" button opens create modal
- nz-table with columns: checkbox, Name (with date), edit/delete actions
- Bulk delete with selected checkboxes
- Pagination via PaginationBarComponent
- Create/Edit chapter modals (ReactiveForm with name, order fields)

### Phase 4: Rich Text Editor Integration (1.5h)
**Status**: pending
**Files**: `package.json`, component extended

- Install ngx-quill v29 (Angular 21 compatible)
- Configure QuillModule in component imports
- Replace pilot textarea with quill-editor
- Toolbar: bold, italic, underline, strike, blockquote, link, color, align
- Match screenshot toolbar layout

### Phase 5: Routes & Navigation (0.5h)
**Status**: pending
**Files**: `app.routes.ts`, `manga-list.html`

- Add `/manga/edit/:id` route under manga children
- Add edit button to manga-list grid cards (navigate to /manga/edit/:id)
- Test navigation flow from list → edit → save → back

## Success Criteria

- [x] All services return Observable with proper types
- [x] Form pre-populates with existing manga data
- [x] Cover upload preview works, multipart submit succeeds
- [x] Genres checkboxes reflect manga.genres, save correctly
- [x] Chapter list loads, CRUD works, bulk delete functional
- [x] Rich text editor matches screenshot toolbar
- [x] Save updates manga, shows success message, reflects changes

## Risks

- **Genre API**: No explicit endpoint in API docs — assume GET /api/admin/genres exists or use hardcoded list
- **Group API**: Likely exists as /api/admin/groups (mirror artist/doujinshi pattern)
- **File upload**: Ensure backend accepts multipart, field name = "cover"
- **Quill version**: v29 must support Angular 21 standalone

## Validation Summary

**Validated:** 2026-02-17
**Questions asked:** 6

### Confirmed Decisions
- **API Endpoints**: Genre (`/api/admin/genres`) và Group (`/api/admin/groups`) đều tồn tại trên backend — confirmed
- **Save behavior**: Ở lại trang edit sau khi save, reload data + hiển thị success message
- **Rich Text Editor**: Dùng ngx-quill (cài thêm package), toolbar đầy đủ theo screenshot
- **User dropdown**: Dùng `nzServerSearch` — gõ tìm mới gọi API thay vì load hết 1000 users
- **Genre checkbox layout**: 4 cột (nzSpan=6) cho checkbox grid

### Action Items
- [ ] Phase 2: Đổi user dropdown từ load-all sang nzServerSearch pattern (debounce search → API call)
- [ ] Phase 2: Đổi genre checkbox grid từ nzSpan=8 thành nzSpan=6 (4 cột)
- [ ] Risks: Remove Genre/Group API uncertainty — confirmed cả hai đều tồn tại

## Next Steps

After completion:
- Create manga page (inverse of edit)
- Chapter detail edit (images upload)
- Manga approval workflow
