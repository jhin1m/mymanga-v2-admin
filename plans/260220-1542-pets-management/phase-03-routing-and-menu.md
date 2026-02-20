# Phase 03: Routing & Menu

> Parent: [plan.md](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-20 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

Register pets route and fix menu link in startup service.

## Key Insights

- Menu item "Bạn đồng hành" already exists in startup.service.ts but links to `/history` — needs to be changed to `/pets`
- Icon is `history` — should change to something pet-related (e.g., `smile` or keep as-is)
- Route pattern follows other simple pages (genres, badges)

## Requirements

- Lazy-loaded route at path `pets`
- Menu link updated from `/history` to `/pets`

## Related Files

- `src/app/app.routes.ts`
- `src/app/core/startup/startup.service.ts`

## Implementation Steps

### 1. Add route in `src/app/app.routes.ts`

Add after the `badges` route entry (line ~47):

```typescript
{
  path: 'pets',
  loadComponent: () => import('./pages/pets/pets').then((m) => m.PetsComponent),
},
```

### 2. Fix menu link in `src/app/core/startup/startup.service.ts`

Change the "Bạn đồng hành" menu item (line ~95-98):

```typescript
// Before:
{
  text: 'Bạn đồng hành',
  link: '/history',
  icon: { type: 'icon', value: 'history' },
},

// After:
{
  text: 'Bạn đồng hành',
  link: '/pets',
  icon: { type: 'icon', value: 'heart' },
},
```

Using `heart` icon — more fitting for companion/pet concept than `history`.

## Todo

- [ ] Add pets route in `app.routes.ts`
- [ ] Update menu link from `/history` to `/pets` in `startup.service.ts`
- [ ] Update icon from `history` to `heart`

## Success Criteria

- Navigating to `/pets` loads PetsComponent
- Sidebar menu item "Bạn đồng hành" navigates to `/pets`
- Menu icon displays correctly

## Risk Assessment

- Low risk — single line additions
- Verify `heart` icon is registered in provideAlain icons config; if not, use another registered icon

## Next Steps

Test full flow: navigate from menu -> list loads -> create/edit/delete work
