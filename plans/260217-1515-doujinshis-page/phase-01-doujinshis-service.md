# Phase 01 — Doujinshis Service

## Context

- Parent: [plan.md](./plan.md)
- Reference: `src/app/core/services/artists.service.ts`

## Parallelization Info

- **Group A** — runs in parallel with Phase 02
- No dependencies on other phases
- No file overlap with Phase 02

## Overview

- Date: 2026-02-17
- Priority: P3
- Status: done

Clone `ArtistsService` → `DoujinshisService`. Same CRUD pattern, different endpoint.

## Key Insights

- API endpoint: `/api/admin/doujinshis`
- Same interface shape as Artist (id, name, slug, user_id, user, timestamps)
- Same query params pattern (Spatie QueryBuilder)

## Requirements

1. Create `Doujinshi` interface (same shape as `Artist`)
2. Create `DoujinshiListParams` interface
3. Create `DoujinshisService` with CRUD methods

## Architecture

Identical to `ArtistsService`:
- `getDoujinshis(params)` → GET `/api/admin/doujinshis`
- `createDoujinshi(name)` → POST
- `updateDoujinshi(id, name)` → PUT
- `deleteDoujinshi(id)` → DELETE

## File Ownership

| File | Action |
|------|--------|
| `src/app/core/services/doujinshis.service.ts` | CREATE |

## Implementation Steps

1. Create `src/app/core/services/doujinshis.service.ts`
2. Define `Doujinshi` interface (copy Artist, rename)
3. Define `DoujinshiListParams` interface
4. Implement `DoujinshisService` class with 4 CRUD methods
5. Use same `HttpParams` building pattern as ArtistsService

## Todo

- [ ] Create doujinshis.service.ts with interfaces + service class

## Success Criteria

- Service compiles without errors
- All 4 CRUD methods implemented
- Endpoint points to `/api/admin/doujinshis`

## Conflict Prevention

- Only touches 1 new file — no overlap possible

## Risk Assessment

- Low risk — direct clone with rename

## Security Considerations

- Same auth interceptor applies (existing infrastructure)
