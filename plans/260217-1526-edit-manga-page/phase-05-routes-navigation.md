# Phase 5: Routes & Navigation

**Effort**: 0.5h | **Status**: pending

## Context

- Edit component complete (manga-edit.ts in pages/manga-edit/)
- Current manga routes: `/manga/list` (list page), `/manga` redirects to list
- Need: `/manga/edit/:id` route under manga children
- Add edit button to manga-list grid cards for navigation

## Overview

Add edit route to app.routes.ts under manga children array. Add edit button to each manga card in manga-list.html that navigates to `/manga/edit/:id` using Router. Test navigation flow: list → edit → save → (optionally back to list).

## Key Insights

- **Route structure**: Lazy-load edit component like list component
- **Navigation**: Use `[routerLink]="['/manga/edit', manga.id]"` or `router.navigate([...])`
- **Button placement**: Add edit button next to delete button in manga card
- **Icon**: Use `nz-icon nzType="edit"` for edit button
- **Back navigation**: After save, optionally add "Back to list" button or auto-navigate

## Requirements

### Route Definition
- Path: `edit/:id` (relative under `/manga` parent)
- Lazy load: `loadComponent: () => import('./pages/manga-edit/manga-edit').then(m => m.MangaEditComponent)`

### Manga List Edit Button
- Position: In `.manga-cover` div, next to delete button
- Style: Primary button, small size
- Icon: edit icon
- Tooltip: "Chỉnh sửa manga"
- Click: Navigate to `/manga/edit/:id`

### Optional: Back Button in Edit Page
- Position: In card header next to title or in extra slot
- Click: Navigate back to `/manga/list`

## Architecture

Route config in `app.routes.ts`:
```typescript
{
  path: 'manga',
  children: [
    {
      path: 'list',
      loadComponent: () => import('./pages/manga-list/manga-list').then(m => m.MangaListComponent),
    },
    {
      path: 'edit/:id',
      loadComponent: () => import('./pages/manga-edit/manga-edit').then(m => m.MangaEditComponent),
    },
    { path: '', redirectTo: 'list', pathMatch: 'full' },
  ],
}
```

Navigation in manga-list.html:
```html
<button
  nz-button
  nzType="primary"
  nzSize="small"
  [routerLink]="['/manga/edit', manga.id]"
  nz-tooltip
  nzTooltipTitle="Chỉnh sửa manga"
>
  <nz-icon nzType="edit" />
</button>
```

## Related Code

- `app.routes.ts` (lines 36-45) — manga route definition
- `pages/manga-list/manga-list.html` (lines 120-134) — delete button location
- `pages/manga-list/manga-list.ts` — import Router if using programmatic navigation

## Implementation Steps

### 1. Add Edit Route to app.routes.ts

Modify manga children array:
```typescript
// app.routes.ts
{
  path: 'manga',
  children: [
    {
      path: 'list',
      loadComponent: () =>
        import('./pages/manga-list/manga-list').then((m) => m.MangaListComponent),
    },
    {
      path: 'edit/:id',
      loadComponent: () =>
        import('./pages/manga-edit/manga-edit').then((m) => m.MangaEditComponent),
    },
    { path: '', redirectTo: 'list', pathMatch: 'full' },
  ],
},
```

### 2. Add Edit Button to Manga List (manga-list.html)

Find the delete button section (around line 120-134) in manga-list.html:

**Before:**
```html
<!-- Nút xoá ở góc dưới ảnh -->
<button
  class="delete-btn"
  nz-button
  nzType="primary"
  nzDanger
  nzSize="small"
  nz-popconfirm
  nzPopconfirmTitle="Xoá manga này? Tất cả chapters sẽ bị xoá theo!"
  (nzOnConfirm)="onDeleteManga(manga)"
  nz-tooltip
  nzTooltipTitle="Xoá manga"
>
  <nz-icon nzType="delete" />
</button>
```

**After (add edit button before delete):**
```html
<!-- Action buttons ở góc dưới ảnh -->
<div class="manga-actions">
  <button
    nz-button
    nzType="primary"
    nzSize="small"
    [routerLink]="['/manga/edit', manga.id]"
    nz-tooltip
    nzTooltipTitle="Chỉnh sửa manga"
  >
    <nz-icon nzType="edit" />
  </button>
  <button
    nz-button
    nzType="primary"
    nzDanger
    nzSize="small"
    nz-popconfirm
    nzPopconfirmTitle="Xoá manga này? Tất cả chapters sẽ bị xoá theo!"
    (nzOnConfirm)="onDeleteManga(manga)"
    nz-tooltip
    nzTooltipTitle="Xoá manga"
  >
    <nz-icon nzType="delete" />
  </button>
</div>
```

### 3. Update Manga List Styles (manga-list.less)

Replace `.delete-btn` class with `.manga-actions` wrapper:

**Before:**
```less
.delete-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 1;
}
```

**After:**
```less
.manga-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 1;
  display: flex;
  gap: 8px;

  button {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}
```

### 4. Import RouterLink in Manga List Component (manga-list.ts)

Add RouterLink to imports:
```typescript
import { RouterLink } from '@angular/router';

@Component({
  // ...
  imports: [
    // ... existing imports
    RouterLink,
  ],
  // ...
})
```

### 5. Optional: Add Back Button to Edit Page

In `manga-edit.html`, add back button to card extra slot:

```html
<ng-template #cardExtra>
  <button
    nz-button
    nzSize="small"
    [routerLink]="['/manga/list']"
    style="margin-right: 8px;"
  >
    <nz-icon nzType="arrow-left" />
    Quay lại
  </button>
  <button
    nz-button
    nzType="primary"
    nzSize="small"
    (click)="onSubmit()"
    [nzLoading]="saving()"
    [disabled]="loading()"
  >
    <nz-icon nzType="save" />
    Lưu
  </button>
</ng-template>
```

Import RouterLink in manga-edit.ts:
```typescript
import { RouterLink } from '@angular/router';

@Component({
  imports: [
    // ... existing
    RouterLink,
  ],
})
```

### 6. Test Navigation Flow

1. Start dev server: `npm start`
2. Navigate to `/manga/list`
3. Verify edit button appears on each manga card
4. Click edit button, verify navigation to `/manga/edit/:id`
5. Verify manga data loads in edit form
6. Make changes, click Save
7. Verify success message
8. Click "Quay lại" (if added), verify navigation back to list
9. Test direct URL access: `/manga/edit/[valid-id]`

## Todo

- [ ] Add edit route to app.routes.ts manga children
- [ ] Add edit button to manga-list.html (before delete button)
- [ ] Update manga-list.less styles for button group
- [ ] Import RouterLink in manga-list.ts
- [ ] Optional: Add back button to manga-edit page
- [ ] Test navigation from list to edit
- [ ] Test direct URL access to edit page
- [ ] Test back navigation (if implemented)

## Success Criteria

- Edit route registered at `/manga/edit/:id`
- Edit button visible on all manga cards in list
- Clicking edit navigates to edit page with correct ID
- Edit page loads manga data via route param
- Back button (if added) returns to list page
- Direct URL access to edit page works
- No navigation errors in console

## Security Considerations

- Auth guard already applied to parent route (admin layout)
- Verify manga.id exists before navigation
- Handle 404 if manga ID invalid (redirect to list with error message)

## Next Steps

After routes complete:
- End-to-end testing of full flow
- Update menu (if needed) to include "Quản lý manga" link
- Consider breadcrumb navigation for better UX
