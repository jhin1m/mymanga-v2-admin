# Phase 4: Routing & Dashboard Placeholder

## Context Links
- [plan.md](./plan.md)
- [Phase 3](./phase-03-login-page.md)
- [src/app/app.routes.ts](/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts)

## Overview

Wire up routing: /login (public), /dashboard (protected), / redirects to /dashboard. Create minimal dashboard placeholder component.

## Key Insights

- Use lazy loading (`loadComponent`) for login and dashboard
- Auth guard applied to dashboard route via `canActivate`
- Root path redirects to /dashboard; guard handles unauthenticated redirect chain
- Wildcard route redirects to /dashboard (guard catches unauthenticated)

## Requirements

1. /login route loads LoginComponent (public)
2. /dashboard route loads DashboardComponent (protected by authGuard)
3. / redirects to /dashboard
4. Unknown routes redirect to /dashboard
5. Dashboard shows minimal placeholder content

## Architecture

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
```

## Related Code Files

| File | Action |
|------|--------|
| src/app/app.routes.ts | Modify: add all routes |
| src/app/pages/dashboard/dashboard.ts | Create |
| src/app/pages/dashboard/dashboard.html | Create |
| src/app/pages/dashboard/dashboard.less | Create |

## Implementation Steps

### Step 1: Create dashboard placeholder

**dashboard.ts**
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.less',
})
export class DashboardComponent {}
```

**dashboard.html**
```html
<div class="dashboard-container">
  <h1>MyManga Admin Dashboard</h1>
  <p>Welcome! Dashboard content coming soon.</p>
</div>
```

**dashboard.less**
```less
.dashboard-container {
  padding: 24px;
}
```

### Step 2: Update app.routes.ts

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
```

### Step 3: Smoke test

1. `npm start` -- no compilation errors
2. Navigate to http://localhost:4200 -- should redirect to /login (not authenticated)
3. After login -- should land on /dashboard

## Todo

- [ ] Create src/app/pages/dashboard/dashboard.ts
- [ ] Create src/app/pages/dashboard/dashboard.html
- [ ] Create src/app/pages/dashboard/dashboard.less
- [ ] Update src/app/app.routes.ts with all routes
- [ ] Smoke test: unauthenticated user redirected to /login
- [ ] Smoke test: authenticated user can access /dashboard
- [ ] Smoke test: unknown routes redirect to /dashboard

## Success Criteria

- / redirects to /dashboard, guard redirects to /login if unauthenticated
- /login renders login form
- /dashboard renders placeholder when authenticated
- Unknown paths handled gracefully

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redirect loop (/ -> /dashboard -> /login -> ...) | High | Guard returns UrlTree, router handles single redirect |
| Lazy load path typo | Low | TypeScript import checks at compile time |

## Security Considerations

- All routes except /login are protected by authGuard
- No sensitive data exposed in dashboard placeholder

## Next Steps

After all 4 phases complete:
- End-to-end manual smoke test
- Run `npm test` for all unit tests
- Consider adding a logout button to dashboard header (future enhancement)
