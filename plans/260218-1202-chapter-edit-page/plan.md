---
title: "Edit Chapter Page"
description: "Chapter edit page with name form, image upload zone, drag-drop reorder, and delete"
status: completed
priority: P2
effort: 3h
branch: main
tags: [chapter, edit, upload, drag-drop, angular]
created: 2026-02-18
---

# Edit Chapter Page

## Goal
Create an edit chapter page at route `manga/:mangaId/chapters/:chapterId/edit` with:
- Header bar showing last updated time + Save button
- "Thong tin" card with chapter name form
- "Hinh chuong" card with upload zone + image list with drag-drop reorder + delete

## Phases

| # | Phase | Effort | File |
|---|-------|--------|------|
| 1 | Service & Routing | 30min | [phase-01](./phase-01-service-and-routing.md) |
| 2 | Chapter Edit Component | 1h | [phase-02](./phase-02-chapter-edit-component.md) |
| 3 | Drag-Drop Image Management | 1.5h | [phase-03](./phase-03-drag-drop-image-management.md) |

## Key Decisions
- Install `@angular/cdk` for `CdkDragDrop` reorder (not currently in package.json)
- Upload images sequentially via `concat` to avoid server overload
- `DELETE /chapters/{id}/clr-img` clears ALL images; no single-image delete API exists
- Image reorder is visual-only; no server-side order API for images (chapters-order is for chapters, not images)
- Route pattern: `manga/edit/:id/chapters/:chapterId/edit` nested under manga children
- Follow manga-edit pattern: standalone component, signals, inject services, top-bar layout

## API Endpoints Used
- `GET /api/admin/chapters/{id}` — load chapter detail + images
- `PUT /api/admin/chapters/{id}` — update name/order
- `PUT /api/admin/chapters/{id}/add-img` — upload image (multipart)
- `DELETE /api/admin/chapters/{id}/clr-img` — clear all images

## Reference Files
- `src/app/pages/manga-edit/manga-edit.ts` — edit page pattern
- `src/app/core/services/chapters.service.ts` — existing service to extend
- `src/app/app.routes.ts` — route registration

## Unresolved Questions
1. What is the exact response shape of `GET /chapters/{id}`? Does it include an `images` array? Need to verify against actual API response.
2. Is there a single-image delete endpoint, or only clear-all? Plan assumes clear-all only.
3. Does the add-img endpoint return the updated chapter with images, or just success? Affects reload strategy.
