# Planner Report: Edit Manga Page Implementation

**Date**: 2026-02-17 15:30
**Plan**: plans/260217-1526-edit-manga-page/
**Effort**: 8h total

## Summary

Created comprehensive 5-phase plan for Edit Manga Page with full CRUD functionality, rich text editor, file upload, chapter management, and navigation.

## Deliverables

### Plan Structure
```
plans/260217-1526-edit-manga-page/
├── plan.md (overview, 80 lines)
├── phase-01-extend-services.md (services + types)
├── phase-02-edit-manga-component.md (main form)
├── phase-03-chapter-list-section.md (embedded table + CRUD)
├── phase-04-rich-text-editor.md (Quill integration)
└── phase-05-routes-navigation.md (routing + links)
```

### Phase Breakdown

**Phase 1** (1.5h): Extend Services
- Add getManga(id), updateManga(id, FormData) to MangaService
- Create ChapterService (list, create, update, delete, bulk delete)
- Create GroupService (list for dropdown)
- Create GenreService (list all genres)

**Phase 2** (2.5h): Edit Component
- Route: `/manga/edit/:id`
- Two-column layout: left form (name, genres, pilot), right sidebar (cover, metadata)
- Top bar: timestamp + Save button
- Dropdowns: artist, doujinshi, group, user
- Cover upload: nz-upload picture-card
- FormData construction for multipart submit

**Phase 3** (2h): Chapter List
- Embedded table below form
- Columns: checkbox, name+date, actions
- "+ Tạo mới" button → modal
- Edit/delete actions per row
- Bulk delete with checkboxes
- Pagination via PaginationBarComponent

**Phase 4** (1.5h): Rich Text Editor
- Install ngx-quill v29 + quill v2
- Replace pilot textarea with quill-editor
- Toolbar: bold, italic, underline, strike, quote, link, color, align
- Import Quill CSS, configure modules

**Phase 5** (0.5h): Routes & Navigation
- Add edit route to app.routes.ts
- Edit button on manga-list cards
- Optional back button in edit page
- Test full navigation flow

## Key Decisions

**Services Pattern**: Mirror existing artists/doujinshis pattern — HttpClient, HttpParams, inject(), PaginatedResponse<T>

**Form Approach**: ReactiveFormsModule with FormBuilder, signal() state, patchValue pre-population

**File Upload**: Manual control with beforeUpload=false, build FormData on submit

**Chapter Management**: Embedded in same component (not separate route), modal for create/edit

**Rich Text**: ngx-quill v29 (Angular 21 compatible), Quill v2, toolbar matches screenshot

## Technical Highlights

- **Standalone components**: All imports in component decorator
- **Signal-based state**: Reactive data flow with signal(), computed() if needed
- **Type safety**: Interfaces for all API responses (Manga, Chapter, Group, Genre)
- **Reusable patterns**: PaginationBarComponent, NzMessageService, FormData construction
- **Two-column layout**: nz-row/nz-col for responsive desktop layout

## Risks Identified

1. **Genre API assumption**: No explicit endpoint in docs — plan assumes `/api/admin/genres` exists (mirror artist/doujinshi)
2. **Group API assumption**: Likely exists as `/api/admin/groups` (same pattern)
3. **Quill v29 compatibility**: Version is new, may have bugs — fallback to v28 if needed
4. **File upload field name**: Plan assumes backend expects `cover` field — verify with backend
5. **HTML sanitization**: Backend MUST sanitize Quill HTML to prevent XSS

## Unresolved Questions

- Does Genre API return PaginatedResponse or simple array?
- Group API endpoint confirmed as `/api/admin/groups`?
- Backend file upload field name = `cover`? Max file size?
- Should pilot HTML be sanitized on frontend before submit?
- Is auto-navigation back to list after save desired, or stay on edit page?

## Success Criteria

- All services return typed Observables, compile without errors
- Form pre-populates from API, all fields editable
- Cover upload preview works, multipart submit succeeds
- Genres checkboxes reflect manga.genres, save correctly
- Chapter list loads/creates/edits/deletes, bulk delete works
- Rich text editor matches screenshot toolbar
- Save updates manga, shows success, reflects changes
- Navigation: list → edit → save → list

## Next Steps (Post-Implementation)

- Create manga page (inverse of edit)
- Chapter detail edit with image uploads
- Manga approval workflow
- Bulk manga operations
- Search/filter improvements

---

**Plan ready for developer handoff.**
