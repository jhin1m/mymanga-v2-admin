# Phase 03 — Route + Menu Integration

> Parent: [plan.md](./plan.md) | Depends on: [Phase 02](./phase-02-component.md)

## Overview
- **Date**: 2026-02-20
- **Priority**: P2
- **Implementation Status**: pending
- **Review Status**: pending

## Context

Wire up component vào routing và sidebar menu. Follow pattern các page khác.

## Implementation Steps

### 1. Thêm route trong `src/app/app.routes.ts`

Thêm route `chapter-reports` vào children của layout route (cùng cấp với `comments`):

```typescript
{
  path: 'chapter-reports',
  loadComponent: () =>
    import('./pages/chapter-reports/chapter-reports').then((m) => m.ChapterReportsComponent),
},
```

### 2. Thêm menu item trong `src/app/core/startup/startup.service.ts`

Thêm vào group "HỆ THỐNG" (cùng với Bình luận):

```typescript
{
  text: 'Báo cáo Chapter',
  link: '/chapter-reports',
  icon: { type: 'icon', value: 'warning' },
},
```

Đặt sau item "Bình luận" vì liên quan đến content moderation.

## Related Code Files

- `src/app/app.routes.ts` — thêm 1 route entry
- `src/app/core/startup/startup.service.ts` — thêm 1 menu item

## Todo List

- [ ] Add lazy-loaded route
- [ ] Add sidebar menu item with warning icon
- [ ] Verify navigation works

## Success Criteria

- [ ] Route `/chapter-reports` loads component
- [ ] Menu item visible in sidebar under "HỆ THỐNG"
- [ ] Active state highlights correctly on navigation

## Risk Assessment

- **Low**: Simple config changes, no logic involved
