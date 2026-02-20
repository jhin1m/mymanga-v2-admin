# Phase 02: Component + Route

> Parent: [plan.md](./plan.md)
> Depends on: [Phase 01](./phase-01-service-layer.md)

## Overview
- **Date**: 2026-02-20
- **Priority**: P2
- **Status**: pending
- **Review**: pending

## Description
Create AchievementsComponent with list table, search, modal form, delete confirm, pagination. Register route at `/badges`.

## Key Insights
- Clone genres page pattern: search card + table card + pagination bar
- Modal form for create/edit (single `name` field)
- Signal-based state management
- Standalone component with NG-ZORRO imports

## Requirements
- Table columns: ID, Tên, Ngày tạo, Hành động (sửa/xóa)
- Search by name
- Create/Edit via NzModal with form
- Delete with nz-popconfirm
- Pagination (top + bottom)
- Vietnamese labels

## Related Code Files
- `src/app/pages/genres/genres.ts` — component pattern
- `src/app/pages/genres/genres.html` — template pattern
- `src/app/pages/genres/genres.less` — style pattern
- `src/app/app.routes.ts` — route registration
- `src/app/shared/pagination-bar/pagination-bar.ts` — shared component

## Implementation Steps

### 1. Create `achievements.ts`
- `AchievementFormModalComponent` — modal nội tuyến, chỉ có field `name`
- `AchievementsComponent` — main page component
  - Signals: achievements, loading, total, pageIndex, pageSize
  - searchForm: FormGroup với field `name`
  - Methods: loadAchievements, onSearch, onReset, onPageChange, onPageSizeChange
  - showAchievementModal (shared for create/edit)
  - onCreateAchievement, onEditAchievement, onDeleteAchievement

### 2. Create `achievements.html`
- Search card: input name + reset/search/create buttons
- Table card: nz-table with columns
- Pagination bar top + bottom (conditional bottom)

### 3. Create `achievements.less`
- Copy genres.less, rename `.genre-name` → `.achievement-name`

### 4. Register route in `app.routes.ts`
```typescript
{
  path: 'badges',
  loadComponent: () =>
    import('./pages/achievements/achievements').then(m => m.AchievementsComponent),
},
```

## Todo
- [ ] Create achievements.ts (modal + main component)
- [ ] Create achievements.html (search + table + pagination)
- [ ] Create achievements.less (copy from genres)
- [ ] Add route to app.routes.ts

## Success Criteria
- Page loads at `/badges` without errors
- List displays achievements from API
- Search by name works
- Create/Edit modal works
- Delete with confirmation works
- Pagination works (top + bottom)

## Risk Assessment
- Low risk — direct clone of genres page
- API field names may differ slightly — verify at runtime

## Security Considerations
- Route protected by authGuard (already on parent route)
