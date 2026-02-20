---
phase: 1
title: "Service & Routing"
effort: 30min
status: completed
---

# Phase 1: Service & Routing

## Context
- [chapters.service.ts](../../src/app/core/services/chapters.service.ts) — existing service, needs new methods
- [app.routes.ts](../../src/app/app.routes.ts) — route registration
- [API docs](../../docs/API-ADMIN-DOCS.md) — chapter endpoints

## Overview
Extend ChaptersService with 3 new methods (getChapter, addImage, clearImages) and add the chapter edit route. Install `@angular/cdk`.

## Key Insights
- Existing service already has CRUD for chapters list, but no single-chapter GET
- `add-img` uses PUT with multipart/form-data (field: `image`)
- `clr-img` uses DELETE
- Route must be nested under manga children to match navigation from manga-edit (`/manga/edit/:id/chapters/:chapterId/edit`)
- Actually, looking at `onNavigateEditChapter`, it navigates to `/manga/:mangaId/chapters/:chapterId/edit` — so route should be `manga/:mangaId/chapters/:chapterId/edit` but since manga routes use `edit/:id` pattern, the actual path from manga-edit navigates to `/manga/${mangaId}/chapters/${chapterId}/edit`

## Requirements
1. Add `ChapterDetail` interface (Chapter + images array)
2. Add `getChapter(id)` method returning `ApiResponse<ChapterDetail>`
3. Add `addImage(chapterId, file)` method using FormData
4. Add `clearImages(chapterId)` method
5. Add route `manga/:mangaId/chapters/:chapterId/edit`
6. Install `@angular/cdk`

## Architecture

### ChapterDetail Interface
```typescript
export interface ChapterImage {
  id: string;
  image_full_url: string;
  order: number;
}

export interface ChapterDetail extends Chapter {
  images?: ChapterImage[];
}
```

### New Service Methods
```typescript
getChapter(id: string): Observable<ApiResponse<ChapterDetail>> {
  return this.http.get<ApiResponse<ChapterDetail>>(`${this.apiBase}/${id}`);
}

addImage(chapterId: string, file: File): Observable<ApiResponse<unknown>> {
  const fd = new FormData();
  fd.append('image', file);
  return this.http.put<ApiResponse<unknown>>(`${this.apiBase}/${chapterId}/add-img`, fd);
}

clearImages(chapterId: string): Observable<void> {
  return this.http.delete<void>(`${this.apiBase}/${chapterId}/clr-img`);
}
```

### Route Addition
```typescript
// Inside manga children array, after edit/:id
{
  path: ':mangaId/chapters/:chapterId/edit',
  loadComponent: () =>
    import('./pages/chapter-edit/chapter-edit').then(m => m.ChapterEditComponent),
},
```

**Note:** The manga-edit `onNavigateEditChapter` navigates to `/manga/${mangaId}/chapters/${chapterId}/edit`. Since manga routes root is `manga`, the child path should be `:mangaId/chapters/:chapterId/edit`. But wait — there's a conflict: `edit/:id` and `:mangaId/chapters/...` both start with a dynamic segment after `manga/`. Actually, `edit/:id` is literal "edit" followed by `:id`. A route like `:mangaId/chapters/:chapterId/edit` would match `{mangaId}/chapters/{chapterId}/edit`. But the navigation is `['/manga', mangaId, 'chapters', chapterId, 'edit']`. This means from the root, it's `manga/{mangaId}/chapters/{chapterId}/edit`. Since manga children: the child path would be `:mangaId/chapters/:chapterId/edit`. But `:mangaId` conflicts with `edit` (literal) and `list` (literal) because Angular matches literally first. So this should work fine — `list`, `create`, `edit` are literals; anything else falls to `:mangaId`.

## Related Files
- `src/app/core/services/chapters.service.ts`
- `src/app/app.routes.ts`
- `package.json`

## Implementation Steps
- [ ] Run `npm install @angular/cdk` (check compatible version for Angular 21)
- [ ] Add `ChapterImage` and `ChapterDetail` interfaces to `chapters.service.ts`
- [ ] Add `getChapter(id)` method to `ChaptersService`
- [ ] Add `addImage(chapterId, file)` method to `ChaptersService`
- [ ] Add `clearImages(chapterId)` method to `ChaptersService`
- [ ] Add chapter edit route to `app.routes.ts` under manga children
- [ ] Verify route does not conflict with existing `edit/:id` route

## Success Criteria
- `ChaptersService` has all 3 new methods with correct HTTP verbs and URLs
- Route resolves correctly from manga-edit chapter table "edit" button click
- `@angular/cdk` installed and available

## Risk Assessment
- **Route conflict**: Low. Angular matches literal segments before dynamic ones. `edit`, `list`, `create` matched first; `:mangaId` catches the rest.
- **CDK version**: Must match Angular 21. Use `@angular/cdk@^21`.

## Security Considerations
- File upload: Server validates file type/size; client should also restrict via nz-upload accept/size limits
- Auth: Existing interceptor adds bearer token automatically

## Next Steps
Phase 2: Create the ChapterEditComponent with form and layout.
