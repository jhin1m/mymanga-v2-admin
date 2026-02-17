# Phase 02 — Doujinshis Component + Route

## Context

- Parent: [plan.md](./plan.md)
- Reference: `src/app/pages/artists/` (all 3 files)

## Parallelization Info

- **Group A** — runs in parallel with Phase 01
- Imports `DoujinshisService` from Phase 01 — but no runtime conflict since both create new files
- No file overlap with Phase 01

## Overview

- Date: 2026-02-17
- Priority: P3
- Status: done

Clone artists component → doujinshis. Add route to `app.routes.ts`.

## Key Insights

- Component structure identical to ArtistsComponent
- Modal component for name input (create/edit) — clone `ArtistNameInputComponent` → `DoujinshiNameInputComponent`
- Menu sidebar already has "Doujinshi" entry at `/doujinshi` — route path should match

## Requirements

1. Create doujinshis component (ts, html, less)
2. Include modal input component for create/edit
3. Add lazy-loaded route at path `doujinshi` (matches existing menu link)
4. All UI text: "artist" → "doujinshi"

## Architecture

Same as artists page:
- Search card with name filter
- Table with ID, name, slug, creator, date, actions
- Pagination bar (top + bottom)
- Modal for create/edit name
- Popconfirm for delete

## File Ownership

| File | Action |
|------|--------|
| `src/app/pages/doujinshis/doujinshis.ts` | CREATE |
| `src/app/pages/doujinshis/doujinshis.html` | CREATE |
| `src/app/pages/doujinshis/doujinshis.less` | CREATE |
| `src/app/app.routes.ts` | MODIFY (add 1 route) |

## Implementation Steps

1. Create `src/app/pages/doujinshis/` directory
2. Create `doujinshis.ts`:
   - `DoujinshiNameInputComponent` (modal content)
   - `DoujinshisComponent` (main page)
   - Replace all "artist" references with "doujinshi"
3. Create `doujinshis.html`:
   - Clone artists.html
   - Change labels: "Artist" → "Doujinshi"
   - Change method names: `onCreateArtist` → `onCreateDoujinshi`, etc.
4. Create `doujinshis.less`:
   - Clone artists.less
   - Rename `.artist-name` → `.doujinshi-name`
5. Add route in `app.routes.ts`:
   ```typescript
   {
     path: 'doujinshi',
     loadComponent: () => import('./pages/doujinshis/doujinshis').then(m => m.DoujinshisComponent),
   },
   ```

## Todo

- [ ] Create doujinshis.ts with both components
- [ ] Create doujinshis.html template
- [ ] Create doujinshis.less styles
- [ ] Add route to app.routes.ts

## Success Criteria

- Page loads at `/doujinshi`
- Search, create, edit, delete all work
- Sidebar menu link navigates correctly
- No TypeScript compilation errors

## Conflict Prevention

- Only new files + 1 line addition to routes
- Route addition is append-only (no modification of existing routes)

## Risk Assessment

- Low — direct clone
- Route path `doujinshi` must match menu link in startup.service.ts (already `/doujinshi`)

## Security Considerations

- Same patterns as artists — no new attack surface
