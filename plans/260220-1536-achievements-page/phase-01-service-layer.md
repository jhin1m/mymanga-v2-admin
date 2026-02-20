# Phase 01: Service Layer

> Parent: [plan.md](./plan.md)

## Overview
- **Date**: 2026-02-20
- **Priority**: P2
- **Status**: pending
- **Review**: pending

## Description
Create `AchievementsService` with TypeScript interfaces and CRUD HTTP methods, following `GenresService` pattern.

## Key Insights
- API follows same pattern as genres/groups/artists
- Uses `PaginatedResponse<T>` for list, `ApiResponse<T>` for mutations
- HttpParams built from object entries (skip empty values)

## Requirements
- Achievement interface matching API response shape
- AchievementListParams for query filters
- AchievementPayload for create/update
- CRUD methods: list, getById, create, update, delete

## Related Code Files
- `src/app/core/services/genres.service.ts` — reference pattern
- `src/app/core/models/api-types.ts` — PaginatedResponse, PaginationInfo
- `src/app/core/services/auth.service.ts` — ApiResponse interface

## Implementation Steps

### 1. Define Interfaces
```typescript
export interface Achievement {
  id: string;
  name: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface AchievementListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
  'filter[user_id]'?: string;
}

export interface AchievementPayload {
  name: string;
}
```

### 2. Create Service
- Injectable providedIn root
- apiBase = `${environment.apiUrl}/api/admin/achievements`
- Methods: `getAchievements()`, `createAchievement()`, `updateAchievement()`, `deleteAchievement()`
- HttpParams built from object entries, skip empty values

## Todo
- [ ] Create achievements.service.ts
- [ ] Export interfaces: Achievement, AchievementListParams, AchievementPayload

## Success Criteria
- Service compiles without errors
- All CRUD methods implemented
- Follows same pattern as genres.service.ts

## Risk Assessment
- Low risk — direct copy of existing pattern

## Security Considerations
- All endpoints require Bearer auth (handled by interceptor)
